/**
 * Scheduled connector sync + incremental compile.
 *
 * Connectors (Gmail, Drive, IMAP, Postgres, SQLite) only imported when
 * someone clicked. This keeps the wiki current on its own: every
 * `interval_hours`, for each configured connection it lists the newest
 * items, imports them into data/raw/connectors/, and -- if any file is new
 * or changed -- runs an incremental compile with the saved pipeline
 * settings, so only those files cost LLM calls.
 *
 * - Off by default. Configured in data/sync_settings.json (admin panel).
 * - "Unchanged" matters: compiler/connectors_service.import_item leaves an
 *   unchanged file untouched, so a sync with nothing new does no compile.
 * - A failing connection is recorded and skipped, never fatal to the
 *   others. A failed run is not retried before the next interval (a broken
 *   connector isn't hammered every few minutes); "Run now" retries at once.
 * - One sync at a time, and a compile never waits behind a build someone
 *   started: it is skipped ("busy") and the changed files are picked up by
 *   the next compile, manual or scheduled, since compiles are incremental.
 * - Runs are kept in data/sync_state.json (last 20) for the admin panel.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import { SYNC_SETTINGS_FILE, SYNC_STATE_FILE } from '../paths';
import { logSystemEvent } from './activityLog';
import { atomicWriteJson } from './atomicWrite';
import { logConnectorEvent } from './connectorActivity';
import { loadPipelineSettings } from './pipelineSettings';
import { isBuildRunning, runBuildHeadless, runCli } from './pythonBridge';

export const MIN_INTERVAL_HOURS = 1;
export const MAX_INTERVAL_HOURS = 24 * 30;
export const MAX_CONNECTIONS = 20;
export const MAX_ITEMS_PER_CONNECTION = 200;
const MAX_RUNS_KEPT = 20;
const CHECK_EVERY_MS = 10 * 60 * 1000;

export interface SyncConnection {
  connector_id: string;
  account_label: string;
  /** Passed to the connector's search (e.g. a Gmail query); empty = newest items. */
  query: string;
  limit: number;
}

export interface SyncSettings {
  enabled: boolean;
  interval_hours: number;
  compile_after_sync: boolean;
  connections: SyncConnection[];
}

export interface ConnectionResult {
  connector_id: string;
  account_label: string;
  listed: number;
  changed: number;
  unchanged: number;
  failed: number;
  errors: string[];
}

export type CompileOutcome =
  | { status: 'not_needed'; reason: string }
  | { status: 'busy'; reason: string }
  | { status: 'success'; run_id: string | null }
  | { status: 'failed'; run_id: string | null; reason: string };

export interface SyncRun {
  id: string;
  trigger: 'schedule' | 'manual';
  started_at: string;
  finished_at: string | null;
  connections: ConnectionResult[];
  changed: number;
  compile: CompileOutcome | null;
}

export class SyncSettingsError extends Error {}
export class SyncBusyError extends Error {}

const DEFAULT_SETTINGS: SyncSettings = { enabled: false, interval_hours: 24, compile_after_sync: true, connections: [] };

function readJson(file: string): any | null {
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return null;
  }
}

