'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const { makeDoc, bm25Rank } = require('./hybridRetrieval');
const { buildPassageDocs } = require('./retrievalEvalDataset');
const { VectorStore } = require('./vectorStore');

const EMBEDDING_DIM = 128;
function seededRandom(seed) {
  let state = Number(seed) >>> 0;
  return () => { state += 0x6D2B79F5; let value = state; value = Math.imul(value ^ (value >>> 15), value | 1); value ^= value + Math.imul(value ^ (value >>> 7), value | 61); return ((value ^ (value >>> 14)) >>> 0) / 4294967296; };
}
function generateSyntheticCorpus(targetSize, { seed = 0 } = {}) {
  if (!Number.isInteger(targetSize) || targetSize < 0) throw new RangeError('targetSize must be a non-negative integer');
  const baseDocs = buildPassageDocs(), random = seededRandom(seed), docs = [];
  if (!targetSize) return docs;
  if (!baseDocs.length) throw new Error('Cannot generate benchmark data from an empty passage corpus.');
  for (let i = 0; i < targetSize; i++) {
    const base = baseDocs[i % baseDocs.length], text = `${base.text} (variant ${i}, ref ${1000 + Math.floor(random() * 9000)})`;
    docs.push(makeDoc(`${base.id}-${i}`, text));
  }
  return docs;
}
function randomEmbedding(random, dim = EMBEDDING_DIM) { return Array.from({ length: dim }, () => random() * 2 - 1); }
async function benchmarkAtSizeAsync(corpusSize, { seed = 0, query = 'why do batteries drain fast' } = {}) {
  const docs = generateSyntheticCorpus(corpusSize, { seed }), random = seededRandom(seed);
  let start = performance.now(); bm25Rank(query, docs, { topK: 5 }); const firstCall = (performance.now() - start) / 1000;
  start = performance.now(); bm25Rank(query, docs, { topK: 5 }); const bm25Query = (performance.now() - start) / 1000;
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-benchmark-'));
  let store;
  try {
    store = await VectorStore.open(path.join(root, 'bench.sqlite'));
    const records = docs.map((doc) => ({ id: doc.id, text: doc.text, embedding: randomEmbedding(random) }));
    start = performance.now(); store.upsertMany(records); const vectorInsert = (performance.now() - start) / 1000;
    const queryEmbedding = randomEmbedding(random);
    start = performance.now(); store.search(queryEmbedding, { topK: 5 }); const vectorQuery = (performance.now() - start) / 1000;
    return { corpus_size: corpusSize, bm25_index_seconds: Math.max(0, firstCall - bm25Query), bm25_query_seconds: bm25Query, vector_insert_seconds: vectorInsert, vector_query_seconds: vectorQuery };
  } finally { store?.close(); fs.rmSync(root, { recursive: true, force: true }); }
}
async function runBenchmark(sizes = [10, 100, 1000, 5000, 10000]) { const results = []; for (const size of sizes) results.push(await benchmarkAtSizeAsync(size)); return results; }
function formatBenchmark(results) {
  const lines = [`${'size'.padStart(6)}  ${'bm25_index_ms'.padStart(14)}  ${'bm25_query_ms'.padStart(14)}  ${'vec_insert_ms'.padStart(14)}  ${'vec_query_ms'.padStart(13)}`];
  for (const row of results) lines.push(`${String(row.corpus_size).padStart(6)}  ${ (row.bm25_index_seconds * 1000).toFixed(2).padStart(14)}  ${(row.bm25_query_seconds * 1000).toFixed(2).padStart(14)}  ${(row.vector_insert_seconds * 1000).toFixed(2).padStart(14)}  ${(row.vector_query_seconds * 1000).toFixed(2).padStart(13)}`);
  return lines.join('\n');
}
module.exports = { EMBEDDING_DIM, generateSyntheticCorpus, benchmarkAtSizeAsync, runBenchmark, formatBenchmark };
