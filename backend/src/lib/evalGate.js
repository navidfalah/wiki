'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createRequire } = require('node:module');
const { evaluateNoApiTiers } = require('./retrievalEval');
const { QUERIES } = require('./retrievalEvalDataset');
const projectRequire = createRequire(path.join(__dirname, '../../package.json'));
const { runEval: evaluateEntityResolution } = projectRequire('../compiler/entityResolutionEval.js');
const { loadTrustEvalDataset } = require('./trustEvalDataset');
const { runAblation } = require('./trustPropagationEval');
const pii = require('./piiRedactionEval');
const temporal = require('./temporalModelEval');
const { evaluateExtractiveFaithfulness } = require('./faithfulnessEval');
const { createChatEngine } = require('./chatEngine');
const { checkCorpusGroundedness } = require('./faithfulnessHeuristic');
const qa = require('./qaBenchmarkEval');

const BASELINE_PATH = path.resolve(__dirname, '../../../compiler/eval_baseline.json');
const DEFAULT_TOLERANCE = 0.02;

function mean(values) {
  const present = values.filter((value) => value !== null && value !== undefined && Number.isFinite(value));
  return present.length ? present.reduce((sum, value) => sum + value, 0) / present.length : Number.NaN;
}
function localFrontmatter(content) {
  if (!content.startsWith('---')) return { meta: {}, body: content };
  const end = content.indexOf('\n---', 3);
  if (end < 0) return { meta: {}, body: content };
  const meta = {};
  for (const line of content.slice(3, end).split(/\r?\n/)) {
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) { try { value = JSON.parse(value); } catch { value = value.slice(1, -1); } }
    else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    meta[match[1]] = value;
  }
  return { meta, body: content.slice(end + 4).replace(/^\n+/, '') };
}
function parseFrontmatter(content) { return localFrontmatter(content).meta; }
function stripFrontmatter(content) { return localFrontmatter(content).body; }

