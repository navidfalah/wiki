import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AURORA_PAGE, startHarness, type Harness } from './__fixtures__/harness';

let h: Harness;
let token: string;
const auth = () => ({ token });

beforeAll(async () => {
  h = await startHarness();
  token = await h.login();
});
afterAll(() => h.close());

const docFile = (name: string) => path.join(h.root, 'wiki-app', 'docs', name);

describe('docs', () => {
  it('lists pages with title and category', async () => {
    const { status, body } = await h.json('GET', '/api/docs', auth());
    expect(status).toBe(200);
    expect(body.total).toBe(2);
    expect(body.pages.map((p: any) => p.title).sort()).toEqual(['Aurora Labs', 'Nova Widget']);
    expect(body.pages[0]).toHaveProperty('category');
    expect(Date.parse(body.pages[0].modified_at)).not.toBeNaN();
  });

  it('returns one page with body, tags and links', async () => {
    const { body } = await h.json('GET', '/api/docs/aurora-labs.md', auth());
    expect(body).toMatchObject({ title: 'Aurora Labs', tags: ['company', 'iot'] });
    expect(body.body).toContain('# Aurora Labs');
    expect(body.links).toContainEqual({ text: 'Nova Widget', href: './nova-widget.md' });
  });

  it.each(['missing.md', '../../etc/passwd', '..%2F..%2Fdata%2Fusers.json'])('404/400 for %s', async (name) => {
    expect([400, 404]).toContain((await h.json('GET', `/api/docs/${name}`, auth())).status);
  });

  it('editing keeps the frontmatter and replaces the body', async () => {
    const { status, body } = await h.json('PUT', '/api/docs/nova-widget.md', { ...auth(), body: { body: '# Nova Widget\n\nEdited body.\n' } });
    expect(status).toBe(200);
    expect(body.body).toContain('Edited body.');
    const onDisk = fs.readFileSync(docFile('nova-widget.md'), 'utf-8');
    expect(onDisk.startsWith('---\nid: nova-widget')).toBe(true);
  });

  it('rejects an edit without a string body', async () => {
    expect((await h.json('PUT', '/api/docs/nova-widget.md', { ...auth(), body: { body: 42 } })).status).toBe(400);
  });
});

describe('page history', () => {
  it('the edit above was recorded as a version with the old content', async () => {
    const { body } = await h.json('GET', '/api/doc-history/nova-widget.md', auth());
    expect(body.versions).toHaveLength(1);
    expect(body.versions[0].reason).toBe('edit');
  });

  it('a version comes with a diff against the current page', async () => {
    const { body: list } = await h.json('GET', '/api/doc-history/nova-widget.md', auth());
    const { body } = await h.json('GET', `/api/doc-history/nova-widget.md?version=${list.versions[0].id}`, auth());
    expect(body.content).toContain('every 15 minutes');
    expect(body.current_exists).toBe(true);
    expect(body.diff.some((l: any) => l.op === '+' && l.text === 'Edited body.')).toBe(true);
    expect(body.diff.some((l: any) => l.op === '-' && l.text.includes('every 15 minutes'))).toBe(true);
  });

  it('restoring brings the old content back and is itself undoable', async () => {
    const { body: list } = await h.json('GET', '/api/doc-history/nova-widget.md', auth());
    const { status } = await h.json('POST', '/api/doc-history/nova-widget.md', { ...auth(), body: { version: list.versions[0].id } });
    expect(status).toBe(200);
    expect(fs.readFileSync(docFile('nova-widget.md'), 'utf-8')).toContain('every 15 minutes');
    const after = (await h.json('GET', '/api/doc-history/nova-widget.md', auth())).body.versions;
    expect(after.map((v: any) => v.reason)).toEqual(['restore', 'edit']);
  });

  it.each([
    ['GET', '/api/doc-history/..%2Fusers.json', undefined, 400],
    ['GET', '/api/doc-history/nova-widget.md?version=../../x', undefined, 404],
    ['POST', '/api/doc-history/nova-widget.md', { version: 'nope' }, 404],
  ])('%s %s is refused', async (method, url, body, status) => {
    expect((await h.json(method, url, { ...auth(), body })).status).toBe(status);
  });

  it('deleting a page keeps its history, and restore recreates it', async () => {
    expect((await h.json('DELETE', '/api/docs/aurora-labs.md', auth())).status).toBe(200);
    expect(fs.existsSync(docFile('aurora-labs.md'))).toBe(false);
    const { body: list } = await h.json('GET', '/api/doc-history/aurora-labs.md', auth());
    expect(list.versions[0].reason).toBe('delete');
    const { body: version } = await h.json('GET', `/api/doc-history/aurora-labs.md?version=${list.versions[0].id}`, auth());
    expect(version.current_exists).toBe(false);
    await h.json('POST', '/api/doc-history/aurora-labs.md', { ...auth(), body: { version: list.versions[0].id } });
    expect(fs.readFileSync(docFile('aurora-labs.md'), 'utf-8')).toBe(AURORA_PAGE);
  });
});

