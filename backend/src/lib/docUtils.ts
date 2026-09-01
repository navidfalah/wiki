/**
 * Port of compiler/doc_utils.py -- read compiled wiki pages (frontmatter +
 * body) and cross-reference them against the topic index the Python
 * linker wrote to compiler/temp_output/index.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { INDEX_JSON, OUTPUT_DIR } from '../paths';

const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;

export function slugify(text: string): string {
  let s = text.toLowerCase().trim();
  s = s.replace(/[^\w\s-]/g, '');
  s = s.replace(/[\s_]+/g, '-');
  return s.replace(/^-+|-+$/g, '').slice(0, 80);
}

export interface FrontmatterMeta {
  [key: string]: string | string[] | undefined;
  tags_list?: string[];
}

export function parseFrontmatter(content: string): FrontmatterMeta {
  if (!content.startsWith('---')) return {};
  const parts = content.split('---');
  // content.split keeps every "---" occurrence; join back everything after
  // the second one, matching Python's str.split('---', 2)[2] semantics.
  if (parts.length < 3) return {};
  const fmBlock = parts[1];

  const meta: FrontmatterMeta = {};
  const tags: string[] = [];
  let inTags = false;

  for (const line of fmBlock.split('\n')) {
    if (inTags) {
      if (line.startsWith('  - ')) {
        tags.push(line.slice(4).trim().replace(/^["']|["']$/g, ''));
        continue;
      }
      if (line.startsWith('- ')) {
        tags.push(line.slice(2).trim().replace(/^["']|["']$/g, ''));
        continue;
      }
      inTags = false;
    }
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const key = match[1];
      let value = match[2].trim();
      if (key === 'tags' && (value === '[]' || value === '')) {
        inTags = true;
        continue;
      }
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      meta[key] = value;
      if (key === 'tags') inTags = true;
    }
  }
  if (tags.length) meta.tags_list = tags;
  return meta;
}

export function stripFrontmatter(content: string): string {
  if (!content.startsWith('---')) return content;
  const first = content.indexOf('---');
  const second = content.indexOf('---', first + 3);
  if (second === -1) return content;
  return content.slice(second + 3).replace(/^\n+/, '');
}

export function extractLinks(body: string): { text: string; href: string }[] {
  const links: { text: string; href: string }[] = [];
  for (const match of body.matchAll(LINK_RE)) {
    links.push({ text: match[1], href: match[2] });
  }
  return links;
}

export function normalizeTopic(title: string): string {
  return title.replace(/\\(["'])/g, '$1').trim();
}

export function loadTopicIndex(): Record<string, string> {
  if (!fs.existsSync(INDEX_JSON)) return {};
  try {
    const data = JSON.parse(fs.readFileSync(INDEX_JSON, 'utf-8'));
    return data.topics && typeof data.topics === 'object' ? data.topics : {};
  } catch {
    return {};
  }
}

export function topicFilename(
  topicIndex: Record<string, string>,
  topic: string,
  docsDir: string = OUTPUT_DIR,
): string | null {
  if (topic in topicIndex) return topicIndex[topic];
  const normalized = normalizeTopic(topic);
  for (const [key, filename] of Object.entries(topicIndex)) {
    if (normalizeTopic(key) === normalized) return filename;
  }
  const candidate = `${slugify(normalized)}.md`;
  if (fs.existsSync(path.join(docsDir, candidate))) return candidate;
  return null;
}

export interface ChunkLike {
  topics?: string[];
  entities?: { name?: string }[];
  concepts?: { name?: string }[];
}

export function collectSourceMetadata(stateEntry: { chunks?: ChunkLike[] }) {
  const topics: string[] = [];
  const entities: { name?: string }[] = [];
  const concepts: { name?: string }[] = [];
  const seenTopics = new Set<string>();
  const seenEntities = new Set<string>();
  const seenConcepts = new Set<string>();

  for (const chunk of stateEntry.chunks ?? []) {
    for (const topic of chunk.topics ?? []) {
      const normalized = normalizeTopic(topic);
      if (normalized && !seenTopics.has(normalized)) {
        seenTopics.add(normalized);
        topics.push(normalized);
      }
    }
    for (const entity of chunk.entities ?? []) {
      const name = entity.name ?? '';
      if (name && !seenEntities.has(name)) {
        seenEntities.add(name);
        entities.push(entity);
      }
    }
    for (const concept of chunk.concepts ?? []) {
      const name = concept.name ?? '';
      if (name && !seenConcepts.has(name)) {
        seenConcepts.add(name);
        concepts.push(concept);
      }
    }
  }

  return { topics, entities, concepts, chunks: stateEntry.chunks ?? [] };
}

export function synthesizedPagesForTopics(
  topics: string[],
  entities: { name?: string }[],
  concepts: { name?: string }[],
  docsDir: string = OUTPUT_DIR,
) {
  const topicIndex = loadTopicIndex();
  const pages: Record<string, unknown>[] = [];
  const seenDocs = new Set<string>();

  for (const topic of topics) {
    const filename = topicFilename(topicIndex, topic, docsDir);
    if (!filename || seenDocs.has(filename)) continue;
    const docPath = path.join(docsDir, filename);
    if (!fs.existsSync(docPath)) continue;
    seenDocs.add(filename);
    const raw = fs.readFileSync(docPath, 'utf-8');
    const meta = parseFrontmatter(raw);
    const body = stripFrontmatter(raw);
    pages.push({
      topic,
      doc_path: filename,
      title: meta.title || topic,
      tags: meta.tags_list || [],
      entities,
      concepts,
      body,
      links: extractLinks(body),
    });
  }
  return pages;
}

export function readDocPayload(docPath: string, docsDir: string = OUTPUT_DIR) {
  const rel = path.relative(docsDir, docPath).split(path.sep).join('/');
  const raw = fs.readFileSync(docPath, 'utf-8');
  const meta = parseFrontmatter(raw);
  const body = stripFrontmatter(raw);
  const stem = path.basename(docPath, path.extname(docPath));
  const titleCase = stem
    .replace(/-/g, ' ')
    .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
  return {
    path: rel,
    title: meta.title || titleCase,
    id: meta.id,
    slug: meta.slug,
    tags: meta.tags_list || [],
    body,
    links: extractLinks(body),
  };
}

export function rawFileStatus(
  relPath: string,
  currentMd5: string,
  state: { files?: Record<string, { md5?: string }> },
): 'Processed' | 'Unprocessed' {
  const entry = state.files?.[relPath];
  return entry && entry.md5 === currentMd5 ? 'Processed' : 'Unprocessed';
}
