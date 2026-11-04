#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { yamlQuote } = require('./yamlFrontmatter.js');

const ROOT = process.env.WIKI_DATA_ROOT ? path.resolve(process.env.WIKI_DATA_ROOT) : path.resolve(__dirname, '../../..');
const OUTPUT_DIR = path.join(ROOT, 'wiki-app', 'docs');

function parseFrontmatter(content) {
  if (!content.startsWith('---')) return {};
  const first = content.indexOf('---'), second = content.indexOf('---', first + 3);
  if (second < 0) return {};
  const meta = {}, tags = [];
  let inTags = false;
  for (const line of content.slice(first + 3, second).split(/\r?\n/)) {
    if (inTags) {
      const item = line.match(/^\s*-\s+(.*)$/);
      if (item) { tags.push(item[1].trim().replace(/^(["'])(.*)\1$/, '$2')); continue; }
      inTags = false;
    }
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (!match) continue;
    const [, key, raw] = match, value = raw.trim();
    if (key === 'tags') {
      if (value.startsWith('[') && value.endsWith(']')) {
        for (const item of value.slice(1, -1).split(',')) if (item.trim()) tags.push(item.trim().replace(/^(["'])(.*)\1$/, '$2'));
      } else inTags = true;
      continue;
    }
    meta[key] = value.replace(/^(["'])(.*)\1$/, '$2');
  }
  if (tags.length) meta.tags_list = tags;
  return meta;
}

function stripFrontmatter(content) {
  if (!content.startsWith('---')) return content;
  const first = content.indexOf('---'), second = content.indexOf('---', first + 3);
  return second < 0 ? content : content.slice(second + 3).replace(/^\n+/, '');
}

const SKIP_FILES = new Set(['index.md', '.gitkeep']);
const META_TAGS = new Set(['wiki', 'auto-ingest', 'llm-ingest', 'index', 'moc', 'overview']);
const FOLDER_CATEGORIES = { entities: 'Entities', concepts: 'Concepts', sources: 'Sources', comparisons: 'Comparisons' };
const CATEGORY_ORDER = ['Overview', 'Sources', 'Entities', 'Concepts', 'Comparisons'];
const FALLBACK_CATEGORY = 'General Reference';
const CATEGORY_ORDER_LAST = [FALLBACK_CATEGORY];

function utcNowIso() { return new Date().toISOString(); }

function extractSummary(body, maxLength = 120) {
  for (const line of body.split(/\r?\n/)) {
    const text = line.trim();
    if (!text || text.startsWith('#') || /^[-*|>]/.test(text) || text.startsWith('<!--')) continue;
    const clean = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_`]/g, '');
    if (clean.length > 20) return `${clean.slice(0, maxLength).trimEnd()}${clean.length > maxLength ? '…' : ''}`;
  }
  return '';
}

function parsePage(filePath, docsRoot) {
  const name = path.basename(filePath);
  if (SKIP_FILES.has(name)) return null;
  const relPath = path.relative(docsRoot, filePath).split(path.sep).join('/');
  const raw = fs.readFileSync(filePath, 'utf8'), meta = parseFrontmatter(raw), body = stripFrontmatter(raw);
  let title = String(meta.title || '').trim();
  if (!title) title = body.split(/\r?\n/).find((line) => line.startsWith('# '))?.slice(2).trim() || '';
  if (!title) title = path.basename(filePath, path.extname(filePath)).replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  const tags = Array.isArray(meta.tags_list) ? meta.tags_list.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean) : typeof meta.tags === 'string' ? [meta.tags.trim().toLowerCase()] : [];
  return {
    title,
    rel_path: relPath,
    doc_id: String(meta.id || path.basename(filePath, path.extname(filePath))),
    tags,
    last_updated: meta.last_updated ? String(meta.last_updated) : null,
    summary: extractSummary(body),
    link_path: `./${relPath}`,
    folder: relPath.includes('/') ? relPath.split('/')[0] : null,
  };
}

function markdownFiles(root) {
  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.md')) files.push(full);
    }
  }
  if (fs.existsSync(root)) walk(root);
  return files.sort();
}

function discoverPages(docsDir) { return markdownFiles(docsDir).map((file) => parsePage(file, docsDir)).filter(Boolean); }

function meaningfulTags(tags, docId) {
  return new Set(tags.filter((tag) => !META_TAGS.has(tag) && tag !== docId));
}

function dynamicTagCategories(pages, { maxCategories = 8, minPages = 2 } = {}) {
  const counts = new Map();
  for (const page of pages) for (const tag of meaningfulTags(page.tags, page.doc_id)) counts.set(tag, (counts.get(tag) || 0) + 1);
  const frequent = [...counts.entries()].filter(([, count]) => count >= minPages)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, maxCategories);
  return new Map(frequent.map(([tag]) => [tag, tag.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())]));
}

function assignCategory(page, tagCategories) {
  if (page.doc_id === 'overview' || page.rel_path === 'overview.md') return 'Overview';
  if (page.folder && FOLDER_CATEGORIES[page.folder]) return FOLDER_CATEGORIES[page.folder];
  const tags = meaningfulTags(page.tags, page.doc_id);
  for (const [tag, category] of tagCategories) if (tags.has(tag)) return category;
  return FALLBACK_CATEGORY;
}

function categorizePages(pages) {
  const tags = dynamicTagCategories(pages), grouped = new Map();
  for (const page of pages) {
    if (page.rel_path === 'index.md') continue;
    const category = assignCategory(page, tags);
    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category).push(page);
  }
  for (const items of grouped.values()) items.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
  return grouped;
}

function subtagsForCategory(pages) {
  const grouped = new Map();
  for (const page of pages) {
    const meaningful = [...meaningfulTags(page.tags, page.doc_id)].sort();
    const name = meaningful[0] ? meaningful[0].replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Uncategorized';
    if (!grouped.has(name)) grouped.set(name, []);
    grouped.get(name).push(page);
  }
  return new Map([...grouped.entries()].sort((a, b) => a[0].toLowerCase().localeCompare(b[0].toLowerCase())));
}

function formatEntry(page) {
  const tagHint = [...meaningfulTags(page.tags, page.doc_id)].sort().slice(0, 4).join(', ');
  const desc = page.summary || (tagHint ? `tags: ${tagHint}` : page.doc_id);
  return [`- [${page.title}](${page.link_path}) — ${desc}`];
}

function renderMocBody(categories, { totalPages, now = utcNowIso() }) {
  const lines = ['# Wiki Map of Content', '', `> Auto-generated index of **${totalPages}** pages, organized by topic and tags.`, ''];
  const names = categories instanceof Map ? [...categories.keys()] : Object.keys(categories);
  const get = (category) => categories instanceof Map ? categories.get(category) : categories[category];
  const ordered = CATEGORY_ORDER.filter((category) => names.includes(category));
  for (const category of [...names].sort()) if (!ordered.includes(category) && !CATEGORY_ORDER_LAST.includes(category)) ordered.push(category);
  ordered.push(...CATEGORY_ORDER_LAST.filter((category) => names.includes(category)));
  for (const category of ordered) {
    const pages = get(category) || [];
    if (!pages.length) continue;
    lines.push(`## ${category}`, '');
    if (pages.length >= 5 && !Object.values(FOLDER_CATEGORIES).includes(category)) {
      const groups = subtagsForCategory(pages);
      for (const [subName, subPages] of groups) {
        if (groups.size > 1) lines.push(`### ${subName}`, '');
        for (const page of subPages) lines.push(...formatEntry(page));
        if (groups.size > 1) lines.push('');
      }
    } else {
      for (const page of pages) lines.push(...formatEntry(page));
      lines.push('');
    }
  }
  lines.push('---', '', `*Last generated: ${now}*`);
  return `${lines.join('\n').replace(/\n+$/, '')}\n`;
}

function generateMoc(docsDir = OUTPUT_DIR, outputPath = path.join(docsDir, 'index.md'), { now = utcNowIso() } = {}) {
  fs.mkdirSync(docsDir, { recursive: true });
  const pages = discoverPages(docsDir), categories = categorizePages(pages);
  const body = renderMocBody(categories, { totalPages: pages.length, now });
  const tags = ['index', 'moc', 'wiki'].map((tag) => `  - ${yamlQuote(tag)}`).join('\n');
  const frontmatter = `---\nid: ${yamlQuote('index')}\ntitle: ${yamlQuote('Wiki Map of Content')}\ntags:\n${tags}\nlast_updated: ${yamlQuote(now)}\nsidebar_label: ${yamlQuote('Wiki Index')}\nslug: /index\n---\n\n`;
  fs.writeFileSync(outputPath, `${frontmatter}${body}`, 'utf8');
  return { output: path.resolve(outputPath), page_count: pages.length, category_count: categories.size, categories: Object.fromEntries([...categories].sort(([a], [b]) => a.localeCompare(b)).map(([name, items]) => [name, items.length])) };
}

function main(argv = process.argv.slice(2)) {
  let docsDir = OUTPUT_DIR, outputPath;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--docs-dir' && argv[i + 1]) docsDir = path.resolve(argv[++i]);
    else if (argv[i] === '--output' && argv[i + 1]) outputPath = path.resolve(argv[++i]);
    else if (argv[i] === '--help' || argv[i] === '-h') { process.stdout.write('Usage: node compiler/moc_generator.js [--docs-dir PATH] [--output PATH]\n'); return 0; }
    else { process.stderr.write(`Unknown or incomplete option: ${argv[i]}\n`); return 2; }
  }
  process.stdout.write(`${JSON.stringify(generateMoc(docsDir, outputPath || path.join(docsDir, 'index.md')), null, 2)}\n`);
  return 0;
}

if (require.main === module) process.exitCode = main();
module.exports = { SKIP_FILES, META_TAGS, FOLDER_CATEGORIES, CATEGORY_ORDER, FALLBACK_CATEGORY, extractSummary, parsePage, discoverPages, meaningfulTags, dynamicTagCategories, assignCategory, categorizePages, subtagsForCategory, formatEntry, renderMocBody, generateMoc, main };
