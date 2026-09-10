const apiBase = document.querySelector('meta[name="api-base"]')?.getAttribute('content') ?? '';

function escapeHtml(text: string | null | undefined): string {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

/** Shared JSON fetch helper -- used by the Database and Connectors tabs
 * (both originally had their own identical copy of this). */
async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

// --- Tabs -------------------------------------------------------------

document.querySelectorAll<HTMLButtonElement>('.resource-tab').forEach((btn) => {
  btn.addEventListener('click', () => activateTab(btn.dataset.tab!));
});

// The Connectors tab has an inline link back to the Database tab (for
// Postgres/SQLite, which the Database tab handles with a guided form and
// table browser -- Connectors only covers Gmail/Drive/IMAP).
document.querySelectorAll<HTMLButtonElement>('[data-tab-link]').forEach((btn) => {
  btn.addEventListener('click', () => activateTab(btn.dataset.tabLink!));
});

function activateTab(tab: string) {
  document.querySelectorAll<HTMLButtonElement>('.resource-tab').forEach((b) => {
    const active = b.dataset.tab === tab;
    b.classList.toggle('border-accent', active);
    b.classList.toggle('text-accent', active);
    b.classList.toggle('border-transparent', !active);
    b.classList.toggle('text-gray-500', !active);
  });
  document.querySelectorAll<HTMLElement>('.resource-panel').forEach((panel) => {
    panel.classList.toggle('hidden', panel.id !== `tab-panel-${tab}`);
  });
}

// Lands on a specific tab when linked in from elsewhere (e.g. the OAuth
// callback page sends the user back to /resources?tab=connectors).
const requestedTab = new URLSearchParams(window.location.search).get('tab');
if (requestedTab && document.getElementById(`tab-panel-${requestedTab}`)) {
  activateTab(requestedTab);
}

/* ======================================================================
   Files -- data/raw/ file manager
   ====================================================================== */

// Custom drag MIME type for internal file-tile → folder-tile moves, kept
// distinct from the browser's native "Files" type so a drop handler can
// tell an in-app drag apart from a drag-in from the user's OS/file
// manager without inspecting file contents.
const INTERNAL_DRAG_TYPE = 'application/x-wiki-raw-file-path';

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

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp']);
const AUDIO_EXTS = new Set(['mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac']);
const VIDEO_EXTS = new Set(['mp4', 'mov', 'avi', 'mkv', 'm4v']);
const ARCHIVE_EXTS = new Set(['zip', 'rar', '7z', 'tar', 'gz', 'tgz']);
const SPREADSHEET_EXTS = new Set(['xlsx', 'csv', 'tsv', 'ods']);

function iconForFile(filePath: string): string {
  const ext = filePath.includes('.') ? filePath.split('.').pop()!.toLowerCase() : '';
  if (ext === 'pdf') return '📕';
  if (IMAGE_EXTS.has(ext)) return '🖼';
  if (AUDIO_EXTS.has(ext)) return '🎵';
  if (VIDEO_EXTS.has(ext)) return '🎬';
  if (ARCHIVE_EXTS.has(ext)) return '🗜';
  if (SPREADSHEET_EXTS.has(ext)) return '📊';
  if (ext === 'eml') return '✉️';
  return '📄';
}

interface RawFile {
  path: string;
  status: string;
  size_bytes: number;
  source: string | null;
}

interface ResourceEntry {
  source: string;
  source_type: string;
  trust: string;
  citation_count: number;
  citing_pages: { doc_path: string; title: string }[];
}

let filesCache: RawFile[] = [];
let foldersCache: string[] = [];
let managedFolders: string[] = [];
let resourceBySource = new Map<string, ResourceEntry>();
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
    const [filesData, resourcesData] = await Promise.all([apiFetch('/api/raw-files'), apiFetch('/api/resources')]);
    filesCache = filesData.files;
    foldersCache = filesData.folders;
    managedFolders = filesData.managed_folders;
    resourceBySource = new Map(resourcesData.resources.map((r: ResourceEntry) => [r.source, r]));
    renderExplorer();
  } catch {
    el('resource-grid').innerHTML = `<p class="col-span-full py-8 text-center text-sm text-red-600">Cannot reach API at ${escapeHtml(apiBase)}.</p>`;
  }
}

