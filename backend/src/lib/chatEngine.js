'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const core = require('./wikiCore');
const { readSource } = require('./sourceReader');
const { makeDoc, bm25Rank, cosineSimilarity, reciprocalRankFusion } = require('./hybridRetrieval');
const { VectorStore } = require('./vectorStore');

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
  const passageById = new Map(passages.map((passage) => [passageVectorId(passage), passage]));
  const docs = passages.map((passage) => makeDoc(passageVectorId(passage), passage.text));
  return bm25Rank(query, docs, { topK: limit, config }).map((item) => ({ id: item.doc_id, passage: passageById.get(item.doc_id), score: item.score }));
}
function passageVectorId(passage) { return crypto.createHash('sha256').update(JSON.stringify([passage.doc_path, passage.title, passage.heading, passage.text])).digest('hex'); }
function similarity(a, b) { return cosineSimilarity(a, b); }
function fusion(rankings, limit) {
  const passageById = new Map(rankings.flatMap((ranking) => ranking.map((item) => [item.id, item.passage])));
  const fused = reciprocalRankFusion(rankings.map((ranking) => ranking.map((item) => ({ doc_id: item.id, score: item.score }))), { topK: limit });
  return fused.map((item) => ({ id: item.doc_id, score: item.score, passage: passageById.get(item.doc_id) }));
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
  let vectorQueue = Promise.resolve();
  function withVectorStore(operation) {
    const current = vectorQueue.then(async () => {
      const store = await VectorStore.open(options.vectorStoreFile);
      try { return await operation(store); } finally { store.close(); }
    });
    vectorQueue = current.catch(() => undefined);
    return current;
  }
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
        let semantic;
        if (settings.use_vector_store && options.vectorStoreFile) {
          semantic = await withVectorStore(async (store) => {
            const docs = passages.map((passage) => ({ id: passageVectorId(passage), passage })), liveIds = new Set(docs.map((doc) => doc.id));
            const missing = docs.filter((doc) => store.get(doc.id) === null);
            if (missing.length) {
              const vectors = await embed(missing.map((doc) => doc.passage.text));
              store.upsertMany(missing.map((doc, index) => ({ id: doc.id, text: doc.passage.text, embedding: vectors[index] })));
            }
            const queryVector = (await embed([query]))[0];
            return store.search(queryVector, { topK: store.count() }).filter(([id]) => liveIds.has(id)).slice(0, shortlist)
              .map(([id, score]) => ({ id, passage: docs.find((doc) => doc.id === id).passage, score }));
          });
        } else {
          const vectors = await embed([query, ...passages.map((p) => p.text)]), q = vectors[0];
          semantic = passages.map((passage, index) => ({ id: passageVectorId(passage), passage, score: similarity(q, vectors[index + 1]) })).sort((a, b) => b.score - a.score).slice(0, shortlist);
        }
        ranked = fusion([ranked, semantic], shortlist);
      } catch { /* BM25 remains available if embeddings fail. */ }
    }
    ranked = ranked.slice(0, limit);
    if (!ranked.length) return { answer: `I couldn't find anything in the ${label} about that. Try rephrasing.`, sources: [], mode: 'no_match' };
    const seen = new Set(), sources = [];
    for (const item of ranked) if (!seen.has(item.passage.doc_path)) { seen.add(item.passage.doc_path); sources.push({ doc_path: item.passage.doc_path, title: item.passage.title, heading: item.passage.heading, score: Number(item.score.toFixed(4)) }); }
    const excerpts = ranked.slice(0, 3).map(({ passage }) => `\n**${passage.title} — ${passage.heading}**\n${passage.text.length > 400 ? `${passage.text.slice(0, 400)}…` : passage.text}`);
    const extractiveAnswer = [`Here are the closest source excerpts from the ${label}:`, ...excerpts].join('\n');
    if (settings.answer_mode === 'generated' && options.generateAnswer) {
      const context = ranked.slice(0, 5).map(({ passage }, index) => `[${index + 1}] ${passage.title} — ${passage.heading}\n${passage.text}`).join('\n\n');
      try {
        const generated = await options.generateAnswer({
          message: query,
          context,
          sourceLabel: label,
        });
        if (typeof generated === 'string' && generated.trim()) {
          const faithfulness = options.scoreAnswer
            ? options.scoreAnswer(generated.trim(), ranked.slice(0, 5).map(({ passage }) => passage.text).join('\n\n'))
            : { basis: 'extractive', unsupported_rate: 0, checkable_count: 0 };
          return { answer: generated.trim(), sources, mode: 'generated', faithfulness };
        }
      } catch { /* keep the source-grounded extractive response available */ }
    }
    return { answer: extractiveAnswer, sources, mode: 'extractive', faithfulness: { basis: /** @type {'extractive'} */ ('extractive'), unsupported_rate: 0, checkable_count: 0 } };
  }
  function status() {
    const files = markdownFiles(options.docsDir), rawFiles = options.discoverRawSourceFiles(options.rawDir).length;
    const count = files.reduce((sum, file) => sum + sections(options.stripFrontmatter(fs.readFileSync(file, 'utf8'))).length, 0);
    return { corpus_pages: files.length, corpus_passages: count, raw_source_files: rawFiles, llm_available: options.isChatAvailable() };
  }
  return { answer, status, corpus };
}
module.exports = { createChatEngine, bm25, fusion, makeEmbeddings, similarity, passageVectorId };
