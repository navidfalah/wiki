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

function setBadge(status: 'idle' | 'running' | 'success' | 'error' | 'stopped') {
  const labels: Record<string, string> = {
    idle: 'Ready',
    running: 'Running…',
    success: 'Done',
    error: 'Failed',
    stopped: 'Stopped',
  };
  const tones: Record<string, string> = {
    idle: 'bg-gray-100 text-gray-600',
    running: 'bg-amber-50 text-amber-700',
    success: 'bg-emerald-50 text-emerald-700',
    error: 'bg-red-50 text-red-700',
    stopped: 'bg-gray-100 text-gray-600',
  };
  const badge = el('build-status-badge');
  badge.className = `inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tones[status]}`;
  badge.textContent = labels[status];
}

function setMessage(text: string) {
  el('build-message').textContent = text;
}

// Fixed 5-step sequence main.py always runs, in order -- see
// _step_banner() calls in compiler/main.py. Hardcoded here so the
// dashboard can show all 5 as "pending" placeholders before a run (or
// before its first step has reported in), not just the ones seen so far.
const BUILD_STEP_NAMES = ['1. Data Reading', '2. Extraction', '3. Synthesis', '4. Indexing', '5. Cross-linking'];

interface LiveStep {
  name: string;
  status: 'running' | 'success' | 'error';
  detail: string | null;
  error: string | null;
}

function stepIcon(status: string): string {
  if (status === 'success') return '✓';
  if (status === 'error') return '✕';
  if (status === 'running') return '●';
  return '';
}

function stepTone(status: string): string {
  if (status === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'error') return 'border-red-200 bg-red-50 text-red-700';
  if (status === 'running') return 'border-amber-200 bg-amber-50 text-amber-700 animate-pulse';
  return 'border-gray-200 bg-gray-50 text-gray-300';
}

function renderBuildSteps(liveSteps: LiveStep[]) {
  const byName = new Map(liveSteps.map((s) => [s.name, s]));
  el('build-steps').innerHTML = BUILD_STEP_NAMES.map((name) => {
    const step = byName.get(name);
    const status = step?.status ?? 'pending';
    return `
      <div class="flex items-center gap-2.5 rounded-lg border px-3 py-1.5 ${stepTone(status)}">
        <span class="flex h-4 w-4 shrink-0 items-center justify-center text-[10px] font-bold">${stepIcon(status)}</span>
        <span class="min-w-0 flex-1 text-xs font-medium">${escapeHtml(name.replace(/^\d+\.\s*/, ''))}</span>
        ${step?.detail ? `<span class="truncate text-[11px] opacity-80">${escapeHtml(step.detail)}</span>` : ''}
        ${step?.error ? `<span class="truncate text-[11px]">${escapeHtml(step.error)}</span>` : ''}
      </div>`;
  }).join('');
}

let buildPollTimer: number | undefined;
let currentRunId: string | null = null;

function stopBuildPolling() {
  if (buildPollTimer) {
    window.clearInterval(buildPollTimer);
    buildPollTimer = undefined;
  }
}

async function pollBuildSteps() {
  if (!currentRunId) return;
  try {
    const run = await apiFetch(`/api/pipelines/${encodeURIComponent(currentRunId)}`);
    renderBuildSteps(run.steps ?? []);
  } catch {
    /* transient -- keep the last rendered state and try again next tick */
  }
}

function startBuildPolling() {
  stopBuildPolling();
  pollBuildSteps();
  buildPollTimer = window.setInterval(pollBuildSteps, 1200);
}

// --- Sources-to-include picker --------------------------------------------

let excludedTopFolders = new Set<string>();

function topLevelFolders(): string[] {
  const tops = new Set<string>();
  for (const f of foldersCache) tops.add(f.split('/')[0]);
  for (const f of filesCache) tops.add(f.path.split('/')[0]);
  return [...tops].sort();
}

