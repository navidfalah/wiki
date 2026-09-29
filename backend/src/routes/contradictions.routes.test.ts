import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startHarness, type Harness } from './__fixtures__/harness';

let h: Harness;
let token: string;
const auth = () => ({ token });
const docs = (file: string) => path.join(h.root, 'wiki-app', 'docs', file);
const TEXT = 'The flyer says 200 euros; the correct price is 250 euros.';

const list = async (query = '') => (await h.json('GET', `/api/contradictions${query}`, auth())).body;
const contradictionItems = async () => (await h.json('GET', '/api/attention', auth())).body;

beforeAll(async () => {
  h = await startHarness();
  token = await h.login();
  fs.writeFileSync(docs('price-demo.md'), `---\ntitle: Price Demo\n---\n\nBody.\n\n> **Contradiction:** ${TEXT}\n`);
});
afterAll(() => h.close());

describe('contradiction inbox', () => {
  it('lists an open contradiction and shows it in the attention feed', async () => {
    const body = await list();
    expect(body.counts).toEqual({ open: 1, resolved: 0, dismissed: 0 });
    expect(body.items[0]).toMatchObject({ page: 'price-demo.md', page_title: 'Price Demo', text: TEXT, status: 'open' });
    const report = await contradictionItems();
    expect(report.counts.open_contradictions).toBe(1);
    expect(report.items.find((i: any) => i.kind === 'open_contradiction')).toMatchObject({ title: 'Price Demo', doc_path: 'price-demo.md', severity: 'medium' });
  });

  it('records a decision with the deciding user, filters by status, and clears the attention item', async () => {
    const [{ id }] = (await list()).items;
    const put = await h.json('PUT', `/api/contradictions/${id}`, { ...auth(), body: { status: 'resolved', note: 'Page states 250 euros.' } });
    expect(put.status).toBe(200);
    expect(put.body).toMatchObject({ status: 'resolved', note: 'Page states 250 euros.' });
    expect(put.body.decided_by).toBeTruthy();
    expect((await list('?status=open')).items).toEqual([]);
    expect((await list('?status=resolved')).items).toHaveLength(1);
    expect((await contradictionItems()).counts.open_contradictions).toBe(0);
  });

  it('reopens, and the decision lives in data/contradiction_decisions.json', async () => {
    const [{ id }] = (await list()).items;
    expect(JSON.parse(fs.readFileSync(path.join(h.root, 'data', 'contradiction_decisions.json'), 'utf-8'))[id].status).toBe('resolved');
    await h.json('PUT', `/api/contradictions/${id}`, { ...auth(), body: { status: 'open' } });
    expect((await list()).counts.open).toBe(1);
  });

  it('rejects a bad status, a bad note, and an unknown id', async () => {
    const [{ id }] = (await list()).items;
    expect((await h.json('GET', '/api/contradictions?status=bogus', auth())).status).toBe(400);
    expect((await h.json('PUT', `/api/contradictions/${id}`, { ...auth(), body: { status: 'maybe' } })).status).toBe(400);
    expect((await h.json('PUT', `/api/contradictions/${id}`, { ...auth(), body: { status: 'resolved', note: 5 } })).status).toBe(400);
    expect((await h.json('PUT', `/api/contradictions/${id}`, { ...auth(), body: { status: 'resolved', note: 'x'.repeat(501) } })).status).toBe(400);
    expect((await h.json('PUT', '/api/contradictions/nope', { ...auth(), body: { status: 'resolved' } })).status).toBe(404);
    expect((await list()).counts.open).toBe(1);
  });

  it('requires authentication', async () => {
    expect((await h.json('GET', '/api/contradictions')).status).toBe(401);
    expect((await h.json('PUT', '/api/contradictions/x', { body: { status: 'open' } })).status).toBe(401);
  });
});
