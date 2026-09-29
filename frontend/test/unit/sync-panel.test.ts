import { describe, expect, it, vi } from 'vitest';
import { dictionaries } from '../../src/i18n';

async function load(lang: 'en' | 'de' = 'en') {
  vi.resetModules();
  document.documentElement.lang = lang;
  document.body.innerHTML = `<script type="application/json" id="i18n-data">${JSON.stringify(dictionaries[lang])}</script>`;
  return import('../../src/client/lib/syncPanel');
}

const NOW = Date.parse('2026-09-29T12:00:00Z');
const HOUR = 3600_000;

type Mod = Awaited<ReturnType<typeof load>>;

function status(over: Partial<import('../../src/client/lib/syncPanel').SyncStatus> = {}): import('../../src/client/lib/syncPanel').SyncStatus {
  return {
    settings: { enabled: true, interval_hours: 6, compile_after_sync: true, connections: [{ connector_id: 'gmail', account_label: 'a@x.test', query: '', limit: 20 }] },
    running: false,
    running_since: null,
    last_run: null,
    next_run_at: new Date(NOW + 3 * HOUR).toISOString(),
    runs: [],
    ...over,
  };
}

function run(over: Record<string, unknown> = {}) {
  return {
    id: 'r1',
    trigger: 'schedule' as const,
    started_at: new Date(NOW - 2 * HOUR).toISOString(),
    finished_at: new Date(NOW - 2 * HOUR + 60_000).toISOString(),
    connections: [{ connector_id: 'gmail', account_label: 'a@x.test', listed: 4, changed: 2, unchanged: 2, failed: 0, errors: [] as string[] }],
    changed: 2,
    compile: { status: 'success' as const, run_id: 'x' },
    ...over,
  };
}

function dom(html: string): HTMLElement {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div;
}

describe('syncStatusLine', () => {
  it('describes off, running, scheduled and due states', async () => {
    const m = await load();
    expect(m.syncStatusLine(status({ settings: { ...status().settings, enabled: false } }), NOW)).toBe('Automatic sync is off.');
    expect(m.syncStatusLine(status({ settings: { ...status().settings, connections: [] } }), NOW)).toBe('Automatic sync is off.');
    expect(m.syncStatusLine(status({ running: true }), NOW)).toBe('A sync is running…');
    expect(m.syncStatusLine(status(), NOW)).toBe('Every 6 h. Next sync in 3 hours.');
    expect(m.syncStatusLine(status({ next_run_at: new Date(NOW - 1000).toISOString() }), NOW)).toContain('at the next check');
  });

  it('speaks German', async () => {
    const m = await load('de');
    expect(m.syncStatusLine(status(), NOW)).toBe('Alle 6 Std. Nächster Abgleich in 3 Stunden.');
  });
});

describe('accountsFromCatalog', () => {
  it('flattens connected accounts and ignores connectors without any', async () => {
    const m = await load();
    expect(
      m.accountsFromCatalog([
        { id: 'gmail', display_name: 'Gmail', connected_accounts: ['a@x.test', 'b@x.test'] },
        { id: 'drive', display_name: 'Drive', connected_accounts: [] },
        { id: 'imap', display_name: 'IMAP' },
      ]),
    ).toEqual([
      { connector_id: 'gmail', display_name: 'Gmail', account_label: 'a@x.test' },
      { connector_id: 'gmail', display_name: 'Gmail', account_label: 'b@x.test' },
    ]);
    expect(m.accountsFromCatalog(null)).toEqual([]);
  });
});

