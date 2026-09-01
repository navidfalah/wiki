/**
 * Port of compiler/analytics.py -- aggregate wiki metrics, tag index, and
 * dead-link audit data for the dashboard's /api/analytics endpoint.
 */
import fs from 'node:fs';
import path from 'node:path';
import { OUTPUT_DIR, RAW_DIR } from '../paths';
import { findBrokenLinks } from './deadLinkChecker';
import { detectTopicLinks } from './linkOverrides';
import { loadTopicIndex, parseFrontmatter, slugify } from './docUtils';
import { computeMd5, discoverRawSourceFiles, loadState } from './rawFiles';

interface TagBucket {
  tag: string;
  label: string;
  raw_chunks: Record<string, unknown>[];
  pages: { path: string; title: string; id: string }[];
}

function normalizeTag(label: string): string {
  return slugify(label) || label.toLowerCase().trim();
}

function countProcessedRawFiles(state: any): [number, number] {
  let processed = 0;
  let total = 0;
  for (const filePath of discoverRawSourceFiles(RAW_DIR)) {
    total += 1;
    const rel = path.relative(RAW_DIR, filePath).split(path.sep).join('/');
    const md5 = computeMd5(filePath);
    const entry = state.files?.[rel];
    if (entry?.md5 === md5) processed += 1;
  }
  return [processed, total];
}

function registerRawChunk(registry: Map<string, TagBucket>, label: string, chunk: any, source: string): void {
  const key = normalizeTag(label);
  if (!key) return;
  let bucket = registry.get(key);
  if (!bucket) {
    bucket = { tag: key, label: label.trim() || key, raw_chunks: [], pages: [] };
    registry.set(key, bucket);
  }
  const entry = {
    source,
    chunk_index: chunk.chunk_index,
    preview: String(chunk.text ?? '').slice(0, 240).replace(/\n/g, ' '),
    topics: chunk.topics ?? [],
  };
  const dupe = bucket.raw_chunks.some((item: any) => item.source === source && item.chunk_index === chunk.chunk_index);
  if (!dupe) bucket.raw_chunks.push(entry);
}

function registerPage(registry: Map<string, TagBucket>, label: string, page: { path: string; title: string; id: string }): void {
  const key = normalizeTag(label);
  if (!key) return;
  let bucket = registry.get(key);
  if (!bucket) {
    bucket = { tag: key, label: label.trim() || key, raw_chunks: [], pages: [] };
    registry.set(key, bucket);
  }
  if (!bucket.pages.some((p) => p.path === page.path)) bucket.pages.push(page);
}

function buildTagRegistry(state: any, topicIndex: Record<string, string>, docsDir: string): Map<string, TagBucket> {
  const registry = new Map<string, TagBucket>();

  for (const [source, fileEntry] of Object.entries<any>(state.files ?? {})) {
    for (const chunk of fileEntry.chunks ?? []) {
      const labels = new Set<string>();
      for (const topic of chunk.topics ?? []) labels.add(topic);
      for (const entity of chunk.entities ?? []) if (entity.name) labels.add(entity.name);
      for (const concept of chunk.concepts ?? []) if (concept.name) labels.add(concept.name);
      for (const label of labels) registerRawChunk(registry, label, chunk, source);
    }
  }

  const indexedFiles = new Set(Object.values(topicIndex));
  for (const [title, filename] of Object.entries(topicIndex)) {
    const docPath = path.join(docsDir, filename);
    if (!fs.existsSync(docPath)) continue;
    const raw = fs.readFileSync(docPath, 'utf-8');
    const page = { path: filename, title, id: path.basename(filename, path.extname(filename)) };
    registerPage(registry, title, page);
    const meta = parseFrontmatter(raw);
    for (const tag of meta.tags_list ?? []) registerPage(registry, tag, page);
  }

  if (fs.existsSync(docsDir)) {
    for (const entry of fs.readdirSync(docsDir).sort()) {
      if (!entry.endsWith('.md')) continue;
      if (entry === 'index.md' || indexedFiles.has(entry)) continue;
      const docPath = path.join(docsDir, entry);
      const raw = fs.readFileSync(docPath, 'utf-8');
      const stem = path.basename(entry, '.md');
      let title = stem.replace(/-/g, ' ').replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1));
      const meta = parseFrontmatter(raw);
      if (typeof meta.title === 'string') title = meta.title;
      const page = { path: entry, title, id: stem };
      for (const tag of meta.tags_list ?? []) registerPage(registry, tag, page);
    }
  }

  return registry;
}

export function buildAnalytics(docsDir: string = OUTPUT_DIR) {
  const state = loadState();
  const [processed, rawTotal] = countProcessedRawFiles(state);
  const topicIndex = loadTopicIndex();
  const wikiPages = Object.keys(topicIndex).length;
  const crossLinks = wikiPages ? detectTopicLinks(topicIndex, docsDir).length : 0;

  const broken = findBrokenLinks(docsDir);
  const deadLinks = broken.map((b) => ({
    source: b.source,
    line: b.line,
    text: b.text,
    href: b.href,
    missing: b.missing,
  }));

  const registry = buildTagRegistry(state, topicIndex, docsDir);
  const bucketCount = (bucket: TagBucket) => bucket.raw_chunks.length + bucket.pages.length;

  const tagSummaries = [...registry.values()]
    .filter((b) => bucketCount(b) > 0)
    .map((b) => ({
      tag: b.tag,
      label: b.label,
      count: bucketCount(b),
      raw_count: b.raw_chunks.length,
      page_count: b.pages.length,
    }))
    .sort((a, b) => b.count - a.count || a.label.toLowerCase().localeCompare(b.label.toLowerCase()));

  const tagDetails: Record<string, unknown> = {};
  for (const b of registry.values()) {
    if (bucketCount(b) > 0) {
      tagDetails[b.tag] = { tag: b.tag, label: b.label, raw_chunks: b.raw_chunks, pages: b.pages };
    }
  }

  return {
    metrics: {
      raw_files_processed: processed,
      raw_files_total: rawTotal,
      wiki_pages_created: wikiPages,
      cross_links_established: crossLinks,
      dead_links: deadLinks.length,
    },
    tags: tagSummaries,
    tag_details: tagDetails,
    dead_links: deadLinks,
  };
}

export function getTagDetail(tag: string, docsDir: string = OUTPUT_DIR) {
  const data = buildAnalytics(docsDir);
  const key = normalizeTag(tag);
  return (data.tag_details as Record<string, unknown>)[key] ?? null;
}
