'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { loadTopicIndexOrDocs, parseFrontmatter, slugify } = require('../../../compiler/doc_utils.js');
const { findBrokenLinks } = require('../../../compiler/dead_link_checker.js');

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const DATA_ROOT = process.env.WIKI_DATA_ROOT ? path.resolve(process.env.WIKI_DATA_ROOT) : PROJECT_ROOT;
const OUTPUT_DIR = path.join(DATA_ROOT, 'wiki-app', 'docs');
const RAW_DIR = path.join(DATA_ROOT, 'data', 'raw');
const STATE_FILE = path.join(DATA_ROOT, 'data', 'state.json');
const INDEX_JSON = path.join(DATA_ROOT, 'compiler', 'temp_output', 'index.json');
const EXTENSIONS_FILE = path.join(PROJECT_ROOT, 'compiler', 'all_source_extensions.json');

function loadState(stateFile = STATE_FILE) {
  if (!fs.existsSync(stateFile)) return { files: {} };
  try { return JSON.parse(fs.readFileSync(stateFile, 'utf8')); } catch { return { files: {} }; }
}

function discoverRawSourceFiles(rawDir = RAW_DIR, manifestFile = EXTENSIONS_FILE) {
  if (!fs.existsSync(rawDir)) return [];
  const extensions = new Set(JSON.parse(fs.readFileSync(manifestFile, 'utf8')));
  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === '_archive') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && extensions.has(path.extname(entry.name).toLowerCase())) files.push(full);
    }
  }
  walk(rawDir);
  return [...new Set(files)].sort();
}

function countProcessedRawFiles(state, rawDir = RAW_DIR, manifestFile = EXTENSIONS_FILE) {
  let processed = 0, total = 0;
  for (const file of discoverRawSourceFiles(rawDir, manifestFile)) {
    total += 1;
    const relative = path.relative(rawDir, file).split(path.sep).join('/');
    const digest = crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex');
    if (state.files?.[relative]?.md5 === digest) processed += 1;
  }
  return [processed, total];
}

function normalizeTag(label) { return slugify(label) || label.toLowerCase().trim(); }

function registerRawChunk(registry, label, chunk, source) {
  const key = normalizeTag(label);
  if (!key) return;
  let bucket = registry.get(key);
  if (!bucket) { bucket = { tag: key, label: label.trim() || key, raw_chunks: [], pages: [] }; registry.set(key, bucket); }
  if (bucket.raw_chunks.some((item) => item.source === source && item.chunk_index === chunk.chunk_index)) return;
  bucket.raw_chunks.push({ source, chunk_index: chunk.chunk_index, preview: String(chunk.text ?? '').slice(0, 240).replace(/\n/g, ' '), topics: chunk.topics ?? [] });
}

function registerPage(registry, label, page) {
  const key = normalizeTag(label);
  if (!key) return;
  let bucket = registry.get(key);
  if (!bucket) { bucket = { tag: key, label: label.trim() || key, raw_chunks: [], pages: [] }; registry.set(key, bucket); }
  if (!bucket.pages.some((item) => item.path === page.path)) bucket.pages.push(page);
}

function buildTagRegistry(state, topicIndex, docsDir) {
  const registry = new Map();
  for (const [source, entry] of Object.entries(state.files ?? {})) {
    for (const chunk of entry.chunks ?? []) {
      const labels = new Set();
      for (const topic of chunk.topics ?? []) labels.add(topic);
      for (const entity of chunk.entities ?? []) if (entity.name) labels.add(entity.name);
      for (const concept of chunk.concepts ?? []) if (concept.name) labels.add(concept.name);
      for (const label of labels) registerRawChunk(registry, label, chunk, source);
    }
  }
  const indexedFiles = new Set(Object.values(topicIndex));
  for (const [title, filename] of Object.entries(topicIndex)) {
    const docPath = path.join(docsDir, filename);
    if (!fs.existsSync(docPath) || !fs.statSync(docPath).isFile()) continue;
    const raw = fs.readFileSync(docPath, 'utf8');
    const page = { path: filename, title, id: path.basename(filename, path.extname(filename)) };
    registerPage(registry, title, page);
    for (const tag of parseFrontmatter(raw).tags_list ?? []) registerPage(registry, tag, page);
  }
  if (fs.existsSync(docsDir)) for (const entry of fs.readdirSync(docsDir).sort()) {
    if (!entry.endsWith('.md') || entry === 'index.md' || indexedFiles.has(entry)) continue;
    const raw = fs.readFileSync(path.join(docsDir, entry), 'utf8'), stem = path.basename(entry, '.md');
    let title = stem.replace(/-/g, ' ').replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1));
    const meta = parseFrontmatter(raw);
    if (typeof meta.title === 'string') title = meta.title;
    const page = { path: entry, title, id: stem };
    for (const tag of meta.tags_list ?? []) registerPage(registry, tag, page);
  }
  return registry;
}

