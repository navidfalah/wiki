'use strict';

const retrieval = require('./hybridRetrieval');
const { tokenize, indexCorpus, scorePassages } = require('./ragTypes');

const HYDE_SYSTEM_PROMPT = 'Write a short, plausible passage (3-5 sentences) that would appear in a wiki page directly answering the question below. Invent specifics if you don\'t know them -- this text is only used to find semantically similar real passages, it is never shown to the user.';
const FUSION_SYSTEM_PROMPT = 'Generate 3 alternative phrasings of the user\'s question that search the same underlying information need from different angles (a synonym swap, a more specific version, a more general version). Return ONLY a JSON array of exactly 3 strings, no commentary.\n\nExample response: ["...", "...", "..."]';
const CORRECTIVE_GRADE_SYSTEM_PROMPT = 'You grade whether retrieved passages actually answer a question. Given the question and the passages, respond with exactly one word: CORRECT (the passages clearly answer it), AMBIGUOUS (partially relevant), or INCORRECT (not relevant).';
const CORRECTIVE_REWRITE_SYSTEM_PROMPT = 'The first search for this question didn\'t find a clearly relevant result. Rewrite the question as a broader or differently-worded search query likely to match more of the source material. Return ONLY the rewritten query, no commentary.';

function context(options = {}) {
  const topK = Math.max(1, Math.floor(options.topK || 5));
  const { docs, byId } = indexCorpus(options.corpus || []);
  const config = options.bm25Config || retrieval.DEFAULT_BM25_CONFIG;
  const rank = (query, limit = topK) => retrieval.bm25Rank(query, docs, { topK: limit, config });
  const convert = (rows) => scorePassages(rows, byId);
  return { topK, docs, byId, config, rank, convert, llm: options.llm || null, signal: options.signal };
}

async function ask(llm, system, prompt, temperature, signal) {
  return llm.generate({ system, prompt, purpose: 'chat', step: 'RAG architecture', signal, sampling: { temperature } });
}
function usableLlm(llm) { return Boolean(llm && llm.available && typeof llm.generate === 'function'); }
function isAbort(error, signal) { return signal?.aborted || error?.name === 'AbortError'; }

async function retrieveNaive(query, options = {}) {
  const c = context(options);
  return c.convert(c.rank(query));
}

async function retrieveHyde(query, options = {}) {
  const c = context(options), shortlist = Math.max(c.topK * 3, c.topK), base = c.rank(query, shortlist);
  if (!usableLlm(c.llm)) return c.convert(base.slice(0, c.topK));
  try {
    const hypothetical = await ask(c.llm, HYDE_SYSTEM_PROMPT, query, 0.3, c.signal);
    const semantic = await retrieval.embeddingRank(hypothetical, c.docs, (text) => c.llm.embedText(text, { signal: c.signal, step: 'HyDE embedding' }), { topK: shortlist });
    const fused = retrieval.reciprocalRankFusion([base, semantic], { topK: c.topK });
    return c.convert(fused.length ? fused : base.slice(0, c.topK));
  } catch (error) {
    if (isAbort(error, c.signal)) throw error;
    return c.convert(base.slice(0, c.topK));
  }
}

function parseQueryVariants(raw) {
  const match = String(raw).match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const value = JSON.parse(match[0]);
    return Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim()) : [];
  } catch { return []; }
}

async function retrieveFusion(query, options = {}) {
  const c = context(options), shortlist = Math.max(c.topK * 3, c.topK), base = c.rank(query, shortlist);
  if (!usableLlm(c.llm)) return c.convert(base.slice(0, c.topK));
  let variants = [];
  try { variants = parseQueryVariants(await ask(c.llm, FUSION_SYSTEM_PROMPT, query, 0.5, c.signal)).slice(0, options.numVariants || 3); }
  catch (error) { if (isAbort(error, c.signal)) throw error; }
  if (!variants.length) return c.convert(base.slice(0, c.topK));
  const rankings = [base, ...variants.map((variant) => c.rank(variant, shortlist))];
  const fused = retrieval.reciprocalRankFusion(rankings, { topK: c.topK });
  return c.convert(fused.length ? fused : base.slice(0, c.topK));
}