describe('connections form', () => {
  const available = [
    { connector_id: 'gmail', display_name: 'Gmail', account_label: 'a@x.test' },
    { connector_id: 'gmail', display_name: 'Gmail', account_label: 'b@x.test' },
  ];

  function form(m: Mod, configured: import('../../src/client/lib/syncPanel').SyncConnection[], extra = '') {
    const f = document.createElement('form');
    f.innerHTML = `<input name="enabled" type="checkbox" checked /><input name="interval_hours" value="12" /><input name="compile_after_sync" type="checkbox" />
      <div id="rows">${m.renderSyncConnections(available, configured)}</div>${extra}`;
    return f;
  }

  it('checks the saved accounts and fills in their query and limit', async () => {
    const m = await load();
    const html = dom(m.renderSyncConnections(available, [{ connector_id: 'gmail', account_label: 'b@x.test', query: 'label:wiki', limit: 5 }]));
    const rows = html.querySelectorAll<HTMLElement>('.sync-connection');
    expect(rows).toHaveLength(2);
    expect(rows[0].querySelector<HTMLInputElement>('[data-field="selected"]')!.checked).toBe(false);
    expect(rows[1].querySelector<HTMLInputElement>('[data-field="selected"]')!.checked).toBe(true);
    expect(rows[1].querySelector<HTMLInputElement>('[data-field="query"]')!.value).toBe('label:wiki');
    expect(rows[1].querySelector<HTMLInputElement>('[data-field="limit"]')!.value).toBe('5');
    expect(rows[0].querySelector<HTMLInputElement>('[data-field="limit"]')!.value).toBe('20');
  });

  it('keeps a saved account that is no longer connected, flagged, so saving does not drop it silently', async () => {
    const m = await load();
    const html = dom(m.renderSyncConnections(available, [{ connector_id: 'imap', account_label: 'old@x.test', query: '', limit: 10 }]));
    const gone = html.querySelector<HTMLElement>('[data-connector="imap"]')!;
    expect(gone.textContent).toContain('not connected any more');
    expect(gone.querySelector<HTMLInputElement>('[data-field="selected"]')!.checked).toBe(true);
  });

  it('says so when there are no accounts at all', async () => {
    const m = await load();
    expect(dom(m.renderSyncConnections([], [])).textContent).toContain('No connected accounts yet');
  });

  it('reads the form back: only checked accounts, trimmed query, sane limit', async () => {
    const m = await load();
    const f = form(m, [{ connector_id: 'gmail', account_label: 'a@x.test', query: ' q ', limit: 7 }]);
    f.querySelectorAll<HTMLInputElement>('[data-field="selected"]')[1].checked = true;
    f.querySelectorAll<HTMLInputElement>('[data-field="limit"]')[1].value = 'abc';
    expect(m.readSyncForm(f)).toEqual({
      enabled: true,
      interval_hours: 12,
      compile_after_sync: false,
      connections: [
        { connector_id: 'gmail', account_label: 'a@x.test', query: 'q', limit: 7 },
        { connector_id: 'gmail', account_label: 'b@x.test', query: '', limit: 20 },
      ],
    });
  });

  it('escapes account labels and queries in markup and attributes', async () => {
    const m = await load();
    const evil = '"><img src=x onerror=alert(1)>';
    const html = m.renderSyncConnections([{ connector_id: 'gmail', display_name: 'Gmail', account_label: evil }], [{ connector_id: 'gmail', account_label: evil, query: evil, limit: 1 }]);
    expect(html).not.toContain('<img');
    const row = dom(html).querySelector<HTMLElement>('.sync-connection')!;
    expect(row.dataset.account).toBe(evil);
    expect(row.querySelector<HTMLInputElement>('[data-field="query"]')!.value).toBe(evil);
  });
});

describe('renderSyncRuns', () => {
  it('summarises each run with its counts, trigger and compile outcome', async () => {
    const m = await load();
    const html = dom(m.renderSyncRuns([run()], NOW));
    expect(html.textContent).toContain('2 hours ago');
    expect(html.textContent).toContain('scheduled');
    expect(html.textContent).toContain('2 new or changed, 2 unchanged, 0 failed');
    expect(html.textContent).toContain('compiled');
    expect(html.querySelector('[data-run-id="r1"]')).not.toBeNull();
  });

  it('shows failures, errors and a failed compile in warning colours', async () => {
    const m = await load();
    const html = dom(
      m.renderSyncRuns(
        [
          run({
            connections: [{ connector_id: 'gmail', account_label: 'a@x.test', listed: 1, changed: 0, unchanged: 0, failed: 1, errors: ['Could not list items: Token expired'] }],
            changed: 0,
            compile: { status: 'failed', reason: 'Build failed (exit 1).' },
            trigger: 'manual',
          }),
        ],
        NOW,
      ),
    );
    expect(html.textContent).toContain('0 new or changed, 0 unchanged, 1 failed');
    expect(html.textContent).toContain('compile failed (Build failed (exit 1).)');
    expect(html.textContent).toContain('a@x.test: Could not list items: Token expired');
    expect(html.textContent).toContain('manual');
    expect(html.innerHTML).toContain('text-amber-700');
  });

  it('shows a run in progress and the empty state, in German too', async () => {
    const m = await load();
    expect(dom(m.renderSyncRuns([run({ compile: null })], NOW)).textContent).toContain('running…');
    expect(dom(m.renderSyncRuns([], NOW)).textContent).toBe('No syncs yet.');
    const de = await load('de');
    expect(dom(de.renderSyncRuns([], NOW)).textContent).toBe('Noch keine Abgleiche.');
    expect(dom(de.renderSyncRuns([run({ trigger: 'manual' })], NOW)).textContent).toContain('manuell');
  });

  it('escapes error text', async () => {
    const m = await load();
    const html = m.renderSyncRuns([run({ connections: [{ connector_id: 'g', account_label: 'a', listed: 1, changed: 0, unchanged: 0, failed: 1, errors: ['<b>x</b>'] }] })], NOW);
    expect(html).not.toContain('<b>x</b>');
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
  });
});
