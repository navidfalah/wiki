'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DEFAULT_CONFIG: DEFAULT_PROPAGATION_CONFIG, propagateGroupTrust } = require('./trustPropagation');

const CORRECTIONS_PATH = path.resolve(__dirname, '../../../data/review_corrections.json');
const LOW_CONFIDENCE_THRESHOLD = 0.35;
const CONTRADICTION_MARGIN = 0.15;
const VERDICTS = new Set(['confirm_correct', 'confirm_incorrect', 'confirm_superseded', 'confirm_scope_dependent']);

function selectReviewCandidates(group, scores, { lowConfidenceThreshold = LOW_CONFIDENCE_THRESHOLD, contradictionMargin = CONTRADICTION_MARGIN } = {}) {
  const claims = new Map(group.claims.map((claim) => [claim.id, claim])), flagged = new Map();
  for (const claim of group.claims) {
    const score = scores[claim.id].score;
    if (score < lowConfidenceThreshold) flagged.set(claim.id, { claim_id: claim.id, group_id: group.id, reason: 'low_confidence', score, quote: claim.quote, source_path: claim.source_path });
  }
  for (const relation of group.relations) {
    if (relation.type !== 'contradicts' || !scores[relation.from_id] || !scores[relation.to_id]) continue;
    if (Math.abs(scores[relation.from_id].score - scores[relation.to_id].score) < contradictionMargin) {
      for (const [id, otherId] of [[relation.from_id, relation.to_id], [relation.to_id, relation.from_id]]) {
        if (flagged.get(id)?.reason === 'unresolved_contradiction') continue;
        const claim = claims.get(id);
        if (!claim) continue;
        flagged.set(id, { claim_id: id, group_id: group.id, reason: 'unresolved_contradiction', score: scores[id].score, quote: claim.quote, source_path: claim.source_path, contradicts: otherId });
      }
    }
  }
  return [...flagged.values()].sort((a, b) => a.score - b.score);
}

function selectReviewCandidatesForDataset(claimGroups, { config = DEFAULT_PROPAGATION_CONFIG, trustConfig, lowConfidenceThreshold = LOW_CONFIDENCE_THRESHOLD, contradictionMargin = CONTRADICTION_MARGIN } = {}) {
  return claimGroups.flatMap((group) => selectReviewCandidates(group, propagateGroupTrust(group, config, trustConfig), { lowConfidenceThreshold, contradictionMargin }));
}

function correctionFromCandidate(candidate, verdict, note) {
  if (!VERDICTS.has(verdict)) throw new Error(`Unknown verdict ${JSON.stringify(verdict)}; must be one of ${[...VERDICTS].sort().join(', ')}`);
  return { claim_id: candidate.claim_id, group_id: candidate.group_id, verdict, note, quote_excerpt: candidate.quote.slice(0, 200), reviewed_at: new Date().toISOString().replace(/Z$/, '+00:00') };
}

function loadCorrections(file = CORRECTIONS_PATH) {
  let data;
  try { data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; }
  return (Array.isArray(data.corrections) ? data.corrections : []).map((entry) => {
    if (!entry || !VERDICTS.has(entry.verdict)) throw new Error(`Unknown verdict ${JSON.stringify(entry?.verdict)}; must be one of ${[...VERDICTS].sort().join(', ')}`);
    return entry;
  });
}

function saveCorrection(correction, file = CORRECTIONS_PATH) {
  if (!VERDICTS.has(correction.verdict)) throw new Error(`Unknown verdict ${JSON.stringify(correction.verdict)}`);
  const retained = loadCorrections(file).filter((item) => item.group_id !== correction.group_id || item.claim_id !== correction.claim_id);
  retained.push(correction);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify({ version: 1, corrections: retained }, null, 2)}\n`, 'utf8');
  return file;
}

function renderFewshotBlock(corrections) {
  if (!corrections.length) return '';
  return ['Known corrections from human review — apply the same judgment to similar text:', ...corrections.map((item) => `- "${String(item.quote_excerpt || '').slice(0, 200)}" -> ${item.verdict}: ${item.note}`)].join('\n');
}

module.exports = { CORRECTIONS_PATH, LOW_CONFIDENCE_THRESHOLD, CONTRADICTION_MARGIN, VERDICTS, selectReviewCandidates, selectReviewCandidatesForDataset, correctionFromCandidate, loadCorrections, saveCorrection, renderFewshotBlock };
