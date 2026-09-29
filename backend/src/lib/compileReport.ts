/**
 * "What changed" report for each compiler build: which wiki pages it added,
 * changed and removed, and by how many lines. Users can't trust an LLM that
 * silently rewrites pages; this shows them exactly what a run touched.
 *
 * How it works, with no change to the compiler:
 *  - pythonBridge takes a manifest (page file -> hash of its content minus
 *    volatile timestamp lines) when a build starts;
 *  - when the build ends, buildReport() compares it with the pages on disk;
 *  - for changed and removed pages the line counts come from the page
 *    history snapshot the compiler wrote just before replacing the page
 *    (reason "compile") or removing it (reason "delete"); see linker.py and
 *    compiler/page_history.py. So the counts are exact.
 *
 * Reports are stored in data/compile_reports/<run-id>.json (newest 30 kept)
 * with a small index of totals for the Pipelines list.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { COMPILE_REPORTS_DIR, OUTPUT_DIR, PAGE_HISTORY_DIR } from '../paths';
import { atomicWriteJson } from './atomicWrite';
import { parseFrontmatter } from './docUtils';
import { comparable, isPageFile, lineDiff, listVersions, readVersion } from './pageHistory';

export const MAX_REPORTS_KEPT = 30;
export const MAX_PAGES_IN_REPORT = 500;
const RUN_ID_RE = /^\d{8}-\d{6}-[0-9a-f]{6}$/;

export type Manifest = Map<string, string>;

export interface ChangedPage {
  path: string;
  title: string;
  status: 'added' | 'changed' | 'removed';
  /** Lines added / removed compared with the previous version; null when
   * the previous version was not kept (an added page has none to compare). */
  lines_added: number | null;
  lines_removed: number | null;
}

export interface ReportTotals {
  added: number;
  changed: number;
  removed: number;
  unchanged: number;
}

export interface CompileReport {
  run_id: string;
  started_at: string;
  finished_at: string;
  totals: ReportTotals;
  /** Added first, then changed, then removed; capped at MAX_PAGES_IN_REPORT. */
  pages: ChangedPage[];
  truncated: boolean;
}

function hashOf(text: string): string {
  return crypto.createHash('sha256').update(comparable(text)).digest('hex');
}

/** Page file -> content hash for every page in the wiki right now. */
export function snapshotManifest(docsDir: string = OUTPUT_DIR): Manifest {
  const manifest: Manifest = new Map();
  if (!fs.existsSync(docsDir)) return manifest;
  for (const name of fs.readdirSync(docsDir)) {
    if (!isPageFile(name)) continue;
    try {
      manifest.set(name, hashOf(fs.readFileSync(path.join(docsDir, name), 'utf-8')));
    } catch {
      /* unreadable page: leave it out of the comparison */
    }
  }
  return manifest;
}

function titleOf(text: string, file: string): string {
  const title = parseFrontmatter(text).title;
  return typeof title === 'string' && title ? title : file.replace(/\.md$/, '').replace(/-/g, ' ');
}

/** The page's content just before the compiler replaced it ("compile") or
 * removed it ("delete") during this run, if the compiler kept it. */
function versionBeforeRun(file: string, startedAtMs: number, historyDir: string, reason: 'compile' | 'delete'): string | null {
  const snapshot = listVersions(file, historyDir).find((v) => v.reason === reason && Date.parse(v.at) >= startedAtMs - 1000);
  return snapshot ? readVersion(file, snapshot.id, historyDir) : null;
}

/** Lines in a text, not counting the empty string after a final newline. */
export function lineCount(text: string): number {
  if (text === '') return 0;
  const lines = text.split('\n');
  return text.endsWith('\n') ? lines.length - 1 : lines.length;
}

function countLines(before: string, after: string): { added: number; removed: number } {
  let added = 0;
  let removed = 0;
  for (const line of lineDiff(comparable(before), comparable(after))) {
    if (line.op === '+') added++;
    else if (line.op === '-') removed++;
  }
  return { added, removed };
}

