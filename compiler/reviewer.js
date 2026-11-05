#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DATA_ROOT, OUTPUT_DIR, STATE_FILE } = require('./models');
const { parseFrontmatter, stripFrontmatter, normalizeTopic } = require('./doc_utils');
const { createModelClient } = require('../backend/src/lib/modelClient');

const COMPILER_DIR = __dirname;
const INDEX_JSON = path.join(DATA_ROOT, 'compiler', 'temp_output', 'index.json');
const DEFAULT_REPORT_PATH = path.join(DATA_ROOT, 'compiler', 'review_report.txt');
const MAX_CHUNK_CHARS = 8000;
const MAX_WIKI_CHARS = 12000;
const REVIEW_SYSTEM_PROMPT = `You are a wiki quality reviewer. Compare a compiled wiki page against the original raw source chunks it was synthesized from.
Find structural inconsistencies (missing content, ungrounded claims, organization, attribution) and dubious or contradicted claims. Ignore navigation cross-links unless they introduce factual claims. Return ONLY valid JSON:
{"topic":"string","severity":"clean|minor|major","structural_issues":[{"type":"missing_content|ungrounded_content|organization|attribution|other","description":"string","source_refs":["source/path (chunk N)"],"wiki_excerpt":"optional short quote"}],"dubious_claims":[{"claim":"questionable statement","reason":"why dubious vs sources","confidence":"low|medium|high","source_refs":["source/path (chunk N)"]}],"summary":"one or two sentence assessment"}
Be specific and cite source files. If the page faithfully reflects sources, use empty arrays and severity clean.`;

function loadJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function loadTopicIndex(file = INDEX_JSON) {
  const topics = loadJson(file, {}).topics;
  return topics && typeof topics === 'object' && !Array.isArray(topics) ? topics : {};
}
function normalizeKey(topic) {
  return normalizeTopic(String(topic).replace(/\\(["'])/g, '$1')).replace(/\s+/g, ' ').trim().toLocaleLowerCase();
}
function buildGroupedFromState(state) {
  const grouped = new Map();
  for (const [source, fileEntry] of Object.entries(state.files || {})) {
    for (const chunk of fileEntry.chunks || []) {
      const payload = { source, chunk_index: chunk.chunk_index, text: chunk.text, entities: chunk.entities || [], concepts: chunk.concepts || [] };
      for (const topic of chunk.topics?.length ? chunk.topics : ['General Notes']) {
        const key = normalizeKey(topic);
        if (key) grouped.set(key, [...(grouped.get(key) || []), payload]);
      }
    }
  }
  return grouped;
}
function dedupeChunkEntries(entries) {
  const seen = new Set();
  return entries.filter((entry) => {
    const key = `${entry.source}\0${entry.chunk_index}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}
function formatSourceChunks(entries) {
  return dedupeChunkEntries(entries).map((entry) => {
    const text = entry.text.length > MAX_CHUNK_CHARS ? `${entry.text.slice(0, MAX_CHUNK_CHARS)}\n\n[... truncated for review ...]` : entry.text;
    return `### Source: \`${entry.source}\` (chunk ${entry.chunk_index})\n\n${text}`;
  }).join('\n\n---\n\n');
}
function parseReviewJson(raw, topic) {
  const match = String(raw).match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Model response did not contain JSON');
  const data = JSON.parse(match[0]);
  return { topic, severity: 'minor', structural_issues: [], dubious_claims: [], summary: '', ...data };
}
async function reviewPageWithModel({ topic, wikiBody, sourceEntries, model }) {
  if (!sourceEntries.length) return {
    topic, severity: 'major', summary: 'No raw source chunks are mapped to this topic in state.json.',
    structural_issues: [{ type: 'attribution', description: 'Topic has no linked raw chunks in compiler state.', source_refs: [], wiki_excerpt: '' }],
    dubious_claims: [],
  };
  const body = wikiBody.length > MAX_WIKI_CHARS ? `${wikiBody.slice(0, MAX_WIKI_CHARS)}\n\n[... truncated for review ...]` : wikiBody;
  const entries = dedupeChunkEntries(sourceEntries);
  const prompt = `Topic: ${topic}\nSource chunk count: ${entries.length}\n\n## Compiled wiki page\n\n${body}\n\n## Original raw source chunks\n\n${formatSourceChunks(entries)}`;
  const data = parseReviewJson(await model.generate({ system: REVIEW_SYSTEM_PROMPT, prompt, step: 'wiki review', sampling: { temperature: 0.1 } }), topic);
  return { topic, severity: data.severity, summary: data.summary, structural_issues: data.structural_issues || [], dubious_claims: data.dubious_claims || [] };
}
function discoverPages(docsDir, topicIndex, indexedOnly = true) {
  if (indexedOnly && Object.keys(topicIndex).length) {
    return Object.entries(topicIndex).sort(([a], [b]) => a.toLowerCase().localeCompare(b.toLowerCase()))
      .map(([title, filename]) => [title, path.join(docsDir, filename)]).filter(([, file]) => fs.existsSync(file));
  }
  const filenameToTopic = new Map(Object.entries(topicIndex).map(([title, filename]) => [filename, title]));
  const pages = [];
  function visit(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'index.md') {
        const raw = fs.readFileSync(file, 'utf8'), meta = parseFrontmatter(raw);
        pages.push([filenameToTopic.get(entry.name) || meta.title || path.basename(file, '.md').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), file]);
      }
    }
  }
  visit(docsDir);
  return pages;
}
function formatReport(reviews, docsDir) {
  const rank = { major: 0, minor: 1, clean: 2 };
  const lines = ['LLM Wiki Review Report', '='.repeat(72), `Generated: ${new Date().toISOString()}`, `Docs directory: ${docsDir}`, 'Review mode: LLM', `Pages reviewed: ${reviews.length}`, ''];
  const sorted = [...reviews].sort((a, b) => (rank[a.severity] ?? 1) - (rank[b.severity] ?? 1) || a.topic.toLowerCase().localeCompare(b.topic.toLowerCase()));
  const flagged = sorted.filter((r) => r.error || r.structural_issues.length || r.dubious_claims.length || r.severity !== 'clean');
  if (!flagged.length) return `${lines.join('\n')}No structural inconsistencies or dubious claims flagged.\n`;
  for (const review of flagged) {
    let display = review.page_path;
    const relative = path.relative(path.resolve(docsDir, '../..'), review.page_path);
    if (!relative.startsWith('..')) display = relative;
    lines.push('-'.repeat(72), `PAGE: ${review.topic}`, `FILE: ${display}`, `SEVERITY: ${review.severity.toUpperCase()}`);
    if (review.summary) lines.push(`SUMMARY: ${review.summary}`);
    if (review.error) lines.push(`ERROR: ${review.error}`);
    lines.push('');
    if (review.structural_issues.length) {
      lines.push('STRUCTURAL ISSUES', '-'.repeat(40));
      for (const issue of review.structural_issues) {
        lines.push(`  [${issue.type || 'other'}] ${issue.description || ''}`);
        if (issue.source_refs?.length) lines.push(`    Sources: ${issue.source_refs.join(', ')}`);
        if (issue.wiki_excerpt) lines.push(`    Wiki excerpt: ${issue.wiki_excerpt}`);
      }
      lines.push('');
    }
    if (review.dubious_claims.length) {
      lines.push('DUBIOUS CLAIMS', '-'.repeat(40));
      for (const claim of review.dubious_claims) {
        lines.push(`  [${claim.confidence || 'medium'} confidence] ${claim.claim || ''}`);
        if (claim.reason) lines.push(`    Reason: ${claim.reason}`);
        if (claim.source_refs?.length) lines.push(`    Sources: ${claim.source_refs.join(', ')}`);
      }
      lines.push('');
    }
  }
  const cleanCount = reviews.length - flagged.length;
  if (cleanCount) lines.push('-'.repeat(72), `${cleanCount} additional page(s) passed with no flagged issues.`, '');
  return lines.join('\n');
}
function createReviewModel() {
  const env = process.env;
  const apiKey = env.CHAT_OPENAI_API_KEY || env.OPENAI_API_KEY || '';
  if (!apiKey) throw new Error('Set CHAT_OPENAI_API_KEY or OPENAI_API_KEY to run LLM review.');
  const number = (value) => value !== undefined && value !== '' && Number.isFinite(Number(value)) ? Number(value) : undefined;
  return createModelClient({ default: {
    apiKey, base: env.CHAT_OPENAI_BASE_URL || env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model: env.CHAT_OPENAI_MODEL || env.OPENAI_MODEL || 'gpt-4o-mini',
    sampling: { temperature: number(env.CHAT_TEMPERATURE) ?? 0.2, ...(number(env.CHAT_TOP_P) === undefined ? {} : { top_p: number(env.CHAT_TOP_P) }) },
  } });
}
async function runReview({ docsDir = OUTPUT_DIR, reportPath = DEFAULT_REPORT_PATH, model = createReviewModel(), topicFilter = '', indexedOnly = true } = {}) {
  if (!fs.existsSync(docsDir)) throw new Error(`Docs directory not found: ${docsDir}`);
  if (!fs.existsSync(STATE_FILE)) throw new Error(`Compiler state not found: ${STATE_FILE}\nRun the JavaScript compiler first (node compiler/main.js).`);
  const state = loadJson(STATE_FILE, { files: {} }), grouped = buildGroupedFromState(state), topicIndex = loadTopicIndex();
  if (indexedOnly && !Object.keys(topicIndex).length) { console.warn('index.json not found — reviewing all docs under output directory.'); indexedOnly = false; }
  let pages = discoverPages(docsDir, topicIndex, indexedOnly);
  if (topicFilter) pages = pages.filter(([title]) => title.toLowerCase().includes(topicFilter.toLowerCase()));
  console.log(`LLM Wiki Reviewer\nDocs: ${docsDir}\nReport: ${reportPath}\nMode: LLM\nPages: ${pages.length}`);
  const reviews = [];
  for (let index = 0; index < pages.length; index++) {
    const [topic, pagePath] = pages[index];
    process.stdout.write(`\rReviewing ${index + 1}/${pages.length}: ${topic}`);
    try {
      const raw = fs.readFileSync(pagePath, 'utf8');
      reviews.push({ ...await reviewPageWithModel({ topic, wikiBody: stripFrontmatter(raw), sourceEntries: grouped.get(normalizeKey(topic)) || [], model }), page_path: pagePath });
    } catch (error) {
      reviews.push({ topic, page_path: pagePath, severity: 'major', summary: 'Review failed.', structural_issues: [], dubious_claims: [], error: String(error.message || error) });
    }
  }
  if (pages.length) process.stdout.write('\n');
  const reportText = formatReport(reviews, docsDir);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true }); fs.writeFileSync(reportPath, reportText, 'utf8');
  const issueCount = reviews.reduce((sum, review) => sum + review.structural_issues.length + review.dubious_claims.length + (review.error ? 1 : 0), 0);
  const flagged = reviews.filter((review) => review.severity !== 'clean' || review.structural_issues.length || review.dubious_claims.length || review.error).length;
  console.log(`Review complete\nPages reviewed: ${reviews.length}\nPages flagged: ${flagged}\nTotal issues: ${issueCount}\nReport: ${reportPath}`);
  return reportPath;
}
function parseArgs(argv) {
  const result = { docsDir: OUTPUT_DIR, reportPath: DEFAULT_REPORT_PATH, topicFilter: '', indexedOnly: true };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--docs-dir' && argv[i + 1]) result.docsDir = path.resolve(argv[++i]);
    else if (argv[i] === '--output' && argv[i + 1]) result.reportPath = path.resolve(argv[++i]);
    else if (argv[i] === '--topic' && argv[i + 1]) result.topicFilter = argv[++i];
    else if (argv[i] === '--all-docs') result.indexedOnly = false;
    else if (argv[i] === '--help' || argv[i] === '-h') {
      console.log('Usage: node compiler/reviewer.js [--docs-dir DIR] [--output FILE] [--topic TEXT] [--all-docs]'); process.exit(0);
    } else throw new Error(`Unknown option: ${argv[i]}`);
  }
  return result;
}
if (require.main === module) runReview(parseArgs(process.argv.slice(2))).catch((error) => { console.error(error.message || error); process.exitCode = 1; });
module.exports = { MAX_CHUNK_CHARS, MAX_WIKI_CHARS, REVIEW_SYSTEM_PROMPT, normalizeKey, buildGroupedFromState, dedupeChunkEntries, formatSourceChunks, parseReviewJson, reviewPageWithModel, discoverPages, formatReport, runReview };
