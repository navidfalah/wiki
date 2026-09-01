const apiBase = document.querySelector('meta[name="api-base"]')?.getAttribute('content') ?? '';
const UNCHANGED = '__unchanged__';

interface Profile {
  id: string;
  label: string;
  provider: 'openai' | 'gemini' | 'local' | 'custom';
  base_url: string;
  model: string;
  api_key: string; // masked when loaded from the server
  has_key?: boolean;
}

type Purpose = 'default' | 'thinking' | 'embedding';
const PURPOSES: { key: Purpose; label: string; hint: string }[] = [
  { key: 'default', label: 'Default', hint: 'Extraction, indexing, cross-linking' },
  { key: 'thinking', label: 'Thinking', hint: 'Synthesis -- the reasoning-heavy step that writes wiki pages' },
  { key: 'embedding', label: 'Embeddings', hint: 'Vector search / hybrid retrieval' },
];

interface LocalLlmConfig {
  model_repo: string;
  model_file: string;
  model_alias: string;
  context: number;
  chat_format: string;
}

interface Settings {
  profiles: Profile[];
  assignments: Record<Purpose, string>;
  local_llm: LocalLlmConfig;
}

let state: Settings = {
  profiles: [],
  assignments: { default: '', thinking: '', embedding: '' },
  local_llm: { model_repo: '', model_file: '', model_alias: '', context: 4096, chat_format: 'gemma' },
};
let editedKeys: Record<string, string> = {};

function uid(): string {
  return `p-${Math.random().toString(36).slice(2, 10)}`;
}

function renderProfiles() {
  const container = document.getElementById('profiles-list')!;
  const template = document.getElementById('profile-row-template') as HTMLTemplateElement;
  container.innerHTML = '';
  if (!state.profiles.length) {
    container.innerHTML = '<p class="p-5 text-sm text-gray-500">No providers yet -- add one.</p>';
    return;
  }
  for (const profile of state.profiles) {
    const node = template.content.cloneNode(true) as DocumentFragment;
    const row = node.querySelector('.profile-row') as HTMLElement;
    row.dataset.id = profile.id;

    const labelInput = row.querySelector('[data-field="label"]') as HTMLInputElement;
    labelInput.value = profile.label;
    labelInput.addEventListener('input', () => {
      profile.label = labelInput.value;
      renderAssignments();
    });

    const providerSelect = row.querySelector('[data-field="provider"]') as HTMLSelectElement;
    providerSelect.value = profile.provider;
    providerSelect.addEventListener('change', () => {
      profile.provider = providerSelect.value as Profile['provider'];
    });

    const baseUrlInput = row.querySelector('[data-field="base_url"]') as HTMLInputElement;
    baseUrlInput.value = profile.base_url;
    baseUrlInput.addEventListener('input', () => (profile.base_url = baseUrlInput.value));

    const modelInput = row.querySelector('[data-field="model"]') as HTMLInputElement;
    modelInput.value = profile.model;
    modelInput.addEventListener('input', () => (profile.model = modelInput.value));

    const keyInput = row.querySelector('[data-field="api_key"]') as HTMLInputElement;
    keyInput.placeholder = profile.has_key ? profile.api_key : 'API key';
    keyInput.addEventListener('input', () => {
      editedKeys[profile.id] = keyInput.value;
    });

    const hint = row.querySelector('[data-field="key-hint"]') as HTMLElement;
    hint.textContent = profile.has_key
      ? `Currently set (${profile.api_key}). Leave blank to keep it.`
      : 'No key set yet.';

    const removeBtn = row.querySelector('[data-action="remove"]') as HTMLButtonElement;
    removeBtn.addEventListener('click', () => {
      state.profiles = state.profiles.filter((p) => p.id !== profile.id);
      delete editedKeys[profile.id];
      renderProfiles();
      renderAssignments();
    });

    container.appendChild(node);
  }
}

