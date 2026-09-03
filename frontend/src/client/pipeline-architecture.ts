const apiBase = document.querySelector('meta[name="api-base"]')?.getAttribute('content') ?? '';

interface PipelineSettings {
  critic_pass: boolean;
  critic_samples: number;
  critic_regenerate: boolean;
  use_corrections: boolean;
  redact_pii: boolean;
  web_search: boolean;
  excluded_folders: string[];
}

let topLevelFolders: string[] = [];

function checkboxFields(): NodeListOf<HTMLInputElement> {
  return document.querySelectorAll('[data-field]');
}

function fillForm(settings: PipelineSettings) {
  checkboxFields().forEach((el) => {
    const key = el.dataset.field as keyof PipelineSettings;
    if (key === 'excluded_folders') return;
    if (el.type === 'checkbox') {
      el.checked = Boolean(settings[key]);
    } else {
      el.value = String(settings[key] ?? '');
    }
  });
  updateCriticSuboptionsVisibility();
  renderFolders(settings.excluded_folders);
}

function updateCriticSuboptionsVisibility() {
  const criticPass = document.querySelector<HTMLInputElement>('[data-field="critic_pass"]');
  const suboptions = document.getElementById('critic-suboptions');
  if (!criticPass || !suboptions) return;
  suboptions.classList.toggle('hidden', !criticPass.checked);
  suboptions.classList.toggle('flex', criticPass.checked);
}

function renderFolders(excludedFolders: string[]) {
  const container = document.getElementById('pipeline-arch-folders');
  if (!container) return;
  if (!topLevelFolders.length) {
    container.innerHTML = '<p class="p-5 text-sm text-gray-500">No folders found under data/raw/ yet.</p>';
    return;
  }
  const excluded = new Set(excludedFolders);
  container.innerHTML = '';
  for (const folder of topLevelFolders) {
    const label = document.createElement('label');
    label.className = 'flex items-center justify-between gap-3 px-5 py-3 text-sm';
    label.innerHTML = `
      <span class="font-mono text-gray-800">data/raw/${folder}</span>
      <input type="checkbox" data-folder="${folder}" class="rounded border-gray-300 text-accent focus:ring-accent/30" ${excluded.has(folder) ? '' : 'checked'} />
    `;
    container.appendChild(label);
  }
}

function readForm(): PipelineSettings {
  const result: any = {};
  checkboxFields().forEach((el) => {
    const key = el.dataset.field as keyof PipelineSettings;
    if (key === 'excluded_folders') return;
    result[key] = el.type === 'checkbox' ? el.checked : Number(el.value);
  });
  const excluded_folders = topLevelFolders.filter((folder) => {
    const input = document.querySelector<HTMLInputElement>(`[data-folder="${folder}"]`);
    return input ? !input.checked : false;
  });
  return { ...result, excluded_folders } as PipelineSettings;
}

async function loadFolders() {
  try {
    const res = await fetch(`${apiBase}/api/raw-files`);
    if (!res.ok) return;
    const data = await res.json();
    const folders: string[] = Array.isArray(data.folders) ? data.folders : [];
    topLevelFolders = [...new Set(folders.filter((f) => !f.includes('/')))].sort();
  } catch {
    topLevelFolders = [];
  }
}

async function load() {
  try {
    await loadFolders();
    const res = await fetch(`${apiBase}/api/settings/pipeline`);
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    fillForm(await res.json());
  } catch {
    (window as any).showToast?.(`Cannot reach API at ${apiBase}.`, 'error');
  }
}

async function save() {
  const btn = document.getElementById('save-pipeline-arch-btn') as HTMLButtonElement;
  const hint = document.getElementById('pipeline-arch-saved-hint') as HTMLElement;
  btn.disabled = true;
  btn.textContent = 'Saving…';
  try {
    const res = await fetch(`${apiBase}/api/settings/pipeline`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(readForm()),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Request failed (${res.status})`);
    }
    fillForm(await res.json());
    hint.textContent = `Saved at ${new Date().toLocaleTimeString()}`;
    (window as any).showToast?.('Pipeline architecture saved.');
  } catch (err: any) {
    (window as any).showToast?.(err.message || 'Could not save pipeline architecture.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save';
  }
}

document.getElementById('save-pipeline-arch-btn')?.addEventListener('click', save);
document.querySelector('[data-field="critic_pass"]')?.addEventListener('change', updateCriticSuboptionsVisibility);

load();