export function validateSettings(input: any): SyncSettings {
  if (!input || typeof input !== 'object') throw new SyncSettingsError('Settings must be an object');
  const interval = Number(input.interval_hours);
  if (!Number.isInteger(interval) || interval < MIN_INTERVAL_HOURS || interval > MAX_INTERVAL_HOURS) {
    throw new SyncSettingsError(`'interval_hours' must be a whole number between ${MIN_INTERVAL_HOURS} and ${MAX_INTERVAL_HOURS}`);
  }
  if (!Array.isArray(input.connections)) throw new SyncSettingsError("'connections' must be a list");
  if (input.connections.length > MAX_CONNECTIONS) throw new SyncSettingsError(`At most ${MAX_CONNECTIONS} connections can be synced`);
  const seen = new Set<string>();
  const connections = input.connections.map((raw: any) => {
    const connectorId = String(raw?.connector_id ?? '').trim();
    const accountLabel = String(raw?.account_label ?? '').trim();
    if (!connectorId || !accountLabel) throw new SyncSettingsError('Every connection needs a connector and an account');
    const key = `${connectorId}\u0000${accountLabel}`;
    if (seen.has(key)) throw new SyncSettingsError(`Connection listed twice: ${connectorId} / ${accountLabel}`);
    seen.add(key);
    const limit = raw?.limit === undefined || raw?.limit === '' ? 20 : Number(raw.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_ITEMS_PER_CONNECTION) {
      throw new SyncSettingsError(`'limit' must be between 1 and ${MAX_ITEMS_PER_CONNECTION}`);
    }
    const query = String(raw?.query ?? '').trim();
    if (query.length > 200) throw new SyncSettingsError('A sync query is limited to 200 characters');
    return { connector_id: connectorId, account_label: accountLabel, query, limit };
  });
  return { enabled: Boolean(input.enabled), interval_hours: interval, compile_after_sync: input.compile_after_sync !== false, connections };
}

export function loadSyncSettings(): SyncSettings {
  const stored = readJson(SYNC_SETTINGS_FILE);
  if (!stored) return { ...DEFAULT_SETTINGS, connections: [] };
  try {
    return validateSettings(stored);
  } catch {
    return { ...DEFAULT_SETTINGS, connections: [] }; // a hand-edited bad file: stay off rather than half-run
  }
}

export function saveSyncSettings(input: unknown): SyncSettings {
  const settings = validateSettings(input);
  atomicWriteJson(SYNC_SETTINGS_FILE, { version: 1, ...settings });
  return settings;
}

export function listSyncRuns(): SyncRun[] {
  const stored = readJson(SYNC_STATE_FILE);
  return Array.isArray(stored?.runs) ? stored.runs : [];
}

function saveRuns(runs: SyncRun[]): void {
  atomicWriteJson(SYNC_STATE_FILE, { version: 1, runs: runs.slice(0, MAX_RUNS_KEPT) });
}

let running = false;
let runningSince: string | null = null;

export interface SyncStatus {
  settings: SyncSettings;
  running: boolean;
  running_since: string | null;
  last_run: SyncRun | null;
  next_run_at: string | null;
  runs: SyncRun[];
}

/** When the scheduler will next sync, or null if it is off. With no run on
 * record it is due at the next check. */
export function nextRunAt(settings: SyncSettings, runs: SyncRun[], now: Date = new Date()): string | null {
  if (!settings.enabled || !settings.connections.length) return null;
  const last = runs[0];
  if (!last) return now.toISOString();
  return new Date(Date.parse(last.started_at) + settings.interval_hours * 3600 * 1000).toISOString();
}

export function syncStatus(now: Date = new Date()): SyncStatus {
  const settings = loadSyncSettings();
  const runs = listSyncRuns();
  return { settings, running, running_since: runningSince, last_run: runs[0] ?? null, next_run_at: nextRunAt(settings, runs, now), runs };
}

