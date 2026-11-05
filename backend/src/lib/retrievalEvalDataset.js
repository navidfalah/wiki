'use strict';

const { loadTrustEvalDataset } = require('./trustEvalDataset');
const { makeDoc } = require('./hybridRetrieval');

const QUERIES = [
  { id: 'q-read-interval', text: 'What is the default sensor read interval for the Nova Widget?', relevant_ids: new Set(['nri-1', 'nri-2', 'nri-3', 'nri-4', 'nri-5', 'nri-6', 'nri-7', 'nri-8']) },
  { id: 'q-battery-cell', text: 'What battery cell type does the Nova Widget use?', relevant_ids: new Set(['nbc-1', 'nbc-2', 'nbc-3', 'nbc-4', 'nbc-5', 'nbc-6']) },
  { id: 'q-battery-life', text: "How long does the Nova Widget's battery last?", relevant_ids: new Set(['nbl-1', 'nbl-2', 'nbl-3', 'nbl-4', 'nbl-5']) },
  { id: 'q-herbal-preset', text: 'When does the TeaBuddy herbal steep preset trigger?', relevant_ids: new Set(['thp-1', 'thp-2']) },
  { id: 'q-relay-drain', text: 'Why does MeshSync relay mode drain the battery faster than expected?', relevant_ids: new Set(['mrd-1', 'mrd-2', 'mrd-3']) },
  { id: 'q-cr2450-mixup', text: 'There was a mixup where a blog post said the wrong battery type — what happened?', relevant_ids: new Set(['nbc-3', 'nbc-4', 'nbc-6']) },
  { id: 'q-hourly-vs-15min', text: 'Was the read interval ever hourly instead of 15 minutes?', relevant_ids: new Set(['nri-1', 'nri-2', 'nri-3', 'nri-5', 'nri-7']) },
  { id: 'q-relay-sleep-timer-fix', text: 'What was the technical root cause and fix for the relay radio not sleeping?', relevant_ids: new Set(['mrd-1', 'mrd-2']) },
];

function buildPassageDocs(dataset = loadTrustEvalDataset()) {
  return dataset.claim_groups.flatMap((group) => group.claims.map((claim) => makeDoc(claim.id, claim.quote)));
}

module.exports = { QUERIES, buildPassageDocs };
