import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

beforeEach(() => clearSearchCache());
import { clearSearchCache, makeSnippet, searchCorpus, searchCorpusPage, searchEmails, searchResourceItems, searchWikiPages } from './searchEngine';

describe('searchWikiPages', () => {
  let docsDir: string;

  beforeEach(() => {
    docsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'search-engine-test-'));
  });

  afterEach(() => {
    fs.rmSync(docsDir, { recursive: true, force: true });
  });

  it('matches on title', () => {
    fs.writeFileSync(path.join(docsDir, 'aurora-labs.md'), '---\ntitle: Aurora Labs\n---\nA fictional IoT startup.');
    const hits = searchWikiPages('aurora', docsDir);
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({ type: 'wiki', title: 'Aurora Labs', path: 'aurora-labs.md' });
  });

  it('matches on body content when the title does not match', () => {
    fs.writeFileSync(path.join(docsDir, 'battery.md'), '---\ntitle: Battery Life\n---\nDiscusses firmware update cadence.');
    const hits = searchWikiPages('firmware', docsDir);
    expect(hits).toHaveLength(1);
    expect(hits[0].snippet).toContain('firmware');
  });

  it('ranks pages matching every query term above partial matches', () => {
    fs.writeFileSync(path.join(docsDir, 'a.md'), '---\ntitle: Aurora Labs\n---\nBattery life is good.');
    fs.writeFileSync(path.join(docsDir, 'b.md'), '---\ntitle: Other Page\n---\nBattery life is bad.');
    const hits = searchWikiPages('aurora battery', docsDir);
    expect(hits.map((h) => h.path)).toEqual(['a.md', 'b.md']);
    expect(hits[0].score).toBeGreaterThan(hits[1].score * 2);
  });

  it('answers a natural-language question by ignoring stopwords', () => {
    fs.writeFileSync(path.join(docsDir, 'battery.md'), '---\ntitle: Battery\n---\nThe Nova Widget uses a CR2032 cell.');
    fs.writeFileSync(path.join(docsDir, 'other.md'), '---\ntitle: Other\n---\nWhat is this? It is what it is.');
    expect(searchWikiPages('What battery does the Nova Widget use?', docsDir)[0].path).toBe('battery.md');
  });

  it('matches plural and singular forms', () => {
    fs.writeFileSync(path.join(docsDir, 'b.md'), '---\ntitle: Cells\n---\nWe stock spare batteries.');
    expect(searchWikiPages('battery', docsDir).map((h) => h.path)).toEqual(['b.md']);
  });

  it('matches version numbers and ticket ids whole or in parts', () => {
    fs.writeFileSync(path.join(docsDir, 'fw.md'), '---\ntitle: Firmware\n---\nMESH-118 is fixed in 0.3.9.');
    expect(searchWikiPages('mesh-118', docsDir)).toHaveLength(1);
    expect(searchWikiPages('0.3.9', docsDir)).toHaveLength(1);
    expect(searchWikiPages('118', docsDir)).toHaveLength(1);
  });

  it('is case-insensitive', () => {
    fs.writeFileSync(path.join(docsDir, 'a.md'), '---\ntitle: Aurora Labs\n---\nBody text.');
    expect(searchWikiPages('AURORA', docsDir)).toHaveLength(1);
  });

  it('ranks a title match above a body-only match', () => {
    fs.writeFileSync(path.join(docsDir, 'title-hit.md'), '---\ntitle: Firmware Update\n---\nUnrelated body.');
    fs.writeFileSync(path.join(docsDir, 'body-hit.md'), '---\ntitle: Unrelated Page\n---\nMentions firmware once.');
    const hits = searchWikiPages('firmware', docsDir);
    expect(hits.map((h) => h.path)).toEqual(['title-hit.md', 'body-hit.md']);
  });

  it('returns nothing for a blank query', () => {
    fs.writeFileSync(path.join(docsDir, 'a.md'), '---\ntitle: Aurora Labs\n---\nBody.');
    expect(searchWikiPages('   ', docsDir)).toEqual([]);
  });

  it('returns nothing when nothing matches', () => {
    fs.writeFileSync(path.join(docsDir, 'a.md'), '---\ntitle: Aurora Labs\n---\nBody.');
    expect(searchWikiPages('nonexistent-term', docsDir)).toEqual([]);
  });

  it('falls back to a title-cased filename when there is no frontmatter title', () => {
    fs.writeFileSync(path.join(docsDir, 'wireless-mesh.md'), 'No frontmatter here, just wireless mesh content.');
    const hits = searchWikiPages('wireless', docsDir);
    expect(hits[0].title).toBe('Wireless Mesh');
  });

  it('returns an empty array when the docs directory does not exist', () => {
    expect(searchWikiPages('anything', path.join(docsDir, 'missing'))).toEqual([]);
  });
});

describe('searchResourceItems', () => {
  let docsDir: string;

  beforeEach(() => {
    docsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'search-engine-resources-test-'));
  });

  afterEach(() => {
    fs.rmSync(docsDir, { recursive: true, force: true });
  });

  it('matches a resource by its source path', () => {
    const body = [
      '---',
      'title: Aurora Labs',
      '---',
      '## References & Trust',
      '',
      '| # | Source | Type | Trust |',
      '|---|---|---|---|',
      '| 1 | `data/raw/notes.txt` | Document | High |',
    ].join('\n');
    fs.writeFileSync(path.join(docsDir, 'aurora-labs.md'), body);
    const hits = searchResourceItems('notes.txt', docsDir);
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({ type: 'resource', path: 'data/raw/notes.txt' });
    expect(hits[0].meta).toMatchObject({ sourceType: 'Document', trust: 'High' });
  });

  it('matches a resource by the title of a page citing it', () => {
    const body = [
      '---',
      'title: Aurora Labs',
      '---',
      '## References & Trust',
      '',
      '| # | Source | Type | Trust |',
      '|---|---|---|---|',
      '| 1 | `data/raw/notes.txt` | Document | High |',
    ].join('\n');
    fs.writeFileSync(path.join(docsDir, 'aurora-labs.md'), body);
    expect(searchResourceItems('aurora', docsDir)).toHaveLength(1);
  });

  it('returns nothing for a blank query', () => {
    expect(searchResourceItems('', docsDir)).toEqual([]);
  });
});

