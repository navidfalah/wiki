#!/usr/bin/env node
'use strict';

// Plain JavaScript counterpart of compiler/doc_utils.py. Paths and JSON
// formats match the compiler and backend so they can share the same files.
const fs = require('node:fs');
const path = require('node:path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_ROOT = process.env.WIKI_DATA_ROOT ? path.resolve(process.env.WIKI_DATA_ROOT) : PROJECT_ROOT;
const OUTPUT_DIR = path.join(DATA_ROOT, 'wiki-app', 'docs');
const INDEX_JSON_PATH = path.join(DATA_ROOT, 'compiler', 'temp_output', 'index.json');
const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;

function splitFrontmatter(content) {
  if (!content.startsWith('---')) return null;
  const first = content.indexOf('---');
  const second = content.indexOf('---', first + 3);
  return second < 0 ? null : { yaml: content.slice(first + 3, second), body: content.slice(second + 3) };
}

function unquote(value) {
  return value.replace(/^(["'])(.*)\1$/, '$2');
}

function parseFrontmatter(content) {
  const split = splitFrontmatter(content);
  if (!split) return {};
  const meta = {};
  const tags = [];
  let inTags = false;
  for (const line of split.yaml.split(/\r?\n/)) {
    if (inTags) {
      const item = line.match(/^\s*-\s+(.*)$/);
      if (item) { tags.push(unquote(item[1].trim())); continue; }
      inTags = false;
    }
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (!match) continue;
    const [, key, raw] = match;
    const value = raw.trim();
    if (key === 'tags') {
      if (!value || value === '[]') { inTags = true; continue; }
      if (value.startsWith('[') && value.endsWith(']')) {
        const inner = value.slice(1, -1).trim();
        if (inner) for (const item of inner.split(',')) if (item.trim()) tags.push(unquote(item.trim()));
        continue;
      }
      // Match the Python reader's permissive behavior for a bare tags value:
      // it starts a block list and is not exposed as meta.tags.
      inTags = true;
      continue;
    }
    meta[key] = unquote(value);
  }
  if (tags.length) meta.tags_list = tags;
  return meta;
}

function stripFrontmatter(content) {
  const split = splitFrontmatter(content);
  return split ? split.body.replace(/^\n+/, '') : content;
}

function extractLinks(markdownBody) {
  return [...String(markdownBody).matchAll(LINK_RE)].map((match) => ({ text: match[1], href: match[2] }));
}

function normalizeTopic(title) {
  return String(title).replace(/\\(["'])/g, '$1').trim();
}

function slugify(text) {
  return String(text).toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

function loadTopicIndex(indexJsonPath = INDEX_JSON_PATH) {
  if (!fs.existsSync(indexJsonPath)) return {};
  try {
    const data = JSON.parse(fs.readFileSync(indexJsonPath, 'utf8'));
    return data?.topics && typeof data.topics === 'object' && !Array.isArray(data.topics) ? data.topics : {};
  } catch {
    return {};
  }
}

function loadTopicIndexOrDocs(docsDir = OUTPUT_DIR, indexJsonPath = INDEX_JSON_PATH) {
  const fromCompiler = loadTopicIndex(indexJsonPath);
  if (Object.keys(fromCompiler).length || !fs.existsSync(docsDir)) return fromCompiler;
  const index = {};
  for (const name of fs.readdirSync(docsDir).sort()) {
    if (!name.endsWith('.md') || name === 'index.md' || name === 'log.md') continue;
    const meta = parseFrontmatter(fs.readFileSync(path.join(docsDir, name), 'utf8'));
    const title = typeof meta.title === 'string' && meta.title.trim() ? meta.title.trim() : path.basename(name, '.md');
    if (!Object.hasOwn(index, title)) index[title] = name;
  }
  return index;
}

function topicFilename(topicIndex, topic, docsDir = OUTPUT_DIR) {
  if (Object.hasOwn(topicIndex, topic)) return topicIndex[topic];
  const normalized = normalizeTopic(topic);
  for (const [key, filename] of Object.entries(topicIndex)) if (normalizeTopic(key) === normalized) return filename;
  const candidate = `${slugify(normalized)}.md`;
  return fs.existsSync(path.join(docsDir, candidate)) ? candidate : null;
}

function collectSourceMetadata(stateEntry = {}) {
  const topics = [], entities = [], concepts = [];
  const seenTopics = new Set(), seenEntities = new Set(), seenConcepts = new Set();
  const chunks = stateEntry.chunks || [];
  for (const chunk of chunks) {
    for (const topic of chunk.topics || []) {
      const normalized = normalizeTopic(topic);
      if (normalized && !seenTopics.has(normalized)) { seenTopics.add(normalized); topics.push(normalized); }
    }
    for (const entity of chunk.entities || []) {
      const name = entity?.name || '';
      if (name && !seenEntities.has(name)) { seenEntities.add(name); entities.push(entity); }
    }
    for (const concept of chunk.concepts || []) {
      const name = concept?.name || '';
      if (name && !seenConcepts.has(name)) { seenConcepts.add(name); concepts.push(concept); }
    }
  }
  return { topics, entities, concepts, chunks };
}

function synthesizedPagesForTopics(topics, entities, concepts, docsDir = OUTPUT_DIR, indexJsonPath = INDEX_JSON_PATH) {
  const topicIndex = loadTopicIndex(indexJsonPath), pages = [], seenDocs = new Set();
  for (const topic of topics) {
    const filename = topicFilename(topicIndex, topic, docsDir);
    if (!filename || seenDocs.has(filename)) continue;
    const docPath = path.join(docsDir, filename);
    if (!fs.existsSync(docPath) || !fs.statSync(docPath).isFile()) continue;
    seenDocs.add(filename);
    const raw = fs.readFileSync(docPath, 'utf8'), meta = parseFrontmatter(raw), body = stripFrontmatter(raw);
    pages.push({ topic, doc_path: filename, title: meta.title || topic, tags: meta.tags_list || [], entities, concepts, body, links: extractLinks(body) });
  }
  return pages;
}

function readDocPayload(docPath, docsDir = OUTPUT_DIR) {
  const rel = path.relative(docsDir, docPath).split(path.sep).join('/');
  const raw = fs.readFileSync(docPath, 'utf8'), meta = parseFrontmatter(raw), body = stripFrontmatter(raw);
  const stem = path.basename(docPath, path.extname(docPath));
  const title = String(meta.title || stem.replace(/-/g, ' ')).replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1));
  return { path: rel, title, id: meta.id, slug: meta.slug, tags: meta.tags_list || [], body, links: extractLinks(body) };
}

function rawFileStatus(relPath, currentMd5, state) {
  return state?.files?.[relPath]?.md5 === currentMd5 ? 'Processed' : 'Unprocessed';
}

module.exports = {
  PROJECT_ROOT, OUTPUT_DIR, INDEX_JSON_PATH,
  parseFrontmatter, stripFrontmatter, extractLinks, normalizeTopic, slugify,
  loadTopicIndex, loadTopicIndexOrDocs, topicFilename, collectSourceMetadata, synthesizedPagesForTopics,
  readDocPayload, rawFileStatus,
};