function renderSourcesPicker() {
  const tops = topLevelFolders();
  // Drop exclusions for folders that no longer exist, so the count stays honest.
  excludedTopFolders = new Set([...excludedTopFolders].filter((t) => tops.includes(t)));

  const list = el('sources-picker-list');
  if (!tops.length) {
    list.innerHTML = '<p class="text-xs text-gray-400">No folders under data/raw/ yet.</p>';
  } else {
    list.innerHTML = tops
      .map((t) => {
        const checked = !excludedTopFolders.has(t);
        const managed = managedFolders.includes(t);
        return `
        <label class="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 ${
          checked ? '' : 'opacity-50'
        }">
          <input type="checkbox" data-top-folder="${escapeHtml(t)}" ${checked ? 'checked' : ''} class="rounded border-gray-300 text-accent focus:ring-accent/30" />
          <span class="font-mono text-xs text-gray-700">${escapeHtml(t)}</span>
          ${managed ? '<span class="text-[10px] text-source">source</span>' : ''}
        </label>`;
      })
      .join('');
    list.querySelectorAll<HTMLInputElement>('[data-top-folder]').forEach((input) =>
      input.addEventListener('change', () => {
        const top = input.dataset.topFolder ?? '';
        if (input.checked) excludedTopFolders.delete(top);
        else excludedTopFolders.add(top);
        renderSourcesPicker();
      }),
    );
  }

  const total = tops.length;
  const included = total - excludedTopFolders.size;
  el('sources-picker-count').textContent = total ? `(${included}/${total})` : '';
}

function initSourcesPicker() {
  const toggle = el('sources-picker-toggle');
  const panel = el('sources-picker');
  toggle.addEventListener('click', () => panel.classList.toggle('hidden'));
}

// --- Run options (critic pass, corrections, PII redaction) ----------------

function updateRunOptionsCount() {
  const criticOn = (el('run-opt-critic-pass') as HTMLInputElement).checked;
  const correctionsOn = (el('run-opt-use-corrections') as HTMLInputElement).checked;
  const redactOn = (el('run-opt-redact-pii') as HTMLInputElement).checked;
  const count = [criticOn, correctionsOn, redactOn].filter(Boolean).length;
  el('run-options-count').textContent = count ? `(${count})` : '';
}

function initRunOptions() {
  const toggle = el('run-options-toggle');
  const panel = el('run-options');
  toggle.addEventListener('click', () => panel.classList.toggle('hidden'));

  const criticPass = el('run-opt-critic-pass') as HTMLInputElement;
  const criticSamplesLabel = el('run-opt-critic-samples-label');
  const criticRegenerateLabel = el('run-opt-critic-regenerate-label');

  const syncCriticSubOptions = () => {
    criticSamplesLabel.classList.toggle('hidden', !criticPass.checked);
    criticRegenerateLabel.classList.toggle('hidden', !criticPass.checked);
  };
  syncCriticSubOptions();

  ['run-opt-critic-pass', 'run-opt-use-corrections', 'run-opt-redact-pii'].forEach((id) =>
    el(id).addEventListener('change', () => {
      syncCriticSubOptions();
      updateRunOptionsCount();
    }),
  );
  updateRunOptionsCount();
}

function runOptionsParams(): Record<string, string> {
  const criticPass = (el('run-opt-critic-pass') as HTMLInputElement).checked;
  const criticSamples = (el('run-opt-critic-samples') as HTMLInputElement).value.trim();
  const criticRegenerate = (el('run-opt-critic-regenerate') as HTMLInputElement).checked;
  const useCorrections = (el('run-opt-use-corrections') as HTMLInputElement).checked;
  const redactPii = (el('run-opt-redact-pii') as HTMLInputElement).checked;

  const params: Record<string, string> = {};
  if (criticPass) {
    params.critic_pass = 'true';
    if (criticSamples && Number(criticSamples) > 1) params.critic_samples = criticSamples;
    if (criticRegenerate) params.critic_regenerate = 'true';
  }
  if (useCorrections) params.use_corrections = 'true';
  if (redactPii) params.redact_pii = 'true';
  return params;
}