export function buildReport(params: {
  runId: string;
  startedAt: Date;
  before: Manifest;
  now?: Date;
  docsDir?: string;
  historyDir?: string;
}): CompileReport {
  const { runId, startedAt, before, now = new Date(), docsDir = OUTPUT_DIR, historyDir = PAGE_HISTORY_DIR } = params;
  const after = snapshotManifest(docsDir);
  const pages: ChangedPage[] = [];
  const totals: ReportTotals = { added: 0, changed: 0, removed: 0, unchanged: 0 };

  for (const [file, hash] of [...after].sort(([a], [b]) => a.localeCompare(b))) {
    const current = fs.readFileSync(path.join(docsDir, file), 'utf-8');
    const previousHash = before.get(file);
    if (previousHash === undefined) {
      totals.added++;
      pages.push({ path: file, title: titleOf(current, file), status: 'added', lines_added: lineCount(current), lines_removed: null });
    } else if (previousHash !== hash) {
      totals.changed++;
      const old = versionBeforeRun(file, startedAt.getTime(), historyDir, 'compile');
      const counts = old === null ? null : countLines(old, current);
      pages.push({ path: file, title: titleOf(current, file), status: 'changed', lines_added: counts?.added ?? null, lines_removed: counts?.removed ?? null });
    } else {
      totals.unchanged++;
    }
  }
  for (const file of [...before.keys()].sort()) {
    if (after.has(file)) continue;
    totals.removed++;
    const old = versionBeforeRun(file, startedAt.getTime(), historyDir, 'delete');
    pages.push({ path: file, title: old === null ? file.replace(/\.md$/, '').replace(/-/g, ' ') : titleOf(old, file), status: 'removed', lines_added: null, lines_removed: old === null ? null : lineCount(old) });
  }

  const order = { added: 0, changed: 1, removed: 2 } as const;
  pages.sort((a, b) => order[a.status] - order[b.status] || a.path.localeCompare(b.path));
  return {
    run_id: runId,
    started_at: startedAt.toISOString(),
    finished_at: now.toISOString(),
    totals,
    pages: pages.slice(0, MAX_PAGES_IN_REPORT),
    truncated: pages.length > MAX_PAGES_IN_REPORT,
  };
}

// --- Storage --------------------------------------------------------------------

function reportFile(runId: string, dir: string): string {
  if (!RUN_ID_RE.test(runId)) throw new Error(`Invalid run id: ${runId}`);
  return path.join(dir, `${runId}.json`);
}

const INDEX = 'index.json';

export function saveReport(report: CompileReport, dir: string = COMPILE_REPORTS_DIR): void {
  atomicWriteJson(reportFile(report.run_id, dir), report);
  const index = loadIndex(dir);
  index[report.run_id] = report.totals;
  // Run ids sort chronologically, so the oldest reports are the smallest keys.
  for (const stale of Object.keys(index).sort().slice(0, Math.max(0, Object.keys(index).length - MAX_REPORTS_KEPT))) {
    delete index[stale];
    fs.rmSync(reportFile(stale, dir), { force: true });
  }
  atomicWriteJson(path.join(dir, INDEX), index);
}

function loadIndex(dir: string): Record<string, ReportTotals> {
  try {
    const parsed = JSON.parse(fs.readFileSync(path.join(dir, INDEX), 'utf-8'));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** Totals per run id, for the Pipelines list. */
export function reportTotals(dir: string = COMPILE_REPORTS_DIR): Record<string, ReportTotals> {
  return loadIndex(dir);
}

export function getReport(runId: string, dir: string = COMPILE_REPORTS_DIR): CompileReport | null {
  if (!RUN_ID_RE.test(runId)) return null;
  try {
    return JSON.parse(fs.readFileSync(reportFile(runId, dir), 'utf-8'));
  } catch {
    return null;
  }
}

export function deleteReport(runId: string, dir: string = COMPILE_REPORTS_DIR): void {
  if (!RUN_ID_RE.test(runId)) return;
  fs.rmSync(reportFile(runId, dir), { force: true });
  const index = loadIndex(dir);
  if (runId in index) {
    delete index[runId];
    atomicWriteJson(path.join(dir, INDEX), index);
  }
}
