import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildReport, deleteReport, lineCount, getReport, MAX_PAGES_IN_REPORT, MAX_REPORTS_KEPT, reportTotals, saveReport, snapshotManifest, type CompileReport } from './compileReport';
import { snapshotPage } from './pageHistory';

let root: string;
let docs: string;
let history: string;
let reports: string;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'compile-report-'));
  docs = path.join(root, 'docs');
  history = path.join(root, 'history');
  reports = path.join(root, 'reports');
  fs.mkdirSync(docs);
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

const page = (title: string, body: string, updated = '2026-01-01') => `---\ntitle: ${title}\nlast_updated: "${updated}"\n---\n\n${body}\n`;
const write = (file: string, content: string) => fs.writeFileSync(path.join(docs, file), content);

const START = new Date('2026-09-29T12:00:00.000Z');
const DURING = new Date('2026-09-29T12:00:05.000Z');

/** What the compiler does to a page: snapshot the old content, then replace it. */
function compilerRewrites(file: string, content: string, reason: 'compile' | 'delete' = 'compile') {
  snapshotPage(path.join(docs, file), reason, reason === 'compile' ? content : undefined, history, DURING);
  if (reason === 'compile') write(file, content);
  else fs.rmSync(path.join(docs, file));
}

const report = (before: ReturnType<typeof snapshotManifest>, over = {}) =>
  buildReport({ runId: '20260929-120000-abcdef', startedAt: START, before, now: new Date('2026-09-29T12:01:00Z'), docsDir: docs, historyDir: history, ...over });

describe('snapshotManifest', () => {
  it('hashes pages, skips other files and ignores timestamp lines', () => {
    write('a.md', page('A', 'text', '2026-01-01'));
    write('notes.txt', 'not a page');
    const first = snapshotManifest(docs);
    write('a.md', page('A', 'text', '2026-09-29'));
    expect([...first.keys()]).toEqual(['a.md']);
    expect(snapshotManifest(docs).get('a.md')).toBe(first.get('a.md'));
    write('a.md', page('A', 'other text'));
    expect(snapshotManifest(docs).get('a.md')).not.toBe(first.get('a.md'));
  });

  it('is empty for a missing directory', () => {
    expect(snapshotManifest(path.join(root, 'nope')).size).toBe(0);
  });
});

describe('buildReport', () => {
  it('lists added, changed and removed pages with exact line counts, and counts the unchanged', () => {
    write('same.md', page('Same', 'x'));
    write('edit.md', page('Edit', 'one\ntwo\nthree'));
    write('gone.md', page('Gone', 'a\nb\nc\nd'));
    const before = snapshotManifest(docs);

    compilerRewrites('edit.md', page('Edit', 'one\nTWO\nthree\nfour'));
    compilerRewrites('gone.md', '', 'delete');
    write('new.md', page('Brand new', 'fresh'));
    write('same.md', page('Same', 'x', '2026-09-29')); // only the timestamp moved

    const r = report(before);

    expect(r.totals).toEqual({ added: 1, changed: 1, removed: 1, unchanged: 1 });
    expect(r.pages).toEqual([
      { path: 'new.md', title: 'Brand new', status: 'added', lines_added: 6, lines_removed: null },
      { path: 'edit.md', title: 'Edit', status: 'changed', lines_added: 2, lines_removed: 1 }, // "two" -> "TWO", plus "four"
      { path: 'gone.md', title: 'Gone', status: 'removed', lines_added: null, lines_removed: 9 },
    ]);
    expect(r).toMatchObject({ run_id: '20260929-120000-abcdef', started_at: START.toISOString(), finished_at: '2026-09-29T12:01:00.000Z', truncated: false });
  });

  it('reports nothing for a run that changed nothing', () => {
    write('a.md', page('A', 'x'));
    const r = report(snapshotManifest(docs));
    expect(r.totals).toEqual({ added: 0, changed: 0, removed: 0, unchanged: 1 });
    expect(r.pages).toEqual([]);
  });

  it('does not count a page as changed when only its timestamp differs, even if the compiler rewrote the file', () => {
    write('a.md', page('A', 'x', '2026-01-01'));
    const before = snapshotManifest(docs);
    write('a.md', page('A', 'x', '2026-09-29'));
    expect(report(before).totals.changed).toBe(0);
  });

  it('gives no line counts when the previous version was not kept, or predates the run', () => {
    write('a.md', page('A', 'one'));
    write('b.md', page('B', 'one'));
    const before = snapshotManifest(docs);
    // a.md: no snapshot at all. b.md: a snapshot from an earlier edit, before this run started.
    snapshotPage(path.join(docs, 'b.md'), 'compile', 'x', history, new Date('2026-09-28T09:00:00Z'));
    write('a.md', page('A', 'two'));
    write('b.md', page('B', 'two'));

    const r = report(before);

    expect(r.pages.map((p) => [p.path, p.lines_added, p.lines_removed])).toEqual([
      ['a.md', null, null],
      ['b.md', null, null],
    ]);
  });

  it("uses the run's own snapshot, not a later manual edit's", () => {
    write('a.md', page('A', 'original'));
    const before = snapshotManifest(docs);
    compilerRewrites('a.md', page('A', 'compiled'));
    snapshotPage(path.join(docs, 'a.md'), 'edit', page('A', 'compiled\nplus a human edit'), history, new Date('2026-09-29T12:00:30Z'));
    write('a.md', page('A', 'compiled\nplus a human edit'));

    const [changed] = report(before).pages;

    expect(changed).toMatchObject({ status: 'changed', lines_added: 2, lines_removed: 1 }); // vs the pre-run version
  });

  it('falls back to the file name for a title, and titles a removed page from its old content', () => {
    write('no-title.md', 'plain body\n');
    write('old-name.md', page('Old Name', 'x'));
    const before = snapshotManifest(docs);
    compilerRewrites('old-name.md', '', 'delete');
    write('another-page.md', 'body\n');
    const r = report(before);
    expect(r.pages.find((p) => p.path === 'another-page.md')?.title).toBe('another page');
    expect(r.pages.find((p) => p.path === 'old-name.md')?.title).toBe('Old Name');
  });

  it('caps the list but keeps the true totals, and says it was cut', () => {
    const before = snapshotManifest(docs);
    for (let i = 0; i < MAX_PAGES_IN_REPORT + 5; i++) write(`p${String(i).padStart(4, '0')}.md`, page(`P${i}`, 'x'));
    const r = report(before);
    expect(r.totals.added).toBe(MAX_PAGES_IN_REPORT + 5);
    expect(r.pages).toHaveLength(MAX_PAGES_IN_REPORT);
    expect(r.truncated).toBe(true);
  });
});