async function evaluateExtractiveOnSyntheticCorpus(dataset, queries) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wissensbau-extractive-eval-'));
  try {
    for (const group of dataset.claim_groups) {
      const body = group.claims.map((claim) => `## ${claim.id}\n\n${claim.quote}`).join('\n\n');
      fs.writeFileSync(path.join(root, `${group.id}.md`), `---\ntitle: ${JSON.stringify(group.subject)}\n---\n\n${body}\n`, 'utf8');
    }
    const engine = createChatEngine({
      docsDir: root, rawDir: qa.DEFAULT_RAW_DIR,
      parseFrontmatter, stripFrontmatter,
      discoverRawSourceFiles: qa.discoverRawSourceFiles,
      loadSettings: () => ({ top_k: 5, bm25_k1: 1.5, bm25_b: 0.75, retrieval_mode: 'bm25', answer_mode: 'extractive', use_vector_store: false }),
      isChatAvailable: () => false,
      embeddingConfig: () => ({ apiKey: '' }),
    });
    const corpus = await engine.corpus('wiki');
    return await evaluateExtractiveFaithfulness(queries, {
      corpus,
      answer: (query) => engine.answer({ message: query, corpusSource: 'wiki' }),
    });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function collectMetrics() {
  const metrics = {};
  const retrieval = await evaluateNoApiTiers();
  const bm25 = retrieval.find((tier) => tier.name === 'bm25');
  if (!bm25) throw new Error('BM25 retrieval evaluation returned no result.');
  metrics['retrieval.bm25.recall_at_5'] = bm25.mean_recall_at_5;
  metrics['retrieval.bm25.ndcg_at_5'] = bm25.mean_ndcg_at_5;
  metrics['retrieval.queries'] = QUERIES.length;

  const entityResolution = await evaluateEntityResolution();
  metrics['entity_resolution.heuristic.precision'] = entityResolution.precision;
  metrics['entity_resolution.heuristic.recall'] = entityResolution.recall;
  metrics['entity_resolution.heuristic.f1'] = entityResolution.f1;
  metrics['entity_resolution.gold_pairs'] = entityResolution.gold_pairs;

  const dataset = loadTrustEvalDataset(), trust = runAblation(dataset).full_default;
  metrics['trust.full_default.precision_at_1'] = trust.mean_precision_at_1;
  metrics['trust.full_default.pairwise_accuracy'] = trust.pooled_pairwise_accuracy;
  metrics['trust.claim_groups'] = dataset.claim_groups.length;

  const piiReport = pii.runEval();
  metrics['pii.precision'] = piiReport.precision;
  metrics['pii.recall'] = piiReport.recall;
  metrics['pii.true_positives'] = piiReport.true_positives;

  const temporalReports = temporal.evaluateDataset(dataset);
  metrics['temporal.mean_precision'] = mean(temporalReports.map((report) => report.precision));
  metrics['temporal.mean_recall'] = mean(temporalReports.map((report) => report.recall));

  const extractive = await evaluateExtractiveOnSyntheticCorpus(dataset, QUERIES.map((query) => query.text));
  metrics['faithfulness.extractive.verbatim_rate'] = extractive.verbatim_rate;
  metrics['faithfulness.extractive.answers'] = extractive.total;

  const questions = qa.loadBenchmark(), wikiCorpus = qa.buildWikiCorpus();
  metrics['qa.questions'] = questions.length;
  metrics['qa.wiki.coverage'] = qa.coverage(questions, wikiCorpus);
  for (const score of await qa.evaluate(questions, ['naive'])) {
    metrics[`qa.${score.corpus}.naive.fact_recall`] = score.fact_recall;
    metrics[`qa.${score.corpus}.naive.source_hit`] = score.source_hit;
  }

  const grounded = checkCorpusGroundedness();
  const checkable = grounded.reduce((sum, result) => sum + result.report.checkableCount, 0);
  const unsupported = grounded.reduce((sum, result) => sum + result.report.unsupported.length, 0);
  metrics['groundedness.pages'] = grounded.length;
  metrics['groundedness.checkable_sentences'] = checkable;
  metrics['groundedness.supported_rate'] = checkable ? 1 - unsupported / checkable : Number.NaN;

  return Object.fromEntries(Object.entries(metrics).map(([key, value]) => [key, value == null ? Number.NaN : Number(value)]));
}

function compare(current, baseline) {
  const tolerance = baseline.tolerance ?? DEFAULT_TOLERANCE, overrides = baseline.tolerances || [], failures = [];
  for (const [name, expected] of Object.entries(baseline.metrics || {})) {
    const actual = current[name], allowed = overrides[name] ?? tolerance;
    if (!Number.isFinite(actual)) failures.push(`${name}: missing or NaN (baseline ${Number(expected).toFixed(4)})`);
    else if (actual < expected - allowed) failures.push(`${name}: ${actual.toFixed(4)} < baseline ${Number(expected).toFixed(4)} - ${allowed}`);
  }
  for (const [name, floor] of Object.entries(baseline.minimums || {})) {
    const actual = current[name];
    if (!Number.isFinite(actual) || actual < floor) failures.push(`${name}: ${actual} below minimum ${floor} (eval ran on too little input?)`);
  }
  return failures;
}
function buildBaseline(current, tolerance = DEFAULT_TOLERANCE) {
  const counts = new Set(Object.keys(current).filter((key) => key.endsWith('.queries') || key.endsWith('.questions') || key.endsWith('.gold_pairs') || key.endsWith('.claim_groups') || key.endsWith('.true_positives') || key.endsWith('.answers') || key.endsWith('.pages') || key.endsWith('.checkable_sentences')));
  const tolerances = { 'groundedness.supported_rate': 0.10, 'qa.wiki.coverage': 0.05, 'qa.wiki.naive.fact_recall': 0.05, 'qa.wiki.naive.source_hit': 0.05 };
  return {
    tolerance,
    tolerances,
    metrics: Object.fromEntries(Object.entries(current).filter(([key, value]) => !counts.has(key) && Number.isFinite(value)).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => [key, Number(value.toFixed(4))])),
    minimums: Object.fromEntries(Object.entries(current).filter(([key, value]) => counts.has(key) && Number.isFinite(value)).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => [key, Math.max(1, Math.floor(value / 2))])),
  };
}
async function main(argv = process.argv.slice(2), { baselinePath = BASELINE_PATH, collect = collectMetrics } = {}) {
  let updateBaseline = false;
  for (const arg of argv) {
    if (arg === '--update-baseline') updateBaseline = true;
    else if (arg === '--help' || arg === '-h') { process.stdout.write('Usage: node compiler/evalGate.js [--update-baseline]\n'); return 0; }
    else throw new Error(`Unknown option: ${arg}`);
  }
  const current = await collect();
  for (const [name, value] of Object.entries(current).sort(([a], [b]) => a.localeCompare(b))) process.stdout.write(`${name.padEnd(55)} ${Number.isNaN(value) ? 'NaN' : value.toFixed(4)}\n`);
  if (updateBaseline) {
    fs.writeFileSync(baselinePath, `${JSON.stringify(buildBaseline(current), null, 2)}\n`, 'utf8');
    process.stdout.write(`\nWrote ${path.basename(baselinePath)}\n`); return 0;
  }
  const failures = compare(current, JSON.parse(fs.readFileSync(baselinePath, 'utf8')));
  if (failures.length) {
    process.stdout.write('\nEVAL REGRESSIONS:\n');
    for (const failure of failures) process.stdout.write(`  - ${failure}\n`);
    return 1;
  }
  process.stdout.write('\nAll offline evals at or above baseline.\n');
  return 0;
}

if (require.main === module) main().then((code) => { process.exitCode = code; }).catch((error) => { process.stderr.write(`${error.stack || error}\n`); process.exitCode = 1; });
module.exports = { BASELINE_PATH, mean, collectMetrics, compare, buildBaseline, main };
