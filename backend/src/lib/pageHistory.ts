/**
 * Version history for compiled wiki pages -- the backend half of
 * compiler/page_history.py (keep the on-disk format in sync):
 *
 *   data/page_history/<page-stem>/<stamp>-<reason>.md
 *
 * where <stamp> is UTC `YYYYMMDDTHHMMSSffffffZ` (sortable) and <reason> is
 * compile | edit | delete | restore. The compiler snapshots a page before a
 * compile rewrites or removes it; this module does the same for manual
 * edits, deletes and restores, and lists, reads and diffs versions.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PAGE_HISTORY_DIR } from '../paths';
import { atomicWriteText } from './atomicWrite';

export const MAX_VERSIONS_PER_PAGE = 20;
export type HistoryReason = 'compile' | 'edit' | 'delete' | 'restore';

const PAGE_FILE_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*\.md$/;
const VERSION_ID_RE = /^(\d{8}T\d{6}\d{6})Z-(compile|edit|delete|restore)$/;
const VOLATILE_LINE_RE = /^(last_updated|last_modified):.*$/gm;

export interface PageVersion {
  id: string;
  at: string;
  reason: HistoryReason;
  size_bytes: number;
}

export function isPageFile(name: string): boolean {
  return PAGE_FILE_RE.test(name) && !name.includes('..');
}

/** The page text without its volatile timestamp lines -- what "changed" is judged on. */
export function comparable(text: string): string {
  return text.replace(VOLATILE_LINE_RE, '');
}

export function versionStamp(now: Date = new Date()): string {
  const iso = now.toISOString(); // 2026-09-27T12:45:00.123Z
  return `${iso.slice(0, 10).replace(/-/g, '')}T${iso.slice(11, 19).replace(/:/g, '')}${iso.slice(20, 23)}000Z`;
}

function stampToIso(stamp: string): string {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(\d{3})\d{3}$/.exec(stamp);
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}.${m[7]}Z` : stamp;
}

function pageDir(pageFile: string, historyDir: string): string {
  if (!isPageFile(pageFile)) throw new Error(`Invalid page file name: ${pageFile}`);
  return path.join(historyDir, path.basename(pageFile, '.md'));
}

/** Save the page's current content before it's replaced by `newContent`
 * (or deleted, when omitted). No-op when the page doesn't exist or only
 * its timestamp lines would change. Returns the new version id, if any. */
export function snapshotPage(
  docPath: string,
  reason: HistoryReason,
  newContent?: string,
  historyDir: string = PAGE_HISTORY_DIR,
  now: Date = new Date(),
): string | null {
  if (!fs.existsSync(docPath) || !fs.statSync(docPath).isFile()) return null;
  const old = fs.readFileSync(docPath, 'utf-8');
  if (newContent !== undefined && comparable(old) === comparable(newContent)) return null;
  const dir = pageDir(path.basename(docPath), historyDir);
  fs.mkdirSync(dir, { recursive: true });
  let id = `${versionStamp(now)}-${reason}`;
  // Two snapshots within the same millisecond: bump the microsecond digits.
  for (let n = 1; fs.existsSync(path.join(dir, `${id}.md`)); n++) {
    id = `${versionStamp(now).slice(0, -4)}${String(n).padStart(3, '0')}Z-${reason}`;
  }
  atomicWriteText(path.join(dir, `${id}.md`), old);
  prune(dir);
  return id;
}

function prune(dir: string): void {
  const versions = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort();
  for (const old of versions.slice(0, Math.max(0, versions.length - MAX_VERSIONS_PER_PAGE))) {
    fs.unlinkSync(path.join(dir, old));
  }
}

export function listVersions(pageFile: string, historyDir: string = PAGE_HISTORY_DIR): PageVersion[] {
  const dir = pageDir(pageFile, historyDir);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .map((f) => ({ f, m: VERSION_ID_RE.exec(f.replace(/\.md$/, '')) }))
    .filter(({ f, m }) => f.endsWith('.md') && m)
    .map(({ f, m }) => ({
      id: f.replace(/\.md$/, ''),
      at: stampToIso(m![1]),
      reason: m![2] as HistoryReason,
      size_bytes: fs.statSync(path.join(dir, f)).size,
    }))
    .sort((a, b) => b.id.localeCompare(a.id));
}

export function readVersion(pageFile: string, versionId: string, historyDir: string = PAGE_HISTORY_DIR): string | null {
  if (!VERSION_ID_RE.test(versionId)) return null;
  const file = path.join(pageDir(pageFile, historyDir), `${versionId}.md`);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : null;
}

const MAX_LCS_CELLS = 4_000_000;

export interface DiffLine {
  op: ' ' | '+' | '-';
  text: string;
}

/** Line diff (LCS) from `before` to `after`, with common prefix/suffix
 * trimmed first so typical page edits stay cheap. */
export function lineDiff(before: string, after: string): DiffLine[] {
  const a = before.split('\n');
  const b = after.split('\n');
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }
  const midA = a.slice(start, endA);
  const midB = b.slice(start, endB);
  const head = a.slice(0, start).map((text) => ({ op: ' ' as const, text }));
  const tail = a.slice(endA).map((text) => ({ op: ' ' as const, text }));
  if (midA.length * midB.length > MAX_LCS_CELLS) {
    // Too big for a quadratic table: show the changed block as replaced.
    return [...head, ...midA.map((text) => ({ op: '-' as const, text })), ...midB.map((text) => ({ op: '+' as const, text })), ...tail];
  }
  const lcs: number[][] = Array.from({ length: midA.length + 1 }, () => new Array(midB.length + 1).fill(0));
  for (let i = midA.length - 1; i >= 0; i--) {
    for (let j = midB.length - 1; j >= 0; j--) {
      lcs[i][j] = midA[i] === midB[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const middle: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < midA.length && j < midB.length) {
    if (midA[i] === midB[j]) {
      middle.push({ op: ' ', text: midA[i] });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      middle.push({ op: '-', text: midA[i++] });
    } else {
      middle.push({ op: '+', text: midB[j++] });
    }
  }
  while (i < midA.length) middle.push({ op: '-', text: midA[i++] });
  while (j < midB.length) middle.push({ op: '+', text: midB[j++] });
  return [...head, ...middle, ...tail];
}

export interface DiffHunkLine extends DiffLine {
  gap?: number;
}

/** Keep `context` unchanged lines around each change; collapse the rest
 * into a single `{gap: n}` marker line. */
export function withContext(diff: DiffLine[], context = 3): DiffHunkLine[] {
  const near = diff.map((_, idx) =>
    diff.slice(Math.max(0, idx - context), idx + context + 1).some((d) => d.op !== ' '),
  );
  const out: DiffHunkLine[] = [];
  let skipped = 0;
  diff.forEach((line, idx) => {
    if (near[idx]) {
      if (skipped) out.push({ op: ' ', text: '', gap: skipped });
      skipped = 0;
      out.push(line);
    } else {
      skipped++;
    }
  });
  if (skipped) out.push({ op: ' ', text: '', gap: skipped });
  return out;
}