function initBuild() {
  const runButton = el('run-build') as HTMLButtonElement;
  const stopButton = el('stop-build') as HTMLButtonElement;
  const forceCheckbox = el('force-rebuild') as HTMLInputElement;

  renderBuildSteps([]);

  stopButton.addEventListener('click', async () => {
    stopButton.disabled = true;
    try {
      const res = await fetch(`${apiBase}/api/build/stop`, { method: 'POST' });
      const data = await res.json();
      if (!data.stopped) setMessage('Nothing to stop — no build is running.');
    } catch {
      setMessage('Could not reach the API to stop the build.');
    }
  });

  runButton.addEventListener('click', async () => {
    try {
      const status = await apiFetch('/api/build/status');
      if (status.running) {
        setMessage('A build is already running.');
        return;
      }
    } catch {
      setMessage(`Cannot reach API at ${apiBase}.`);
      return;
    }

    currentRunId = null;
    renderBuildSteps([]);
    setMessage('Starting compiler pipeline…');
    setBadge('running');
    runButton.disabled = true;
    stopButton.classList.remove('hidden');
    stopButton.disabled = false;

    const params = new URLSearchParams();
    if (forceCheckbox.checked) params.set('force', 'true');
    if (excludedTopFolders.size) params.set('exclude_folders', [...excludedTopFolders].join(','));
    for (const [key, value] of Object.entries(runOptionsParams())) params.set(key, value);
    const source = new EventSource(`${apiBase}/api/build/stream?${params.toString()}`);

    source.onmessage = (event) => {
      let payload: any;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }
      if (payload.type === 'run_id') {
        currentRunId = payload.run_id;
        startBuildPolling();
      } else if (payload.type === 'error') {
        setMessage(`Error: ${payload.message}`);
      } else if (payload.type === 'done') {
        stopBuildPolling();
        pollBuildSteps(); // one last fetch -- the process has exited, so this is guaranteed to see the final step state
        setMessage(payload.message ?? (payload.success ? 'Finished.' : 'Failed.'));
        setBadge(payload.stopped ? 'stopped' : payload.success ? 'success' : 'error');
        runButton.disabled = false;
        stopButton.classList.add('hidden');
        source.close();
        if (payload.success) {
          loadStatCards();
          loadFiles();
        }
      }
    };
    source.onerror = () => {
      if (source.readyState === EventSource.CLOSED) return;
      stopBuildPolling();
      setMessage('Lost connection to the build stream.');
      setBadge('error');
      runButton.disabled = false;
      stopButton.classList.add('hidden');
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
    renderSourcesPicker();
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
            : `<div class="absolute right-0 top-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                <select data-move="${escapeHtml(file.path)}" class="w-6" title="Move to…">
                  <option value="">⋯</option>
                  ${folderOptionsHtml(parentOf(file.path))}
                </select>
                <button data-delete-file="${escapeHtml(file.path)}" class="h-6 w-6 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600" title="Delete file">🗑</button>
              </div>`
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
    .querySelectorAll<HTMLButtonElement>('[data-delete-file]')
    .forEach((btn) =>
      btn.addEventListener('click', async (event) => {
        event.stopPropagation();
        const filePath = btn.dataset.deleteFile ?? '';
        if (!confirm(`Delete "${nameOf(filePath)}"? This cannot be undone.`)) return;
        try {
          await apiFetch(`/api/raw-files/${filePath.split('/').map(encodeURIComponent).join('/')}`, { method: 'DELETE' });
          await loadFiles();
        } catch (err: any) {
          alert(err.message);
        }
      }),
    );
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
      <div class="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-panel">
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
    const rawUrl = `${apiBase}${detail.raw_url}`;

    let sourcePanel: string;
    if (detail.is_pdf) {
      sourcePanel = `<embed src="${escapeHtml(rawUrl)}" type="application/pdf" class="h-[65vh] w-full bg-gray-50" />`;
    } else if (detail.is_image) {
      sourcePanel = `<div class="flex h-[65vh] items-center justify-center bg-gray-50 p-2"><img src="${escapeHtml(
        rawUrl,
      )}" alt="${escapeHtml(filePath)}" class="max-h-full max-w-full object-contain" /></div>`;
    } else if (detail.is_text) {
      sourcePanel = `<pre class="max-h-[65vh] overflow-auto p-3 font-mono text-xs text-gray-800 whitespace-pre-wrap">${escapeHtml(detail.content ?? '')}</pre>`;
    } else {
      sourcePanel = `
        <div class="flex h-40 flex-col items-center justify-center gap-2 p-4 text-center">
          <p class="text-sm text-gray-500">No inline preview for this file type (${escapeHtml(detail.mime ?? 'unknown')}).</p>
          <a href="${escapeHtml(rawUrl)}" target="_blank" rel="noopener" class="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-dark">Open / download</a>
        </div>`;
    }

    document.getElementById('preview-body')!.innerHTML = `
      <p class="mb-4 text-sm text-gray-500">${escapeHtml(detail.status)} · ${detail.synthesized_pages.length} wiki page(s)</p>
      <div class="grid gap-4 lg:grid-cols-2">
        <div class="overflow-hidden rounded-xl border border-source-border">
          <div class="flex items-center justify-between border-b border-source-border bg-source-bg px-3 py-2 text-sm font-medium text-source">
            <span>Source (raw, unedited)</span>
            <a href="${escapeHtml(rawUrl)}" target="_blank" rel="noopener" class="text-xs font-normal text-source hover:underline">Open in new tab ↗</a>
          </div>
          ${sourcePanel}
        </div>
        <div class="overflow-hidden rounded-xl border border-generated-border">
          <div class="border-b border-generated-border bg-generated-bg px-3 py-2 text-sm font-medium text-generated">${page ? escapeHtml(page.title) : 'Generated wiki page'}</div>
          ${page ? `<pre class="max-h-[65vh] overflow-auto p-3 text-xs text-gray-800 whitespace-pre-wrap">${escapeHtml(page.body)}</pre>` : '<p class="p-4 text-sm text-gray-500">No wiki page yet. Run the compiler.</p>'}
        </div>
      </div>`;
  } catch (err: any) {
    document.getElementById('preview-body')!.innerHTML = `<p class="text-sm text-red-600">${escapeHtml(err.message)}</p>`;
  }
}

async function uploadFilesToCurrentFolder(fileList: FileList | File[]) {
  const files = Array.from(fileList);
  if (!files.length) return;
  const status = el('upload-status');
  status.classList.remove('hidden');
  status.textContent = `Uploading ${files.length} file${files.length === 1 ? '' : 's'}…`;
  const form = new FormData();
  form.set('parent', currentPath);
  files.forEach((f) => form.append('files', f));
  try {
    const res = await fetch(`${apiBase}/api/raw-files/upload`, { method: 'POST', body: form });
    if (!res.ok) {
      let message = await res.text();
      try {
        message = JSON.parse(message).detail ?? message;
      } catch {
        /* plain text */
      }
      throw new Error(message || `Upload failed (${res.status})`);
    }
    status.textContent = `Uploaded ${files.length} file${files.length === 1 ? '' : 's'}.`;
    await loadFiles();
    setTimeout(() => status.classList.add('hidden'), 2500);
  } catch (err: any) {
    status.textContent = `Upload failed: ${err.message}`;
  }
}

function initUpload() {
  const toggle = el('upload-files-toggle');
  const input = el('upload-files-input') as HTMLInputElement;
  toggle.addEventListener('click', () => input.click());
  input.addEventListener('change', () => {
    if (input.files) uploadFilesToCurrentFolder(input.files);
    input.value = '';
  });

  const dropzone = el('file-grid');
  let dragDepth = 0;
  dropzone.addEventListener('dragover', (event) => {
    event.preventDefault();
  });
  dropzone.addEventListener('dragenter', (event) => {
    event.preventDefault();
    dragDepth += 1;
    dropzone.classList.add('bg-source-bg/60', 'ring-2', 'ring-source-border');
  });
  dropzone.addEventListener('dragleave', () => {
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) dropzone.classList.remove('bg-source-bg/60', 'ring-2', 'ring-source-border');
  });
  dropzone.addEventListener('drop', (event) => {
    event.preventDefault();
    dragDepth = 0;
    dropzone.classList.remove('bg-source-bg/60', 'ring-2', 'ring-source-border');
    if (event.dataTransfer?.files?.length) uploadFilesToCurrentFolder(event.dataTransfer.files);
  });
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
initSourcesPicker();
initRunOptions();
initSources();
initExplorer();
initUpload();
loadStatCards();
loadSources();
loadFiles();
