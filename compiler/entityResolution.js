'use strict';

const EMAIL_RE = /^[\p{L}\p{N}_.+-]+@[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}.-]+)+$/u;
const DEFAULT_CONFIG = Object.freeze({ heuristic_merge_threshold: 0.85, heuristic_review_threshold: 0.55, embedding_merge_threshold: 0.9, embedding_review_threshold: 0.75 });
const ENTITY_ADJUDICATION_SYSTEM_PROMPT = `You resolve entity coreference for a personal wiki.

Given two name/label strings extracted from different sources, decide whether they refer to the SAME real-world entity (the same person, product, or organization) — not just similar-looking names. "Alex Kim" and "Alex Rivera" are DIFFERENT people who happen to share a first name; do not merge on partial overlap alone.

Return ONLY JSON: {"same_entity": true|false, "reason": "<one line>"}`;

function normalize(name) { return String(name).trim().toLocaleLowerCase('und').replace(/\s+/gu, ' '); }
function emailLocalPartToName(email) { return email.split('@', 1)[0].split(/[._-]+/u).filter(Boolean).map((part) => part[0].toLocaleUpperCase('und') + part.slice(1).toLocaleLowerCase('und')).join(' '); }
function canonicalizedForComparison(name) { const value = String(name).trim(); return normalize(EMAIL_RE.test(value) ? emailLocalPartToName(value) : value); }

// Port of difflib.SequenceMatcher.ratio() for short entity labels. Its
// recursive longest-contiguous-match behavior differs from edit distance.
function sequenceRatio(a, b) {
  const left = Array.from(a), right = Array.from(b);
  if (!left.length && !right.length) return 1;
  if (!left.length || !right.length) return 0;
  const positions = new Map();
  right.forEach((char, index) => { if (!positions.has(char)) positions.set(char, []); positions.get(char).push(index); });
  const matchingBlocks = [];
  const pending = [[0, left.length, 0, right.length]];
  while (pending.length) {
    const [alo, ahi, blo, bhi] = pending.pop();
    let bestI = alo, bestJ = blo, bestSize = 0, previous = new Map();
    for (let i = alo; i < ahi; i++) {
      const current = new Map();
      for (const j of positions.get(left[i]) || []) {
        if (j < blo) continue;
        if (j >= bhi) break;
        const size = (previous.get(j - 1) || 0) + 1;
        current.set(j, size);
        if (size > bestSize) { bestI = i - size + 1; bestJ = j - size + 1; bestSize = size; }
      }
      previous = current;
    }
    if (!bestSize) continue;
    matchingBlocks.push([bestI, bestJ, bestSize]);
    if (alo < bestI && blo < bestJ) pending.push([alo, bestI, blo, bestJ]);
    if (bestI + bestSize < ahi && bestJ + bestSize < bhi) pending.push([bestI + bestSize, ahi, bestJ + bestSize, bhi]);
  }
  const matches = matchingBlocks.reduce((sum, block) => sum + block[2], 0);
  return (2 * matches) / (left.length + right.length);
}

function heuristicSimilarity(a, b) {
  const normalizedA = normalize(a), normalizedB = normalize(b);
  if (normalizedA && normalizedA === normalizedB) return 1;
  const tokensA = new Set(normalizedA.split(' ').filter(Boolean)), tokensB = new Set(normalizedB.split(' ').filter(Boolean));
  const isSubset = (small, large) => small.size && [...small].every((token) => large.has(token));
  if (isSubset(tokensA, tokensB) || isSubset(tokensB, tokensA)) return 0.7;
  return Math.min(0.7, sequenceRatio(normalizedA, normalizedB));
}

class UnionFind {
  constructor(ids) { this.parent = new Map(ids.map((id) => [id, id])); }
  find(id) { let root = id; while (this.parent.get(root) !== root) root = this.parent.get(root); while (this.parent.get(id) !== id) { const next = this.parent.get(id); this.parent.set(id, root); id = next; } return root; }
  union(a, b) { const rootA = this.find(a), rootB = this.find(b); if (rootA !== rootB) this.parent.set(rootA, rootB); }
}