function renderBreadcrumbs() {
  const parts = currentPath ? currentPath.split('/') : [];
  let acc = '';
  const crumbs = parts.map((part) => {
    acc = acc ? `${acc}/${part}` : part;
    const path = acc;
    return `<span class="text-gray-300">/</span><button data-path="${escapeHtml(path)}" data-drop-target="${escapeHtml(path)}" class="crumb rounded-md px-1.5 py-0.5 hover:bg-gray-100 ${
      path === currentPath ? 'font-medium text-gray-900' : 'text-gray-500'
    }">${escapeHtml(part)}</button>`;
  });
  el('breadcrumbs').innerHTML = `<button data-path="" data-drop-target="" class="crumb flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-gray-100 ${
    currentPath === '' ? 'font-medium text-gray-900' : 'text-gray-500'
  }">🏠 data/raw</button>${crumbs.join('')}`;
  el('breadcrumbs')
    .querySelectorAll<HTMLButtonElement>('.crumb')
    .forEach((btn) => {
      btn.addEventListener('click', () => navigateTo(btn.dataset.path ?? ''));
      wireDropTarget(btn, btn.dataset.dropTarget ?? '');
    });
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

async function moveFileTo(sourcePath: string, destination: string) {
  try {
    await apiFetch('/api/raw-files/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: sourcePath, destination }),
    });
    (window as any).showToast?.(`Moved ${nameOf(sourcePath)}.`);
    await loadFiles();
  } catch (err: any) {
    (window as any).showToast?.(err.message || 'Could not move file.', 'error');
  }
}

/** Wires an element as both a move-target (internal drag) and an upload-target (OS file drag) for `folderPath`. */
function wireDropTarget(node: HTMLElement, folderPath: string) {
  if (isManaged(folderPath)) return; // managed/source folders are edited via the Dashboard's Source folders panel
  node.addEventListener('dragover', (event) => {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = event.dataTransfer.types.includes('Files') ? 'copy' : 'move';
  });
  node.addEventListener('dragenter', (event) => {
    event.preventDefault();
    node.classList.add('bg-source-bg/60', 'ring-2', 'ring-source-border');
  });
  node.addEventListener('dragleave', () => {
    node.classList.remove('bg-source-bg/60', 'ring-2', 'ring-source-border');
  });
  node.addEventListener('drop', (event) => {
    event.preventDefault();
    event.stopPropagation();
    node.classList.remove('bg-source-bg/60', 'ring-2', 'ring-source-border');
    const dt = event.dataTransfer;
    if (!dt) return;
    if (dt.files?.length) {
      // A drag-in from the user's OS/file manager -- upload straight into this folder.
      uploadFilesToFolder(folderPath, dt.files);
      return;
    }
    const sourcePath = dt.getData(INTERNAL_DRAG_TYPE) || dt.getData('text/plain');
    if (sourcePath && parentOf(sourcePath) !== folderPath) moveFileTo(sourcePath, folderPath);
  });
}

