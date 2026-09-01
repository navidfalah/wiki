const apiBase = document.querySelector('meta[name="api-base"]')?.getAttribute('content') ?? '';

function el(id: string): HTMLElement {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing #${id}`);
  return found;
}

async function apiFetch(path: string, opts?: RequestInit): Promise<any> {
  const res = await fetch(`${apiBase}${path}`, opts);
  if (!res.ok) {
    let message = await res.text();
    try {
      message = JSON.parse(message).detail ?? message;
    } catch {
      /* plain text */
    }
    throw new Error(message || `Request failed (${res.status})`);
  }
  return res.json();
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// --- Stat cards --------------------------------------------------------

async function loadStatCards() {
  try {
    const data = await apiFetch('/api/analytics');
    const m = data.metrics;
    el('stat-cards').innerHTML = `
      ${statCard('source', `${m.raw_files_processed} / ${m.raw_files_total}`, 'Raw files processed')}
      ${statCard('generated', String(m.wiki_pages_created), 'Wiki pages created')}
      ${statCard('neutral', String(m.cross_links_established), 'Cross-links')}
      ${statCard(m.dead_links ? 'warn' : 'neutral', String(m.dead_links), 'Dead links')}
    `;
  } catch {
    el('stat-cards').innerHTML = '';
  }
}

function statCard(tone: string, value: string, label: string): string {
  const tones: Record<string, string> = {
    source: 'bg-source-bg text-source',
    generated: 'bg-generated-bg text-generated',
    neutral: 'bg-gray-100 text-gray-600',
    warn: 'bg-red-50 text-red-600',
  };
  return `
    <div class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-card">
      <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tones[tone]}">●</span>
      <div>
        <p class="text-lg font-semibold leading-none text-gray-900">${escapeHtml(value)}</p>
        <p class="mt-1 text-xs text-gray-500">${escapeHtml(label)}</p>
      </div>
    </div>`;
}

// --- Build / run compiler -----------------------------------------------

function setBadge(status: 'idle' | 'running' | 'success' | 'error') {
  const labels: Record<string, string> = { idle: 'Ready', running: 'Running…', success: 'Done', error: 'Failed' };
  const tones: Record<string, string> = {
    idle: 'bg-gray-100 text-gray-600',
    running: 'bg-amber-50 text-amber-700',
    success: 'bg-emerald-50 text-emerald-700',
    error: 'bg-red-50 text-red-700',
  };
  const badge = el('build-status-badge');
  badge.className = `inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tones[status]}`;
  badge.textContent = labels[status];
}

function appendLog(line: string) {
  const log = el('build-log');
  log.textContent += `\n${line}`;
  log.scrollTop = log.scrollHeight;
}

function initBuild() {
  const runButton = el('run-build') as HTMLButtonElement;
  const clearButton = el('clear-log');
  const forceCheckbox = el('force-rebuild') as HTMLInputElement;

  clearButton.addEventListener('click', () => {
    el('build-log').textContent = 'Ready. Click "Run compiler" to start.';
  });

  runButton.addEventListener('click', async () => {
    try {
      const status = await apiFetch('/api/build/status');
      if (status.running) {
        appendLog('ERROR: A build is already running.');
        return;
      }
    } catch (err: any) {
      appendLog(`ERROR: Cannot reach API at ${apiBase}.`);
      return;
    }

    el('build-log').textContent = '';
    setBadge('running');
    runButton.disabled = true;

    const params = new URLSearchParams();
    if (forceCheckbox.checked) params.set('force', 'true');
    const source = new EventSource(`${apiBase}/api/build/stream?${params.toString()}`);

    source.onmessage = (event) => {
      let payload: any;
      try {
        payload = JSON.parse(event.data);
      } catch {
        appendLog(event.data);
        return;
      }
      if (payload.type === 'start' || payload.type === 'log') {
        appendLog(payload.message);
      } else if (payload.type === 'error') {
        appendLog(`ERROR: ${payload.message}`);
      } else if (payload.type === 'done') {
        appendLog(payload.message ?? (payload.success ? 'Finished.' : 'Failed.'));
        setBadge(payload.success ? 'success' : 'error');
        runButton.disabled = false;
        source.close();
        if (payload.success) {
          loadStatCards();
          loadFiles();
        }
      }
    };
    source.onerror = () => {
      if (source.readyState === EventSource.CLOSED) return;
      appendLog('ERROR: Lost connection to the build stream.');
      setBadge('error');
      runButton.disabled = false;
      source.close();
    };
  });
}

// --- Source folders ------------------------------------------------------

let sourcesCache: any[] = [];

async function loadSources() {
  try {
    const data = await apiFetch('/api/sources');
    sourcesCache = data.sources;
    el('sources-subtitle').innerHTML = `Always includes <code class="rounded bg-gray-100 px-1 py-0.5">${escapeHtml(
      data.raw_dir,
    )}</code>${sourcesCache.length ? ' — plus the folders below' : ''}`;
    renderSourcesGrid();
  } catch {
    el('sources-grid').innerHTML = '<p class="col-span-full text-sm text-red-600">Cannot reach the API.</p>';
  }
}

function renderSourcesGrid() {
  if (sourcesCache.length === 0) {
    el('sources-grid').innerHTML =
      '<p class="col-span-full rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400">No extra folders registered yet.</p>';
    return;
  }
  el('sources-grid').innerHTML = sourcesCache
    .map(
      (s) => `
    <div class="group relative flex flex-col gap-2 rounded-xl border ${
      s.enabled ? 'border-source-border' : 'border-gray-200 opacity-60'
    } bg-white p-4 shadow-card">
      <div class="flex items-start justify-between gap-2">
        <div class="flex min-w-0 items-center gap-2.5">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            s.enabled ? 'bg-source-bg text-source' : 'bg-gray-100 text-gray-400'
          }">📁</span>
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-gray-900">${escapeHtml(s.label)}</p>
            <p class="truncate font-mono text-xs text-gray-400" title="${escapeHtml(s.path)}">${escapeHtml(s.path)}</p>
          </div>
        </div>
        <button data-remove="${s.id}" class="rounded-lg p-1.5 text-gray-400 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100">✕</button>
      </div>
      <div class="flex items-center justify-between pt-1">
        <span class="text-xs text-gray-500">${
          s.exists ? `${s.file_count} file${s.file_count === 1 ? '' : 's'}` : '<span class="text-red-500">folder not found</span>'
        }</span>
        <button data-toggle="${s.id}" data-enabled="${s.enabled}" class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          s.enabled ? 'bg-accent' : 'bg-gray-300'
        }">
          <span class="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform" style="transform:translateX(${
            s.enabled ? '18px' : '2px'
          })"></span>
        </button>
      </div>
    </div>`,
    )
    .join('');

  el('sources-grid')
    .querySelectorAll<HTMLButtonElement>('[data-remove]')
    .forEach((btn) =>
      btn.addEventListener('click', async () => {
        await apiFetch(`/api/sources/${btn.dataset.remove}`, { method: 'DELETE' });
        await loadSources();
        await loadFiles();
      }),
    );
  el('sources-grid')
    .querySelectorAll<HTMLButtonElement>('[data-toggle]')
    .forEach((btn) =>
      btn.addEventListener('click', async () => {
        const enabled = btn.dataset.enabled !== 'true';
        await apiFetch(`/api/sources/${btn.dataset.toggle}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled }),
        });
        await loadSources();
        await loadFiles();
      }),
    );
}

function initSources() {
  const toggle = el('add-source-toggle');
  const form = el('add-source-form');
  toggle.addEventListener('click', () => {
    form.classList.toggle('hidden');
    if (!form.classList.contains('hidden')) {
      form.innerHTML = `
        <form id="add-source-real-form" class="rounded-xl border border-dashed border-source-border bg-source-bg/60 p-4">
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="text-xs font-medium text-gray-600">Folder path on disk
              <input name="path" type="text" placeholder="/home/user/Documents/exports" class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm" />
            </label>
            <label class="text-xs font-medium text-gray-600">Display name (optional)
              <input name="label" type="text" placeholder="Work emails" class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm" />
            </label>
          </div>
          <p id="add-source-error" class="mt-2 text-xs text-red-600"></p>
          <div class="mt-3 flex gap-2">
            <button type="submit" class="inline-flex items-center justify-center gap-2 rounded-lg bg-source px-4 py-2 text-sm font-medium text-white hover:bg-source-light">Add folder</button>
          </div>
        </form>`;
      form.querySelector('form')!.addEventListener('submit', async (event) => {
        event.preventDefault();
        const data = new FormData(event.target as HTMLFormElement);
        try {
          await apiFetch('/api/sources', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: data.get('path'), label: data.get('label') || null }),
          });
          form.classList.add('hidden');
          await loadSources();
          await loadFiles();
        } catch (err: any) {
          el('add-source-error').textContent = err.message;
        }
      });
    }
  });
}

// --- File explorer --------------------------------------------------------

let filesCache: any[] = [];
let foldersCache: string[] = [];
let managedFolders: string[] = [];
let currentPath = '';

function parentOf(p: string): string {
  const idx = p.lastIndexOf('/');
  return idx === -1 ? '' : p.slice(0, idx);
}
function nameOf(p: string): string {
  const idx = p.lastIndexOf('/');
  return idx === -1 ? p : p.slice(idx + 1);
}
function topSegment(p: string): string {
  return p.split('/')[0];
}
function isManaged(p: string): boolean {
  return managedFolders.includes(topSegment(p));
}

async function loadFiles() {
  try {
    const data = await apiFetch('/api/raw-files');
    filesCache = data.files;
    foldersCache = data.folders;
    managedFolders = data.managed_folders;
    renderExplorer();
  } catch {
    el('file-grid').innerHTML = '<p class="col-span-full py-8 text-center text-sm text-red-600">Cannot reach the API.</p>';
  }
}

function renderBreadcrumbs() {
  const parts = currentPath ? currentPath.split('/') : [];
  let acc = '';
  const crumbs = parts.map((part) => {
    acc = acc ? `${acc}/${part}` : part;
    const path = acc;
    return `<span class="text-gray-300">/</span><button data-path="${escapeHtml(path)}" class="crumb rounded-md px-1.5 py-0.5 hover:bg-gray-100 ${
      path === currentPath ? 'font-medium text-gray-900' : 'text-gray-500'
    }">${escapeHtml(part)}</button>`;
  });
  el('breadcrumbs').innerHTML = `<button data-path="" class="crumb flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-gray-100 ${
    currentPath === '' ? 'font-medium text-gray-900' : 'text-gray-500'
  }">🏠 data/raw</button>${crumbs.join('')}`;
  el('breadcrumbs')
    .querySelectorAll<HTMLButtonElement>('.crumb')
    .forEach((btn) => btn.addEventListener('click', () => navigateTo(btn.dataset.path ?? '')));
}

function navigateTo(path: string) {
  currentPath = path;
  renderExplorer();
}

function folderOptionsHtml(excludePath: string): string {
  const options = [{ path: '', label: 'Data root' }, ...foldersCache.filter((f) => !isManaged(f)).map((f) => ({ path: f, label: f }))];
  return options
    .map((o) => `<option value="${escapeHtml(o.path)}" ${o.path === excludePath ? 'disabled' : ''}>${escapeHtml(o.label)}</option>`)
    .join('');
}

function renderExplorer() {
  renderBreadcrumbs();
  const childFolders = foldersCache.filter((f) => parentOf(f) === currentPath);
  const childFiles = filesCache.filter((f) => parentOf(f.path) === currentPath);
  const searchValue = (el('file-search') as HTMLInputElement).value.trim().toLowerCase();
  const visibleFiles = searchValue ? childFiles.filter((f) => nameOf(f.path).toLowerCase().includes(searchValue)) : childFiles;

  const folderTiles = childFolders
    .map((path) => {
      const managed = isManaged(path);
      const itemCount =
        filesCache.filter((f) => parentOf(f.path) === path).length + foldersCache.filter((f) => parentOf(f) === path).length;
      return `
      <div class="group relative flex flex-col items-center gap-1.5 rounded-lg p-3 text-center hover:bg-gray-50">
        <button data-open="${escapeHtml(path)}" class="flex flex-col items-center gap-1.5">
          <span class="flex h-12 w-12 items-center justify-center rounded-xl ${managed ? 'bg-source-bg text-source' : 'bg-amber-50 text-amber-600'} text-xl">📁</span>
          <span class="line-clamp-2 w-24 text-xs font-medium text-gray-800">${escapeHtml(nameOf(path))}</span>
          <span class="text-[11px] text-gray-400">${itemCount} item${itemCount === 1 ? '' : 's'}</span>
        </button>
        ${
          managed
            ? ''
            : `<button data-delete-folder="${escapeHtml(path)}" class="absolute right-1 top-1 h-7 w-7 rounded-lg text-gray-400 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100">🗑</button>`
        }
      </div>`;
    })
    .join('');

  const fileTiles = visibleFiles
    .map((file) => {
      const managed = isManaged(file.path);
      const ext = file.path.includes('.') ? file.path.split('.').pop().toUpperCase() : '';
      const processed = file.status === 'Processed';
      return `
      <div class="group relative flex flex-col items-center gap-1.5 rounded-lg p-3 text-center hover:bg-gray-50">
        <button data-preview="${escapeHtml(file.path)}" class="flex flex-col items-center gap-1.5">
          <span class="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-500 text-xl">📄
            <span class="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${processed ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
          </span>
          <span class="line-clamp-2 w-24 text-xs font-medium text-gray-800">${escapeHtml(nameOf(file.path))}</span>
          ${ext ? `<span class="text-[10px] font-medium tracking-wide text-gray-400">${escapeHtml(ext)}</span>` : ''}
          ${file.source ? `<span class="inline-flex items-center rounded-full border border-source-border bg-source-bg px-1.5 py-0 text-[10px] font-medium text-source">${escapeHtml(file.source)}</span>` : ''}
        </button>
        ${
          managed
            ? ''
            : `<select data-move="${escapeHtml(file.path)}" class="absolute right-0 top-0 w-6 opacity-0 group-hover:opacity-100" title="Move to…">
                <option value="">⋯</option>
                ${folderOptionsHtml(parentOf(file.path))}
              </select>`
        }
      </div>`;
    })
    .join('');

  el('file-grid').innerHTML = folderTiles + fileTiles || '<p class="col-span-full py-10 text-center text-sm text-gray-400">This folder is empty.</p>';

  el('file-grid')
    .querySelectorAll<HTMLButtonElement>('[data-open]')
    .forEach((btn) => btn.addEventListener('click', () => navigateTo(btn.dataset.open ?? '')));
  el('file-grid')
    .querySelectorAll<HTMLButtonElement>('[data-delete-folder]')
    .forEach((btn) =>
      btn.addEventListener('click', async (event) => {
        event.stopPropagation();
        try {
          await apiFetch(`/api/raw-files/folders/${encodeURIComponent(btn.dataset.deleteFolder ?? '')}`, { method: 'DELETE' });
          await loadFiles();
        } catch (err: any) {
          alert(err.message);
        }
      }),
    );
  el('file-grid')
    .querySelectorAll<HTMLButtonElement>('[data-preview]')
    .forEach((btn) => btn.addEventListener('click', () => openPreview(btn.dataset.preview ?? '')));
  el('file-grid')
    .querySelectorAll<HTMLSelectElement>('[data-move]')
    .forEach((select) =>
      select.addEventListener('change', async () => {
        if (!select.value && select.selectedIndex === 0) return;
        try {
          await apiFetch('/api/raw-files/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: select.dataset.move, destination: select.value }),
          });
          await loadFiles();
        } catch (err: any) {
          alert(err.message);
        }
      }),
    );
}

async function openPreview(filePath: string) {
  const modal = el('preview-modal');
  modal.classList.remove('hidden');
  modal.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
      <div class="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-panel">
        <div class="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <h2 class="truncate text-sm font-medium text-gray-900">${escapeHtml(filePath)}</h2>
          <button id="close-preview" class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">✕</button>
        </div>
        <div class="flex-1 overflow-auto p-5" id="preview-body">
          <p class="py-10 text-center text-sm text-gray-500">Loading…</p>
        </div>
      </div>
    </div>`;
  el('close-preview').addEventListener('click', () => {
    modal.classList.add('hidden');
    modal.innerHTML = '';
  });

  try {
    const detail = await apiFetch(`/api/raw-files/${filePath.split('/').map(encodeURIComponent).join('/')}`);
    const page = detail.synthesized_pages?.[0];
    document.getElementById('preview-body')!.innerHTML = `
      <p class="mb-4 text-sm text-gray-500">${escapeHtml(detail.status)} · ${detail.synthesized_pages.length} wiki page(s)</p>
      <div class="grid gap-4 lg:grid-cols-2">
        <div class="overflow-hidden rounded-xl border border-source-border">
          <div class="border-b border-source-border bg-source-bg px-3 py-2 text-sm font-medium text-source">Source (raw, unedited)</div>
          <pre class="max-h-96 overflow-auto p-3 font-mono text-xs text-gray-800 whitespace-pre-wrap">${escapeHtml(detail.content)}</pre>
        </div>
        <div class="overflow-hidden rounded-xl border border-generated-border">
          <div class="border-b border-generated-border bg-generated-bg px-3 py-2 text-sm font-medium text-generated">${page ? escapeHtml(page.title) : 'Generated wiki page'}</div>
          ${page ? `<pre class="max-h-96 overflow-auto p-3 text-xs text-gray-800 whitespace-pre-wrap">${escapeHtml(page.body)}</pre>` : '<p class="p-4 text-sm text-gray-500">No wiki page yet. Run the compiler.</p>'}
        </div>
      </div>`;
  } catch (err: any) {
    document.getElementById('preview-body')!.innerHTML = `<p class="text-sm text-red-600">${escapeHtml(err.message)}</p>`;
  }
}

function initExplorer() {
  el('file-search').addEventListener('input', renderExplorer);

  const toggle = el('new-folder-toggle');
  const form = el('new-folder-form');
  toggle.addEventListener('click', () => {
    form.classList.toggle('hidden');
    if (!form.classList.contains('hidden')) {
      form.innerHTML = `
        <form id="new-folder-real-form" class="flex flex-wrap items-center gap-2">
          <input name="name" type="text" placeholder="New folder name…" class="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm" />
          <span id="new-folder-error" class="text-xs text-red-600"></span>
          <button type="submit" class="rounded-lg bg-accent px-3 py-1 text-xs font-medium text-white hover:bg-accent-dark">Create</button>
        </form>`;
      form.querySelector('form')!.addEventListener('submit', async (event) => {
        event.preventDefault();
        const data = new FormData(event.target as HTMLFormElement);
        try {
          await apiFetch('/api/raw-files/folders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parent: currentPath, name: data.get('name') }),
          });
          form.classList.add('hidden');
          await loadFiles();
        } catch (err: any) {
          document.getElementById('new-folder-error')!.textContent = err.message;
        }
      });
    }
  });
}

initBuild();
initSources();
initExplorer();
loadStatCards();
loadSources();
loadFiles();
