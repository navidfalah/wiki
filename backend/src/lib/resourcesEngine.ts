/**
 * Port of compiler/resources_engine.py -- every cited source, deduped and
 * browsable independently of any one page (inverts each page's
 * "References & Trust" table into "what cites this source").
 */
import fs from 'node:fs';
import path from 'node:path';
import { OUTPUT_DIR, RAW_DIR } from '../paths';
import { parseFrontmatter } from './docUtils';
import { walkEntries } from './fsWalk';

const REFERENCES_ROW_RE = /^\|\s*\d+\s*\|\s*`([^`]+)`\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/gm;

export function parseReferencesTable(body: string): { source: string; source_type: string; trust: string }[] {
  const rows: { source: string; source_type: string; trust: string }[] = [];
  for (const match of body.matchAll(REFERENCES_ROW_RE)) {
    rows.push({ source: match[1], source_type: match[2].trim(), trust: match[3].trim() });
  }
  return rows;
}

function walkMarkdownFiles(docsDir: string): string[] {
  const files: string[] = [];
  const walk = (dir: string) => {
    walkEntries(dir, (full, name, stat) => {
      if (stat.isDirectory()) walk(full);
      else if (name.endsWith('.md')) files.push(full);
    });
  };
  walk(docsDir);
  return files.sort();
}

export function listResources(
  docsDir: string = OUTPUT_DIR,
  q?: string,
  sourceType?: string,
  trust?: string,
) {
  const resources = new Map<string, any>();

  for (const filePath of walkMarkdownFiles(docsDir)) {
    const rel = path.relative(docsDir, filePath).split(path.sep).join('/');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const meta = parseFrontmatter(raw);
    const stem = path.basename(filePath, '.md');
    const title =
      (typeof meta.title === 'string' && meta.title) ||
      stem.replace(/-/g, ' ').replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1));

    for (const row of parseReferencesTable(raw)) {
      let entry = resources.get(row.source);
      if (!entry) {
        entry = { source: row.source, source_type: row.source_type, trust: row.trust, citing_pages: [] };
        resources.set(row.source, entry);
      }
      entry.citing_pages.push({ doc_path: rel, title });
    }
  }

  let items = [...resources.values()];
  for (const item of items) {
    item.citing_pages.sort((a: any, b: any) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
    item.citation_count = item.citing_pages.length;
  }

  const needle = (q || '').trim().toLowerCase();
  if (needle) items = items.filter((item) => item.source.toLowerCase().includes(needle));
  if (sourceType) items = items.filter((item) => item.source_type === sourceType);
  if (trust) items = items.filter((item) => item.trust.toLowerCase() === trust.toLowerCase());

  items.sort((a, b) => b.citation_count - a.citation_count || a.source.localeCompare(b.source));
  return { total: items.length, resources: items };
}

export function getResourceDetail(sourcePath: string, docsDir: string = OUTPUT_DIR, rawDir: string = RAW_DIR) {
  const match = listResources(docsDir).resources.find((item) => item.source === sourcePath);
  if (!match) return null;

  let preview: string | null = null;
  const candidate = path.resolve(rawDir, sourcePath);
  const rawResolved = path.resolve(rawDir);
  if ((candidate === rawResolved || candidate.startsWith(rawResolved + path.sep)) && fs.existsSync(candidate)) {
    try {
      preview = fs.readFileSync(candidate, 'utf-8').slice(0, 4000);
    } catch {
      preview = null;
    }
  }

  return { ...match, preview };
}
