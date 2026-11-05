'use strict';

const { loadTrustEvalDataset } = require('./trustEvalDataset');
const { DEFAULT_CONFIG, propagateDatasetTrust, propagateGroupTrust } = require('./trustPropagation');

const GOOD_LABELS = new Set(['correct', 'scope_dependent']);
const BAD_LABELS = new Set(['incorrect', 'superseded', 'disputed']);
const STATIC_BASELINE_CONFIG = { ...DEFAULT_CONFIG, prior_weight: 1, supersede_decay: 1 };
const NAMED_ABLATIONS = {
  'static_baseline (prior only, = trust.js today)': STATIC_BASELINE_CONFIG,
  full_default: DEFAULT_CONFIG,
  no_corroboration: { ...DEFAULT_CONFIG, corroborate_weight: 0 },
  no_contradiction: { ...DEFAULT_CONFIG, contradict_weight: 0 },
  no_supersession: { ...DEFAULT_CONFIG, supersede_weight: 0, supersede_decay: 1 },
  'relational_only (prior_weight=0)': { ...DEFAULT_CONFIG, prior_weight: 0 },
};

function groupMetrics(group, scores) {
  const good = group.claims.filter((claim) => GOOD_LABELS.has(claim.gold_label));
  const bad = group.claims.filter((claim) => BAD_LABELS.has(claim.gold_label));
  if (!bad.length) return { group_id: group.id, n_good: good.length, n_bad: 0, precision_at_1: null, pairwise_accuracy: null };
  const max = Math.max(...group.claims.map((claim) => scores[claim.id].score));
  const top = group.claims.filter((claim) => scores[claim.id].score === max);
  const precisionAt1 = top.every((claim) => GOOD_LABELS.has(claim.gold_label)) ? 1 : 0;
  let pairwiseAccuracy = null;
  if (good.length) {
    let correct = 0;
    for (const positive of good) for (const negative of bad) if (scores[positive.id].score > scores[negative.id].score) correct++;
    pairwiseAccuracy = correct / (good.length * bad.length);
  }
  return { group_id: group.id, n_good: good.length, n_bad: bad.length, precision_at_1: precisionAt1, pairwise_accuracy: pairwiseAccuracy };
}

function evaluateConfig(dataset, config = DEFAULT_CONFIG, configName = 'config') {
  const propagated = propagateDatasetTrust(dataset, config);
  const groupResults = dataset.claim_groups.map((group) => groupMetrics(group, propagated[group.id]));
  const labels = new Map();
  for (const group of dataset.claim_groups) for (const claim of group.claims) {
    if (!labels.has(claim.gold_label)) labels.set(claim.gold_label, []);
    labels.get(claim.gold_label).push(propagated[group.id][claim.id].score);
  }
  const meanScoreByLabel = Object.fromEntries([...labels].map(([label, values]) => [label, values.reduce((sum, value) => sum + value, 0) / values.length]));
  const informative = groupResults.filter((group) => group.n_bad > 0);
  const meanPrecisionAt1 = informative.length ? informative.reduce((sum, group) => sum + group.precision_at_1, 0) / informative.length : null;
  const totalPairs = groupResults.reduce((sum, group) => sum + group.n_good * group.n_bad, 0);
  const pooledPairwiseAccuracy = totalPairs ? groupResults.reduce((sum, group) => sum + (group.pairwise_accuracy ?? 0) * group.n_good * group.n_bad, 0) / totalPairs : null;
  return { config_name: configName, group_results: groupResults, mean_score_by_label: meanScoreByLabel, informative_groups: informative, mean_precision_at_1: meanPrecisionAt1, pooled_pairwise_accuracy: pooledPairwiseAccuracy };
}

function runAblation(dataset) { return Object.fromEntries(Object.entries(NAMED_ABLATIONS).map(([name, config]) => [name, evaluateConfig(dataset, config, name)])); }
function sweepPriorWeight(dataset, values = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]) {
  return values.map((alpha) => [alpha, evaluateConfig(dataset, { ...DEFAULT_CONFIG, prior_weight: alpha }, `prior_weight=${alpha}`)]);
}

function simulateIsolatedClaim(dataset, groupId, claimId, config = DEFAULT_CONFIG) {
  const group = dataset.claim_groups.find((entry) => entry.id === groupId);
  if (!group) throw new Error(`Unknown claim group: ${groupId}`);
  const claim = group.claims.find((entry) => entry.id === claimId);
  if (!claim) throw new Error(`Unknown claim ${claimId} in group ${groupId}`);
  const baseline = propagateGroupTrust(group, config)[claimId].score;
  const isolated = propagateGroupTrust({ id: `${claimId}-isolated`, domain: group.domain, subject: '', description: '', claims: [claim], relations: [] }, config)[claimId].score;
  return { group_id: groupId, claim_id: claimId, gold_label: claim.gold_label, score_when_correctly_grouped: baseline, score_when_wrongly_isolated: isolated, score_delta: isolated - baseline };
}

function reportLine(report) {
  const p1 = report.mean_precision_at_1, pairwise = report.pooled_pairwise_accuracy;
  return `${report.config_name.padEnd(45)} precision@1=${p1 === null ? ' n/a' : p1.toFixed(2).padStart(5)}  pairwise_acc=${pairwise === null ? ' n/a' : pairwise.toFixed(2).padStart(5)}`;
}

function formatReport(dataset = loadTrustEvalDataset()) {
  const lines = ['=== Ablation (named configs) ===', ...Object.values(runAblation(dataset)).map(reportLine), '', '=== prior_weight sweep ===', ...sweepPriorWeight(dataset).map(([, report]) => reportLine(report)), '', '=== Mean score by gold label (full_default) ==='];
  const defaultReport = evaluateConfig(dataset, DEFAULT_CONFIG, 'full_default');
  for (const [label, mean] of Object.entries(defaultReport.mean_score_by_label).sort(([a], [b]) => a.localeCompare(b))) lines.push(`  ${label.padEnd(16)} ${mean.toFixed(3)}`);
  const error = simulateIsolatedClaim(dataset, 'nova_read_interval', 'nri-1');
  lines.push('', '=== Simulated entity-resolution error: a bad claim wrongly isolated ===', `  ${error.claim_id} (gold=${error.gold_label}): correctly grouped=${error.score_when_correctly_grouped.toFixed(3)}  wrongly isolated=${error.score_when_wrongly_isolated.toFixed(3)}  delta=${error.score_delta >= 0 ? '+' : ''}${error.score_delta.toFixed(3)}`, '  Losing its contradicting/superseding evidence (an entity-resolution false-negative merge would do exactly this) makes a bad claim look meaningfully more trustworthy, not less — the error compounds.');
  return lines.join('\n');
}

if (require.main === module) process.stdout.write(`${formatReport()}\n`);

module.exports = { GOOD_LABELS, BAD_LABELS, STATIC_BASELINE_CONFIG, NAMED_ABLATIONS, groupMetrics, evaluateConfig, runAblation, sweepPriorWeight, simulateIsolatedClaim, reportLine, formatReport };
