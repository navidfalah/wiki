const apiBase = document.querySelector('meta[name="api-base"]')?.getAttribute('content') ?? '';

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

interface ConnectorEntry {
  id: string;
  display_name: string;
  requires_oauth: boolean;
  configured: boolean;
  secret_key_set: boolean;
  connected_accounts: string[];
}

interface ConnectorItem {
  id: string;
  title: string;
  snippet: string;
  source_url: string;
  metadata: Record<string, unknown>;
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

function imapConnectForm(connectorId: string): string {
  return `<form class="imap-connect-form mt-3 flex flex-wrap items-end gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3" data-connector-id="${connectorId}">
    <label class="flex flex-col gap-1 text-xs font-medium text-gray-600">Account (email) <input name="account_label" type="text" required placeholder="me@example.com" class="rounded-lg border border-gray-300 px-2 py-1.5 text-sm" /></label>
    <label class="flex flex-col gap-1 text-xs font-medium text-gray-600">IMAP host <input name="host" type="text" required placeholder="imap.example.com" class="rounded-lg border border-gray-300 px-2 py-1.5 text-sm" /></label>
    <label class="flex w-20 flex-col gap-1 text-xs font-medium text-gray-600">Port <input name="port" type="number" value="993" class="rounded-lg border border-gray-300 px-2 py-1.5 text-sm" /></label>
    <label class="flex flex-col gap-1 text-xs font-medium text-gray-600">Mailbox <input name="mailbox" type="text" value="INBOX" class="rounded-lg border border-gray-300 px-2 py-1.5 text-sm" /></label>
    <label class="flex flex-col gap-1 text-xs font-medium text-gray-600">App password <input name="password" type="password" required class="rounded-lg border border-gray-300 px-2 py-1.5 text-sm" /></label>
    <button type="submit" class="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800">Connect</button>
  </form>`;
}

function accountRow(connectorId: string, accountLabel: string): string {
  return `<div class="connector-account rounded-lg border border-gray-100 bg-white p-3" data-connector-id="${connectorId}" data-account-label="${escapeHtml(accountLabel)}">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <span class="text-sm font-medium text-gray-900">${escapeHtml(accountLabel)}</span>
      <div class="flex items-center gap-2">
        <button type="button" class="browse-items-btn rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">Browse items</button>
        <button type="button" class="disconnect-btn rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Disconnect</button>
      </div>
    </div>
    <div class="items-panel mt-3 hidden"></div>
  </div>`;
}

function connectorCard(entry: ConnectorEntry): string {
  const hint = entry.requires_oauth && !entry.configured
    ? `<p class="mt-2 text-xs text-amber-700">Not configured -- set the ${entry.id === 'gmail' ? 'GMAIL_CLIENT_ID/GMAIL_CLIENT_SECRET/GMAIL_REDIRECT_URI' : 'GDRIVE_CLIENT_ID/GDRIVE_CLIENT_SECRET/GDRIVE_REDIRECT_URI'} env vars first.</p>`
    : '';
  const connectAction = entry.requires_oauth
    ? `<button type="button" class="oauth-connect-btn rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40" data-connector-id="${entry.id}" ${entry.configured && entry.secret_key_set ? '' : 'disabled'}>Connect new account</button>`
    : '';

  return `<div class="connector-card rounded-xl border border-gray-200 bg-white p-4 shadow-card" data-connector-id="${entry.id}">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="text-sm font-semibold text-gray-900">${escapeHtml(entry.display_name)}</h2>
        <p class="text-xs text-gray-500">${entry.requires_oauth ? 'OAuth2, read-only' : 'IMAP, app password'}</p>
      </div>
      ${connectAction}
    </div>
    ${hint}
    ${!entry.requires_oauth ? imapConnectForm(entry.id) : ''}
    <div class="accounts-list mt-3 flex flex-col gap-2">
      ${entry.connected_accounts.length ? entry.connected_accounts.map((a) => accountRow(entry.id, a)).join('') : '<p class="text-xs text-gray-400">No accounts connected yet.</p>'}
    </div>
  </div>`;
}

async function load() {
  const list = document.getElementById('connectors-list')!;
  try {
    const data = await api<{ connectors: ConnectorEntry[] }>('/api/connectors');
    const secretKeySet = data.connectors[0]?.secret_key_set ?? true;
    const warning = secretKeySet
      ? ''
      : `<div class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <code class="rounded bg-white px-1 py-0.5">CONNECTOR_SECRET_KEY</code> is not set on the server, so credentials can't be
          stored yet. Generate one with <code class="rounded bg-white px-1 py-0.5">python -c "from connectors.credential_store import generate_secret_key; print(generate_secret_key())"</code>
          and set it in <code class="rounded bg-white px-1 py-0.5">.env</code>.
        </div>`;
    list.innerHTML = warning + data.connectors.map(connectorCard).join('');
  } catch (err: any) {
    list.innerHTML = `<p class="text-sm text-red-600">Cannot reach API at ${escapeHtml(apiBase)}: ${escapeHtml(err.message || '')}</p>`;
  }
}

function itemRow(connectorId: string, accountLabel: string, item: ConnectorItem): string {
  return `<div class="connector-item flex items-start justify-between gap-3 rounded-lg border border-gray-100 p-2" data-item-id="${escapeHtml(item.id)}" data-item-title="${escapeHtml(item.title)}">
    <div class="min-w-0">
      <p class="truncate text-xs font-medium text-gray-900">${escapeHtml(item.title || '(untitled)')}</p>
      <p class="truncate text-xs text-gray-500">${escapeHtml(item.snippet || '')}</p>
    </div>
    <button type="button" class="import-item-btn shrink-0 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">Import</button>
  </div>`;
}

document.getElementById('connectors-list')?.addEventListener('click', async (event) => {
  const target = event.target as HTMLElement;

  const oauthBtn = target.closest('.oauth-connect-btn') as HTMLButtonElement | null;
  if (oauthBtn) {
    oauthBtn.disabled = true;
    try {
      const result = await api<{ authorization_url: string }>(`/api/connectors/${oauthBtn.dataset.connectorId}/oauth/start`, { method: 'POST' });
      window.open(result.authorization_url, '_blank', 'noopener');
      (window as any).showToast?.('Complete the sign-in in the new tab, then come back and refresh.', 'success');
    } catch (err: any) {
      (window as any).showToast?.(err.message || 'Failed to start connection.', 'error');
    } finally {
      oauthBtn.disabled = false;
    }
    return;
  }

  const disconnectBtn = target.closest('.disconnect-btn') as HTMLButtonElement | null;
  if (disconnectBtn) {
    const row = disconnectBtn.closest('.connector-account') as HTMLElement;
    const { connectorId, accountLabel } = row.dataset as { connectorId: string; accountLabel: string };
    disconnectBtn.disabled = true;
    try {
      await api(`/api/connectors/${connectorId}/accounts/${encodeURIComponent(accountLabel)}`, { method: 'DELETE' });
      (window as any).showToast?.(`Disconnected ${accountLabel}.`, 'success');
      load();
    } catch (err: any) {
      (window as any).showToast?.(err.message || 'Failed to disconnect.', 'error');
      disconnectBtn.disabled = false;
    }
    return;
  }

  const browseBtn = target.closest('.browse-items-btn') as HTMLButtonElement | null;
  if (browseBtn) {
    const row = browseBtn.closest('.connector-account') as HTMLElement;
    const panel = row.querySelector('.items-panel') as HTMLElement;
    const { connectorId, accountLabel } = row.dataset as { connectorId: string; accountLabel: string };
    const opening = panel.classList.contains('hidden');
    if (!opening) {
      panel.classList.add('hidden');
      return;
    }
    panel.classList.remove('hidden');
    panel.innerHTML = `<div class="flex items-center gap-2">
      <input type="text" class="items-query flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs" placeholder="Search (optional)" />
      <button type="button" class="items-search-btn rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-gray-800">Search</button>
    </div>
    <div class="items-results mt-2 flex flex-col gap-1.5"></div>`;

    const runSearch = async () => {
      const query = (panel.querySelector('.items-query') as HTMLInputElement).value;
      const results = panel.querySelector('.items-results') as HTMLElement;
      results.innerHTML = '<p class="text-xs text-gray-400">Loading…</p>';
      try {
        const data = await api<{ items: ConnectorItem[] }>(`/api/connectors/${connectorId}/items`, {
          method: 'POST',
          body: JSON.stringify({ account_label: accountLabel, query, limit: 20 }),
        });
        results.innerHTML = data.items.length
          ? data.items.map((i) => itemRow(connectorId, accountLabel, i)).join('')
          : '<p class="text-xs text-gray-400">No items found.</p>';
      } catch (err: any) {
        results.innerHTML = `<p class="text-xs text-red-600">${escapeHtml(err.message || 'Failed to list items.')}</p>`;
      }
    };
    panel.querySelector('.items-search-btn')?.addEventListener('click', runSearch);
    runSearch();
    return;
  }

  const importBtn = target.closest('.import-item-btn') as HTMLButtonElement | null;
  if (importBtn) {
    const itemEl = importBtn.closest('.connector-item') as HTMLElement;
    const accountEl = importBtn.closest('.connector-account') as HTMLElement;
    const { connectorId, accountLabel } = accountEl.dataset as { connectorId: string; accountLabel: string };
    const { itemId, itemTitle } = itemEl.dataset as { itemId: string; itemTitle: string };
    importBtn.disabled = true;
    importBtn.textContent = 'Importing…';
    try {
      const result = await api<{ raw_path: string }>(`/api/connectors/${connectorId}/items/import`, {
        method: 'POST',
        body: JSON.stringify({ account_label: accountLabel, item_id: itemId, item_title: itemTitle }),
      });
      (window as any).showToast?.(`Imported to ${result.raw_path}.`, 'success');
      importBtn.textContent = 'Imported ✓';
    } catch (err: any) {
      (window as any).showToast?.(err.message || 'Failed to import.', 'error');
      importBtn.disabled = false;
      importBtn.textContent = 'Import';
    }
  }
});

document.getElementById('connectors-list')?.addEventListener('submit', async (event) => {
  const form = event.target as HTMLFormElement;
  if (!form.classList.contains('imap-connect-form')) return;
  event.preventDefault();

  const connectorId = form.dataset.connectorId!;
  const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
  submitBtn.disabled = true;
  try {
    await api('/api/connectors/imap/connect', {
      method: 'POST',
      body: JSON.stringify({
        account_label: (form.elements.namedItem('account_label') as HTMLInputElement).value.trim(),
        host: (form.elements.namedItem('host') as HTMLInputElement).value.trim(),
        port: Number((form.elements.namedItem('port') as HTMLInputElement).value) || 993,
        mailbox: (form.elements.namedItem('mailbox') as HTMLInputElement).value.trim() || 'INBOX',
        password: (form.elements.namedItem('password') as HTMLInputElement).value,
      }),
    });
    (window as any).showToast?.('Connected.', 'success');
    load();
  } catch (err: any) {
    (window as any).showToast?.(err.message || 'Failed to connect.', 'error');
    submitBtn.disabled = false;
  }
});

load();