function renderAssignments() {
  const container = document.getElementById('assignments-form')!;
  if (!state.profiles.length) {
    container.innerHTML = '<p class="text-sm text-gray-500">Add a provider first.</p>';
    return;
  }
  container.innerHTML = PURPOSES.map(
    (p) => `
    <label class="flex flex-col gap-1">
      <span class="text-sm font-medium text-gray-800">${p.label}</span>
      <span class="text-xs text-gray-500">${p.hint}</span>
      <select data-purpose="${p.key}" class="mt-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20">
        ${state.profiles
          .map(
            (profile) =>
              `<option value="${profile.id}" ${state.assignments[p.key] === profile.id ? 'selected' : ''}>${escapeHtml(profile.label || 'Untitled')}</option>`,
          )
          .join('')}
      </select>
    </label>`,
  ).join('');
  container.querySelectorAll<HTMLSelectElement>('select[data-purpose]').forEach((sel) => {
    sel.addEventListener('change', () => {
      const purpose = sel.dataset.purpose as Purpose;
      state.assignments[purpose] = sel.value;
    });
  });
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

function renderLocalLlmForm() {
  const container = document.getElementById('local-llm-form')!;
  const cfg = state.local_llm;
  container.innerHTML = `
    <label class="flex flex-col gap-1">
      <span class="text-xs font-medium text-gray-600">Hugging Face repo</span>
      <input data-local="model_repo" type="text" value="${escapeHtml(cfg.model_repo)}" class="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
    </label>
    <label class="flex flex-col gap-1">
      <span class="text-xs font-medium text-gray-600">GGUF filename</span>
      <input data-local="model_file" type="text" value="${escapeHtml(cfg.model_file)}" class="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
    </label>
    <div class="grid grid-cols-2 gap-2">
      <label class="flex flex-col gap-1">
        <span class="text-xs font-medium text-gray-600">Model alias</span>
        <input data-local="model_alias" type="text" value="${escapeHtml(cfg.model_alias)}" class="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
      </label>
      <label class="flex flex-col gap-1">
        <span class="text-xs font-medium text-gray-600">Context length</span>
        <input data-local="context" type="number" min="512" step="512" value="${cfg.context}" class="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
      </label>
    </div>
    <label class="flex flex-col gap-1">
      <span class="text-xs font-medium text-gray-600">Chat format</span>
      <input data-local="chat_format" type="text" value="${escapeHtml(cfg.chat_format)}" class="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
    </label>
  `;
  container.querySelectorAll<HTMLInputElement>('[data-local]').forEach((input) => {
    input.addEventListener('input', () => {
      const key = input.dataset.local as keyof LocalLlmConfig;
      (cfg as any)[key] = input.type === 'number' ? Number(input.value) : input.value;
    });
  });
}

async function loadLocalLlmStatus() {
  const badge = document.getElementById('local-llm-status')!;
  try {
    const res = await fetch(`${apiBase}/api/settings/llm/local-status`);
    const data = await res.json();
    if (data.reachable) {
      badge.textContent = 'Reachable';
      badge.className = 'shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700';
    } else {
      badge.textContent = 'Not running';
      badge.className = 'shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500';
    }
  } catch {
    badge.textContent = 'Unknown';
  }
}

async function load() {
  try {
    const res = await fetch(`${apiBase}/api/settings/llm`);
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    state = await res.json();
    editedKeys = {};
    renderProfiles();
    renderAssignments();
    renderLocalLlmForm();
    loadLocalLlmStatus();
  } catch {
    document.getElementById('profiles-list')!.innerHTML =
      `<p class="p-5 text-sm text-red-600">Cannot reach API at ${escapeHtml(apiBase)}.</p>`;
  }
}

function addProfile() {
  const profile: Profile = {
    id: uid(),
    label: '',
    provider: 'custom',
    base_url: 'https://api.openai.com/v1',
    model: '',
    api_key: '',
    has_key: false,
  };
  state.profiles.push(profile);
  renderProfiles();
  renderAssignments();
}

async function save() {
  const btn = document.getElementById('save-settings-btn') as HTMLButtonElement;
  btn.disabled = true;
  btn.textContent = 'Saving…';
  try {
    const payload = {
      profiles: state.profiles.map((p) => ({
        id: p.id,
        label: p.label,
        provider: p.provider,
        base_url: p.base_url,
        model: p.model,
        api_key: editedKeys[p.id] !== undefined && editedKeys[p.id] !== '' ? editedKeys[p.id] : UNCHANGED,
      })),
      assignments: state.assignments,
      local_llm: state.local_llm,
    };
    const res = await fetch(`${apiBase}/api/settings/llm`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Request failed (${res.status})`);
    }
    state = await res.json();
    editedKeys = {};
    renderProfiles();
    renderAssignments();
    (window as any).showToast?.('Settings saved.');
  } catch (err: any) {
    (window as any).showToast?.(err.message || 'Could not save settings.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save settings';
  }
}

document.getElementById('add-profile-btn')?.addEventListener('click', addProfile);
document.getElementById('save-settings-btn')?.addEventListener('click', save);

load();
