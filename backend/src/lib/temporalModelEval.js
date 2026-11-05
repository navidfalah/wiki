'use strict';

const { loadTrustEvalDataset } = require('./trustEvalDataset');
const { buildDatasetTimelines, currentClaims } = require('./temporalModel');
const { GOOD_LABELS, BAD_LABELS } = require('./trustPropagationEval');

function evaluateGroup(group, timeline) {
  const currentIds = new Set(currentClaims(group, timeline).map((claim) => claim.id));
  const goodIds = new Set(group.claims.filter((claim) => GOOD_LABELS.has(claim.gold_label)).map((claim) => claim.id));
  const badIds = new Set(group.claims.filter((claim) => BAD_LABELS.has(claim.gold_label)).map((claim) => claim.id));
  let truePositive = 0, falsePositive = 0, falseNegative = 0;
  for (const id of currentIds) { if (goodIds.has(id)) truePositive++; if (badIds.has(id)) falsePositive++; }
  for (const id of goodIds) if (!currentIds.has(id)) falseNegative++;
  const precision = truePositive + falsePositive ? truePositive / (truePositive + falsePositive) : null;
  const recall = truePositive + falseNegative ? truePositive / (truePositive + falseNegative) : null;
  return { group_id: group.id, precision, recall, current_ids: currentIds };
}

function evaluateDataset(dataset) {
  const timelines = buildDatasetTimelines(dataset);
  return dataset.claim_groups.map((group) => evaluateGroup(group, timelines[group.id]));
}

function formatReport(reports) {
  return reports.map((report) => {
    const p = report.precision === null ? 'n/a' : report.precision.toFixed(2);
    const r = report.recall === null ? 'n/a' : report.recall.toFixed(2);
    return `${report.group_id.padEnd(40)} precision=${p.padStart(5)} recall=${r.padStart(5)}`;
  }).join('\n');
}

if (require.main === module) process.stdout.write(`${formatReport(evaluateDataset(loadTrustEvalDataset()))}\n`);

module.exports = { evaluateGroup, evaluateDataset, formatReport };