function renderExplorer() {
  renderBreadcrumbs();
  const childFolders = foldersCache.filter((f) => parentOf(f) === currentPath);
  const childFiles = filesCache.filter((f) => parentOf(f.path) === currentPath);
  const searchValue = (el('resource-search') as HTMLInputElement).value.trim().toLowerCase();
  const matches = (f: RawFile) => {
    if (!searchValue) return true;
    if (nameOf(f.path).toLowerCase().includes(searchValue)) return true;
    const resource = resourceBySource.get(f.path);
    return resource?.citing_pages.some((p) => p.title.toLowerCase().includes(searchValue)) ?? false;
  };
  const visibleFiles = childFiles.filter(matches);

  const folderTiles = childFolders
    .map((path) => {
      const managed = isManaged(path);
      const itemCount =
        filesCache.filter((f) => parentOf(f.path) === path).length + foldersCache.filter((f) => parentOf(f) === path).length;
      return `
      <div class="group relative flex flex-col items-center gap-1.5 rounded-lg p-3 text-center hover:bg-gray-50" data-folder-tile="${escapeHtml(path)}">
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
      const ext = file.path.includes('.') ? file.path.split('.').pop()!.toUpperCase() : '';
      const processed = file.status === 'Processed';
      const resource = resourceBySource.get(file.path);
      return `
      <div class="group relative flex flex-col items-center gap-1.5 rounded-lg p-3 text-center hover:bg-gray-50" data-file-tile="${escapeHtml(file.path)}" draggable="true">
        <button data-preview="${escapeHtml(file.path)}" class="flex flex-col items-center gap-1.5">
          <span class="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-500 text-xl">${iconForFile(file.path)}
            <span class="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${processed ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
          </span>
          <span class="line-clamp-2 w-24 text-xs font-medium text-gray-800">${escapeHtml(nameOf(file.path))}</span>
          ${ext ? `<span class="text-[10px] font-medium tracking-wide text-gray-400">${escapeHtml(ext)}</span>` : ''}
          ${
            resource
              ? `<span class="inline-flex items-center rounded-full border border-generated-border bg-generated-bg px-1.5 py-0 text-[10px] font-medium text-generated" title="Cited by ${resource.citation_count} page(s): ${escapeHtml(resource.citing_pages.map((p) => p.title).join(', '))}">${escapeHtml(resource.trust)} · ${resource.citation_count} cite${resource.citation_count === 1 ? '' : 's'}</span>`
              : ''
          }
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

  el('resource-grid').innerHTML =
    folderTiles + fileTiles || '<p class="col-span-full py-10 text-center text-sm text-gray-400">This folder is empty. Drag files in to upload.</p>';

  el('resource-grid')
    .querySelectorAll<HTMLButtonElement>('[data-open]')
    .forEach((btn) => btn.addEventListener('click', () => navigateTo(btn.dataset.open ?? '')));
  el('resource-grid')
    .querySelectorAll<HTMLElement>('[data-folder-tile]')
    .forEach((tile) => wireDropTarget(tile, tile.dataset.folderTile ?? ''));
  el('resource-grid')
    .querySelectorAll<HTMLElement>('[data-file-tile]')
    .forEach((tile) => {
      const filePath = tile.dataset.fileTile ?? '';
      if (isManaged(filePath)) return;
      tile.addEventListener('dragstart', (event) => {
        if (!event.dataTransfer) return;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData(INTERNAL_DRAG_TYPE, filePath);
        event.dataTransfer.setData('text/plain', filePath);
        tile.classList.add('opacity-40');
      });
      tile.addEventListener('dragend', () => tile.classList.remove('opacity-40'));
    });
  el('resource-grid')
    .querySelectorAll<HTMLButtonElement>('[data-delete-folder]')
    .forEach((btn) =>
      btn.addEventListener('click', async (event) => {
        event.stopPropagation();
        try {
          await apiFetch(`/api/raw-files/folders/${encodeURIComponent(btn.dataset.deleteFolder ?? '')}`, { method: 'DELETE' });
          await loadFiles();
        } catch (err: any) {
          (window as any).showToast?.(err.message, 'error');
        }
      }),
    );
  el('resource-grid')
    .querySelectorAll<HTMLButtonElement>('[data-preview]')
    .forEach((btn) => btn.addEventListener('click', () => openPreview(btn.dataset.preview ?? '')));
  el('resource-grid')
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
          (window as any).showToast?.(err.message, 'error');
        }
      }),
    );
  el('resource-grid')
    .querySelectorAll<HTMLSelectElement>('[data-move]')
    .forEach((select) =>
      select.addEventListener('change', async () => {
        if (!select.value && select.selectedIndex === 0) return;
        await moveFileTo(select.dataset.move ?? '', select.value);
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
    const resource = resourceBySource.get(filePath);

    let sourcePanel: string;
    if (detail.is_pdf) {
      sourcePanel = `<embed src="${escapeHtml(rawUrl)}" type="application/pdf" class="h-[65vh] w-full bg-gray-50" />`;
    } else if (detail.is_image) {
      sourcePanel = `<div class="flex h-[65vh] items-center justify-center bg-gray-50 p-2"><img src="${escapeHtml(
        rawUrl,
      )}" alt="${escapeHtml(filePath)}" class="max-h-full max-w-full object-contain" /></div>`;
    } else if (detail.is_audio) {
      sourcePanel = `<div class="flex h-40 items-center justify-center bg-gray-50 p-4"><audio controls src="${escapeHtml(
        rawUrl,
      )}" class="w-full max-w-md"></audio></div>`;
    } else if (detail.is_text) {
      sourcePanel = `<pre class="max-h-[65vh] overflow-auto p-3 font-mono text-xs text-gray-800 whitespace-pre-wrap">${escapeHtml(detail.content ?? '')}</pre>`;
    } else {
      sourcePanel = `
        <div class="flex h-40 flex-col items-center justify-center gap-2 p-4 text-center">
          <p class="text-sm text-gray-500">No inline preview for this file type (${escapeHtml(detail.mime ?? 'unknown')}).</p>
          <a href="${escapeHtml(rawUrl)}" target="_blank" rel="noopener" class="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-dark">Open / download</a>
        </div>`;
    }

    const citedHtml = resource
      ? `<p class="mb-3 rounded-lg border border-generated-border bg-generated-bg px-3 py-2 text-xs text-generated">
          Cited as <strong>${escapeHtml(resource.source_type)}</strong> · trust <strong>${escapeHtml(resource.trust)}</strong> ·
          by ${resource.citing_pages.map((p) => escapeHtml(p.title)).join(', ')}
        </p>`
      : '';

    document.getElementById('preview-body')!.innerHTML = `
      <p class="mb-2 text-sm text-gray-500">${escapeHtml(detail.status)} · ${detail.synthesized_pages.length} wiki page(s)</p>
      ${citedHtml}
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

async function uploadFilesToFolder(folder: string, fileList: FileList | File[]) {
  const files = Array.from(fileList);
  if (!files.length) return;
  const status = el('upload-status');
  status.classList.remove('hidden');
  status.textContent = `Uploading ${files.length} file${files.length === 1 ? '' : 's'}…`;
  const form = new FormData();
  form.set('parent', folder);
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
    if (input.files) uploadFilesToFolder(currentPath, input.files);
    input.value = '';
  });

  // Whole-grid dropzone: dropping OS files anywhere that isn't a specific
  // folder tile uploads into the folder currently being viewed.
  const dropzone = el('resource-grid');
  let dragDepth = 0;
  dropzone.addEventListener('dragover', (event) => event.preventDefault());
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
    // A drop directly on a folder/breadcrumb tile is handled by that
    // tile's own listener (which calls stopPropagation) -- this only
    // fires for drops on the grid's empty background.
    if (event.dataTransfer?.files?.length) uploadFilesToFolder(currentPath, event.dataTransfer.files);
  });

  // Stop a stray drop (missed every dropzone) from navigating the tab to
  // the dragged-in file, which is the browser's default for file drops.
  window.addEventListener('dragover', (event) => event.preventDefault());
  window.addEventListener('drop', (event) => event.preventDefault());
}

function initExplorer() {
  el('resource-search').addEventListener('input', renderExplorer);

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

/* ======================================================================
   Database -- Postgres + SQLite connectors
   ====================================================================== */

const DB_CONNECTOR_IDS = ['postgres', 'sqlite'] as const;
type DbConnectorId = (typeof DB_CONNECTOR_IDS)[number];

// Matches docker/postgres/init.sql + the POSTGRES_* defaults in
// docker-compose.yml / .env.example -- lets someone try the whole flow
// against the seeded sample database with one click, no typing required.
const SAMPLE_POSTGRES_VALUES = {
  account_label: 'sample',
  host: 'postgres',
  port: '5432',
  dbname: 'aurora_kb',
  user: 'wiki_reader',
  schema: 'public',
  password: 'aurora_sample_pw',
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

interface DbConnectorEntry {
  id: string;
  connected_accounts: string[];
}

interface TableItem {
  id: string;
  title: string;
  snippet: string;
  metadata: { schema?: string; columns?: string[]; row_count?: number };
}

interface ConnectorActivityEvent {
  id: string;
  at: string;
  username: string;
  account_label: string | null;
  action: 'connect' | 'browse' | 'import' | 'disconnect';
  detail: string;
  success: boolean;
  duration_ms: number | null;
  error: string | null;
}

document.getElementById('use-sample-values-btn')?.addEventListener('click', () => {
  const form = document.getElementById('connect-form') as HTMLFormElement;
  for (const [name, value] of Object.entries(SAMPLE_POSTGRES_VALUES)) {
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
    loadDbAccounts();
    loadDbActivity();
  } catch (err: any) {
    errorEl.textContent = err.message || 'Failed to connect.';
    errorEl.classList.remove('hidden');
    loadDbActivity();
  } finally {
    submitBtn.disabled = false;
  }
});

document.getElementById('connect-sqlite-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const errorEl = document.getElementById('connect-sqlite-error')!;
  errorEl.classList.add('hidden');
  const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
  submitBtn.disabled = true;
  try {
    await api('/api/connectors/sqlite/connect', {
      method: 'POST',
      body: JSON.stringify({
        account_label: (form.elements.namedItem('account_label') as HTMLInputElement).value.trim(),
        db_path: (form.elements.namedItem('db_path') as HTMLInputElement).value.trim(),
      }),
    });
    (window as any).showToast?.('Connected. Browse its tables below.', 'success');
    form.reset();
    loadDbAccounts();
    loadDbActivity();
  } catch (err: any) {
    errorEl.textContent = err.message || 'Failed to connect.';
    errorEl.classList.remove('hidden');
    loadDbActivity();
  } finally {
    submitBtn.disabled = false;
  }
});

function dbTableRow(item: TableItem): string {
  return `<label class="flex items-start gap-2 rounded-lg border border-gray-100 p-2 hover:bg-gray-50" data-table-row data-item-id="${escapeHtml(item.id)}" data-item-title="${escapeHtml(item.title)}">
    <input type="checkbox" class="table-checkbox mt-0.5" />
    <span class="min-w-0">
      <span class="block truncate text-xs font-medium text-gray-900">${escapeHtml(item.title)}</span>
      <span class="block truncate text-xs text-gray-500">${escapeHtml(item.snippet)}${item.metadata?.columns ? ` — ${escapeHtml(item.metadata.columns.join(', '))}` : ''}</span>
    </span>
  </label>`;
}

const DB_CONNECTOR_LABELS: Record<DbConnectorId, string> = { postgres: 'PostgreSQL', sqlite: 'SQLite' };

function dbAccountCard(connectorId: DbConnectorId, accountLabel: string): string {
  return `<div class="database-account rounded-xl border border-gray-200 bg-white p-4 shadow-card" data-connector-id="${connectorId}" data-account-label="${escapeHtml(accountLabel)}">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h3 class="text-sm font-semibold text-gray-900">
        ${escapeHtml(accountLabel)}
        <span class="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">${DB_CONNECTOR_LABELS[connectorId]}</span>
      </h3>
      <div class="flex items-center gap-2">
        <button type="button" class="browse-tables-btn rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">Browse tables</button>
        <button type="button" class="disconnect-btn rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Disconnect</button>
      </div>
    </div>
    <div class="tables-panel mt-3 hidden"></div>
  </div>`;
}

async function loadDbAccounts() {
  const list = document.getElementById('accounts-list')!;
  try {
    const data = await api<{ connectors: DbConnectorEntry[] }>('/api/connectors');
    const cards = DB_CONNECTOR_IDS.flatMap((id) => {
      const entry = data.connectors.find((c) => c.id === id);
      return (entry?.connected_accounts ?? []).map((label) => dbAccountCard(id, label));
    });
    list.innerHTML = cards.length
      ? cards.join('')
      : '<p class="text-sm text-gray-400">No databases connected yet -- fill in a form above to connect one.</p>';
  } catch (err: any) {
    list.innerHTML = `<p class="text-sm text-red-600">Cannot reach API at ${escapeHtml(apiBase)}: ${escapeHtml(err.message || '')}</p>`;
  }
}

async function loadDbActivity() {
  const status = document.getElementById('activity-status')!;
  const body = document.getElementById('activity-body')!;
  try {
    const results = await Promise.all(
      DB_CONNECTOR_IDS.map((id) => api<{ events: ConnectorActivityEvent[] }>(`/api/connectors/${id}/activity`)),
    );
    const events = results.flatMap((r) => r.events ?? []).sort((a, b) => (a.at < b.at ? 1 : -1));
    status.textContent = `${events.length} event${events.length === 1 ? '' : 's'}`;
    body.innerHTML = events.length
      ? events
          .map(
            (e) => `
        <tr class="${e.success ? '' : 'bg-red-50'}">
          <td class="whitespace-nowrap px-4 py-2 text-xs text-gray-500">${escapeHtml(formatTime(e.at))}</td>
          <td class="whitespace-nowrap px-4 py-2 text-sm font-medium text-gray-900">${escapeHtml(e.username)}</td>
          <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-800">${escapeHtml(e.account_label ?? '—')}</td>
          <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-800">${e.success ? escapeHtml(e.action) : `<span class="font-medium text-red-600">${escapeHtml(e.action)} failed</span>`}</td>
          <td class="px-4 py-2 text-sm text-gray-500">${escapeHtml(e.success ? e.detail : e.error || e.detail)}</td>
          <td class="whitespace-nowrap px-4 py-2 text-xs text-gray-400">${e.duration_ms != null ? `${e.duration_ms}ms` : '—'}</td>
        </tr>`,
          )
          .join('')
      : '<tr><td colspan="6" class="px-4 py-8 text-center text-sm text-gray-400">No interactions recorded yet -- connect a database above to get started.</td></tr>';
  } catch (err: any) {
    status.textContent = `Cannot reach API at ${apiBase}.`;
    body.innerHTML = `<tr><td colspan="6" class="px-4 py-8 text-center text-sm text-red-600">${escapeHtml(err.message || '')}</td></tr>`;
  }
}

document.getElementById('activity-refresh')?.addEventListener('click', loadDbActivity);

document.getElementById('accounts-list')?.addEventListener('click', async (event) => {
  const target = event.target as HTMLElement;

  const disconnectBtn = target.closest('.disconnect-btn') as HTMLButtonElement | null;
  if (disconnectBtn) {
    const card = disconnectBtn.closest('.database-account') as HTMLElement;
    const connectorId = card.dataset.connectorId!;
    const accountLabel = card.dataset.accountLabel!;
    disconnectBtn.disabled = true;
    try {
      await api(`/api/connectors/${connectorId}/accounts/${encodeURIComponent(accountLabel)}`, { method: 'DELETE' });
      (window as any).showToast?.(`Disconnected ${accountLabel}.`, 'success');
      loadDbAccounts();
      loadDbActivity();
    } catch (err: any) {
      (window as any).showToast?.(err.message || 'Failed to disconnect.', 'error');
      disconnectBtn.disabled = false;
    }
    return;
  }

  const browseBtn = target.closest('.browse-tables-btn') as HTMLButtonElement | null;
  if (browseBtn) {
    const card = browseBtn.closest('.database-account') as HTMLElement;
    const connectorId = card.dataset.connectorId!;
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
      const data = await api<{ items: TableItem[] }>(`/api/connectors/${connectorId}/items`, {
        method: 'POST',
        body: JSON.stringify({ account_label: accountLabel, limit: 50 }),
      });
      panel.innerHTML = data.items.length
        ? `<div class="tables-results flex flex-col gap-1.5">${data.items.map((i) => dbTableRow(i)).join('')}</div>
           <div class="mt-3 flex items-center gap-2">
             <button type="button" class="import-selected-btn rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800">Import selected into knowledge base</button>
             <span class="import-status text-xs text-gray-500"></span>
           </div>`
        : '<p class="text-xs text-gray-400">No tables found.</p>';
      loadDbActivity();
    } catch (err: any) {
      panel.innerHTML = `<p class="text-xs text-red-600">${escapeHtml(err.message || 'Failed to list tables.')}</p>`;
      loadDbActivity();
    }
    return;
  }

  const importBtn = target.closest('.import-selected-btn') as HTMLButtonElement | null;
  if (importBtn) {
    const card = importBtn.closest('.database-account') as HTMLElement;
    const connectorId = card.dataset.connectorId!;
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
        const result = await api<{ raw_path: string }>(`/api/connectors/${connectorId}/items/import`, {
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
    loadDbActivity();
  }
});

/* ======================================================================
   Connectors -- Gmail / Google Drive (OAuth) + IMAP
   ====================================================================== */

interface OAuthConnectorEntry {
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

function connectorAccountRow(connectorId: string, accountLabel: string): string {
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

function connectorCard(entry: OAuthConnectorEntry): string {
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
      ${entry.connected_accounts.length ? entry.connected_accounts.map((a) => connectorAccountRow(entry.id, a)).join('') : '<p class="text-xs text-gray-400">No accounts connected yet.</p>'}
    </div>
  </div>`;
}

async function loadConnectors() {
  const list = document.getElementById('connectors-list')!;
  try {
    const data = await api<{ connectors: OAuthConnectorEntry[] }>('/api/connectors');
    // Postgres/SQLite live on the Database tab's own guided UI -- this
    // tab covers everything else (Gmail/Drive OAuth, IMAP).
    const entries = data.connectors.filter((c) => !DB_CONNECTOR_IDS.includes(c.id as DbConnectorId));
    const secretKeySet = entries[0]?.secret_key_set ?? true;
    const warning = secretKeySet
      ? ''
      : `<div class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <code class="rounded bg-white px-1 py-0.5">CONNECTOR_SECRET_KEY</code> is not set on the server, so credentials can't be
          stored yet. Generate one with <code class="rounded bg-white px-1 py-0.5">python -c "from connectors.credential_store import generate_secret_key; print(generate_secret_key())"</code>
          and set it in <code class="rounded bg-white px-1 py-0.5">.env</code>.
        </div>`;
    list.innerHTML = warning + entries.map(connectorCard).join('');
  } catch (err: any) {
    list.innerHTML = `<p class="text-sm text-red-600">Cannot reach API at ${escapeHtml(apiBase)}: ${escapeHtml(err.message || '')}</p>`;
  }
}

function connectorItemRow(item: ConnectorItem): string {
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
      loadConnectors();
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
          ? data.items.map((i) => connectorItemRow(i)).join('')
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
    loadConnectors();
  } catch (err: any) {
    (window as any).showToast?.(err.message || 'Failed to connect.', 'error');
    submitBtn.disabled = false;
  }
});

