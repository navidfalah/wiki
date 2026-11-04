'use strict';
const fs = require('node:fs');
const CRITIC = 'You are a fact-checking critic. Compare the draft with the supplied source excerpts. Identify specific factual sentences that are not supported by the excerpts. Return only JSON: {"flagged":[{"sentence":"exact sentence copied from draft","reason":"why unsupported"}]}. Do not flag a supported paraphrase. If none, return {"flagged":[]}.';

function correctionsBlock(file) {
  let entries; try { entries = JSON.parse(fs.readFileSync(file, 'utf8')).corrections; } catch { return ''; }
  if (!Array.isArray(entries) || !entries.length) return '';
  return ['Known corrections from human review — apply the same judgment to similar text:', ...entries.map((item) => `- "${String(item.quote_excerpt || '').slice(0, 200)}" -> ${item.verdict}: ${item.note}`)].join('\n');
}
async function critic({ model, sources, draft, samples = 1, corrections = '', signal = undefined }) {
  samples = Math.max(1, Math.min(10, Math.floor(samples) || 1));
  const votes = new Map(); let successful = 0;
  for (let i = 0; i < samples; i++) {
    const raw = await model.generate({ system: `${CRITIC}${corrections ? `\n\n${corrections}` : ''}`, prompt: `SOURCE EXCERPTS:\n${sources}\n\n---\n\nDRAFT:\n${draft}`, purpose: 'default', step: '3. Synthesis', sampling: { temperature: samples > 1 ? 0.3 : 0 }, skipCache: samples > 1, signal });
    let flagged;
    try { const text = String(raw), match = text.match(/\{[\s\S]*\}/); flagged = JSON.parse(match?.[0] || '').flagged; if (!Array.isArray(flagged)) continue; } catch { continue; }
    successful++; const seen = new Set();
    for (const item of flagged) { const sentence = typeof item?.sentence === 'string' ? item.sentence.trim() : ''; if (!sentence || seen.has(sentence)) continue; seen.add(sentence); const prior = votes.get(sentence) || { count: 0, reason: String(item.reason || '') }; prior.count++; votes.set(sentence, prior); }
  }
  if (!successful) return { body: draft, flagged: [], parseError: true };
  const flagged = [...votes].filter(([, vote]) => vote.count > successful / 2).map(([sentence, vote]) => ({ sentence, reason: vote.reason, removed: draft.includes(sentence) }));
  let body = draft; for (const item of flagged) if (item.removed) body = body.replace(item.sentence, '').trim();
  return { body: body.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim(), flagged, parseError: false };
}
async function webSearch(query, { provider = 'duckduckgo', apiKey = '', maxResults = 3, signal } = {}) {
  provider = provider.toLowerCase();
  if (!['duckduckgo', 'serpapi', 'bing'].includes(provider)) throw new Error(`Unknown web search provider: ${provider}`);
  if (provider !== 'duckduckgo' && !apiKey) throw new Error(`The ${provider} web search provider requires an API key.`);
  const url = new URL(provider === 'duckduckgo' ? 'https://api.duckduckgo.com/' : provider === 'serpapi' ? 'https://serpapi.com/search' : 'https://api.bing.microsoft.com/v7.0/search');
  const params = provider === 'duckduckgo' ? { q: query, format: 'json', no_html: '1', skip_disambig: '1' } : provider === 'serpapi' ? { q: query, engine: 'google', api_key: apiKey, num: String(maxResults) } : { q: query, count: String(maxResults) };
  url.search = new URLSearchParams(params).toString();
  try {
    const response = await fetch(url, { headers: provider === 'bing' ? { 'Ocp-Apim-Subscription-Key': apiKey } : {}, signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000) });
    if (!response.ok) return []; const data = await response.json();
    if (provider === 'serpapi') return (data.organic_results || []).slice(0, maxResults).map((item) => ({ title: item.title || query, url: item.link || '', snippet: item.snippet || '' }));
    if (provider === 'bing') return (data.webPages?.value || []).slice(0, maxResults).map((item) => ({ title: item.name || query, url: item.url || '', snippet: item.snippet || '' }));
    const results = []; if (data.AbstractText) results.push({ title: data.Heading || query, url: data.AbstractURL || '', snippet: data.AbstractText });
    for (const item of data.RelatedTopics || []) for (const topic of item.Topics || [item]) if (topic.Text) results.push({ title: topic.Text.split(' - ')[0].slice(0, 120), url: topic.FirstURL || '', snippet: topic.Text });
    return results.slice(0, maxResults);
  } catch (error) { if (signal?.aborted) throw error; return []; }
}
module.exports = { correctionsBlock, critic, webSearch };