describe('search', () => {
  it('an empty query returns nothing without calling Python', async () => {
    const before = h.pythonCalls().length;
    expect((await h.json('GET', '/api/search?q=%20', auth())).body).toEqual({ query: '', total: 0, results: [] });
    expect(h.pythonCalls().length).toBe(before);
  });

  it('finds wiki pages for a typed question', async () => {
    const { body } = await h.json('GET', `/api/search?q=${encodeURIComponent('Which battery cell does Aurora Labs use?')}`, auth());
    expect(body.results[0]).toMatchObject({ type: 'wiki', path: 'aurora-labs.md' });
    expect(body.results[0].snippet.toLowerCase()).toContain('cr2032');
  });

  it('searches full email bodies (asks the bridge for them)', async () => {
    const { body } = await h.json('GET', '/api/search?q=sleep+timer', auth());
    expect(body.results.find((r: any) => r.type === 'email')).toMatchObject({ path: 'emails/relay.eml', meta: { from: 'Mira Chen <mira@example.test>' } });
    expect(h.pythonCalls().filter((c) => c.command === 'emails-list').at(-1)?.input).toEqual({ include_body: true });
  });

  it('finds cited resources', async () => {
    const { body } = await h.json('GET', '/api/search?q=kickoff', auth());
    expect(body.results.find((r: any) => r.type === 'resource')).toMatchObject({ path: 'notes/kickoff.txt' });
  });

  it('reports the true total', async () => {
    const { body } = await h.json('GET', '/api/search?q=nova', auth());
    expect(body.total).toBeGreaterThanOrEqual(body.results.length);
  });
});

describe('resources, graph and analytics', () => {
  it('resources invert the References tables', async () => {
    const { body } = await h.json('GET', '/api/resources', auth());
    const kickoff = body.resources.find((r: any) => r.source === 'notes/kickoff.txt');
    expect(kickoff.citation_count).toBe(2);
    expect(kickoff.citing_pages.map((p: any) => p.title).sort()).toEqual(['Aurora Labs', 'Nova Widget']);
  });

  it('filters resources by type', async () => {
    const { body } = await h.json('GET', '/api/resources?source_type=email', auth());
    expect(body.resources.map((r: any) => r.source)).toEqual(['emails/relay.eml']);
  });

  it('one resource comes with a preview of the raw file', async () => {
    const { body } = await h.json('GET', '/api/resources/notes/kickoff.txt', auth());
    expect(body.preview).toContain('Kickoff');
    expect((await h.json('GET', '/api/resources/notes/unknown.txt', auth())).status).toBe(404);
  });

  it('the knowledge graph uses the topic index', async () => {
    const { status, body } = await h.json('GET', '/api/knowledge-graph', auth());
    expect(status).toBe(200);
    expect(JSON.stringify(body)).toContain('Nova Widget');
  });

  it('analytics and attention reports build from the docs', async () => {
    expect((await h.json('GET', '/api/analytics', auth())).status).toBe(200);
    expect((await h.json('GET', '/api/attention', auth())).status).toBe(200);
  });

  it('counts the compiled pages even when the topic index is missing', async () => {
    const indexPath = path.join(h.root, 'compiler/temp_output/index.json');
    const saved = fs.readFileSync(indexPath, 'utf-8');
    fs.unlinkSync(indexPath);
    try {
      const { body } = await h.json('GET', '/api/analytics', auth());
      expect(body.metrics.wiki_pages_created).toBe(2);
      expect(body.metrics.cross_links_established).toBeGreaterThanOrEqual(0);
    } finally {
      fs.writeFileSync(indexPath, saved);
    }
  });
});

describe('bridged to Python', () => {
  it.each([
    ['/api/emails', 'emails'],
    ['/api/review-queue', 'candidates'],
    ['/api/entity-graph', 'nodes'],
    ['/api/temporal-facts', 'groups'],
    ['/api/chat/status', 'corpus_pages'],
  ])('%s passes the bridge result through', async (url, key) => {
    const { status, body } = await h.json('GET', url, auth());
    expect(status).toBe(200);
    expect(body).toHaveProperty(key);
  });

  it('maps bridge error types to HTTP statuses', async () => {
    expect((await h.json('GET', '/api/emails/emails/relay.eml', auth())).status).toBe(200);
    expect((await h.json('GET', '/api/emails/emails/missing.eml', auth())).status).toBe(404);
    expect((await h.json('GET', '/api/emails/notes/kickoff.txt', auth())).status).toBe(400);
  });
});