/* ======================================================================
   Emails -- ingested .eml sources
   ====================================================================== */

function splitAddrs(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function loadEmails() {
  const container = document.getElementById('emails-list')!;
  try {
    const res = await fetch(`${apiBase}/api/emails`);
    const data = await res.json();
    if (!data.emails.length) {
      container.innerHTML = '<p class="text-sm text-gray-400">No .eml sources found under data/raw/.</p>';
      return;
    }
    container.innerHTML = data.emails
      .map(
        (email: any) => `
      <button data-path="${escapeHtml(email.path)}" class="email-row rounded-xl border border-gray-200 bg-white p-4 text-left shadow-card hover:shadow-md">
        <div class="flex items-center justify-between gap-2">
          <p class="truncate text-sm font-medium text-gray-900">${escapeHtml(email.subject)}</p>
          <span class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            email.status === 'Processed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          }">${escapeHtml(email.status)}</span>
        </div>
        <p class="mt-1 text-xs text-gray-500">From ${escapeHtml(email.from ?? '')} · ${escapeHtml(email.date ?? '')}</p>
        <p class="mt-2 text-sm text-gray-600">${escapeHtml(email.body_preview ?? '')}</p>
      </button>`,
      )
      .join('');

    container.querySelectorAll<HTMLButtonElement>('.email-row').forEach((btn) => {
      btn.addEventListener('click', () => openEmail(btn.dataset.path ?? ''));
    });
  } catch {
    container.innerHTML = `<p class="text-sm text-red-600">Cannot reach API at ${escapeHtml(apiBase)}.</p>`;
  }
}

async function openEmail(path: string) {
  const modal = document.getElementById('email-modal')!;
  modal.classList.remove('hidden');
  modal.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
      <div class="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-panel">
        <div class="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <h2 class="truncate text-sm font-medium text-gray-900">${escapeHtml(path)}</h2>
          <div class="flex shrink-0 items-center gap-1">
            <button id="edit-email" class="rounded-lg px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100">Edit</button>
            <button id="delete-email" class="rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>
            <button id="close-email" class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">✕</button>
          </div>
        </div>
        <div class="flex-1 overflow-auto p-5 text-sm" id="email-body">Loading…</div>
      </div>
    </div>`;
  const close = () => {
    modal.classList.add('hidden');
    modal.innerHTML = '';
  };
  document.getElementById('close-email')!.addEventListener('click', close);
  document.getElementById('delete-email')!.addEventListener('click', async () => {
    if (!confirm(`Delete this email (${path})? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${apiBase}/api/emails/${path.split('/').map(encodeURIComponent).join('/')}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.detail || 'Delete failed');
      close();
      loadEmails();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  });

  try {
    const res = await fetch(`${apiBase}/api/emails/${path.split('/').map(encodeURIComponent).join('/')}`);
    const data = await res.json();
    document.getElementById('email-body')!.innerHTML = `
      <p class="mb-1"><strong>From:</strong> ${escapeHtml(data.from ?? '')}</p>
      <p class="mb-1"><strong>To:</strong> ${escapeHtml((data.to ?? []).join(', '))}</p>
      ${data.cc?.length ? `<p class="mb-1"><strong>Cc:</strong> ${escapeHtml(data.cc.join(', '))}</p>` : ''}
      <p class="mb-3"><strong>Date:</strong> ${escapeHtml(data.date ?? '')}</p>
      <pre class="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-xs">${escapeHtml(data.body ?? '')}</pre>`;
    document.getElementById('edit-email')!.addEventListener('click', () => openEmailForm(data));
  } catch (err: any) {
    document.getElementById('email-body')!.textContent = `Error: ${err.message}`;
  }
}

