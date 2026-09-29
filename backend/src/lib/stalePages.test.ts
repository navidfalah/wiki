import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { tmpRoot, state } = vi.hoisted(() => {
  const fs: typeof import('node:fs') = require('node:fs');
  const os: typeof import('node:os') = require('node:os');
  const path: typeof import('node:path') = require('node:path');
  return { tmpRoot: fs.mkdtempSync(path.join(os.tmpdir(), 'stale-test-')), state: { current: { files: {} as Record<string, { md5?: string }> } } };
});

vi.mock('../paths', () => ({ OUTPUT_DIR: path.join(tmpRoot, 'docs'), RAW_DIR: path.join(tmpRoot, 'raw') }));
vi.mock('./rawFiles', () => ({ loadState: () => state.current }));

import { citedSources, describeSources, findStaleSources, pageStaleness, stalePages } from './stalePages';

const RAW = path.join(tmpRoot, 'raw');
const DOCS = path.join(tmpRoot, 'docs');
const md5 = (text: string) => crypto.createHash('md5').update(text).digest('hex');

/** A source the compiler processed: on disk, and recorded in the state with its checksum. */
function processed(rel: string, content: string) {
  fs.mkdirSync(path.dirname(path.join(RAW, rel)), { recursive: true });
  fs.writeFileSync(path.join(RAW, rel), content);
  state.current.files[rel] = { md5: md5(content) };
}

