'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function createModelClient(options) {
  const cache = new Map();
  const usage = [];
  if (options.cacheFile) try { Object.entries(JSON.parse(fs.readFileSync(options.cacheFile, 'utf8'))).forEach(([k, v]) => cache.set(k, v)); } catch { /* empty cache */ }
  function cacheResult(key, text) {
    cache.set(key, text);
    if (!options.cacheFile) return;
    fs.mkdirSync(path.dirname(options.cacheFile), { recursive: true });
    const tmp = `${options.cacheFile}.${crypto.randomBytes(8).toString('hex')}.tmp`;
    try { fs.writeFileSync(tmp, JSON.stringify(Object.fromEntries(cache)), { mode: 0o600 }); fs.renameSync(tmp, options.cacheFile); }
    finally { try { fs.unlinkSync(tmp); } catch { /* temporary file already removed or could not be cleaned up */ } }
  }
  async function generate({ system, prompt, purpose = 'default', step = purpose, signal = undefined, sampling: overrides = {}, skipCache = false }) {
    const profile = purpose === 'thinking' && options.thinking?.apiKey ? options.thinking : options.default;
    if (!profile?.apiKey) throw new Error('An API key is required for compilation.');
    const sampling = Object.fromEntries(Object.entries({ ...(profile.sampling || {}), ...overrides }).filter(([, value]) => value !== undefined && value !== null && value !== ''));
    const key = crypto.createHash('sha256').update(JSON.stringify([profile.base, profile.model, sampling, system, prompt])).digest('hex');
    if (!skipCache && cache.has(key)) { usage.push({ step, model: profile.model, calls: 0, cache_hits: 1, prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }); return cache.get(key); }
    const response = await fetch(`${profile.base.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${profile.apiKey}` },
      body: JSON.stringify({ model: profile.model, ...sampling, messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }] }),
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(120000)]) : AbortSignal.timeout(120000),
    });
    if (!response.ok) throw new Error(`Model request failed (HTTP ${response.status}).`);
    const json = await response.json(), text = json.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) throw new Error('The model returned an invalid response.');
    if (!skipCache) cacheResult(key, text);
    const u = json.usage || {};
    usage.push({ step, model: profile.model, calls: 1, cache_hits: 0, prompt_tokens: u.prompt_tokens || 0, completion_tokens: u.completion_tokens || 0, total_tokens: u.total_tokens || 0 });
    return text;
  }
  async function describeImage({ bytes, mime, signal = undefined }) {
    return generate({
      system: 'Describe the visible image faithfully and concisely for a research wiki. Transcribe clearly readable text.',
      prompt: [{ type: 'text', text: 'Describe this image.' }, { type: 'image_url', image_url: { url: `data:${mime};base64,${bytes.toString('base64')}` } }],
      signal,
    });
  }
  async function transcribeAudio({ bytes, filename, mime, signal = undefined }) {
    const profile = options.default;
    if (!profile?.apiKey) throw new Error('An API key is required for transcription.');
    const model = options.transcriptionModel || 'whisper-1';
    const key = crypto.createHash('sha256').update(`audio\n${profile.base}\n${model}\n`).update(bytes).digest('hex');
    if (cache.has(key)) { usage.push({ step: 'audio', model, calls: 0, cache_hits: 1, prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }); return cache.get(key); }
    const form = new FormData(); form.append('model', model); form.append('file', new Blob([bytes], { type: mime }), filename);
    const response = await fetch(`${profile.base.replace(/\/+$/, '')}/audio/transcriptions`, {
      method: 'POST', headers: { Authorization: `Bearer ${profile.apiKey}` }, body: form,
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(120000)]) : AbortSignal.timeout(120000),
    });
    if (!response.ok) throw new Error(`Transcription request failed (HTTP ${response.status}).`);
    const data = await response.json(); if (typeof data.text !== 'string') throw new Error('Invalid transcription response.');
    cacheResult(key, data.text); usage.push({ step: 'audio', model, calls: 1, cache_hits: 0, prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 });
    return data.text;
  }
  return { generate, describeImage, transcribeAudio, usage };
}
module.exports = { createModelClient };