describe('searchEmails', () => {
  const emails = [
    { path: 'emails/a.eml', subject: 'Q3 Battery Recall', from: 'ops@aurora-labs.test', date: '2024-01-01', body_preview: 'We are recalling the Q3 battery units.' },
    { path: 'emails/b.eml', subject: 'Welcome aboard', from: 'hr@aurora-labs.test', date: '2024-01-02', body_preview: 'Looking forward to working with you.' },
  ];

  it('matches on subject', () => {
    const hits = searchEmails('recall', emails);
    expect(hits).toHaveLength(1);
    expect(hits[0].path).toBe('emails/a.eml');
  });

  it('matches on body preview', () => {
    const hits = searchEmails('working with you', emails);
    expect(hits).toHaveLength(1);
    expect(hits[0].path).toBe('emails/b.eml');
  });

  it('exposes from/date as meta, not baked into the snippet text', () => {
    const hits = searchEmails('recall', emails);
    expect(hits[0].meta).toEqual({ from: 'ops@aurora-labs.test', date: '2024-01-01' });
  });

  it('falls back to a placeholder title for a subjectless email', () => {
    const hits = searchEmails('recall', [{ path: 'x.eml', subject: '', body_preview: 'a recall notice' }]);
    expect(hits[0].title).toBe('(no subject)');
  });

  it('returns nothing for a blank query', () => {
    expect(searchEmails('', emails)).toEqual([]);
  });
});

describe('makeSnippet', () => {
  it('centers the snippet around the first matched term', () => {
    const body = 'a'.repeat(100) + ' NEEDLE ' + 'b'.repeat(100);
    const snippet = makeSnippet(body, ['needle'], 40);
    expect(snippet.toLowerCase()).toContain('needle');
    expect(snippet.startsWith('…')).toBe(true);
    expect(snippet.endsWith('…')).toBe(true);
  });

  it('collapses whitespace/newlines to single spaces', () => {
    expect(makeSnippet('line one\nline   two', ['two'])).toBe('line one line two');
  });

  it('returns an empty string for empty body', () => {
    expect(makeSnippet('   ', ['x'])).toBe('');
  });

  it('truncates from the start when there is no match', () => {
    const body = 'x'.repeat(300);
    expect(makeSnippet(body, ['absent'], 50)).toBe(`${'x'.repeat(50)}…`);
  });
});

describe('searchCorpus', () => {
  let docsDir: string;

  beforeEach(() => {
    docsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'search-engine-corpus-test-'));
  });

  afterEach(() => {
    fs.rmSync(docsDir, { recursive: true, force: true });
  });

  it('merges and ranks hits across wiki pages and emails', () => {
    fs.writeFileSync(path.join(docsDir, 'a.md'), '---\ntitle: Battery Recall Notice\n---\nDetails of the recall.');
    const emails = [{ path: 'e.eml', subject: 'FYI: battery recall', body_preview: 'see attached' }];
    const hits = searchCorpus('recall', emails, docsDir);
    expect(hits.map((h) => h.type).sort()).toEqual(['email', 'wiki']);
  });

  it('sorts by score descending, then title', () => {
    fs.writeFileSync(path.join(docsDir, 'title-match.md'), '---\ntitle: Recall\n---\nUnrelated.');
    fs.writeFileSync(path.join(docsDir, 'body-match.md'), '---\ntitle: Other\n---\nMentions recall once.');
    const hits = searchCorpus('recall', [], docsDir);
    expect(hits[0].path).toBe('title-match.md');
  });
});

describe('searchCorpusPage', () => {
  let docsDir: string;

  beforeEach(() => {
    docsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'search-engine-page-test-'));
    for (let i = 0; i < 5; i++) fs.writeFileSync(path.join(docsDir, `p${i}.md`), `---\ntitle: Page ${i}\n---\nbattery note ${i}`);
  });

  afterEach(() => {
    fs.rmSync(docsDir, { recursive: true, force: true });
  });

  it('returns the top `limit` hits but the full match count', () => {
    const page = searchCorpusPage('battery', [], docsDir, 2);
    expect(page.total).toBe(5);
    expect(page.results).toHaveLength(2);
  });

  it('picks up a changed page once the cache is invalidated', () => {
    expect(searchCorpusPage('zeppelin', [], docsDir).total).toBe(0);
    fs.writeFileSync(path.join(docsDir, 'p0.md'), '---\ntitle: Page 0\n---\nzeppelin');
    clearSearchCache();
    expect(searchCorpusPage('zeppelin', [], docsDir).total).toBe(1);
  });

  it('searches full email bodies, not only the preview', () => {
    const email = { path: 'e.eml', subject: 'Status', body_preview: 'short preview', body: 'short preview ... much later: zeppelin' };
    expect(searchCorpusPage('zeppelin', [email], docsDir).results[0]).toMatchObject({ type: 'email', path: 'e.eml' });
  });
});
