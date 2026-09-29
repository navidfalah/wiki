import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startHarness, type Harness } from './__fixtures__/harness';

let h: Harness;
let admin: string;
let member: string;

beforeAll(async () => {
  h = await startHarness();
  admin = await h.login();
  await h.json('POST', '/api/users', { token: admin, body: { username: 'plain', password: 'plain-user-pw', role: 'user' } });
  member = await h.login('plain', 'plain-user-pw');
});
afterAll(() => h.close());

const CONNECTION = { connector_id: 'gmail', account_label: 'me@example.test', query: '', limit: 10 };
const settings = (over: Record<string, unknown> = {}) => ({ enabled: true, interval_hours: 6, compile_after_sync: true, connections: [CONNECTION], ...over });

async function status() {
  return (await h.json('GET', '/api/admin/sync', { token: admin })).body;
}

/** Waits for the background run to finish and returns the newest run. */
async function finishedRun(previousRuns: number) {
  for (let i = 0; i < 100; i++) {
    const s = await status();
    if (!s.running && s.runs.length > previousRuns) return s.runs[0];
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('sync run did not finish');
}

describe('scheduled sync API', () => {
  it('is admin only', async () => {
    expect((await h.json('GET', '/api/admin/sync')).status).toBe(401);
    for (const [method, url] of [['GET', '/api/admin/sync'], ['PUT', '/api/admin/sync/settings'], ['POST', '/api/admin/sync/run']] as const) {
      expect((await h.json(method, url, { token: member, ...(method === 'GET' ? {} : { body: settings() }) })).status).toBe(403);
    }
  });

  it('starts switched off, with no runs and no next run', async () => {
    expect(await status()).toMatchObject({
      settings: { enabled: false, interval_hours: 24, connections: [] },
      running: false,
      last_run: null,
      next_run_at: null,
      runs: [],
    });
  });

  it('saves settings and reports when the next sync is due', async () => {
    const saved = await h.json('PUT', '/api/admin/sync/settings', { token: admin, body: settings({ interval_hours: 12 }) });
    expect(saved.status).toBe(200);
    expect(saved.body.settings).toMatchObject({ enabled: true, interval_hours: 12, connections: [CONNECTION] });
    expect(Date.parse(saved.body.next_run_at)).toBeLessThanOrEqual(Date.now() + 1000); // never run: due at the next check
    expect(JSON.parse(fs.readFileSync(path.join(h.root, 'data', 'sync_settings.json'), 'utf-8'))).toMatchObject({ enabled: true, interval_hours: 12 });
  });

  it.each([
    [{ interval_hours: 0 }, "'interval_hours' must be a whole number between 1 and 720"],
    [{ connections: 'x' }, "'connections' must be a list"],
    [{ connections: [{ connector_id: 'gmail' }] }, 'Every connection needs a connector and an account'],
  ])('rejects %j', async (over, detail) => {
    const res = await h.json('PUT', '/api/admin/sync/settings', { token: admin, body: settings(over) });
    expect(res.status).toBe(400);
    expect(res.body.detail).toBe(detail);
  });

  it('refuses to run with nothing configured', async () => {
    await h.json('PUT', '/api/admin/sync/settings', { token: admin, body: settings({ connections: [] }) });
    const res = await h.json('POST', '/api/admin/sync/run', { token: admin });
    expect(res.status).toBe(400);
    expect(res.body.detail).toBe('Add at least one connection to sync first');
  });

  it('a manual run imports, counts, compiles incrementally, and is recorded', async () => {
    await h.json('PUT', '/api/admin/sync/settings', { token: admin, body: settings() });
    const before = (await status()).runs.length;
    const started = await h.json('POST', '/api/admin/sync/run', { token: admin });
    expect(started).toMatchObject({ status: 202, body: { started: true } });

    const run = await finishedRun(before);
    expect(run).toMatchObject({ trigger: 'manual', changed: 1 });
    expect(run.connections[0]).toMatchObject({ listed: 3, changed: 1, unchanged: 1, failed: 1 });
    expect(run.connections[0].errors[0]).toContain('Bad: Item vanished');
    expect(run.compile.status).toBe('success');

    const compile = h.pythonCalls().filter((c) => c.command === 'main.py').at(-1) as any;
    expect(compile.args).not.toContain('--force'); // incremental
    const s = await status();
    expect(s.last_run.id).toBe(run.id);
    expect(Date.parse(s.next_run_at)).toBeGreaterThan(Date.now());
    const events = (await h.json('GET', '/api/activity?limit=50', { token: admin })).body.events;
    expect(events.some((e: any) => e.action === 'Sync run finished')).toBe(true);
  });

  it('skips the compile when it is switched off in the settings', async () => {
    await h.json('PUT', '/api/admin/sync/settings', { token: admin, body: settings({ compile_after_sync: false }) });
    const before = (await status()).runs.length;
    const compilesBefore = h.pythonCalls().filter((c) => c.command === 'main.py').length;
    await h.json('POST', '/api/admin/sync/run', { token: admin });
    const run = await finishedRun(before);
    expect(run.compile.status).toBe('not_needed');
    expect(h.pythonCalls().filter((c) => c.command === 'main.py').length).toBe(compilesBefore);
  });

  it('records a connection that cannot be listed without failing the run', async () => {
    await h.json('PUT', '/api/admin/sync/settings', { token: admin, body: settings({ connections: [{ ...CONNECTION, account_label: 'broken' }] }) });
    const before = (await status()).runs.length;
    await h.json('POST', '/api/admin/sync/run', { token: admin });
    const run = await finishedRun(before);
    expect(run.connections[0]).toMatchObject({ listed: 0, failed: 1 });
    expect(run.connections[0].errors[0]).toContain('Token expired');
    expect(run.compile.status).toBe('not_needed');
  });

  it('answers 409 to a second run while one is in progress', async () => {
    process.env.FAKE_BUILD_SLEEP_MS = '400';
    try {
      await h.json('PUT', '/api/admin/sync/settings', { token: admin, body: settings() });
      const before = (await status()).runs.length;
      expect((await h.json('POST', '/api/admin/sync/run', { token: admin })).status).toBe(202);
      const second = await h.json('POST', '/api/admin/sync/run', { token: admin });
      expect(second.status).toBe(409);
      expect(second.body.detail).toBe('A sync is already running');
      expect((await status()).running).toBe(true);
      await finishedRun(before);
    } finally {
      delete process.env.FAKE_BUILD_SLEEP_MS;
    }
  });
});
