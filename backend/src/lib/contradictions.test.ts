import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { contradictionId, decide, extractCallouts, listContradictions, loadDecisions, MAX_DECISIONS_KEPT, UnknownContradictionError } from './contradictions';

let root: string;
let docs: string;
let decisions: string;
const NOW = new Date('2026-09-29T12:00:00Z');

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'contradictions-'));
  docs = path.join(root, 'docs');
  decisions = path.join(root, 'decisions.json');
  fs.mkdirSync(docs);
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

const write = (file: string, body: string, title = 'A Page') => fs.writeFileSync(path.join(docs, file), `---\ntitle: ${title}\n---\n\n${body}\n`);
const A = '> **Contradiction:** The flyer says 200 euros; the correct price is 250 euros.';
const B = '> **Contradiction:** The plan says 198 kWp; later sources say 171.6 kWp.';

describe('extractCallouts', () => {
  it('finds each callout, including ones separated by a blank line or directly adjacent', () => {
    expect(extractCallouts(`text\n\n${A}\n\n${B}\n\nmore`)).toEqual(['The flyer says 200 euros; the correct price is 250 euros.', 'The plan says 198 kWp; later sources say 171.6 kWp.']);
    expect(extractCallouts(`${A}\n${B}`)).toHaveLength(2);
  });

  it('joins a callout that continues over several quoted lines and stops at the first unquoted or empty-quote line', () => {
    expect(extractCallouts('> **Contradiction:** first part\n> second part\n>\n> not part of it\n\nplain')).toEqual(['first part second part']);
  });

  it('handles a callout at the very end of the text and ignores other blockquotes', () => {
    expect(extractCallouts('> a normal quote\n\n> **Note:** nope\n\n> **Contradiction:** last one')).toEqual(['last one']);
    expect(extractCallouts('nothing here')).toEqual([]);
  });

  it('ignores an empty callout', () => {
    expect(extractCallouts('> **Contradiction:**\n\ntext')).toEqual([]);
  });
});

describe('listContradictions', () => {
  it('lists open callouts with their page, skipping index.md and pages without any', () => {
    write('price.md', `Body\n\n${A}`, 'Share price');
    write('plain.md', 'nothing');
    write('index.md', A);
    const items = listContradictions(docs, decisions);
    expect(items).toEqual([
      { id: contradictionId('price.md', 'The flyer says 200 euros; the correct price is 250 euros.'), page: 'price.md', page_title: 'Share price', text: 'The flyer says 200 euros; the correct price is 250 euros.', status: 'open', note: '', decided_by: null, decided_at: null },
    ]);
  });

  it('counts an identical callout repeated on one page once, but the same text on two pages twice', () => {
    write('a.md', `${A}\n\nx\n\n${A}`);
    write('b.md', A);
    expect(listContradictions(docs, decisions).map((c) => c.page)).toEqual(['a.md', 'b.md']);
  });

  it('is empty for a missing directory and tolerates a corrupt decisions file', () => {
    expect(listContradictions(path.join(root, 'nope'), decisions)).toEqual([]);
    fs.writeFileSync(decisions, '{ nope');
    write('a.md', A);
    expect(listContradictions(docs, decisions)[0].status).toBe('open');
    fs.writeFileSync(decisions, '[1,2]');
    expect(loadDecisions(decisions)).toEqual({});
  });
});

describe('decide', () => {
  it('records who decided what and when, and reopening removes the decision', () => {
    write('a.md', A);
    const [c] = listContradictions(docs, decisions);
    const done = decide(c.id, 'resolved', '  page states 250 euros  ', 'ana', docs, decisions, NOW);
    expect(done).toMatchObject({ status: 'resolved', note: 'page states 250 euros', decided_by: 'ana', decided_at: NOW.toISOString() });
    expect(listContradictions(docs, decisions)[0]).toMatchObject({ status: 'resolved', decided_by: 'ana' });
    expect(decide(c.id, 'dismissed', 'not real', 'bo', docs, decisions, NOW).status).toBe('dismissed');
    const reopened = decide(c.id, 'open', 'ignored', 'bo', docs, decisions, NOW);
    expect(reopened).toMatchObject({ status: 'open', note: '', decided_by: null, decided_at: null });
    expect(loadDecisions(decisions)).toEqual({});
  });

  it('brings a contradiction back as open when the compiler rewrites its text', () => {
    write('a.md', A);
    decide(listContradictions(docs, decisions)[0].id, 'resolved', '', 'ana', docs, decisions, NOW);
    write('a.md', A.replace('250', '260'));
    const [c] = listContradictions(docs, decisions);
    expect(c.status).toBe('open');
    expect(c.text).toContain('260');
  });

  it('keeps decisions per page: the same text on another page stays open', () => {
    write('a.md', A);
    write('b.md', A);
    decide(listContradictions(docs, decisions)[0].id, 'dismissed', '', 'ana', docs, decisions, NOW);
    expect(listContradictions(docs, decisions).map((c) => c.status)).toEqual(['dismissed', 'open']);
  });

  it('refuses an id that is not shown and writes nothing', () => {
    write('a.md', A);
    expect(() => decide('deadbeef0000', 'resolved', '', 'ana', docs, decisions, NOW)).toThrow(UnknownContradictionError);
    expect(fs.existsSync(decisions)).toBe(false);
  });

  it('truncates a very long note', () => {
    write('a.md', A);
    const done = decide(listContradictions(docs, decisions)[0].id, 'resolved', 'x'.repeat(900), 'ana', docs, decisions, NOW);
    expect(done.note).toHaveLength(500);
  });

  it('drops the oldest decisions about vanished callouts when the file grows too large, never live ones', () => {
    write('a.md', A);
    const seeded: Record<string, unknown> = {};
    for (let i = 0; i < MAX_DECISIONS_KEPT; i++) {
      seeded[`gone${String(i).padStart(5, '0')}`] = { status: 'resolved', note: '', decided_by: 'x', decided_at: new Date(2026, 0, 1, 0, 0, i).toISOString() };
    }
    fs.writeFileSync(decisions, JSON.stringify(seeded));
    const id = listContradictions(docs, decisions)[0].id;
    decide(id, 'resolved', '', 'ana', docs, decisions, NOW);
    const after = loadDecisions(decisions);
    expect(Object.keys(after)).toHaveLength(MAX_DECISIONS_KEPT);
    expect(after[id]).toBeDefined();
    expect(after.gone00000).toBeUndefined(); // the oldest went
    expect(after[`gone${String(MAX_DECISIONS_KEPT - 1).padStart(5, '0')}`]).toBeDefined();
  });
});