const TABLE_PAGE = (...sources: string[]) =>
  `---\ntitle: T\n---\n\n# T\n\nBody.\n\n## References & Trust\n\n| # | Source | Type | Trust |\n|---|--------|------|-------|\n${sources.map((s, i) => `| ${i + 1} | \`${s}\` | text | Medium |`).join('\n')}\n`;

beforeEach(() => {
  fs.rmSync(RAW, { recursive: true, force: true });
  fs.rmSync(DOCS, { recursive: true, force: true });
  fs.mkdirSync(RAW, { recursive: true });
  fs.mkdirSync(DOCS, { recursive: true });
  state.current = { files: {} };
});
afterAll(() => fs.rmSync(tmpRoot, { recursive: true, force: true }));

describe('citedSources', () => {
  it('reads the References & Trust table', () => {
    expect(citedSources(TABLE_PAGE('a.md', 'notes/b.pdf'))).toEqual(['a.md', 'notes/b.pdf']);
  });

  it('reads the older Sources bullet list', () => {
    expect(citedSources('# T\n\n## Sources\n\n* `a.md`\n* `b/c.txt`\n')).toEqual(['a.md', 'b/c.txt']);
  });

  it('ignores backticked paths elsewhere on the page, and code fences after the section', () => {
    const page = 'Mentions `not/a/source.md` in prose.\n\n## References & Trust\n\n| 1 | `real.md` | text | High |\n\n```\n| 2 | `fenced.md` | x | y |\n```\n';
    expect(citedSources(page)).toEqual(['real.md']);
  });

  it('is empty without a sources section, and de-duplicates', () => {
    expect(citedSources('# Just a page\n')).toEqual([]);
    expect(citedSources(TABLE_PAGE('a.md', 'a.md'))).toEqual(['a.md']);
  });
});

describe('findStaleSources', () => {
  it('finds nothing when every source still matches what was processed', () => {
    processed('a.md', 'one');
    expect(findStaleSources(['a.md'], state.current, RAW)).toEqual({ changed: [], removed: [] });
  });

  it('flags a source whose content changed', () => {
    processed('a.md', 'one');
    fs.writeFileSync(path.join(RAW, 'a.md'), 'two');
    expect(findStaleSources(['a.md'], state.current, RAW)).toEqual({ changed: ['a.md'], removed: [] });
  });

  it('re-checks a same-size change once the file was touched (the checksum cache is keyed on size and mtime)', () => {
    processed('a.md', 'aaaa');
    findStaleSources(['a.md'], state.current, RAW); // warm the cache
    fs.writeFileSync(path.join(RAW, 'a.md'), 'bbbb'); // same size, new content
    fs.utimesSync(path.join(RAW, 'a.md'), new Date(), new Date(Date.now() + 5000)); // a later mtime
    expect(findStaleSources(['a.md'], state.current, RAW).changed).toEqual(['a.md']);
  });

  it('un-flags a source that was restored to what the compiler saw', () => {
    processed('a.md', 'one');
    fs.writeFileSync(path.join(RAW, 'a.md'), 'two');
    expect(findStaleSources(['a.md'], state.current, RAW).changed).toEqual(['a.md']);
    fs.writeFileSync(path.join(RAW, 'a.md'), 'one');
    fs.utimesSync(path.join(RAW, 'a.md'), new Date(), new Date(Date.now() + 9000));
    expect(findStaleSources(['a.md'], state.current, RAW).changed).toEqual([]);
  });

  it('flags a removed source, including one replaced by a directory', () => {
    processed('gone.md', 'x');
    processed('dir.md', 'x');
    fs.rmSync(path.join(RAW, 'gone.md'));
    fs.rmSync(path.join(RAW, 'dir.md'));
    fs.mkdirSync(path.join(RAW, 'dir.md'));
    expect(findStaleSources(['gone.md', 'dir.md'], state.current, RAW)).toEqual({ changed: [], removed: ['gone.md', 'dir.md'] });
  });

  it('says nothing about a source the compiler has no record of', () => {
    fs.writeFileSync(path.join(RAW, 'new.md'), 'x');
    expect(findStaleSources(['new.md', 'never-seen.md'], state.current, RAW)).toEqual({ changed: [], removed: [] });
  });

  it('never reads outside data/raw, whatever a page claims to cite', () => {
    fs.writeFileSync(path.join(tmpRoot, 'secret.txt'), 'outside');
    state.current.files['../secret.txt'] = { md5: 'different' };
    state.current.files['../raw-old/x'] = { md5: 'different' };
    expect(findStaleSources(['../secret.txt', '../raw-old/x'], state.current, RAW)).toEqual({ changed: [], removed: [] });
  });
});

describe('pageStaleness and stalePages', () => {
  it('is null for a page whose sources are current, and lists what changed for one whose are not', () => {
    processed('a.md', 'one');
    processed('b.md', 'one');
    expect(pageStaleness(TABLE_PAGE('a.md', 'b.md'), state.current, RAW)).toBeNull();
    fs.writeFileSync(path.join(RAW, 'b.md'), 'two');
    expect(pageStaleness(TABLE_PAGE('a.md', 'b.md'), state.current, RAW)).toEqual({ changed: ['b.md'], removed: [] });
  });

  it('finds every stale page in the wiki, skipping the index and non-pages', () => {
    processed('a.md', 'one');
    processed('b.md', 'one');
    fs.writeFileSync(path.join(DOCS, 'fresh.md'), TABLE_PAGE('a.md'));
    fs.writeFileSync(path.join(DOCS, 'stale.md'), TABLE_PAGE('a.md', 'b.md'));
    fs.writeFileSync(path.join(DOCS, 'index.md'), TABLE_PAGE('b.md'));
    fs.writeFileSync(path.join(DOCS, 'notes.txt'), 'x');
    fs.writeFileSync(path.join(RAW, 'b.md'), 'two');

    expect([...stalePages(DOCS, RAW)]).toEqual([['stale.md', { title: 'T', changed: ['b.md'], removed: [] }]]);
  });

  it('is empty for a missing docs directory', () => {
    expect(stalePages(path.join(tmpRoot, 'nope'), RAW).size).toBe(0);
  });
});

describe('describeSources', () => {
  it('lists a few and counts the rest', () => {
    expect(describeSources(['a', 'b'])).toBe('a, b');
    expect(describeSources(['a', 'b', 'c', 'd', 'e'])).toBe('a, b, c (and 2 more)');
  });
});
