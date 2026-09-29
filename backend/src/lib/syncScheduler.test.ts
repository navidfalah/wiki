import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { tmpRoot, SYNC_SETTINGS_FILE, SYNC_STATE_FILE } = vi.hoisted(() => {
  const fs: typeof import('node:fs') = require('node:fs');
  const os: typeof import('node:os') = require('node:os');
  const path: typeof import('node:path') = require('node:path');
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-test-'));
  return {
    tmpRoot,
    SYNC_SETTINGS_FILE: path.join(tmpRoot, 'data', 'sync_settings.json'),
    SYNC_STATE_FILE: path.join(tmpRoot, 'data', 'sync_state.json'),
  };
});

vi.mock('../paths', () => ({ DATA_ROOT: tmpRoot, PROJECT_ROOT: tmpRoot, SYNC_SETTINGS_FILE, SYNC_STATE_FILE }));
vi.mock('./activityLog', () => ({ logSystemEvent: vi.fn(), logEvent: vi.fn() }));
vi.mock('./connectorActivity', () => ({ logConnectorEvent: vi.fn() }));
vi.mock('./pythonBridge', () => ({ runCli: vi.fn(), isBuildRunning: vi.fn(), runBuildHeadless: vi.fn() }));

import { logConnectorEvent } from './connectorActivity';
import { isBuildRunning, runBuildHeadless, runCli } from './pythonBridge';
import {
  isDue,
  listSyncRuns,
  loadSyncSettings,
  nextRunAt,
  runSync,
  saveSyncSettings,
  SyncBusyError,
  SyncSettingsError,
  validateSettings,
  type SyncRun,
  type SyncSettings,
} from './syncScheduler';

const cli = vi.mocked(runCli);
const busy = vi.mocked(isBuildRunning);
const build = vi.mocked(runBuildHeadless);

const CONNECTION = { connector_id: 'gmail', account_label: 'me@example.test', query: 'label:wiki', limit: 5 };
const ON: SyncSettings = { enabled: true, interval_hours: 6, compile_after_sync: true, connections: [CONNECTION] };

function run(startedAt: string): SyncRun {
  return { id: 'r', trigger: 'schedule', started_at: startedAt, finished_at: startedAt, connections: [], changed: 0, compile: null };
}

/** Items the fake connector lists, and what importing each does. */
function fakeConnector(items: { id: string; title: string }[], results: Record<string, { changed?: boolean } | Error>) {
  cli.mockImplementation((async (command: string, input: any) => {
    if (command === 'connectors-items-list') return { items };
    if (command === 'connectors-item-import') {
      const result = results[input.item_id] ?? { changed: true };
      if (result instanceof Error) throw result;
      return { imported: true, raw_path: `connectors/gmail/${input.item_id}.txt`, ...result };
    }
    throw new Error(`unexpected ${command}`);
  }) as any);
}

beforeEach(() => {
  vi.clearAllMocks();
  fs.rmSync(path.join(tmpRoot, 'data'), { recursive: true, force: true });
  busy.mockReturnValue(false);
  build.mockResolvedValue({ success: true, stopped: false, runId: 'run-1', message: 'Build complete.' });
});
afterAll(() => fs.rmSync(tmpRoot, { recursive: true, force: true }));