function cosineSimilarity(a, b) {
  if (a.length !== b.length || !a.length) throw new Error('Embedding vectors must have the same nonzero length.');
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; normA += a[i] ** 2; normB += b[i] ** 2; }
  return normA && normB ? dot / Math.sqrt(normA * normB) : 0;
}

async function llmConfirmsSameEntity(a, b, llm) {
  const prompt = `Name A: "${a}"\nName B: "${b}"`;
  const raw = typeof llm.generate === 'function'
    ? await llm.generate({ system: ENTITY_ADJUDICATION_SYSTEM_PROMPT, prompt, sampling: { temperature: 0 } })
    : await llm.generateResponse(prompt, ENTITY_ADJUDICATION_SYSTEM_PROMPT, { temperature: 0 });
  const match = String(raw).match(/\{[\s\S]*\}/);
  if (!match) return false;
  try { return Boolean(JSON.parse(match[0]).same_entity); } catch { return false; }
}

function pickCanonicalName(names) {
  const fullNames = names.filter((name) => !EMAIL_RE.test(name.trim()) && name.trim().includes(' '));
  const candidates = fullNames.length ? fullNames : names;
  return candidates.reduce((best, name) => name.length > best.length ? name : best, candidates[0]);
}

async function resolveEntities(mentions, { config = DEFAULT_CONFIG, embedFn = null, llm = null } = {}) {
  const lexical = (a, b) => a < b ? -1 : a > b ? 1 : 0;
  const names = [...new Set(mentions.map((mention) => mention.name))].sort(lexical);
  const unionFind = new UnionFind(names), candidates = new Map(names.map((name) => [name, []])), mergePairs = [], escalated = [];
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
    const [a, b] = [names[i], names[j]], score = heuristicSimilarity(a, b);
    if (score >= config.heuristic_merge_threshold) { mergePairs.push([a, b]); candidates.get(a).push(b); candidates.get(b).push(a); }
    else if (score >= config.heuristic_review_threshold) escalated.push([a, b]);
  }
  function ambiguous(a, b) {
    return candidates.get(a).some((other) => other !== b && heuristicSimilarity(other, b) < config.heuristic_merge_threshold)
      || candidates.get(b).some((other) => other !== a && heuristicSimilarity(other, a) < config.heuristic_merge_threshold);
  }
  for (const [a, b] of mergePairs) { if (ambiguous(a, b)) escalated.push([a, b]); else unionFind.union(a, b); }
  if (embedFn && escalated.length) {
    const stillEscalated = [];
    for (const [a, b] of escalated) {
      const score = cosineSimilarity(await embedFn(a), await embedFn(b));
      if (score >= config.embedding_merge_threshold) unionFind.union(a, b);
      else if (score >= config.embedding_review_threshold) stillEscalated.push([a, b]);
    }
    escalated.splice(0, escalated.length, ...stillEscalated);
  }
  if (llm?.available && escalated.length) for (const [a, b] of escalated) if (await llmConfirmsSameEntity(a, b, llm)) unionFind.union(a, b);
  const groups = new Map();
  for (const name of names) { const key = unionFind.find(name); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(name); }
  return [...groups.values()].sort((a, b) => lexical(a.slice().sort(lexical)[0], b.slice().sort(lexical)[0])).map((group, index) => {
    const members = new Set(group);
    return { id: `entity-${index}`, canonical_name: pickCanonicalName(group), aliases: members, mentions: mentions.filter((mention) => members.has(mention.name)), sources: new Set(mentions.filter((mention) => members.has(mention.name)).map((mention) => mention.source)) };
  });
}

module.exports = { EMAIL_RE, DEFAULT_CONFIG, ENTITY_ADJUDICATION_SYSTEM_PROMPT, normalize, emailLocalPartToName, canonicalizedForComparison, sequenceRatio, heuristicSimilarity, cosineSimilarity, llmConfirmsSameEntity, pickCanonicalName, resolveEntities };
