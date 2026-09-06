const apiBase = document.querySelector('meta[name="api-base"]')?.getAttribute('content') ?? '';

// Matches docker/postgres/init.sql + the POSTGRES_* defaults in
// docker-compose.yml / .env.example -- lets someone try the whole flow
// against the seeded sample database with one click, no typing required.
const SAMPLE_VALUES = {
  account_label: 'sample',
  host: 'localhost',
  port: '5432',
  dbname: 'aurora_kb',
  user: 'wiki_reader',
  schema: 'public',
  password: 'aurora_sample_pw',
};

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

interface ConnectorEntry {
  id: string;
  connected_accounts: string[];
}

interface TableItem {
  id: string;
  title: string;
  snippet: string;
  metadata: { schema?: string; columns?: string[]; row_count?: number };
}

async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

document.getElementById('use-sample-values-btn')?.addEventListener('click', () => {
  const form = document.getElementById('connect-form') as HTMLFormElement;
  for (const [name, value] of Object.entries(SAMPLE_VALUES)) {
    const field = form.elements.namedItem(name) as HTMLInputElement | null;
    if (field) field.value = value;
  }
  (window as any).showToast?.('Filled in the sample database\'s connection details.', 'success');
});

document.getElementById('connect-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const errorEl = document.getElementById('connect-error')!;
  errorEl.classList.add('hidden');
  const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
  submitBtn.disabled = true;
  try {
    await api('/api/connectors/postgres/connect', {
      method: 'POST',
      body: JSON.stringify({
        account_label: (form.elements.namedItem('account_label') as HTMLInputElement).value.trim(),
        host: (form.elements.namedItem('host') as HTMLInputElement).value.trim(),
        port: Number((form.elements.namedItem('port') as HTMLInputElement).value) || 5432,
        dbname: (form.elements.namedItem('dbname') as HTMLInputElement).value.trim(),
        user: (form.elements.namedItem('user') as HTMLInputElement).value.trim(),
        schema: (form.elements.namedItem('schema') as HTMLInputElement).value.trim() || 'public',
        password: (form.elements.namedItem('password') as HTMLInputElement).value,
      }),
    });
    (window as any).showToast?.('Connected. Browse its tables below.', 'success');
    (form.elements.namedItem('password') as HTMLInputElement).value = '';
    loadAccounts();
  } catch (err: any) {
    errorEl.textContent = err.message || 'Failed to connect.';
    errorEl.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
  }
});

function tableRow(accountLabel: string, item: TableItem): string {
  return `<label class="flex items-start gap-2 rounded-lg border border-gray-100 p-2 hover:bg-gray-50" data-table-row data-item-id="${escapeHtml(item.id)}" data-item-title="${escapeHtml(item.title)}">
    <input type="checkbox" class="table-checkbox mt-0.5" />
    <span class="min-w-0">
      <span class="block truncate text-xs font-medium text-gray-900">${escapeHtml(item.title)}</span>
      <span class="block truncate text-xs text-gray-500">${escapeHtml(item.snippet)}${item.metadata?.columns ? ` — ${escapeHtml(item.metadata.columns.join(', '))}` : ''}</span>
    </span>
  </label>`;
}

function accountCard(accountLabel: string): string {
  return `<div class="database-account rounded-xl border border-gray-200 bg-white p-4 shadow-card" data-account-label="${escapeHtml(accountLabel)}">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h3 class="text-sm font-semibold text-gray-900">${escapeHtml(accountLabel)}</h3>
      <div class="flex items-center gap-2">
        <button type="button" class="browse-tables-btn rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">Browse tables</button>
        <button type="button" class="disconnect-btn rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Disconnect</button>
      </div>
    </div>
    <div class="tables-panel mt-3 hidden"></div>
  </div>`;
}

async function loadAccounts() {
  const list = document.getElementById('accounts-list')!;
  try {
    const data = await api<{ connectors: ConnectorEntry[] }>('/api/connectors');
    const entry = data.connectors.find((c) => c.id === 'postgres');
    const accounts = entry?.connected_accounts ?? [];
    list.innerHTML = accounts.length
      ? accounts.map(accountCard).join('')
      : '<p class="text-sm text-gray-400">No databases connected yet -- fill in the form above to connect one.</p>';
  } catch (err: any) {
    list.innerHTML = `<p class="text-sm text-red-600">Cannot reach API at ${escapeHtml(apiBase)}: ${escapeHtml(err.message || '')}</p>`;
  }
}

