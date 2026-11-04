'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const core = require('./wikiCore');
const { readSource } = require('./sourceReader');

function markdownFiles(root) {
  const result = [];
  function visit(folder) {
    if (!fs.existsSync(folder)) return;
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const full = path.join(folder, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) result.push(full);
    }
  }
  visit(root); return result.sort();
}
function sections(body) {
  const result = []; let heading = 'Overview', lines = [];
  function flush() { const content = lines.join('\n').trim(); if (content) for (const text of core.chunks(content, 1200)) result.push({ heading, text }); lines = []; }
  for (const line of body.split(/\r?\n/)) {
    const match = line.match(/^#{1,6}\s+(.+?)\s*#*\s*$/);
    if (match) { flush(); heading = match[1]; } else lines.push(line);
  }
  flush(); return result;
}
function bm25(query, passages, limit, config) {
  const terms = core.tokenize(query);
  if (!terms.length || !passages.length) return [];
  const docs = passages.map((passage, id) => {
    const words = core.tokenize(passage.text), counts = new Map();
    for (const word of words) counts.set(word, (counts.get(word) || 0) + 1);
    return { id, passage, counts, length: words.length };
  });
  const avg = docs.reduce((sum, doc) => sum + doc.length, 0) / (docs.filter((doc) => doc.length).length || 1) || 1;
  const frequencies = new Map([...new Set(terms)].map((word) => [word, docs.filter((doc) => doc.counts.has(word)).length]));
  return docs.map((doc) => {
    const score = terms.reduce((sum, word) => {
      const tf = doc.counts.get(word) || 0; if (!tf) return sum;
      const idf = Math.log(1 + (docs.length - frequencies.get(word) + 0.5) / (frequencies.get(word) + 0.5));
      return sum + idf * tf * (config.k1 + 1) / (tf + config.k1 * (1 - config.b + config.b * doc.length / avg));
    }, 0);
    return { id: doc.id, passage: doc.passage, score };
  }).filter((hit) => hit.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
}
function similarity(a, b) {
  if (!a.length || a.length !== b.length) return 0;
  let ab = 0, aa = 0, bb = 0;
  for (let i = 0; i < a.length; i++) { ab += a[i] * b[i]; aa += a[i] ** 2; bb += b[i] ** 2; }
  return aa && bb ? ab / Math.sqrt(aa * bb) : 0;
}
function fusion(rankings, limit) {
  const scores = new Map(), docs = new Map();
  for (const ranking of rankings) ranking.forEach((item, index) => { scores.set(item.id, (scores.get(item.id) || 0) + 1 / (60 + index + 1)); docs.set(item.id, item.passage); });
  return [...scores].map(([id, score]) => ({ id, score, passage: docs.get(id) })).sort((a, b) => b.score - a.score).slice(0, limit);
}
function makeEmbeddings(config, options = {}) {
  const cache = new Map();
  const cacheFile = options.cacheFile;
  if (cacheFile) try { for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(cacheFile, 'utf8')))) cache.set(k, v); } catch { /* no cache yet */ }
  const keyFor = (text) => crypto.createHash('sha256').update(`${config.base}\n${config.model}\n${text}`).digest('hex');
  return async function embed(texts) {
    const missing = [...new Map(texts.filter((text) => !cache.has(keyFor(text))).map((text) => [keyFor(text), text])).entries()];
    for (let i = 0; i < missing.length; i += 32) {
      const batch = missing.slice(i, i + 32);
      const response = await fetch(`${config.base.replace(/\/+$/, '')}/embeddings`, {
        method: 'POST', headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: config.model, input: batch.map(([, text]) => text) }), signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw new Error('Embedding request failed');
      const json = await response.json();
      if (!Array.isArray(json.data) || json.data.length !== batch.length) throw new Error('Invalid embedding response');
      for (const item of json.data) {
        if (!Number.isInteger(item.index) || !batch[item.index] || !Array.isArray(item.embedding) || !item.embedding.length || !item.embedding.every(Number.isFinite)) throw new Error('Invalid embedding response');
        cache.set(batch[item.index][0], item.embedding);
      }
    }
    if (cacheFile && missing.length) {
      fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
      const tmp = `${cacheFile}.${crypto.randomBytes(8).toString('hex')}.tmp`;
      try { fs.writeFileSync(tmp, JSON.stringify(Object.fromEntries(cache)), { mode: 0o600 }); fs.renameSync(tmp, cacheFile); }
      finally { try { fs.unlinkSync(tmp); } catch { /* temporary file already removed or could not be cleaned up */ } }
    }
    return texts.map((text) => cache.get(keyFor(text)));
  };
}
function createChatEngine(options) {
  async function corpus(source, scope) {
    const passages = [];
    if (source === 'wiki') {
      for (const file of markdownFiles(options.docsDir)) {
        const rel = path.relative(options.docsDir, file).split(path.sep).join('/');
        if (scope?.length && !scope.includes(rel)) continue;
        const text = fs.readFileSync(file, 'utf8'), meta = options.parseFrontmatter(text);
        const title = typeof meta.title === 'string' ? meta.title : path.basename(file, '.md').replace(/-/g, ' ');
        for (const part of sections(options.stripFrontmatter(text))) passages.push({ doc_path: rel, title, ...part });
      }
    } else {
      for (const file of options.discoverRawSourceFiles(options.rawDir)) {
        const rel = path.relative(options.rawDir, file).split(path.sep).join('/');
        try {
          const text = await readSource(file);
          core.chunks(text, 1200).forEach((piece, index) => passages.push({ doc_path: rel, title: path.basename(file), heading: `Part ${index + 1}`, text: piece }));
        } catch { /* a vanished/unreadable file should not block all sources */ }
      }
    }
    return passages;
  }
  async function answer(input) {
    const source = input.corpusSource === 'wiki' ? 'wiki' : 'raw', label = source === 'wiki' ? 'wiki' : 'raw sources';
    const settings = options.loadSettings(), query = String(input.message || '').trim();
    const passages = await corpus(source, source === 'wiki' ? input.docScope : null);
    if (!query || !passages.length) return { answer: !query ? `Ask a question about anything in the ${label}.` : `No ${label} content is available to search.`, sources: [], mode: 'empty' };
    const limit = settings.top_k || 5, shortlist = Math.max(limit * 3, limit);
    let ranked = bm25(query, passages, shortlist, { k1: settings.bm25_k1, b: settings.bm25_b });
    if (settings.retrieval_mode === 'hybrid') {
      const embedding = options.embeddingConfig();
      if (embedding.apiKey) try {
        const embed = makeEmbeddings(embedding, { cacheFile: settings.use_vector_store ? options.embeddingCacheFile : undefined });
        const vectors = await embed([query, ...passages.map((p) => p.text)]), q = vectors[0];
        const semantic = passages.map((passage, id) => ({ id, passage, score: similarity(q, vectors[id + 1]) })).sort((a, b) => b.score - a.score).slice(0, shortlist);
        ranked = fusion([ranked, semantic], shortlist);
      } catch { /* BM25 remains available if embeddings fail. */ }
    }
    ranked = ranked.slice(0, limit);
    if (!ranked.length) return { answer: `I couldn't find anything in the ${label} about that. Try rephrasing.`, sources: [], mode: 'no_match' };
    const seen = new Set(), sources = [];
    for (const item of ranked) if (!seen.has(item.passage.doc_path)) { seen.add(item.passage.doc_path); sources.push({ doc_path: item.passage.doc_path, title: item.passage.title, heading: item.passage.heading, score: Number(item.score.toFixed(4)) }); }
    const excerpts = ranked.slice(0, 3).map(({ passage }) => `\n**${passage.title} — ${passage.heading}**\n${passage.text.length > 400 ? `${passage.text.slice(0, 400)}…` : passage.text}`);
    return { answer: [`Here are the closest source excerpts from the ${label}:`, ...excerpts].join('\n'), sources, mode: 'extractive', faithfulness: { basis: /** @type {'extractive'} */ ('extractive'), unsupported_rate: 0, checkable_count: 0 } };
  }
  function status() {
    const files = markdownFiles(options.docsDir), rawFiles = options.discoverRawSourceFiles(options.rawDir).length;
    const count = files.reduce((sum, file) => sum + sections(options.stripFrontmatter(fs.readFileSync(file, 'utf8'))).length, 0);
    return { corpus_pages: files.length, corpus_passages: count, raw_source_files: rawFiles, llm_available: options.isChatAvailable() };
  }
  return { answer, status, corpus };
}
module.exports = { createChatEngine, bm25, fusion, makeEmbeddings, similarity };