describe('validateSettings', () => {
  it('accepts a good configuration and fills defaults', () => {
    expect(validateSettings({ enabled: 1, interval_hours: '12', connections: [{ connector_id: ' gmail ', account_label: 'a' }] })).toEqual({
      enabled: true,
      interval_hours: 12,
      compile_after_sync: true,
      connections: [{ connector_id: 'gmail', account_label: 'a', query: '', limit: 20 }],
    });
  });

  it.each([
    [null, 'Settings must be an object'],
    [{ interval_hours: 0, connections: [] }, "'interval_hours' must be a whole number between 1 and 720"],
    [{ interval_hours: 721, connections: [] }, "'interval_hours' must be a whole number between 1 and 720"],
    [{ interval_hours: 1.5, connections: [] }, "'interval_hours' must be a whole number between 1 and 720"],
    [{ interval_hours: 24 }, "'connections' must be a list"],
    [{ interval_hours: 24, connections: [{ connector_id: 'gmail' }] }, 'Every connection needs a connector and an account'],
    [
      { interval_hours: 24, connections: [{ connector_id: 'g', account_label: 'a' }, { connector_id: 'g', account_label: 'a' }] },
      'Connection listed twice: g / a',
    ],
    [{ interval_hours: 24, connections: [{ connector_id: 'g', account_label: 'a', limit: 0 }] }, "'limit' must be between 1 and 200"],
    [{ interval_hours: 24, connections: [{ connector_id: 'g', account_label: 'a', limit: 201 }] }, "'limit' must be between 1 and 200"],
    [{ interval_hours: 24, connections: [{ connector_id: 'g', account_label: 'a', query: 'x'.repeat(201) }] }, 'A sync query is limited to 200 characters'],
    [{ interval_hours: 24, connections: Array.from({ length: 21 }, (_, i) => ({ connector_id: 'g', account_label: `a${i}` })) }, 'At most 20 connections can be synced'],
  ])('rejects %j', (input, message) => {
    expect(() => validateSettings(input)).toThrow(new SyncSettingsError(message));
  });

  it('compile_after_sync is on unless explicitly false', () => {
    expect(validateSettings({ interval_hours: 1, connections: [], compile_after_sync: false }).compile_after_sync).toBe(false);
  });
});

describe('settings storage', () => {
  it('defaults to off, and a corrupt file stays off instead of half-running', () => {
    expect(loadSyncSettings()).toMatchObject({ enabled: false, connections: [] });
    fs.mkdirSync(path.dirname(SYNC_SETTINGS_FILE), { recursive: true });
    fs.writeFileSync(SYNC_SETTINGS_FILE, '{ not json');
    expect(loadSyncSettings().enabled).toBe(false);
    fs.writeFileSync(SYNC_SETTINGS_FILE, JSON.stringify({ enabled: true, interval_hours: 0, connections: [CONNECTION] }));
    expect(loadSyncSettings().enabled).toBe(false);
  });

  it('round-trips saved settings', () => {
    saveSyncSettings(ON);
    expect(loadSyncSettings()).toEqual(ON);
  });
});

describe('schedule', () => {
  const NOW = new Date('2026-09-29T12:00:00Z');

  it('has no next run when off or with nothing to sync', () => {
    expect(nextRunAt({ ...ON, enabled: false }, [], NOW)).toBeNull();
    expect(nextRunAt({ ...ON, connections: [] }, [], NOW)).toBeNull();
  });

  it('is due at once with no history, then one interval after the last start', () => {
    expect(nextRunAt(ON, [], NOW)).toBe(NOW.toISOString());
    expect(isDue(ON, [], NOW)).toBe(true);
    expect(nextRunAt(ON, [run('2026-09-29T08:00:00Z')], NOW)).toBe('2026-09-29T14:00:00.000Z');
    expect(isDue(ON, [run('2026-09-29T08:00:00Z')], NOW)).toBe(false);
    expect(isDue(ON, [run('2026-09-29T06:00:00Z')], NOW)).toBe(true);
  });

  it('never hammers a failing connector: the interval counts from the last attempt, not the last success', () => {
    const failed: SyncRun = { ...run('2026-09-29T11:50:00Z'), connections: [{ connector_id: 'gmail', account_label: 'a', listed: 0, changed: 0, unchanged: 0, failed: 1, errors: ['boom'] }] };
    expect(isDue(ON, [failed], NOW)).toBe(false);
  });
});

