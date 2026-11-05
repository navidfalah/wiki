'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { readSource } = require('./sourceReader');
const { splitTextIntoChunks } = require('./textChunking');
const { simpleParser } = require('mailparser');
const { retrieve } = require('./ragArchitectures');
const { tokenize } = require('./ragTypes');
const { createModelClient } = require('./modelClient');
const { parsePage } = require('./faithfulnessHeuristic');

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const BENCHMARK_PATH = path.join(PROJECT_ROOT, 'data', 'qa_benchmark.json');
const DEFAULT_DOCS_DIR = path.join(PROJECT_ROOT, 'wiki-app', 'docs');
const DEFAULT_RAW_DIR = path.join(PROJECT_ROOT, 'data', 'raw');
const ALL_SOURCE_EXTENSIONS = new Set(JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'compiler', 'all_source_extensions.json'), 'utf8')));
const OFFLINE_ARCHITECTURES = ['naive', 'graph', 'corrective'];
const LLM_ARCHITECTURES = ['hyde', 'fusion'];
const PASSAGE_CHARS = 900;
const RAW_CHUNK_CHARS = 2000;
const EMAIL_CHUNK_CHARS = 3000;

function normalize(text) {
  return String(text).toLowerCase().replace(/[–—]/g, '-').replace(/[µμ]/g, 'u').replace(/\*\*/g, '').replace(/`/g, '').replace(/\s+/g, ' ');
}
function loadBenchmark(file = BENCHMARK_PATH) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(data.questions)) throw new Error('Q&A benchmark must contain a questions array.');
  return data.questions;
}
async function readSourceText(relPath, rawDir = DEFAULT_RAW_DIR) {
  const file = path.join(rawDir, relPath);
  if (path.extname(file).toLowerCase() === '.eml') {
    const mail = await simpleParser(fs.readFileSync(file));
    return `${String(mail.subject || '').trim()}\n${String(mail.from?.text || '').trim()}\n${String(mail.text || '').trim()}`;
  }
  return fs.readFileSync(file, 'utf8');
}
function factsFound(facts, text) {
  const haystack = normalize(text);
  return facts.reduce((count, alternatives) => count + (alternatives.some((value) => haystack.includes(normalize(value))) ? 1 : 0), 0);
}
function discoverRawSourceFiles(rawDir = DEFAULT_RAW_DIR) {
  const files = [];
  function visit(directory) {
    if (!fs.existsSync(directory)) return;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === '_archive') continue;
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile() && ALL_SOURCE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) files.push(full);
    }
  }
  visit(rawDir);
  return files.sort();
}
function sourceEquivalence(rawDir = DEFAULT_RAW_DIR) {
  return Object.fromEntries(discoverRawSourceFiles(rawDir).map((file) => [
    path.relative(rawDir, file).split(path.sep).join('/'),
    crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex'),
  ]));
}
function wikiPageSources(docsDir = DEFAULT_DOCS_DIR) {
  const result = {};
  if (!fs.existsSync(docsDir)) return result;
  for (const name of fs.readdirSync(docsDir).filter((item) => item.endsWith('.md')).sort()) {
    result[name] = parsePage(fs.readFileSync(path.join(docsDir, name), 'utf8')).sourcePaths;
  }
  return result;
}
function pageMetadataAndBody(content) {
  if (!content.startsWith('---')) return { meta: {}, body: content };
  const end = content.indexOf('\n---', 3);
  if (end < 0) return { meta: {}, body: content };
  const yaml = content.slice(3, end), meta = {};
  for (const line of yaml.split(/\r?\n/)) {
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) { try { value = JSON.parse(value); } catch { value = value.slice(1, -1); } }
    else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    meta[match[1]] = value;
  }
  return { meta, body: content.slice(end + 4).replace(/^\n+/, '') };
}
function headingPassages({ docPath, title, body }) {
  const passages = []; let heading = title, lines = [];
  const flush = () => {
    const section = lines.join('\n').trim(); lines = [];
    if (!section) return;
    for (const piece of splitTextIntoChunks(section, PASSAGE_CHARS)) {
      const text = piece.trim(); if (text) passages.push({ doc_path: docPath, title, heading, text, tokens: tokenize(text) });
    }
  };
  for (const line of body.split(/\r?\n/)) {
    const match = line.match(/^#{1,6}\s+(.+?)\s*#*\s*$/);
    if (match) { flush(); heading = match[1].trim(); }
    else lines.push(line);
  }
  flush();
  return passages;
}
function buildWikiCorpus(docsDir = DEFAULT_DOCS_DIR) {
  if (!fs.existsSync(docsDir)) return [];
  const files = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile() && entry.name.endsWith('.md')) files.push(full);
    }
  }
  visit(docsDir);
  return files.sort().flatMap((file) => {
    const rel = path.relative(docsDir, file).split(path.sep).join('/');
    const raw = fs.readFileSync(file, 'utf8'), { meta, body } = pageMetadataAndBody(raw);
    const title = meta.title || path.basename(file, '.md').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return headingPassages({ docPath: rel, title, body });
  });
}
async function buildRawCorpus(rawDir = DEFAULT_RAW_DIR) {
  const passages = [];
  for (const file of discoverRawSourceFiles(rawDir)) {
    const rel = path.relative(rawDir, file).split(path.sep).join('/');
    try {
      let sourceText, chunkSize = RAW_CHUNK_CHARS;
      if (path.extname(file).toLowerCase() === '.eml') {
        const mail = await simpleParser(fs.readFileSync(file));
        const headers = [
          `Subject: ${String(mail.subject || '').trim() || '(no subject)'}`,
          `From: ${String(mail.from?.text || '').trim() || '(unknown sender)'}`,
          `To: ${String(mail.to?.text || '').trim() || '(unknown recipient)'}`,
        ];
        if (mail.cc?.text) headers.push(`Cc: ${mail.cc.text}`);
        const dateHeader = fs.readFileSync(file, 'utf8').match(/^Date:\s*(.+)$/im)?.[1]?.trim();
        headers.push(`Date: ${dateHeader || '(unknown date)'}`);
        sourceText = `${headers.join('\n')}\n\n${String(mail.text || '').trim() || '(empty body)'}`;
        chunkSize = EMAIL_CHUNK_CHARS;
      } else sourceText = await readSource(file);
      const chunks = splitTextIntoChunks(sourceText, chunkSize);
      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        for (const piece of splitTextIntoChunks(chunks[chunkIndex], PASSAGE_CHARS)) {
          const text = piece.trim();
          if (text) passages.push({ doc_path: rel, title: path.basename(file), heading: `Part ${chunkIndex + 1}`, text, tokens: tokenize(text) });
        }
      }
    } catch { /* An unreadable source is omitted from this offline benchmark. */ }
  }
  return passages;
}
function coverage(questions, corpus) {
  if (!questions.length) return Number.NaN;
  const whole = normalize(corpus.map((passage) => passage.text).join('\n'));
  return questions.filter((question) => factsFound(question.facts, whole) === question.facts.length).length / questions.length;
}
async function evaluate(questions, architectures = OFFLINE_ARCHITECTURES, options = {}) {
  const { topK = 5, llm = null, docsDir = DEFAULT_DOCS_DIR, rawDir = DEFAULT_RAW_DIR, signal } = options;
  const equivalence = sourceEquivalence(rawDir), pageSources = wikiPageSources(docsDir);
  const corpora = { wiki: buildWikiCorpus(docsDir), raw: await buildRawCorpus(rawDir) };
  const scores = [];
  for (const [corpusName, corpus] of Object.entries(corpora)) {
    for (const architecture of architectures) {
      let recallTotal = 0, allFactsTotal = 0, sourceHitTotal = 0, charsTotal = 0;
      for (const question of questions) {
        const retrieved = await retrieve(architecture, question.question, { corpus, topK, llm, signal });
        const text = retrieved.map((item) => item.passage.text).join('\n');
        charsTotal += text.length;
        const found = factsFound(question.facts, text);
        recallTotal += question.facts.length ? found / question.facts.length : 0;
        if (found === question.facts.length) allFactsTotal++;
        const paths = retrieved.flatMap((item) => corpusName === 'wiki' ? (pageSources[item.passage.doc_path] || []) : [item.passage.doc_path]);
        const sourceIds = new Set(paths.map((source) => equivalence[source] || source));
        if (question.sources.some((source) => sourceIds.has(equivalence[source] || source))) sourceHitTotal++;
      }
      const n = questions.length || 1;
      scores.push({ corpus: corpusName, architecture, fact_recall: recallTotal / n, all_facts: allFactsTotal / n, source_hit: sourceHitTotal / n, mean_chars: charsTotal / n });
    }
  }
  return scores;
}
function createEnvironmentModelClient() {
  const apiKey = process.env.CHAT_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';
  const base = process.env.CHAT_OPENAI_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  return createModelClient({
    default: { apiKey, base, model: process.env.CHAT_OPENAI_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini' },
    embedding: { apiKey: process.env.EMBEDDING_OPENAI_API_KEY || apiKey, base: process.env.EMBEDDING_OPENAI_BASE_URL || base, model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small' },
    cacheFile: path.join(PROJECT_ROOT, 'data', 'llm_cache.json'),
  });
}
async function main(argv = process.argv.slice(2)) {
  let withLlm = false, topK = 5;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--with-llm') withLlm = true;
    else if (argv[i] === '--top-k') {
      topK = Number(argv[++i]);
      if (!Number.isInteger(topK) || topK < 1) throw new Error('--top-k must be a positive integer.');
    } else if (argv[i] === '--help' || argv[i] === '-h') {
      process.stdout.write('Usage: node compiler/qaBenchmarkEval.js [--with-llm] [--top-k N]\n'); return 0;
    } else throw new Error(`Unknown option: ${argv[i]}`);
  }
  const questions = loadBenchmark(), llm = withLlm ? createEnvironmentModelClient() : null;
  if (withLlm && !llm.available) throw new Error('--with-llm requires OPENAI_API_KEY.');
  const architectures = withLlm ? [...OFFLINE_ARCHITECTURES, ...LLM_ARCHITECTURES] : OFFLINE_ARCHITECTURES;
  process.stdout.write(`${questions.length} questions, top_k=${topK}\n\n`);
  const [wiki, raw] = await Promise.all([buildWikiCorpus(), buildRawCorpus()]);
  process.stdout.write(`coverage: wiki ${coverage(questions, wiki).toFixed(3)}  raw ${coverage(questions, raw).toFixed(3)}\n\n`);
  process.stdout.write(`${'corpus'.padEnd(6)} ${'architecture'.padEnd(12)} ${'fact_recall'.padStart(11)} ${'all_facts'.padStart(9)} ${'source_hit'.padStart(10)} ${'chars'.padStart(6)}\n`);
  for (const score of await evaluate(questions, architectures, { topK, llm })) {
    process.stdout.write(`${score.corpus.padEnd(6)} ${score.architecture.padEnd(12)} ${score.fact_recall.toFixed(3).padStart(11)} ${score.all_facts.toFixed(3).padStart(9)} ${score.source_hit.toFixed(3).padStart(10)} ${Math.round(score.mean_chars).toString().padStart(6)}\n`);
  }
  return 0;
}

if (require.main === module) main().then((code) => { process.exitCode = code; }).catch((error) => { process.stderr.write(`${error.stack || error}\n`); process.exitCode = 1; });
module.exports = { BENCHMARK_PATH, OFFLINE_ARCHITECTURES, LLM_ARCHITECTURES, normalize, loadBenchmark, readSourceText, factsFound, discoverRawSourceFiles, sourceEquivalence, wikiPageSources, pageMetadataAndBody, headingPassages, buildWikiCorpus, buildRawCorpus, coverage, evaluate, main };