const LINK_RE = /\]\(\.?\/?([a-z0-9][a-z0-9-]*)\.md\)/g;
function buildLinkGraph(corpus) {
  const graph = new Map();
  for (const passage of corpus) {
    const targets = new Set([...String(passage.text).matchAll(LINK_RE)].map((match) => `${match[1]}.md`));
    targets.delete(passage.doc_path);
    if (!graph.has(passage.doc_path)) graph.set(passage.doc_path, new Set());
    for (const target of targets) graph.get(passage.doc_path).add(target);
  }
  return graph;
}
function retrieveGraph(query, options = {}) {
  const c = context(options), corpus = options.corpus || [];
  if (!c.docs.length) return [];
  const graph = buildLinkGraph(corpus), representative = new Map();
  for (const [id, passage] of c.byId) if (!representative.has(passage.doc_path)) representative.set(passage.doc_path, id);
  const full = c.rank(query, c.docs.length);
  if (!full.length) return [];
  const seeds = full.slice(0, c.topK), combined = new Map(seeds.map((row) => [row.doc_id, row.score]));
  const pageScore = new Map();
  for (const row of seeds) {
    const page = c.byId.get(row.doc_id).doc_path;
    pageScore.set(page, Math.max(pageScore.get(page) || 0, row.score));
  }
  const reached = new Set(pageScore.keys()); let frontier = new Set(reached), decay = 0.5;
  for (let hop = 0; hop < Math.max(0, options.hops ?? 1); hop++) {
    const neighbors = new Set([...frontier].flatMap((page) => [...(graph.get(page) || [])]));
    for (const page of reached) neighbors.delete(page);
    if (!neighbors.size) break;
    const nextScores = new Map();
    for (const page of neighbors) {
      const inbound = [...frontier].filter((source) => graph.get(source)?.has(page)).map((source) => pageScore.get(source) || 0);
      if (!inbound.length) continue;
      const score = Math.max(...inbound) * decay, id = representative.get(page);
      nextScores.set(page, score);
      if (id) combined.set(id, Math.max(combined.get(id) || 0, score));
    }
    for (const page of neighbors) reached.add(page);
    for (const [page, score] of nextScores) pageScore.set(page, score);
    frontier = neighbors; decay *= 0.5;
  }
  const ordered = [...combined].sort((a, b) => b[1] - a[1]).slice(0, c.topK).map(([doc_id, score]) => ({ doc_id, score }));
  return c.convert(ordered);
}

function gradeHeuristic(queryTerms, top) {
  if (!top || !queryTerms.length) return 'INCORRECT';
  const terms = new Set(queryTerms), tokens = new Set(Array.isArray(top.passage.tokens) ? top.passage.tokens : tokenize(top.passage.text));
  let covered = 0; for (const term of terms) if (tokens.has(term)) covered++;
  const ratio = covered / terms.size;
  return ratio >= 0.6 ? 'CORRECT' : ratio > 0 ? 'AMBIGUOUS' : 'INCORRECT';
}

async function retrieveCorrective(query, options = {}) {
  const c = context(options), first = c.rank(query, c.topK), scored = c.convert(first);
  let grade;
  if (usableLlm(c.llm) && scored.length) {
    const passageText = scored.slice(0, 3).map((item) => item.passage.text).join('\n\n');
    try {
      const raw = (await ask(c.llm, CORRECTIVE_GRADE_SYSTEM_PROMPT, `Question: ${query}\n\nPassages:\n${passageText}`, 0, c.signal)).trim().toUpperCase();
      const candidate = raw.split(/\s+/)[0].replace(/[.,:]/g, '');
      if (['CORRECT', 'AMBIGUOUS', 'INCORRECT'].includes(candidate)) grade = candidate;
    } catch (error) { if (isAbort(error, c.signal)) throw error; }
  }
  grade ||= gradeHeuristic(tokenize(query), scored[0]);
  if (grade === 'CORRECT') return scored;
  let retryQuery = query;
  if (usableLlm(c.llm)) {
    try { retryQuery = (await ask(c.llm, CORRECTIVE_REWRITE_SYSTEM_PROMPT, query, 0.3, c.signal)).trim() || query; }
    catch (error) { if (isAbort(error, c.signal)) throw error; }
  }
  const second = c.rank(retryQuery, c.topK * 2), fused = retrieval.reciprocalRankFusion([first, second], { topK: c.topK });
  return c.convert(fused.length ? fused : first.slice(0, c.topK));
}

const ARCHITECTURES = Object.freeze({ naive: retrieveNaive, hyde: retrieveHyde, fusion: retrieveFusion, graph: retrieveGraph, corrective: retrieveCorrective });
async function retrieve(architecture, query, options = {}) {
  const fn = ARCHITECTURES[architecture];
  if (!fn) throw new Error(`Unknown RAG architecture: ${JSON.stringify(architecture)}`);
  return fn(query, options);
}

module.exports = {
  HYDE_SYSTEM_PROMPT, FUSION_SYSTEM_PROMPT, CORRECTIVE_GRADE_SYSTEM_PROMPT, CORRECTIVE_REWRITE_SYSTEM_PROMPT,
  parseQueryVariants, buildLinkGraph, gradeHeuristic, retrieveNaive, retrieveHyde, retrieveFusion, retrieveGraph, retrieveCorrective,
  ARCHITECTURES, retrieve,
};