describe('runSync', () => {
  beforeEach(() => saveSyncSettings(ON));

  it('imports, counts new/unchanged/failed per connection, and compiles incrementally with the saved pipeline settings', async () => {
    fakeConnector(
      [
        { id: 'a', title: 'New' },
        { id: 'b', title: 'Seen' },
        { id: 'c', title: 'Broken' },
      ],
      { b: { changed: false }, c: new Error('quota exceeded') },
    );

    const result = await runSync('manual', 'alice');

    expect(result.connections).toEqual([
      { connector_id: 'gmail', account_label: 'me@example.test', listed: 3, changed: 1, unchanged: 1, failed: 1, errors: ['Broken: quota exceeded'] },
    ]);
    expect(result.changed).toBe(1);
    expect(result.compile).toEqual({ status: 'success', run_id: 'run-1' });
    expect(cli).toHaveBeenCalledWith('connectors-items-list', { connector_id: 'gmail', account_label: 'me@example.test', query: 'label:wiki', limit: 5 });
    expect(build).toHaveBeenCalledOnce();
    expect(build.mock.calls[0][0]).toMatchObject({ force: false, redactPii: true, excludeFolders: [] });
    expect(vi.mocked(logConnectorEvent).mock.calls[0][0]).toMatchObject({ username: 'alice', action: 'import', success: false });
    expect(listSyncRuns()[0]).toMatchObject({ id: result.id, trigger: 'manual', changed: 1 });
  });

  it('does not compile when nothing is new or changed', async () => {
    fakeConnector([{ id: 'a', title: 'Seen' }], { a: { changed: false } });
    const result = await runSync('schedule');
    expect(result.compile).toEqual({ status: 'not_needed', reason: 'Nothing new or changed.' });
    expect(build).not.toHaveBeenCalled();
  });

  it('skips the compile when it is switched off', async () => {
    saveSyncSettings({ ...ON, compile_after_sync: false });
    fakeConnector([{ id: 'a', title: 'New' }], {});
    const result = await runSync('schedule');
    expect(result.compile?.status).toBe('not_needed');
    expect(build).not.toHaveBeenCalled();
  });

  it('never waits behind a build someone started', async () => {
    busy.mockReturnValue(true);
    fakeConnector([{ id: 'a', title: 'New' }], {});
    const result = await runSync('schedule');
    expect(result.compile?.status).toBe('busy');
    expect(build).not.toHaveBeenCalled();
  });

  it('records a failed compile with its reason', async () => {
    build.mockResolvedValue({ success: false, stopped: false, runId: 'run-2', message: 'Build failed (exit 1).' });
    fakeConnector([{ id: 'a', title: 'New' }], {});
    expect((await runSync('schedule')).compile).toEqual({ status: 'failed', run_id: 'run-2', reason: 'Build failed (exit 1).' });
  });

  it('a connection that cannot be listed is recorded and the others still sync', async () => {
    saveSyncSettings({ ...ON, connections: [{ ...CONNECTION, account_label: 'broken' }, { ...CONNECTION, connector_id: 'imap', account_label: 'ok' }] });
    cli.mockImplementation((async (command: string, input: any) => {
      if (command === 'connectors-items-list') {
        if (input.account_label === 'broken') throw new Error('Token expired');
        return { items: [{ id: 'm1', title: 'Mail' }] };
      }
      return { imported: true, raw_path: 'connectors/imap/m1.txt', changed: true };
    }) as any);

    const result = await runSync('schedule');

    expect(result.connections[0]).toMatchObject({ account_label: 'broken', listed: 0, failed: 1, errors: ['Could not list items: Token expired'] });
    expect(result.connections[1]).toMatchObject({ connector_id: 'imap', changed: 1, failed: 0 });
    expect(result.compile?.status).toBe('success');
  });

  it('runs one sync at a time, and releases the lock afterwards even on failure', async () => {
    let release: () => void = () => {};
    cli.mockImplementation((() => new Promise((resolve) => (release = () => resolve({ items: [] })))) as any);
    const first = runSync('manual');
    await expect(runSync('manual')).rejects.toBeInstanceOf(SyncBusyError);
    release();
    await first;

    build.mockRejectedValue(new Error('spawn failed'));
    fakeConnector([{ id: 'a', title: 'New' }], {});
    await expect(runSync('manual')).rejects.toThrow('spawn failed');
    fakeConnector([], {});
    await expect(runSync('manual')).resolves.toBeDefined(); // the lock was released
  });

  it('keeps only the newest 20 runs, newest first', async () => {
    fakeConnector([], {});
    for (let i = 0; i < 22; i++) await runSync('schedule');
    const runs = listSyncRuns();
    expect(runs).toHaveLength(20);
    expect(Date.parse(runs[0].started_at)).toBeGreaterThanOrEqual(Date.parse(runs[19].started_at));
  });
});