describe('lineCount', () => {
  it('counts real lines, not the empty string after the last newline', () => {
    expect(lineCount('')).toBe(0);
    expect(lineCount('a')).toBe(1);
    expect(lineCount('a\n')).toBe(1);
    expect(lineCount('a\n\nb\n')).toBe(3);
    expect(lineCount('a\nb')).toBe(2);
  });
});

describe('report storage', () => {
  const make = (n: number): CompileReport => ({
    run_id: `20260929-1200${String(n).padStart(2, '0')}-abcdef`,
    started_at: START.toISOString(),
    finished_at: START.toISOString(),
    totals: { added: n, changed: 0, removed: 0, unchanged: 0 },
    pages: [],
    truncated: false,
  });

  it('round-trips a report and indexes its totals', () => {
    saveReport(make(1), reports);
    expect(getReport(make(1).run_id, reports)).toEqual(make(1));
    expect(reportTotals(reports)).toEqual({ [make(1).run_id]: make(1).totals });
  });

  it('keeps only the newest reports', () => {
    for (let i = 0; i < MAX_REPORTS_KEPT + 3; i++) saveReport(make(i), reports);
    expect(Object.keys(reportTotals(reports))).toHaveLength(MAX_REPORTS_KEPT);
    expect(getReport(make(0).run_id, reports)).toBeNull(); // oldest pruned, file and index entry
    expect(getReport(make(2).run_id, reports)).toBeNull();
    expect(getReport(make(3).run_id, reports)).not.toBeNull();
    expect(fs.readdirSync(reports).filter((f) => f !== 'index.json')).toHaveLength(MAX_REPORTS_KEPT);
  });

  it('deletes with its run', () => {
    saveReport(make(1), reports);
    deleteReport(make(1).run_id, reports);
    expect(getReport(make(1).run_id, reports)).toBeNull();
    expect(reportTotals(reports)).toEqual({});
    deleteReport(make(1).run_id, reports); // idempotent
  });

  it('refuses run ids that are not run ids, so a path can never be built from one', () => {
    expect(getReport('../../etc/passwd', reports)).toBeNull();
    expect(() => saveReport({ ...make(1), run_id: '../x' }, reports)).toThrow('Invalid run id');
    deleteReport('../x', reports); // no-op, no throw
  });

  it('tolerates a corrupt report or index', () => {
    fs.mkdirSync(reports, { recursive: true });
    fs.writeFileSync(path.join(reports, 'index.json'), '{ nope');
    fs.writeFileSync(path.join(reports, `${make(1).run_id}.json`), '{ nope');
    expect(reportTotals(reports)).toEqual({});
    expect(getReport(make(1).run_id, reports)).toBeNull();
    saveReport(make(2), reports); // recovers
    expect(reportTotals(reports)).toEqual({ [make(2).run_id]: make(2).totals });
  });
});
