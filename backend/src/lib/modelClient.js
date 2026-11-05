'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function createModelClient(options) {
  const cache = new Map();
  const usage = [];
  const maxRetries = Math.max(1, Math.floor(Number(options.maxRetries) || 3));
  const retryBaseDelay = Math.max(100, Number(options.retryBaseDelay) || 1000);
  if (options.cacheFile) try { Object.entries(JSON.parse(fs.readFileSync(options.cacheFile, 'utf8'))).forEach(([k, v]) => cache.set(k, v)); } catch { /* empty cache */ }
  function cacheResult(key, text) {
    cache.set(key, text);
    if (!options.cacheFile) return;
    fs.mkdirSync(path.dirname(options.cacheFile), { recursive: true });
    const tmp = `${options.cacheFile}.${crypto.randomBytes(8).toString('hex')}.tmp`;
    try { fs.writeFileSync(tmp, JSON.stringify(Object.fromEntries(cache)), { mode: 0o600 }); fs.renameSync(tmp, options.cacheFile); }
    finally { try { fs.unlinkSync(tmp); } catch { /* temporary file already removed or could not be cleaned up */ } }
  }
  function record(step, model, tokens = {}, cached = false) {
    usage.push({ step, model, calls: cached ? 0 : 1, cache_hits: cached ? 1 : 0, prompt_tokens: tokens.prompt_tokens || 0, completion_tokens: tokens.completion_tokens || 0, total_tokens: tokens.total_tokens || 0 });
  }
  function requestSignal(signal, timeoutMs) {
    const timeout = AbortSignal.timeout(timeoutMs);
    return signal ? AbortSignal.any([signal, timeout]) : timeout;
  }
  function retryAfter(response) {
    const value = response?.headers?.get?.('retry-after');
    const seconds = value === null || value === undefined ? NaN : Number(value);
    return Number.isFinite(seconds) ? Math.max(0, seconds * 1000) : null;
  }
  async function delay(ms, signal) {
    if (signal?.aborted) throw signal.reason || new DOMException('Aborted', 'AbortError');
    await new Promise((resolve, reject) => {
      const onAbort = () => { clearTimeout(timer); reject(signal.reason || new DOMException('Aborted', 'AbortError')); };
      const timer = setTimeout(() => { signal?.removeEventListener('abort', onAbort); resolve(); }, ms);
      signal?.addEventListener('abort', onAbort, { once: true });
    });
  }
  async function request(url, init, { signal, timeoutMs = 120000, label = 'Model request' } = {}) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      let response;
      try {
        response = await fetch(url, { ...init, signal: requestSignal(signal, timeoutMs) });
        if (response.ok) return response;
        const transient = [408, 409, 429].includes(response.status) || response.status >= 500;
        if (!transient || attempt === maxRetries) throw new Error(`${label} failed (HTTP ${response.status}).`);
        lastError = new Error(`HTTP ${response.status}`);
        try { await response.body?.cancel(); } catch { /* discard before retry */ }
      } catch (error) {
        if (signal?.aborted || error?.name === 'AbortError') throw error;
        if (error.message?.startsWith(`${label} failed (HTTP `)) throw error;
        lastError = error;
        if (attempt === maxRetries) throw new Error(`${label} failed after ${maxRetries} attempt(s): ${error.message}`);
      }
      const serverDelay = retryAfter(response);
      await delay(serverDelay ?? retryBaseDelay * 2 ** (attempt - 1), signal);
    }
    throw new Error(`${label} failed after ${maxRetries} attempt(s): ${lastError?.message || 'unknown error'}`);
  }
  async function generate({ system, prompt, purpose = 'default', step = purpose, signal = undefined, sampling: overrides = {}, skipCache = false }) {
    const profile = purpose === 'thinking' && options.thinking?.apiKey ? options.thinking : options.default;
    if (!profile?.apiKey) throw new Error('An API key is required for compilation.');
    const sampling = Object.fromEntries(Object.entries({ temperature: options.defaultTemperature ?? 0.2, ...(profile.sampling || {}), ...overrides }).filter(([, value]) => value !== undefined && value !== null && value !== ''));
    const key = crypto.createHash('sha256').update(JSON.stringify([profile.base, profile.model, sampling, system, prompt])).digest('hex');
    if (!skipCache && cache.has(key)) { record(step, profile.model, {}, true); return cache.get(key); }
    const response = await request(`${profile.base.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${profile.apiKey}` },
      body: JSON.stringify({ model: profile.model, ...sampling, messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }] }),
    }, { signal, label: 'Model request' });
    const json = await response.json(), text = json.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) throw new Error('The model returned an invalid response.');
    if (!skipCache) cacheResult(key, text);
    const u = json.usage || {};
    record(step, profile.model, u);
    return text;
  }
  async function describeImage({ bytes, mime, signal = undefined }) {
    return generate({
      system: 'Describe the visible image faithfully and concisely for a research wiki. Transcribe clearly readable text.',
      prompt: [{ type: 'text', text: 'Describe this image.' }, { type: 'image_url', image_url: { url: `data:${mime};base64,${bytes.toString('base64')}` } }],
      signal,
    });
  }
  async function transcribeAudio({ bytes, filename, mime, signal = undefined, useCache = true }) {
    const profile = options.default;
    if (!profile?.apiKey) throw new Error('An API key is required for transcription.');
    const model = options.transcriptionModel || 'whisper-1';
    const key = crypto.createHash('sha256').update(crypto.createHash('sha256').update(bytes).digest()).update(`\0<audio-transcription>\0${model}`).digest('hex');
    if (useCache && cache.has(key)) { record('audio', model, {}, true); return cache.get(key); }
    const form = new FormData(); form.append('model', model); form.append('file', new Blob([bytes], { type: mime }), filename);
    const response = await request(`${profile.base.replace(/\/+$/, '')}/audio/transcriptions`, {
      method: 'POST', headers: { Authorization: `Bearer ${profile.apiKey}` }, body: form,
    }, { signal, label: 'Transcription request' });
    const data = await response.json(); if (typeof data.text !== 'string') throw new Error('Invalid transcription response.');
    if (useCache) cacheResult(key, data.text); record('audio', model);
    return data.text;
  }

  async function embedText(text, { signal = undefined, step = 'embedding', useCache = true } = {}) {
    const profile = options.embedding || {
      apiKey: process.env.EMBEDDING_OPENAI_API_KEY || options.default?.apiKey,
      base: process.env.EMBEDDING_OPENAI_BASE_URL || options.default?.base || 'https://api.openai.com/v1',
    };
    if (!profile.apiKey) throw new Error('An API key is required for embeddings.');
    const model = profile.model || options.embeddingModel || process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
    const key = crypto.createHash('sha256').update(JSON.stringify([profile.base, '<embedding>', model, text])).digest('hex');
    if (useCache && cache.has(key)) { record(step, model, {}, true); return JSON.parse(cache.get(key)); }
    const response = await request(`${profile.base.replace(/\/+$/, '')}/embeddings`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${profile.apiKey}` },
      body: JSON.stringify({ model, input: text }),
    }, { signal, timeoutMs: 30000, label: 'Embedding request' });
    const json = await response.json(), vector = json.data?.[0]?.embedding;
    if (!Array.isArray(vector) || !vector.length || !vector.every(Number.isFinite)) throw new Error('The model returned an invalid embedding.');
    if (useCache) cacheResult(key, JSON.stringify(vector));
    record(step, model, json.usage || {});
    return vector;
  }

  async function* stream({ system, prompt, purpose = 'default', step = purpose, signal = undefined, sampling: overrides = {}, skipCache = false }) {
    const profile = purpose === 'thinking' && options.thinking?.apiKey ? options.thinking : options.default;
    if (!profile?.apiKey) throw new Error('An API key is required for compilation.');
    const sampling = Object.fromEntries(Object.entries({ temperature: options.defaultTemperature ?? 0.2, ...(profile.sampling || {}), ...overrides }).filter(([, value]) => value !== undefined && value !== null && value !== ''));
    const key = crypto.createHash('sha256').update(JSON.stringify([profile.base, profile.model, sampling, system, prompt])).digest('hex');
    if (!skipCache && cache.has(key)) { record(step, profile.model, {}, true); yield cache.get(key); return; }
    const response = await request(`${profile.base.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${profile.apiKey}` },
      body: JSON.stringify({ model: profile.model, ...sampling, stream: true, messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }] }),
    }, { signal, label: 'Model stream request' });
    if (!response.body) throw new Error('The model returned an empty stream.');
    const reader = response.body.getReader(), decoder = new TextDecoder();
    let buffer = '', fullText = '';
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
      const lines = (done ? `${buffer}\n` : buffer).split(/\r?\n/); buffer = done ? '' : lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim(); if (!data || data === '[DONE]') continue;
        let event; try { event = JSON.parse(data); } catch { continue; }
        const token = event.choices?.[0]?.delta?.content;
        if (typeof token === 'string' && token) { fullText += token; yield token; }
      }
      if (done) break;
    }
    if (!skipCache) cacheResult(key, fullText);
    record(step, profile.model);
  }

  function complete(system, user, temperature = undefined) { return generate({ system, prompt: user, sampling: temperature === undefined ? {} : { temperature } }); }
  async function completeJson(system, user) {
    const raw = await complete(system, user), match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Model response did not contain JSON.');
    return JSON.parse(match[0]);
  }
  function usageSummary() {
    const totals = new Map();
    for (const item of usage) {
      const key = `${item.step}\0${item.model}`;
      if (!totals.has(key)) totals.set(key, { step: item.step, model: item.model, prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, calls: 0, cache_hits: 0 });
      const row = totals.get(key);
      if (item.cache_hits) row.cache_hits += item.cache_hits;
      else { row.calls += item.calls; row.prompt_tokens += item.prompt_tokens; row.completion_tokens += item.completion_tokens; row.total_tokens += item.total_tokens; }
    }
    return [...totals.values()];
  }
  return { available: Boolean(options.default?.apiKey), generate, stream, embedText, describeImage, transcribeAudio, complete, completeJson, usage, usageSummary };
}
module.exports = { createModelClient };
