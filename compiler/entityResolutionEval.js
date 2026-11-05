'use strict';

const { resolveEntities } = require('./entityResolution');
const { GOLD_MENTIONS } = require('./entityResolutionEvalDataset');

function clusterIdByMentionName(clusters) {
  const result = new Map();
  for (const cluster of clusters) for (const alias of cluster.aliases) result.set(alias, cluster.id);
  return result;
}

function pairwiseEvaluate(clusters, gold) {
  const predictedClusterOf = clusterIdByMentionName(clusters), goldClusterOf = new Map(gold.map(([mention, goldId]) => [mention.name, goldId]));
  const names = [...new Set(gold.map(([mention]) => mention.name))].sort(), predictedPairs = new Set(), goldPairs = new Set();
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
    const a = names[i], b = names[j], key = JSON.stringify([a, b]);
    if (predictedClusterOf.get(a) === predictedClusterOf.get(b)) predictedPairs.add(key);
    if (goldClusterOf.get(a) === goldClusterOf.get(b)) goldPairs.add(key);
  }
  const correct = [...predictedPairs].filter((key) => goldPairs.has(key)).length;
  const precision = predictedPairs.size ? correct / predictedPairs.size : Number.NaN;
  const recall = goldPairs.size ? correct / goldPairs.size : Number.NaN;
  const f1 = precision && recall && precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
  return { precision, recall, f1, predicted_pairs: predictedPairs.size, gold_pairs: goldPairs.size, correct_pairs: correct };
}

async function runEval({ gold = GOLD_MENTIONS, embedFn = null, llm = null } = {}) {
  const mentions = gold.map(([mention]) => mention), clusters = await resolveEntities(mentions, { embedFn, llm });
  return pairwiseEvaluate(clusters, gold);
}

function formatReport(report) {
  const number = (value) => Number.isNaN(value) ? 'nan' : value.toFixed(2);
  return `precision=${number(report.precision)} recall=${number(report.recall)} f1=${number(report.f1)}  (${report.correct_pairs}/${report.predicted_pairs} predicted pairs correct, ${report.gold_pairs} gold pairs)`;
}

if (require.main === module) runEval().then((report) => {
  process.stdout.write(`=== Heuristic tier only (no API key needed) ===\n${formatReport(report)}\n`);
  process.stdout.write('\nOptional embedding and LLM adjudication tiers are available to callers that provide embedFn and llm hooks.\n');
}).catch((error) => { process.stderr.write(`${error.stack || error}\n`); process.exitCode = 1; });

module.exports = { clusterIdByMentionName, pairwiseEvaluate, runEval, formatReport };
