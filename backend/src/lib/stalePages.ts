/**
 * Stale-page detection: a wiki page is stale when a raw source it was built
 * from has changed or been removed since the compiler last processed it.
 * Its claims may no longer match its sources, and the page won't say so.
 *
 * Which sources a page was built from is written on the page itself, in its
 * "## References & Trust" table (or the older "## Sources" bullets). Whether
 * a source changed is judged against the compiler's own state
 * (data/state.json): the checksum it recorded when it processed the file.
 *
 * Deliberately NOT a signal: a page's age. A page nothing has contradicted
 * is not wrong for being old, and "old" would flag the whole wiki after any
 * pause; source changes are the actual reason a page can become wrong.
 *
 * Checksumming every cited source on every request would be slow for a big
 * corpus, so checksums are cached by file size and modification time: a file
 * is re-read only after it changed on disk.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { OUTPUT_DIR, RAW_DIR } from '../paths';
import { parseFrontmatter } from './docUtils';
import { loadState } from './rawFiles';

export interface StaleSources {
  /** Cited sources whose content differs from what the compiler processed. */
  changed: string[];
  /** Cited sources that no longer exist in data/raw/. */
  removed: string[];
}

// `(?![\s\S])` is the end of the text: with the m flag a plain `$` would match at the end of every line.
const SOURCES_SECTION_RE = /^## (?:Sources|References & Trust)\n([\s\S]*?)(?=\n##|\n```|(?![\s\S]))/m;
const TABLE_ROW_RE = /^\|\s*\d+\s*\|\s*`([^`]+)`\s*\|/gm;
const BULLET_RE = /^\*\s+`([^`]+)`\s*$/gm;

/** Raw source paths a page cites, in order and without duplicates. */
export function citedSources(pageText: string): string[] {
  const section = SOURCES_SECTION_RE.exec(pageText)?.[1] ?? '';
  const found = [...section.matchAll(TABLE_ROW_RE), ...section.matchAll(BULLET_RE)].map((m) => m[1]);
  return [...new Set(found)];
}

const md5Cache = new Map<string, { mtimeMs: number; size: number; md5: string }>();

/** MD5 of a file, re-read only if its size or modification time changed. */
function cachedMd5(file: string, stat: fs.Stats): string {
  const hit = md5Cache.get(file);
  if (hit && hit.mtimeMs === stat.mtimeMs && hit.size === stat.size) return hit.md5;
  const md5 = crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex');
  md5Cache.set(file, { mtimeMs: stat.mtimeMs, size: stat.size, md5 });
  return md5;
}

/**
 * Which of `sources` changed or disappeared since the compiler processed
 * them. A source the compiler has no record of is skipped: with no
 * checksum to compare, nothing can be said about it.
 */
export function findStaleSources(
  sources: string[],
  state: { files?: Record<string, { md5?: string }> } = loadState(),
  rawDir: string = RAW_DIR,
): StaleSources {
  const result: StaleSources = { changed: [], removed: [] };
  const root = path.resolve(rawDir);
  for (const rel of sources) {
    const recorded = state.files?.[rel]?.md5;
    if (!recorded) continue;
    const file = path.resolve(root, rel);
    if (!file.startsWith(root + path.sep)) continue; // a page can't point us outside data/raw/
    let stat: fs.Stats;
    try {
      stat = fs.statSync(file);
    } catch {
      result.removed.push(rel);
      continue;
    }
    if (!stat.isFile()) {
      result.removed.push(rel);
      continue;
    }
    try {
      if (cachedMd5(file, stat) !== recorded) result.changed.push(rel);
    } catch {
      /* unreadable right now: don't guess */
    }
  }
  return result;
}

/** Stale sources for one page's text, or null if none of its sources changed. */
export function pageStaleness(pageText: string, state?: { files?: Record<string, { md5?: string }> }, rawDir?: string): StaleSources | null {
  const stale = findStaleSources(citedSources(pageText), state, rawDir);
  return stale.changed.length || stale.removed.length ? stale : null;
}

export interface StalePage extends StaleSources {
  title: string;
}

/** Page file name -> its title and stale sources, for every stale page in the wiki. */
export function stalePages(docsDir: string = OUTPUT_DIR, rawDir: string = RAW_DIR): Map<string, StalePage> {
  const stale = new Map<string, StalePage>();
  if (!fs.existsSync(docsDir)) return stale;
  const state = loadState();
  for (const name of fs.readdirSync(docsDir).sort()) {
    if (!name.endsWith('.md') || name === 'index.md') continue;
    let text: string;
    try {
      text = fs.readFileSync(path.join(docsDir, name), 'utf-8');
    } catch {
      continue;
    }
    const found = pageStaleness(text, state, rawDir);
    if (found) {
      const title = parseFrontmatter(text).title;
      stale.set(name, { ...found, title: typeof title === 'string' && title ? title : name.replace(/\.md$/, '').replace(/-/g, ' ') });
    }
  }
  return stale;
}

/** "a.pdf, b.docx (and 2 more)" for a detail line. */
export function describeSources(paths: string[], max = 3): string {
  if (paths.length <= max) return paths.join(', ');
  return `${paths.slice(0, max).join(', ')} (and ${paths.length - max} more)`;
}
