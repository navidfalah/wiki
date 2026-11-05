'use strict';

const { QUERIES, buildPassageDocs } = require('./retrievalEvalDataset');
const { tokenize, bm25Rank, embeddingRank, reciprocalRankFusion, llmRerank } = require('./hybridRetrieval');

function legacyTfidfRank(query, documents, topK = 5) {
  const terms = new Set(tokenize(query));
  if (!terms.size || !documents.length) return [];
  const df = new Map();
  for (const doc of documents) for (const token of new Set(doc.tokens)) df.set(token, (df.get(token) || 0) + 1);
  const n = documents.length, scored = [];
  for (const doc of documents) {
    if (!doc.tokens.length) continue;
    const counts = new Map();
    for (const token of doc.tokens) counts.set(token, (counts.get(token) || 0) + 1);
    let score = 0;
    for (const term of terms) {
      const tf = counts.get(term) || 0;
      if (tf) score += (tf / doc.tokens.length) * (Math.log((n + 1) / ((df.get(term) || 0) + 1)) + 1);
    }
    if (score > 0) scored.push({ doc_id: doc.id, score });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, topK).map((item) => item.doc_id);
}

function recallAtK(rankedIds, relevantIds, k) {
  if (!relevantIds.size) return Number.NaN;
  return new Set(rankedIds.slice(0, k).filter((id) => relevantIds.has(id))).size / relevantIds.size;
}
function dcgAtK(rankedIds, relevantIds, k) {
  return rankedIds.slice(0, k).reduce((score, id, index) => score + (relevantIds.has(id) ? 1 / Math.log2(index + 2) : 0), 0);
}
function ndcgAtK(rankedIds, relevantIds, k) {
  if (!relevantIds.size) return Number.NaN;
  const idealHits = Math.min(k, relevantIds.size);
  const ideal = Array.from({ length: idealHits }, (_, index) => 1 / Math.log2(index + 2)).reduce((a, b) => a + b, 0);
  return ideal > 0 ? dcgAtK(rankedIds, relevantIds, k) / ideal : Number.NaN;
}

async function evaluateRankFn(name, rankFn, queries = QUERIES, k = 5) {
  const recalls = [], ndcgs = [];
  for (const query of queries) {
    const ranked = await rankFn(query.text);
    recalls.push(recallAtK(ranked, query.relevant_ids, k));
    ndcgs.push(ndcgAtK(ranked, query.relevant_ids, k));
  }
  return { name, mean_recall_at_5: recalls.reduce((a, b) => a + b, 0) / recalls.length, mean_ndcg_at_5: ndcgs.reduce((a, b) => a + b, 0) / ndcgs.length };
}

async function evaluateNoApiTiers({ k = 5, docs = buildPassageDocs(), queries = QUERIES } = {}) {
  const legacy = (query) => legacyTfidfRank(query, docs, k);
  const bm25 = (query) => bm25Rank(query, docs, { topK: k }).map((result) => result.doc_id);
  return [await evaluateRankFn('legacy_tfidf', legacy, queries, k), await evaluateRankFn('bm25', bm25, queries, k)];
}

async function evaluateHybridTiers({ embedFn, llm, k = 5, docs = buildPassageDocs(), queries = QUERIES } = {}) {
  if (typeof embedFn !== 'function') throw new Error('evaluateHybridTiers requires an embedFn.');
  if (!llm) throw new Error('evaluateHybridTiers requires an llm for reranking.');
  const shortlist = Math.max(k * 3, k);
  async function hybrid(query) {
    const lexical = bm25Rank(query, docs, { topK: shortlist });
    const semantic = await embeddingRank(query, docs, embedFn, { topK: shortlist });
    return reciprocalRankFusion([lexical, semantic], { topK: shortlist }).slice(0, k).map((item) => item.doc_id);
  }
  async function reranked(query) {
    const lexical = bm25Rank(query, docs, { topK: shortlist });
    const semantic = await embeddingRank(query, docs, embedFn, { topK: shortlist });
    const fused = reciprocalRankFusion([lexical, semantic], { topK: shortlist });
    const docsById = new Map(docs.map((doc) => [doc.id, doc]));
    const candidates = fused.slice(0, k * 2).map((item) => docsById.get(item.doc_id)).filter(Boolean);
    return (await llmRerank(query, candidates, llm, { topN: k })).map((item) => item.doc_id);
  }
  return [await evaluateRankFn('hybrid_bm25_embeddings', hybrid, queries, k), await evaluateRankFn('hybrid_reranked', reranked, queries, k)];
}

function formatReport(report) {
  const f = (value) => Number.isNaN(value) ? 'nan' : value.toFixed(2);
  return `${report.name.padEnd(28)} recall@5=${f(report.mean_recall_at_5)}  ndcg@5=${f(report.mean_ndcg_at_5)}`;
}

async function formatNoApiReport() {
  const reports = await evaluateNoApiTiers();
  return ['=== No-API tiers (legacy TF-IDF vs BM25) ===', ...reports.map(formatReport), '', 'Embedding and reranking tiers are available through evaluateHybridTiers({ embedFn, llm }).'].join('\n');
}

if (require.main === module) formatNoApiReport().then((report) => process.stdout.write(`${report}\n`)).catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});

module.exports = { legacyTfidfRank, recallAtK, dcgAtK, ndcgAtK, evaluateRankFn, evaluateNoApiTiers, evaluateHybridTiers, formatReport, formatNoApiReport };
