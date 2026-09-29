import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startHarness, type Harness } from './__fixtures__/harness';

let h: Harness;
let token: string;
const auth = () => ({ token });
const raw = (rel: string) => path.join(h.root, 'data', 'raw', rel);
const md5 = (text: string) => crypto.createHash('md5').update(text).digest('hex');

const SOURCE = 'notes/kickoff.txt';
const ORIGINAL = 'Kickoff: original text.';
// The harness's own Aurora Labs and Nova Widget pages cite this source too, so a change makes all three stale.
const CITING_PAGES = ['aurora-labs.md', 'nova-widget.md', 'stale-demo.md'];

const page = (...sources: string[]) =>
  `---\ntitle: Stale Demo\n---\n\n# Stale Demo\n\nBody.\n\n## References & Trust\n\n| # | Source | Type | Trust |\n|---|--------|------|-------|\n${sources.map((s, i) => `| ${i + 1} | \`${s}\` | text | Medium |`).join('\n')}\n`;

async function attention() {
  return (await h.json('GET', '/api/attention', auth())).body;
}
const staleItems = (report: any) => report.items.filter((i: any) => i.kind === 'stale_page');

beforeAll(async () => {
  h = await startHarness();
  token = await h.login();
  // The compiler processed the source as it is now, and a page cites it.
  fs.writeFileSync(raw(SOURCE), ORIGINAL);
  fs.writeFileSync(
    path.join(h.root, 'data', 'state.json'),
    JSON.stringify({ version: 1, files: { [SOURCE]: { md5: md5(ORIGINAL), processed_at: '2026-09-01T00:00:00Z' } }, runs: [] }),
  );
  fs.writeFileSync(path.join(h.root, 'wiki-app', 'docs', 'stale-demo.md'), page(SOURCE));
  fs.writeFileSync(path.join(h.root, 'wiki-app', 'docs', 'no-sources.md'), '---\ntitle: No Sources\n---\n\nJust text.\n');
});
afterAll(() => h.close());

describe('stale pages', () => {
  it('flags nothing while every cited source matches what the compiler processed', async () => {
    const report = await attention();
    expect(report.counts.stale_pages).toBe(0);
    expect(staleItems(report)).toEqual([]);
    const list = (await h.json('GET', '/api/docs', auth())).body.pages;
    expect(list.find((p: any) => p.path === 'stale-demo.md').stale_sources).toBe(0);
    expect((await h.json('GET', '/api/docs/stale-demo.md', auth())).body.stale).toBeNull();
  });

  it('flags a page once one of its sources changed, everywhere it should show', async () => {
    fs.writeFileSync(raw(SOURCE), 'Kickoff: EDITED after the page was compiled.');

    const report = await attention();
    expect(report.counts.stale_pages).toBe(3);
    expect(report.counts.total).toBeGreaterThanOrEqual(3);
    const items = staleItems(report);
    expect(items.map((i: any) => i.doc_path).sort()).toEqual(CITING_PAGES);
    expect(items.find((i: any) => i.doc_path === 'stale-demo.md')).toMatchObject({
      kind: 'stale_page',
      severity: 'medium',
      title: 'Stale Demo',
      detail: `Built from sources that changed since it was compiled: ${SOURCE}. Recompile to bring the page up to date.`,
    });

    const list = (await h.json('GET', '/api/docs', auth())).body.pages;
    expect(list.find((p: any) => p.path === 'stale-demo.md').stale_sources).toBe(1);
    expect(list.find((p: any) => p.path === 'no-sources.md').stale_sources).toBe(0);
    expect((await h.json('GET', '/api/docs/stale-demo.md', auth())).body.stale).toEqual({ changed: [SOURCE], removed: [] });
    expect((await h.json('GET', '/api/docs/no-sources.md', auth())).body.stale).toBeNull();
  });

  it('treats a removed source as more serious than a changed one', async () => {
    fs.rmSync(raw(SOURCE));
    const items = staleItems(await attention());
    expect(items).toHaveLength(3);
    for (const item of items) {
      expect(item.severity).toBe('high');
      expect(item.detail).toContain(`no longer in data/raw/: ${SOURCE}`);
    }
    expect((await h.json('GET', '/api/docs/stale-demo.md', auth())).body.stale).toEqual({ changed: [], removed: [SOURCE] });
  });

  it('un-flags the page when the source is put back as the compiler saw it', async () => {
    fs.writeFileSync(raw(SOURCE), ORIGINAL);
    expect((await attention()).counts.stale_pages).toBe(0);
    expect((await h.json('GET', '/api/docs/stale-demo.md', auth())).body.stale).toBeNull();
  });

  it('a page cannot make the server look outside data/raw', async () => {
    fs.writeFileSync(path.join(h.root, 'wiki-app', 'docs', 'sneaky.md'), page('../../package.json', '../state.json'));
    expect((await attention()).counts.stale_pages).toBe(0);
    expect((await h.json('GET', '/api/docs/sneaky.md', auth())).body.stale).toBeNull();
    fs.rmSync(path.join(h.root, 'wiki-app', 'docs', 'sneaky.md'));
  });
});
