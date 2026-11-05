import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { startHarness, type Harness } from './__fixtures__/harness';

let h: Harness;
let token: string;
const auth = () => ({ token });

/** Collect a whole SSE response as parsed `data:` events. */
async function sse(url: string): Promise<any[]> {
  const res = await h.request('GET', url, auth());
  expect(res.headers.get('content-type')).toMatch(/text\/event-stream/);
  const text = await res.text();
  return text
    .split('\n\n')
    .map((block) => block.trim())
    .filter((block) => block.startsWith('data: '))
    .map((block) => JSON.parse(block.slice('data: '.length)));
}

const RUN = {
  id: '20260927-100000-a1b2c3',
  started_at: '2026-09-27T10:00:00Z',
  finished_at: '2026-09-27T10:05:00Z',
  status: 'success',
  force: false,
  error: null,
  steps: [{ name: '1. Discover', status: 'success', started_at: '2026-09-27T10:00:00Z', finished_at: '2026-09-27T10:00:01Z', detail: null, error: null }],
  token_usage: [
    { step: 'extract', model: 'gpt-4o-mini', calls: 10, cache_hits: 2, prompt_tokens: 10000, completion_tokens: 2000, total_tokens: 12000 },
    { step: 'link', model: 'mystery-model', calls: 1, cache_hits: 0, prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
  ],
};

beforeAll(async () => {
  h = await startHarness();
  token = await h.login();
  const runsDir = path.join(h.root, 'data', 'pipeline_runs');
  fs.mkdirSync(runsDir, { recursive: true });
  fs.writeFileSync(path.join(runsDir, `${RUN.id}.json`), JSON.stringify(RUN));
  const { steps: _s, token_usage: _t, error: _e, ...summary } = RUN;
  fs.writeFileSync(path.join(runsDir, 'index.json'), JSON.stringify([summary]));
});
afterAll(() => h.close());

describe('pipeline runs and usage', () => {
  it('lists runs with the LLM backend description', async () => {
    const { body } = await h.json('GET', '/api/pipelines', auth());
    expect(body.runs.map((r: any) => r.id)).toEqual([RUN.id]);
    expect(body.llm_backend).toHaveProperty('mode');
  });

  it('returns one run, 404 for unknown or malformed ids', async () => {
    expect((await h.json('GET', `/api/pipelines/${RUN.id}`, auth())).body.steps).toHaveLength(1);
    expect((await h.json('GET', '/api/pipelines/20990101-000000-ffffff', auth())).status).toBe(404);
    expect((await h.json('GET', '/api/pipelines/..%2F..%2Fusers', auth())).status).toBe(404);
  });

  it('aggregates token usage by step, model and day, flagging unpriced models', async () => {
    const { body } = await h.json('GET', '/api/usage', auth());
    expect(body.runs_counted).toBe(1);
    expect(body.totals).toMatchObject({ calls: 11, cache_hits: 2, total_tokens: 12150, has_unpriced: true });
    expect(body.totals.cost).toBeGreaterThan(0);
    expect(body.by_process.map((b: any) => b.key).sort()).toEqual(['extract', 'link']);
    expect(body.by_day).toEqual([expect.objectContaining({ key: '2026-09-27' })]);
    expect(body.unpriced_models).toEqual(['mystery-model']);
  });
});

describe('JavaScript compile stream', () => {
  it('builds with isolated model responses and persists progress', async () => {
    const previousKey = process.env.OPENAI_API_KEY, previousBase = process.env.OPENAI_BASE_URL;
    const realFetch = globalThis.fetch, prompts: string[] = [];
    process.env.OPENAI_API_KEY = 'test-key'; process.env.OPENAI_BASE_URL = 'https://model.invalid/v1';
    vi.stubGlobal('fetch', async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
      if (!String(input).startsWith('https://model.invalid/')) return realFetch(input, init);
      const request = JSON.parse(String(init?.body)); const system = request.messages[0].content, prompt = request.messages[1].content;
      prompts.push(prompt);
      const content = system.includes('knowledge extractor') ? JSON.stringify({ topics: ['Battery'], entities: [], concepts: [] }) : '# Battery\n\nInformation from the supplied sources.';
      return new Response(JSON.stringify({ choices: [{ message: { content } }], usage: { prompt_tokens: 5, completion_tokens: 2, total_tokens: 7 } }), { status: 200, headers: { 'content-type': 'application/json' } });
    });
    try {
      const events = await sse('/api/build/stream?force=true&redact_pii=false&exclude_folders=notes,drafts');
      expect(events[0].type).toBe('start');
      const id = events.find((event) => event.type === 'run_id').run_id;
      expect(id).toMatch(/^\d{8}-\d{6}-[a-f0-9]{6}$/);
      expect(events.at(-1)).toMatchObject({ type: 'done', success: true, code: 0 });
      expect(prompts.length).toBeGreaterThan(0); expect(prompts.every((prompt) => !prompt.includes('notes/kickoff.txt'))).toBe(true);
      expect((await h.json('GET', `/api/pipelines/${id}`, auth())).body.status).toBe('success');
      expect(fs.readFileSync(path.join(h.root, 'wiki-app/docs/battery.md'), 'utf8')).toContain('References & Trust');
    } finally {
      vi.unstubAllGlobals();
      if (previousKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previousKey;
      if (previousBase === undefined) delete process.env.OPENAI_BASE_URL; else process.env.OPENAI_BASE_URL = previousBase;
    }
  });

  it('reports a missing key and is idle again afterwards', async () => {
    const previousKey = process.env.OPENAI_API_KEY; process.env.OPENAI_API_KEY = '';
    try {
      const events = await sse('/api/build/stream?force=true');
      expect(events.at(-1)).toMatchObject({ type: 'done', success: false, code: 1 });
      expect(events.at(-1).message).toMatch(/API key/);
    } finally { if (previousKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previousKey; }
    expect((await h.json('GET', '/api/build/status', auth())).body).toEqual({ running: false });
  });

  it('stopping with nothing running is harmless', async () => {
    expect((await h.json('POST', '/api/build/stop', auth())).status).toBeLessThan(500);
  });
});

describe('JavaScript chat stream', () => {
  it('streams source excerpts and saves both turns', async () => {
    const id = (await h.json('POST', '/api/chat/sessions', { ...auth(), body: { title: 'q' } })).body.id;
    const events = await sse(`/api/chat/sessions/${id}/stream?message=${encodeURIComponent('battery')}`);
    expect(events.map((event) => event.type)).toEqual(['sources', 'delta', 'done']);
    expect(events.at(-1).mode).toBe('extractive');
    expect(events.at(-1).answer).toContain('Battery target 2 years');
    const session = (await h.json('GET', `/api/chat/sessions/${id}`, auth())).body;
    expect(session.messages.map((message: any) => message.role)).toEqual(['user', 'assistant']);
    expect(session.messages[1].sources[0]).toMatchObject({ doc_path: 'notes/kickoff.txt' });
    expect(session.messages[1].sources[0].slug).toBeUndefined();
  });

  it('returns a visible no-match response and keeps the user message', async () => {
    const id = (await h.json('POST', '/api/chat/sessions', { ...auth(), body: {} })).body.id;
    const events = await sse(`/api/chat/sessions/${id}/stream?message=nonexistentunicorn`);
    expect(events.map((event) => event.type)).toEqual(['sources', 'delta', 'done']);
    expect(events.at(-1).mode).toBe('no_match');
    const session = (await h.json('GET', `/api/chat/sessions/${id}`, auth())).body;
    expect(session.messages.map((message: any) => message.role)).toEqual(['user', 'assistant']);
  });

  it('supports searching wiki pages with clickable sources', async () => {
    const id = (await h.json('POST', '/api/chat/sessions', { ...auth(), body: {} })).body.id;
    await h.json('PATCH', `/api/chat/sessions/${id}`, { ...auth(), body: { corpus_source: 'wiki' } });
    const events = await sse(`/api/chat/sessions/${id}/stream?message=moisture`);
    expect(events.at(-1).mode).toBe('extractive');
    expect(events[0].sources[0]).toMatchObject({ doc_path: 'nova-widget.md', slug: 'nova-widget' });
  });

  it('preserves both turns across follow-up questions', async () => {
    const id = (await h.json('POST', '/api/chat/sessions', { ...auth(), body: {} })).body.id;
    await sse(`/api/chat/sessions/${id}/stream?message=battery`);
    await sse(`/api/chat/sessions/${id}/stream?message=relay`);
    const session = (await h.json('GET', `/api/chat/sessions/${id}`, auth())).body;
    expect(session.messages.map((message: any) => message.role)).toEqual(['user', 'assistant', 'user', 'assistant']);
    expect(session.messages[2].content).toBe('relay');
  });
});

describe('connector activity', () => {
  it('lists logged events per connector, newest first', async () => {
    const { logConnectorEvent } = await import('../lib/connectorActivity');
    const base = { username: 'admin', accountLabel: 'me@example.test', detail: '', success: true };
    logConnectorEvent({ ...base, connectorId: 'imap', action: 'connect' });
    logConnectorEvent({ ...base, connectorId: 'imap', action: 'import', detail: 'inbox/1' });
    logConnectorEvent({ ...base, connectorId: 'gmail', action: 'connect', accountLabel: 'x@example.test' });
    const { body } = await h.json('GET', '/api/connectors/imap/activity', auth());
    expect(body.events.map((e: any) => e.action)).toEqual(['import', 'connect']);
  });

  it('lists the available JavaScript connectors', async () => {
    const body = (await h.json('GET', '/api/connectors', auth())).body;
    expect(body.connectors.map((item: any) => item.id)).toEqual(['gmail', 'google_drive', 'imap', 'postgres', 'sqlite']);
  });

  it('connects, browses, imports and disconnects SQLite', async () => {
    const oldKey = process.env.CONNECTOR_SECRET_KEY;
    process.env.CONNECTOR_SECRET_KEY = Buffer.alloc(32, 7).toString('base64');
    try {
      const SQL = await require('sql.js/dist/sql-asm.js')(), db = new SQL.Database();
      db.run('CREATE TABLE observations (note TEXT)'); db.run("INSERT INTO observations VALUES ('A measured value')");
      const file = path.join(h.root, 'observations.sqlite'); fs.writeFileSync(file, Buffer.from(db.export())); db.close();
      expect((await h.json('POST', '/api/connectors/sqlite/connect', { ...auth(), body: { account_label: 'research', db_path: file } })).status).toBe(200);
      expect((await h.json('POST', '/api/connectors/sqlite/items', { ...auth(), body: { account_label: 'research' } })).body.items[0].id).toBe('observations');
      const imported = await h.json('POST', '/api/connectors/sqlite/items/import', { ...auth(), body: { account_label: 'research', item_id: 'observations' } });
      expect(imported.status).toBe(200); expect(fs.readFileSync(path.join(h.root, 'data/raw', imported.body.raw_path), 'utf8')).toContain('A measured value');
      expect((await h.json('DELETE', '/api/connectors/sqlite/accounts/research', auth())).body.disconnected).toBe(true);
    } finally { if (oldKey === undefined) delete process.env.CONNECTOR_SECRET_KEY; else process.env.CONNECTOR_SECRET_KEY = oldKey; }
  });
});