document.getElementById('accounts-list')?.addEventListener('click', async (event) => {
  const target = event.target as HTMLElement;

  const disconnectBtn = target.closest('.disconnect-btn') as HTMLButtonElement | null;
  if (disconnectBtn) {
    const card = disconnectBtn.closest('.database-account') as HTMLElement;
    const accountLabel = card.dataset.accountLabel!;
    disconnectBtn.disabled = true;
    try {
      await api(`/api/connectors/postgres/accounts/${encodeURIComponent(accountLabel)}`, { method: 'DELETE' });
      (window as any).showToast?.(`Disconnected ${accountLabel}.`, 'success');
      loadAccounts();
    } catch (err: any) {
      (window as any).showToast?.(err.message || 'Failed to disconnect.', 'error');
      disconnectBtn.disabled = false;
    }
    return;
  }

  const browseBtn = target.closest('.browse-tables-btn') as HTMLButtonElement | null;
  if (browseBtn) {
    const card = browseBtn.closest('.database-account') as HTMLElement;
    const accountLabel = card.dataset.accountLabel!;
    const panel = card.querySelector('.tables-panel') as HTMLElement;
    const opening = panel.classList.contains('hidden');
    if (!opening) {
      panel.classList.add('hidden');
      return;
    }
    panel.classList.remove('hidden');
    panel.innerHTML = '<p class="text-xs text-gray-400">Loading tables…</p>';
    try {
      const data = await api<{ items: TableItem[] }>('/api/connectors/postgres/items', {
        method: 'POST',
        body: JSON.stringify({ account_label: accountLabel, limit: 50 }),
      });
      panel.innerHTML = data.items.length
        ? `<div class="tables-results flex flex-col gap-1.5">${data.items.map((i) => tableRow(accountLabel, i)).join('')}</div>
           <div class="mt-3 flex items-center gap-2">
             <button type="button" class="import-selected-btn rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800">Import selected into knowledge base</button>
             <span class="import-status text-xs text-gray-500"></span>
           </div>`
        : '<p class="text-xs text-gray-400">No tables found in this schema.</p>';
    } catch (err: any) {
      panel.innerHTML = `<p class="text-xs text-red-600">${escapeHtml(err.message || 'Failed to list tables.')}</p>`;
    }
    return;
  }

  const importBtn = target.closest('.import-selected-btn') as HTMLButtonElement | null;
  if (importBtn) {
    const card = importBtn.closest('.database-account') as HTMLElement;
    const accountLabel = card.dataset.accountLabel!;
    const panel = importBtn.closest('.tables-panel') as HTMLElement;
    const statusEl = panel.querySelector('.import-status') as HTMLElement;
    const rows = Array.from(panel.querySelectorAll('[data-table-row]')) as HTMLElement[];
    const selected = rows.filter((row) => (row.querySelector('.table-checkbox') as HTMLInputElement).checked);
    if (!selected.length) {
      (window as any).showToast?.('Select at least one table to import.', 'error');
      return;
    }
    importBtn.disabled = true;
    const importedPaths: string[] = [];
    for (let i = 0; i < selected.length; i++) {
      const row = selected[i];
      statusEl.textContent = `Importing ${i + 1} of ${selected.length}…`;
      try {
        const result = await api<{ raw_path: string }>('/api/connectors/postgres/items/import', {
          method: 'POST',
          body: JSON.stringify({
            account_label: accountLabel,
            item_id: row.dataset.itemId,
            item_title: row.dataset.itemTitle,
          }),
        });
        importedPaths.push(result.raw_path);
      } catch (err: any) {
        (window as any).showToast?.(`Failed to import ${row.dataset.itemTitle}: ${err.message || ''}`, 'error');
      }
    }
    importBtn.disabled = false;
    statusEl.textContent = importedPaths.length
      ? `Imported ${importedPaths.length} table(s). Run a compile from Pipelines/Dashboard to turn them into wiki pages.`
      : 'Nothing was imported.';
    if (importedPaths.length) (window as any).showToast?.(`Imported ${importedPaths.length} table(s) into the knowledge base.`, 'success');
  }
});

loadAccounts();