function openEmailForm(existing?: any) {
  const modal = document.getElementById('email-modal')!;
  const isEdit = !!existing;
  modal.classList.remove('hidden');
  modal.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
      <div class="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-panel">
        <div class="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <h2 class="text-sm font-medium text-gray-900">${isEdit ? 'Edit email' : 'Add email'}</h2>
          <button id="close-form" class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">✕</button>
        </div>
        <form id="email-form" class="flex-1 space-y-3 overflow-auto p-5 text-sm">
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-600">Subject</label>
            <input name="subject" required class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value="${escapeHtml(existing?.subject ?? '')}" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-600">From</label>
            <input name="from" required class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value="${escapeHtml(existing?.from ?? '')}" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-600">To <span class="font-normal text-gray-400">(comma-separated)</span></label>
            <input name="to" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value="${escapeHtml((existing?.to ?? []).join(', '))}" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-600">Cc <span class="font-normal text-gray-400">(comma-separated)</span></label>
            <input name="cc" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value="${escapeHtml((existing?.cc ?? []).join(', '))}" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-600">Date <span class="font-normal text-gray-400">(optional — RFC 2822, e.g. Tue, 02 Jun 2026 09:14:00 -0700)</span></label>
            <input name="date" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value="${escapeHtml(existing?.date ?? '')}" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-600">Body</label>
            <textarea name="body" rows="8" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">${escapeHtml(existing?.body ?? '')}</textarea>
          </div>
          <p id="form-error" class="hidden text-sm text-red-600"></p>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" id="cancel-form" class="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
            <button type="submit" class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark">Save</button>
          </div>
        </form>
      </div>
    </div>`;

  const close = () => {
    modal.classList.add('hidden');
    modal.innerHTML = '';
  };
  document.getElementById('close-form')!.addEventListener('click', close);
  document.getElementById('cancel-form')!.addEventListener('click', close);

  document.getElementById('email-form')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const payload = {
      subject: String(fd.get('subject') ?? '').trim(),
      from: String(fd.get('from') ?? '').trim(),
      to: splitAddrs(String(fd.get('to') ?? '')),
      cc: splitAddrs(String(fd.get('cc') ?? '')),
      date: String(fd.get('date') ?? '').trim(),
      body: String(fd.get('body') ?? ''),
    };
    const errorEl = document.getElementById('form-error')!;
    errorEl.classList.add('hidden');
    try {
      const url = isEdit
        ? `${apiBase}/api/emails/${String(existing.path).split('/').map(encodeURIComponent).join('/')}`
        : `${apiBase}/api/emails`;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.detail || `Save failed (${res.status})`);
      }
      close();
      loadEmails();
    } catch (err: any) {
      errorEl.textContent = `Error: ${err.message}`;
      errorEl.classList.remove('hidden');
    }
  });
}

document.getElementById('add-email')?.addEventListener('click', () => openEmailForm());

/* ======================================================================
   Init -- load all four tabs' data up front (same reasoning as the
   Review & Attention merge: switching tabs should be instant, not a
   fresh fetch each time).
   ====================================================================== */

initExplorer();
initUpload();
loadFiles();
loadDbAccounts();
loadDbActivity();
loadConnectors();
loadEmails();
