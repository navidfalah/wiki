import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  isPageFile,
  lineDiff,
  listVersions,
  MAX_VERSIONS_PER_PAGE,
  readVersion,
  snapshotPage,
  versionStamp,
  withContext,
} from './pageHistory';

const PAGE = '---\ntitle: Aurora Labs\nlast_updated: 2026-01-01T00:00:00+00:00\n---\n\nBody v1\n';
let tmp: string;
let docs: string;
let history: string;

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'page-history-'));
  docs = path.join(tmp, 'docs');
  history = path.join(tmp, 'history');
  fs.mkdirSync(docs);
});
afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }));

function writePage(content = PAGE): string {
  const p = path.join(docs, 'aurora-labs.md');
  fs.writeFileSync(p, content);
  return p;
}

describe('snapshotPage', () => {
  it('stores the old content before a real change, and lists it', () => {
    const page = writePage();
    const id = snapshotPage(page, 'edit', PAGE.replace('v1', 'v2'), history, new Date('2026-09-27T12:45:00.123Z'));
    expect(id).toBe('20260927T124500123000Z-edit');
    expect(readVersion('aurora-labs.md', id!, history)).toBe(PAGE);
    expect(listVersions('aurora-labs.md', history)).toEqual([
      { id, at: '2026-09-27T12:45:00.123Z', reason: 'edit', size_bytes: Buffer.byteLength(PAGE) },
    ]);
  });

  it('ignores timestamp-only changes', () => {
    const page = writePage();
    expect(snapshotPage(page, 'edit', PAGE.replace('2026-01-01', '2026-09-27'), history)).toBeNull();
    expect(fs.existsSync(history)).toBe(false);
  });

  it('snapshots deletes unconditionally and is a no-op for a missing page', () => {
    expect(snapshotPage(writePage(), 'delete', undefined, history)).toMatch(/-delete$/);
    expect(snapshotPage(path.join(docs, 'missing.md'), 'delete', undefined, history)).toBeNull();
  });

  it('never overwrites a version taken in the same millisecond', () => {
    const page = writePage();
    const now = new Date('2026-09-27T12:45:00.123Z');
    const a = snapshotPage(page, 'edit', 'x', history, now);
    const b = snapshotPage(page, 'edit', 'y', history, now);
    expect(a).not.toBe(b);
    expect(listVersions('aurora-labs.md', history)).toHaveLength(2);
  });

  it(`keeps only the newest ${MAX_VERSIONS_PER_PAGE} versions`, () => {
    const page = writePage();
    for (let i = 0; i < MAX_VERSIONS_PER_PAGE + 3; i++) {
      fs.writeFileSync(page, `Body ${i}\n`);
      snapshotPage(page, 'edit', `Body ${i + 1}\n`, history, new Date(Date.UTC(2026, 0, 1, 0, 0, i)));
    }
    const versions = listVersions('aurora-labs.md', history);
    expect(versions).toHaveLength(MAX_VERSIONS_PER_PAGE);
    expect(readVersion('aurora-labs.md', versions.at(-1)!.id, history)).toBe('Body 3\n');
  });
});

describe('interop with compiler/page_history.py', () => {
  it('lists versions written by the Python side (microsecond stamps)', () => {
    fs.mkdirSync(path.join(history, 'aurora-labs'), { recursive: true });
    fs.writeFileSync(path.join(history, 'aurora-labs', '20260927T124500123456Z-compile.md'), 'old');
    fs.writeFileSync(path.join(history, 'aurora-labs', 'notes.txt'), 'ignored');
    expect(listVersions('aurora-labs.md', history)).toEqual([
      { id: '20260927T124500123456Z-compile', at: '2026-09-27T12:45:00.123Z', reason: 'compile', size_bytes: 3 },
    ]);
  });

  it('produces the same stamp shape Python does', () => {
    expect(versionStamp(new Date('2026-09-27T12:45:00.123Z'))).toMatch(/^\d{8}T\d{12}Z$/);
  });
});

describe('input validation', () => {
  it.each(['../secrets.md', 'a/b.md', '.hidden.md', 'page.txt', ''])('rejects page name %j', (name) => {
    expect(isPageFile(name)).toBe(false);
    expect(() => listVersions(name, history)).toThrow();
  });

  it.each(['../../etc/passwd', '20260927T124500123456Z-edit/../x', 'nope'])('rejects version id %j', (id) => {
    writePage();
    expect(readVersion('aurora-labs.md', id, history)).toBeNull();
  });
});

describe('lineDiff / withContext', () => {
  it('marks removed and added lines and keeps the rest', () => {
    expect(lineDiff('a\nb\nc', 'a\nB\nc\nd')).toEqual([
      { op: ' ', text: 'a' },
      { op: '-', text: 'b' },
      { op: '+', text: 'B' },
      { op: ' ', text: 'c' },
      { op: '+', text: 'd' },
    ]);
  });

  it('is all-unchanged for identical input', () => {
    expect(lineDiff('x\ny', 'x\ny').every((l) => l.op === ' ')).toBe(true);
  });

  it('falls back to replace-block for huge rewrites', () => {
    const before = Array.from({ length: 3000 }, (_, i) => `a${i}`).join('\n');
    const after = Array.from({ length: 3000 }, (_, i) => `b${i}`).join('\n');
    const diff = lineDiff(before, after);
    expect(diff.filter((l) => l.op === '-')).toHaveLength(3000);
    expect(diff.filter((l) => l.op === '+')).toHaveLength(3000);
  });

  it('collapses long unchanged runs into gap markers', () => {
    const lines = Array.from({ length: 20 }, (_, i) => `l${i}`);
    const changed = [...lines];
    changed[10] = 'CHANGED';
    const hunks = withContext(lineDiff(lines.join('\n'), changed.join('\n')), 2);
    expect(hunks[0]).toEqual({ op: ' ', text: '', gap: 8 });
    expect(hunks.filter((l) => l.op !== ' ').map((l) => l.text)).toEqual(['l10', 'CHANGED']);
    expect(hunks.at(-1)).toEqual({ op: ' ', text: '', gap: 7 });
  });
});
