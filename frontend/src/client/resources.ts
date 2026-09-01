const apiBase = document.querySelector('meta[name="api-base"]')?.getAttribute('content') ?? '';

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

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
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

async function loadAll() {
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
    await loadAll();
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
          <span class="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-500 text-xl">📄
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
          await loadAll();
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
          await loadAll();
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
    await loadAll();
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
          await loadAll();
        } catch (err: any) {
          document.getElementById('new-folder-error')!.textContent = err.message;
        }
      });
    }
  });
}

initExplorer();
initUpload();
loadAll();
