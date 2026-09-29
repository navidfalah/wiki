/**
 * Rendering and form reading for the admin panel's "Scheduled sync" section
 * (views/users.ejs, client/users.ts). No fetching here, so it can be unit
 * tested (test/unit/sync-panel.test.ts).
 */
import { esc, relativeTime } from './dashboardHome';
import { formatDateTime, t, th } from './i18n';

export interface SyncConnection {
  connector_id: string;
  account_label: string;
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

export interface SyncRun {
  id: string;
  trigger: 'schedule' | 'manual';
  started_at: string;
  finished_at: string | null;
  connections: ConnectionResult[];
  changed: number;
  compile: { status: 'not_needed' | 'busy' | 'success' | 'failed'; reason?: string; run_id?: string | null } | null;
}

export interface SyncStatus {
  settings: SyncSettings;
  running: boolean;
  running_since: string | null;
  last_run: SyncRun | null;
  next_run_at: string | null;
  runs: SyncRun[];
}

/** One connected account from GET /api/connectors, flattened. */
export interface AvailableAccount {
  connector_id: string;
  display_name: string;
  account_label: string;
}

export function accountsFromCatalog(
  catalog: { id: string; display_name: string; connected_accounts?: string[] }[] | null | undefined,
): AvailableAccount[] {
  return (catalog ?? []).flatMap((c) => (c.connected_accounts ?? []).map((label) => ({ connector_id: c.id, display_name: c.display_name, account_label: label })));
}

const key = (connectorId: string, accountLabel: string) => `${connectorId}\u0000${accountLabel}`;

export function syncStatusLine(status: SyncStatus, now: number = Date.now()): string {
  if (status.running) return t('users.sync.statusRunning');
  const { settings } = status;
  if (!settings.enabled || !settings.connections.length) return t('users.sync.statusOff');
  const next = status.next_run_at ? Date.parse(status.next_run_at) : NaN;
  if (Number.isNaN(next) || next <= now) return t('users.sync.statusDueNow', { hours: settings.interval_hours });
  return t('users.sync.statusOn', { hours: settings.interval_hours, when: relativeTime(status.next_run_at, now) });
}

/**
 * One row per connected account, checked when it is in the saved settings.
 * A saved connection whose account no longer exists is kept (checked, and
 * flagged) rather than silently dropped by the next save.
 */
export function renderSyncConnections(available: AvailableAccount[], configured: SyncConnection[]): string {
  const saved = new Map(configured.map((c) => [key(c.connector_id, c.account_label), c]));
  const rows = available.map((a) => ({ ...a, note: '', saved: saved.get(key(a.connector_id, a.account_label)) }));
  const known = new Set(available.map((a) => key(a.connector_id, a.account_label)));
  for (const c of configured) {
    if (!known.has(key(c.connector_id, c.account_label))) {
      rows.push({ connector_id: c.connector_id, display_name: c.connector_id, account_label: c.account_label, note: t('users.sync.notConnected'), saved: c });
    }
  }
  if (!rows.length) return `<p class="text-sm text-gray-500">${th('users.sync.noAccounts')}</p>`;
  return rows
    .map((row) => {
      const id = `sync-${esc(row.connector_id)}-${esc(row.account_label)}`.replace(/[^A-Za-z0-9_-]/g, '_');
      return `<div class="sync-connection flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 px-3 py-2" data-connector="${esc(row.connector_id)}" data-account="${esc(row.account_label)}">
  <label class="flex min-w-[14rem] flex-1 items-center gap-2 text-sm text-gray-900" for="${id}">
    <input id="${id}" type="checkbox" data-field="selected" class="h-4 w-4 rounded border-gray-300"${row.saved ? ' checked' : ''} />
    <span class="min-w-0 truncate"><span class="font-medium">${esc(row.display_name)}</span> · ${esc(row.account_label)}${row.note ? ` <span class="text-xs text-amber-700">(${esc(row.note)})</span>` : ''}</span>
  </label>
  <input type="text" data-field="query" maxlength="200" value="${esc(row.saved?.query ?? '')}" placeholder="${th('users.sync.query')}" aria-label="${th('users.sync.query')}" class="min-w-0 flex-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm" />
  <input type="number" data-field="limit" min="1" max="200" step="1" value="${row.saved?.limit ?? 20}" title="${th('users.sync.limit')}" aria-label="${th('users.sync.limit')}" class="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
</div>`;
    })
    .join('');
}

/** Reads the form back into settings: only checked accounts become connections. */
export function readSyncForm(form: HTMLElement): SyncSettings {
  const input = (name: string) => form.querySelector<HTMLInputElement>(`[name="${name}"]`);
  const connections: SyncConnection[] = [];
  form.querySelectorAll<HTMLElement>('.sync-connection').forEach((row) => {
    if (!row.querySelector<HTMLInputElement>('[data-field="selected"]')?.checked) return;
    const limit = Number(row.querySelector<HTMLInputElement>('[data-field="limit"]')?.value);
    connections.push({
      connector_id: row.dataset.connector ?? '',
      account_label: row.dataset.account ?? '',
      query: (row.querySelector<HTMLInputElement>('[data-field="query"]')?.value ?? '').trim(),
      limit: Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 20,
    });
  });
  return {
    enabled: Boolean(input('enabled')?.checked),
    interval_hours: Number(input('interval_hours')?.value),
    compile_after_sync: Boolean(input('compile_after_sync')?.checked),
    connections,
  };
}

export function renderSyncRuns(runs: SyncRun[] | null, now: number = Date.now()): string {
  if (!runs?.length) return `<p class="p-5 text-sm text-gray-500">${th('users.sync.noRuns')}</p>`;
  return `<ul class="divide-y divide-gray-100">${runs
    .map((run) => {
      const failed = run.connections.reduce((n, c) => n + c.failed, 0);
      const unchanged = run.connections.reduce((n, c) => n + c.unchanged, 0);
      const compile = run.compile ? th(`users.sync.compile.${run.compile.status}`) : th('users.sync.running');
      const errors = run.connections.flatMap((c) => c.errors.map((e) => `${c.account_label}: ${e}`)).slice(0, 3);
      const compileFailed = run.compile?.status === 'failed';
      return `<li class="px-5 py-3 text-sm" data-run-id="${esc(run.id)}">
  <p class="text-gray-900"><span title="${esc(formatDateTime(run.started_at))}">${esc(relativeTime(run.started_at, now))}</span>
    <span class="text-xs text-gray-500">· ${th(`users.sync.trigger.${run.trigger}`)}</span></p>
  <p class="mt-0.5 text-xs ${failed || compileFailed ? 'text-amber-700' : 'text-gray-500'}">${th('users.sync.summary', { changed: run.changed, unchanged, failed })} · ${compile}${compileFailed && run.compile?.reason ? ` (${esc(run.compile.reason)})` : ''}</p>
  ${errors.map((e) => `<p class="mt-0.5 truncate text-xs text-red-600" title="${esc(e)}">${esc(e)}</p>`).join('')}
</li>`;
    })
    .join('')}</ul>`;
}