async function syncConnection(connection: SyncConnection, username: string): Promise<ConnectionResult> {
  const result: ConnectionResult = { connector_id: connection.connector_id, account_label: connection.account_label, listed: 0, changed: 0, unchanged: 0, failed: 0, errors: [] };
  const started = Date.now();
  let items: { id: string; title?: string }[] = [];
  try {
    const listed = await runCli<{ items: { id: string; title?: string }[] }>('connectors-items-list', {
      connector_id: connection.connector_id,
      account_label: connection.account_label,
      query: connection.query,
      limit: connection.limit,
    });
    items = listed.items ?? [];
    result.listed = items.length;
  } catch (err: any) {
    result.failed += 1;
    result.errors.push(`Could not list items: ${err.message}`);
  }
  for (const item of items) {
    try {
      const imported = await runCli<{ raw_path: string; changed?: boolean }>('connectors-item-import', {
        connector_id: connection.connector_id,
        account_label: connection.account_label,
        item_id: item.id,
        item_title: item.title ?? '',
      });
      if (imported.changed === false) result.unchanged += 1;
      else result.changed += 1;
    } catch (err: any) {
      result.failed += 1;
      if (result.errors.length < 5) result.errors.push(`${item.title ?? item.id}: ${err.message}`);
    }
  }
  logConnectorEvent({
    username,
    connectorId: connection.connector_id,
    accountLabel: connection.account_label,
    action: 'import',
    detail: `Scheduled sync: ${result.changed} new or changed, ${result.unchanged} unchanged, ${result.failed} failed of ${result.listed}`,
    success: result.failed === 0,
    durationMs: Date.now() - started,
    error: result.errors[0] ?? null,
  });
  return result;
}

/**
 * Runs one sync now. Throws SyncBusyError if one is already running.
 * `username` is who asked ("scheduler" for the timer).
 */
export async function runSync(trigger: 'schedule' | 'manual', username = 'scheduler'): Promise<SyncRun> {
  if (running) throw new SyncBusyError('A sync is already running');
  running = true;
  runningSince = new Date().toISOString();
  const settings = loadSyncSettings();
  const run: SyncRun = { id: crypto.randomUUID(), trigger, started_at: runningSince, finished_at: null, connections: [], changed: 0, compile: null };
  try {
    for (const connection of settings.connections) {
      const result = await syncConnection(connection, username);
      run.connections.push(result);
      run.changed += result.changed;
    }

    if (run.changed === 0) {
      run.compile = { status: 'not_needed', reason: 'Nothing new or changed.' };
    } else if (!settings.compile_after_sync) {
      run.compile = { status: 'not_needed', reason: 'Compile after sync is off; the next compile picks the files up.' };
    } else if (isBuildRunning()) {
      run.compile = { status: 'busy', reason: 'A build was already running; the next compile picks the files up.' };
    } else {
      const pipeline = loadPipelineSettings();
      const build = await runBuildHeadless({
        force: false,
        excludeFolders: pipeline.excluded_folders,
        criticPass: pipeline.critic_pass,
        criticSamples: pipeline.critic_samples,
        criticRegenerate: pipeline.critic_regenerate,
        useCorrections: pipeline.use_corrections,
        redactPii: pipeline.redact_pii,
        webSearch: pipeline.web_search,
      });
      run.compile = build.success ? { status: 'success', run_id: build.runId } : { status: 'failed', run_id: build.runId, reason: build.message };
    }
  } finally {
    run.finished_at = new Date().toISOString();
    running = false;
    runningSince = null;
    saveRuns([run, ...listSyncRuns()]);
    const failed = run.connections.reduce((n, c) => n + c.failed, 0);
    const compile = run.compile ? `, compile ${run.compile.status}` : '';
    logSystemEvent(
      trigger === 'schedule' ? 'Scheduled sync finished' : 'Sync run finished',
      `${run.changed} new or changed${failed ? `, ${failed} failed` : ''}${compile}`,
      failed || run.compile?.status === 'failed' ? 'warn' : 'info',
    );
  }
  return run;
}

/** True when the scheduler should sync now. Exported for tests. */
export function isDue(settings: SyncSettings, runs: SyncRun[], now: Date = new Date()): boolean {
  const next = nextRunAt(settings, runs, now);
  return next !== null && Date.parse(next) <= now.getTime();
}

export function startSyncScheduler(): void {
  const tick = () => {
    if (running) return;
    if (!isDue(loadSyncSettings(), listSyncRuns())) return;
    runSync('schedule').catch((err) => logSystemEvent('Scheduled sync failed', err.message, 'error'));
  };
  setTimeout(tick, 2 * 60 * 1000).unref(); // first check two minutes after boot, off the startup path
  setInterval(tick, CHECK_EVERY_MS).unref();
}
