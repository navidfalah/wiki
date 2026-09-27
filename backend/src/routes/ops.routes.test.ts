import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
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

describe('compile stream', () => {
  it('streams the run id and cleaned log lines, and passes pipeline flags through', async () => {
    const events = await sse('/api/build/stream?force=true&redact_pii=false&exclude_folders=notes,drafts');
    const types = events.map((e) => e.type);
    expect(types[0]).toBe('start');
    expect(events).toContainEqual(expect.objectContaining({ type: 'run_id', run_id: '20260927-120000-abcdef' }));
    const logs = events.filter((e) => e.type === 'log').map((e) => e.message);
    expect(logs).toContain('Step 1/5: discovering raw files'); // ANSI colour codes stripped
    expect(logs).toContain('warning on stderr');
    expect(logs).toContain('Step 5/5: done (no trailing newline)');
    expect(events.at(-1)).toMatchObject({ type: 'done', success: true, code: 0 });
    const call = h.pythonCalls().find((c: any) => c.command === 'main.py') as any;
    expect(call.args).toEqual(expect.arrayContaining(['--force', '--no-redact-pii', '--exclude-folders=notes,drafts']));
  });

  it('reports a failed compile and is idle again afterwards', async () => {
    process.env.FAKE_BUILD_EXIT = '3';
    try {
      const events = await sse('/api/build/stream');
      expect(events.at(-1)).toMatchObject({ type: 'done', success: false, code: 3 });
    } finally {
      delete process.env.FAKE_BUILD_EXIT;
    }
    expect((await h.json('GET', '/api/build/status', auth())).body).toEqual({ running: false });
  });

  it('stopping with nothing running is harmless', async () => {
    expect((await h.json('POST', '/api/build/stop', auth())).status).toBeLessThan(500);
  });
});

describe('chat stream', () => {
  it('streams tokens and saves both turns with linked sources', async () => {
    const id = (await h.json('POST', '/api/chat/sessions', { ...auth(), body: { title: 'q' } })).body.id;
    const events = await sse(`/api/chat/sessions/${id}/stream?message=${encodeURIComponent('What battery?')}`);
    expect(events.map((e) => e.type)).toEqual(['sources', 'token', 'token', 'done']);
    const session = (await h.json('GET', `/api/chat/sessions/${id}`, auth())).body;
    expect(session.messages.map((m: any) => m.role)).toEqual(['user', 'assistant']);
    expect(session.messages[1].content).toBe('Aurora uses a CR2032.');
    expect(session.messages[1].sources[0]).toMatchObject({ doc_path: 'aurora-labs.md', slug: 'aurora-labs' });
    const call = h.pythonCalls().filter((c: any) => c.command === 'chat-stream').at(-1) as any;
    expect(call.input).toMatchObject({ message: 'What battery?', corpus_source: 'wiki' });
  });

  it('passes a model error through and saves no answer', async () => {
    const id = (await h.json('POST', '/api/chat/sessions', { ...auth(), body: {} })).body.id;
    const events = await sse(`/api/chat/sessions/${id}/stream?message=${encodeURIComponent('fail please')}`);
    expect(events.at(-1)).toMatchObject({ type: 'error', message: 'model unavailable' });
    const session = (await h.json('GET', `/api/chat/sessions/${id}`, auth())).body;
    expect(session.messages.map((m: any) => m.role)).toEqual(['user']);
  });

  it('surfaces a crash before any event as an error', async () => {
    const id = (await h.json('POST', '/api/chat/sessions', { ...auth(), body: {} })).body.id;
    const events = await sse(`/api/chat/sessions/${id}/stream?message=${encodeURIComponent('silent please')}`);
    expect(events.at(-1)).toMatchObject({ type: 'error' });
    expect(events.at(-1).message).toMatch(/crashed before any event/);
  });

  it('keeps the chat history in follow-up questions', async () => {
    const id = (await h.json('POST', '/api/chat/sessions', { ...auth(), body: {} })).body.id;
    await sse(`/api/chat/sessions/${id}/stream?message=first`);
    await sse(`/api/chat/sessions/${id}/stream?message=second`);
    const call = h.pythonCalls().filter((c: any) => c.command === 'chat-stream').at(-1) as any;
    expect(call.input.history.map((m: any) => m.content)).toEqual(['first', 'Aurora uses a CR2032.']);
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

  it('the connector catalog comes from the bridge', async () => {
    expect((await h.json('GET', '/api/connectors', auth())).body).toEqual({ connectors: [] });
  });
});
