'use strict';

const DEFAULT_BM25_CONFIG = Object.freeze({ k1: 1.5, b: 0.75 });
const RERANK_SYSTEM_PROMPT = `You are a search relevance reranker.

Given a query and a numbered list of candidate passages, return ONLY a JSON
array of the passage numbers ordered from most to least relevant to the
query. Include every number exactly once, no commentary.

Example response: [3, 1, 2]`;

function tokenize(text) { return String(text).toLowerCase().match(/[a-z0-9]+/g) || []; }
function makeDoc(id, text) { return { id, text, tokens: tokenize(text) }; }

/** @param {string} query @param {Array<{id:string,text:string,tokens:string[]}>} documents @param {{topK?:number,config?:{k1:number,b:number}}} [options] */
function bm25Rank(query, documents, { topK = 5, config = DEFAULT_BM25_CONFIG } = {}) {
  const queryTerms = tokenize(query);
  if (!queryTerms.length || !documents.length) return [];
  const docLengths = new Map(documents.map((doc) => [doc.id, doc.tokens.length]));
  const nonzeroCount = documents.filter((doc) => docLengths.get(doc.id)).length;
  const avgdl = nonzeroCount ? [...docLengths.values()].reduce((sum, length) => sum + length, 0) / nonzeroCount : 0;
  const df = new Map();
  for (const doc of documents) for (const term of new Set(doc.tokens)) df.set(term, (df.get(term) || 0) + 1);
  const scored = [];
  for (const doc of documents) {
    const dl = docLengths.get(doc.id);
    if (!dl) continue;
    const tfByTerm = new Map();
    for (const token of doc.tokens) tfByTerm.set(token, (tfByTerm.get(token) || 0) + 1);
    let score = 0;
    for (const term of queryTerms) {
      const tf = tfByTerm.get(term) || 0;
      if (!tf) continue;
      const termDf = df.get(term) || 0;
      const idf = Math.log(1 + (documents.length - termDf + 0.5) / (termDf + 0.5));
      const denominator = tf + config.k1 * (1 - config.b + config.b * dl / avgdl);
      score += idf * (tf * (config.k1 + 1)) / denominator;
    }
    if (score > 0) scored.push({ doc_id: doc.id, score });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}

function cosineSimilarity(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; normA += a[i] ** 2; normB += b[i] ** 2; }
  return normA && normB ? dot / Math.sqrt(normA * normB) : 0;
}

async function embedDocuments(documents, embedFn) {
  const entries = await Promise.all(documents.map(async (doc) => [doc.id, await embedFn(doc.text)]));
  return Object.fromEntries(entries);
}

/** @param {string} query @param {Array<{id:string,text:string,tokens:string[]}>} documents @param {(text:string)=>number[]|Promise<number[]>} embedFn @param {{topK?:number,docEmbeddings?:Record<string,number[]>|null}} [options] */
async function embeddingRank(query, documents, embedFn, { topK = 5, docEmbeddings = null } = {}) {
  if (!documents.length) return [];
  const embeddings = docEmbeddings || await embedDocuments(documents, embedFn);
  const queryVector = await embedFn(query);
  return documents.map((doc) => ({ doc_id: doc.id, score: cosineSimilarity(queryVector, embeddings[doc.id] || []) }))
    .filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, topK);
}

function reciprocalRankFusion(rankings, { k = 60, topK = 5 } = {}) {
  const scores = new Map();
  for (const ranking of rankings) ranking.forEach((item, index) => scores.set(item.doc_id, (scores.get(item.doc_id) || 0) + 1 / (k + index + 1)));
  return [...scores].map(([doc_id, score]) => ({ doc_id, score })).sort((a, b) => b.score - a.score).slice(0, topK);
}

function parseRerankOrder(raw, n) {
  const fallback = Array.from({ length: n }, (_, index) => index + 1), match = String(raw).match(/\[[\s\S]*\]/);
  if (!match) return fallback;
  let parsed;
  try { parsed = JSON.parse(match[0]); } catch { return fallback; }
  if (!Array.isArray(parsed)) return fallback;
  const valid = parsed.filter((value) => Number.isInteger(value) && value >= 1 && value <= n), ordered = [...new Set(valid)];
  return ordered.concat(fallback.filter((value) => !ordered.includes(value)));
}

/** @param {string} query @param {Array<{id:string,text:string,tokens:string[]}>} candidates @param {any} llm @param {{topN?:number|null}} [options] */
async function llmRerank(query, candidates, llm, { topN = null } = {}) {
  if (!candidates.length) return [];
  const numbered = candidates.map((doc, index) => `[${index + 1}] ${doc.text}`).join('\n\n');
  const prompt = `Query: ${query}\n\nCandidates:\n${numbered}`;
  const raw = typeof llm.generate === 'function'
    ? await llm.generate({ system: RERANK_SYSTEM_PROMPT, prompt, sampling: { temperature: 0 } })
    : await llm.generateResponse(prompt, RERANK_SYSTEM_PROMPT, { temperature: 0 });
  let reordered = parseRerankOrder(raw, candidates.length).map((index) => candidates[index - 1]);
  if (topN !== null) reordered = reordered.slice(0, topN);
  return reordered.map((doc, index) => ({ doc_id: doc.id, score: reordered.length - index }));
}

module.exports = { DEFAULT_BM25_CONFIG, RERANK_SYSTEM_PROMPT, tokenize, makeDoc, bm25Rank, cosineSimilarity, embedDocuments, embeddingRank, reciprocalRankFusion, parseRerankOrder, llmRerank };