function detectTopicLinks(topicIndex, docsDir) {
  const filenameToTopic = new Map(Object.entries(topicIndex).map(([title, filename]) => [filename, title]));
  const indexed = new Set(Object.values(topicIndex)), links = [], seen = new Set();
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  for (const [sourceTopic, sourceFile] of Object.entries(topicIndex)) {
    const full = path.join(docsDir, sourceFile);
    if (!fs.existsSync(full)) continue;
    const body = require('../../../compiler/doc_utils.js').stripFrontmatter(fs.readFileSync(full, 'utf8'));
    const sourceId = path.basename(sourceFile, path.extname(sourceFile));
    for (const match of body.matchAll(linkRegex)) {
      const href = match[2].trim();
      if (/^(?:https?:\/\/|#)/i.test(href)) continue;
      let target;
      if (href.startsWith('/docs/')) target = href.slice('/docs/'.length).replace(/^\/+|\/+$/g, '');
      else target = path.posix.normalize(path.posix.join(path.posix.dirname(sourceFile) === '.' ? '' : path.posix.dirname(sourceFile), href.startsWith('./') ? href.slice(2) : href));
      if (!target.endsWith('.md') || !indexed.has(target)) continue;
      const targetTopic = filenameToTopic.get(target);
      if (!targetTopic) continue;
      const key = `${sourceTopic}\0${targetTopic}`;
      if (seen.has(key)) continue;
      seen.add(key);
      links.push({ source_topic: sourceTopic, target_topic: targetTopic, source_id: sourceId, target_id: path.basename(target, '.md'), origin: 'detected' });
    }
  }
  return links;
}

function buildAnalytics(docsDir = OUTPUT_DIR, options = {}) {
  const rawDir = options.rawDir || RAW_DIR;
  const state = options.state || loadState(options.stateFile || STATE_FILE);
  const indexFile = options.indexFile || INDEX_JSON;
  const manifestFile = options.manifestFile || EXTENSIONS_FILE;
  const [processed, rawTotal] = countProcessedRawFiles(state, rawDir, manifestFile);
  const topicIndex = options.topicIndex || loadTopicIndexOrDocs(docsDir, indexFile);
  const wikiPages = Object.keys(topicIndex).length;
  const deadLinks = findBrokenLinks(docsDir);
  const registry = buildTagRegistry(state, topicIndex, docsDir);
  const tags = [...registry.values()].filter((bucket) => bucket.raw_chunks.length + bucket.pages.length > 0)
    .map((bucket) => ({ tag: bucket.tag, label: bucket.label, count: bucket.raw_chunks.length + bucket.pages.length, raw_count: bucket.raw_chunks.length, page_count: bucket.pages.length }))
    .sort((a, b) => b.count - a.count || a.label.toLowerCase().localeCompare(b.label.toLowerCase()));
  const tagDetails = {};
  for (const bucket of registry.values()) if (bucket.raw_chunks.length + bucket.pages.length > 0) tagDetails[bucket.tag] = { tag: bucket.tag, label: bucket.label, raw_chunks: bucket.raw_chunks, pages: bucket.pages };
  return {
    metrics: { raw_files_processed: processed, raw_files_total: rawTotal, wiki_pages_created: wikiPages, cross_links_established: detectTopicLinks(topicIndex, docsDir).length, dead_links: deadLinks.length },
    tags,
    tag_details: tagDetails,
    dead_links: deadLinks,
  };
}

function getTagDetail(tag, docsDir = OUTPUT_DIR, options = {}) {
  const key = normalizeTag(tag);
  return buildAnalytics(docsDir, options).tag_details[key] ?? null;
}

module.exports = { loadState, discoverRawSourceFiles, countProcessedRawFiles, normalizeTag, buildTagRegistry, detectTopicLinks, buildAnalytics, getTagDetail };
