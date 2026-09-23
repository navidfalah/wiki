import { t, th } from './lib/i18n';

const apiBase = document.querySelector('meta[name="api-base"]')?.getAttribute('content') ?? '';
const UNCHANGED = '__unchanged__';

type Provider = 'openai' | 'gemini' | 'local' | 'custom';
type ReasoningEffort = '' | 'minimal' | 'low' | 'medium' | 'high';

interface Profile {
  id: string;
  label: string;
  provider: Provider;
  base_url: string;
  model: string;
  api_key: string; // masked when loaded from the server
  has_key?: boolean;
  temperature: number;
  top_p: number | null;
  max_tokens: number | null;
  reasoning_effort: ReasoningEffort;
}

// Starting points for the model picker -- a curated list per provider so
// users aren't stuck guessing exact model ids, but the input stays a plain
// text field (via <datalist>) so any custom/self-hosted model id still works.
const MODEL_PRESETS: Record<Provider, string[]> = {
  openai: [
    'gpt-5', 'gpt-5-mini', 'gpt-5-nano',
    'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano',
    'gpt-4o', 'gpt-4o-mini',
    'o3', 'o3-mini', 'o1', 'o1-mini',
    'gpt-3.5-turbo',
  ],
  gemini: [
    'gemini-3-pro', 'gemini-3.5-flash-lite',
    'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite',
    'gemini-2.0-flash', 'gemini-2.0-flash-lite',
    'gemini-1.5-pro', 'gemini-1.5-flash',
    'gemini-embedding-001', 'gemini-embedding-2',
  ],
  local: [
    'gemma-4-it', 'gemma-2-9b-it', 'gemma-2-27b-it',
    'llama-3.1-8b-instruct', 'llama-3.1-70b-instruct', 'llama-3-70b-instruct',
    'mistral-7b-instruct', 'qwen2.5-7b-instruct', 'qwen2.5-14b-instruct',
    'phi-3-mini-4k-instruct',
  ],
  custom: [
    'deepseek-chat', 'deepseek-reasoner',
    'mistral-large-latest', 'mixtral-8x7b-instruct',
    'llama-3.1-70b-instruct', 'qwen2.5-72b-instruct',
    'grok-2-latest', 'command-r-plus',
  ],
};

const REASONING_EFFORTS: { value: ReasoningEffort; label: string }[] = [
  { value: '', label: t('settings.effort.off') },
  { value: 'minimal', label: t('settings.effort.minimal') },
  { value: 'low', label: t('settings.effort.low') },
  { value: 'medium', label: t('settings.effort.medium') },
  { value: 'high', label: t('settings.effort.high') },
];

/** Creates one <datalist> per provider (once) so model inputs can reference
 *  them via the `list` attribute while staying plain, freely-editable text inputs. */
function ensureModelDatalists() {
  for (const provider of Object.keys(MODEL_PRESETS) as Provider[]) {
    const id = `model-presets-${provider}`;
    if (document.getElementById(id)) continue;
    const datalist = document.createElement('datalist');
    datalist.id = id;
    datalist.innerHTML = MODEL_PRESETS[provider].map((m) => `<option value="${m}"></option>`).join('');
    document.body.appendChild(datalist);
  }
}

type Purpose = 'default' | 'thinking' | 'chat' | 'embedding';
const PURPOSES: { key: Purpose; label: string; hint: string }[] = [
  { key: 'default', label: t('settings.purpose.default'), hint: t('settings.purpose.defaultHint') },
  { key: 'thinking', label: t('settings.purpose.thinking'), hint: t('settings.purpose.thinkingHint') },
  { key: 'chat', label: t('settings.purpose.chat'), hint: t('settings.purpose.chatHint') },
  { key: 'embedding', label: t('settings.purpose.embedding'), hint: t('settings.purpose.embeddingHint') },
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
  assignments: { default: '', thinking: '', chat: '', embedding: '' },
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
    container.innerHTML = `<p class="p-5 text-sm text-gray-500">${th('settings.noProviders')}</p>`;
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

    const modelInput = row.querySelector('[data-field="model"]') as HTMLInputElement;
    modelInput.value = profile.model;
    modelInput.setAttribute('list', `model-presets-${profile.provider}`);
    modelInput.addEventListener('input', () => (profile.model = modelInput.value));

    const providerSelect = row.querySelector('[data-field="provider"]') as HTMLSelectElement;
    providerSelect.value = profile.provider;
    providerSelect.addEventListener('change', () => {
      profile.provider = providerSelect.value as Profile['provider'];
      modelInput.setAttribute('list', `model-presets-${profile.provider}`);
    });

    const baseUrlInput = row.querySelector('[data-field="base_url"]') as HTMLInputElement;
    baseUrlInput.value = profile.base_url;
    baseUrlInput.addEventListener('input', () => (profile.base_url = baseUrlInput.value));

    const temperatureInput = row.querySelector('[data-field="temperature"]') as HTMLInputElement;
    temperatureInput.value = String(profile.temperature);
    temperatureInput.addEventListener('input', () => {
      const n = Number(temperatureInput.value);
      profile.temperature = Number.isFinite(n) ? n : profile.temperature;
    });

    const topPInput = row.querySelector('[data-field="top_p"]') as HTMLInputElement;
    topPInput.value = profile.top_p === null ? '' : String(profile.top_p);
    topPInput.addEventListener('input', () => {
      profile.top_p = topPInput.value === '' ? null : Number(topPInput.value);
    });

    const maxTokensInput = row.querySelector('[data-field="max_tokens"]') as HTMLInputElement;
    maxTokensInput.value = profile.max_tokens === null ? '' : String(profile.max_tokens);
    maxTokensInput.addEventListener('input', () => {
      maxTokensInput.value === '' ? (profile.max_tokens = null) : (profile.max_tokens = Number(maxTokensInput.value));
    });

    const reasoningSelect = row.querySelector('[data-field="reasoning_effort"]') as HTMLSelectElement;
    reasoningSelect.innerHTML = REASONING_EFFORTS.map(
      (r) => `<option value="${r.value}" ${profile.reasoning_effort === r.value ? 'selected' : ''}>${r.label}</option>`,
    ).join('');
    reasoningSelect.addEventListener('change', () => {
      profile.reasoning_effort = reasoningSelect.value as ReasoningEffort;
    });

    const keyInput = row.querySelector('[data-field="api_key"]') as HTMLInputElement;
    keyInput.placeholder = profile.has_key ? profile.api_key : t('settings.apiKey');
    keyInput.addEventListener('input', () => {
      editedKeys[profile.id] = keyInput.value;
    });

    const hint = row.querySelector('[data-field="key-hint"]') as HTMLElement;
    hint.textContent = profile.has_key ? t('settings.keyCurrent', { key: profile.api_key }) : t('settings.keyNone');

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
    container.innerHTML = `<p class="text-sm text-gray-500">${th('settings.addFirst')}</p>`;
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
              `<option value="${profile.id}" ${state.assignments[p.key] === profile.id ? 'selected' : ''}>${escapeHtml(profile.label || t('settings.untitled'))}</option>`,
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
      <span class="text-xs font-medium text-gray-600">${th('settings.local.repo')}</span>
      <input data-local="model_repo" type="text" value="${escapeHtml(cfg.model_repo)}" class="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
    </label>
    <label class="flex flex-col gap-1">
      <span class="text-xs font-medium text-gray-600">${th('settings.local.file')}</span>
      <input data-local="model_file" type="text" value="${escapeHtml(cfg.model_file)}" class="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
    </label>
    <div class="grid grid-cols-2 gap-2">
      <label class="flex flex-col gap-1">
        <span class="text-xs font-medium text-gray-600">${th('settings.local.alias')}</span>
        <input data-local="model_alias" type="text" value="${escapeHtml(cfg.model_alias)}" class="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
      </label>
      <label class="flex flex-col gap-1">
        <span class="text-xs font-medium text-gray-600">${th('settings.local.context')}</span>
        <input data-local="context" type="number" min="512" step="512" value="${cfg.context}" class="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
      </label>
    </div>
    <label class="flex flex-col gap-1">
      <span class="text-xs font-medium text-gray-600">${th('settings.local.chatFormat')}</span>
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
      badge.textContent = t('settings.status.reachable');
      badge.className = 'shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700';
    } else {
      badge.textContent = t('settings.status.notRunning');
      badge.className = 'shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500';
    }
  } catch {
    badge.textContent = t('settings.status.unknown');
  }
}

async function load() {
  try {
    const res = await fetch(`${apiBase}/api/settings/llm`);
    if (!res.ok) throw new Error(t('common.requestFailed', { status: res.status }));
    state = await res.json();
    editedKeys = {};
    renderProfiles();
    renderAssignments();
    renderLocalLlmForm();
    loadLocalLlmStatus();
  } catch {
    document.getElementById('profiles-list')!.innerHTML =
      `<p class="p-5 text-sm text-red-600">${th('common.cannotReachApi')}</p>`;
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
    temperature: 0.2,
    top_p: null,
    max_tokens: null,
    reasoning_effort: '',
  };
  state.profiles.push(profile);
  renderProfiles();
  renderAssignments();
}

async function save() {
  const btn = document.getElementById('save-settings-btn') as HTMLButtonElement;
  btn.disabled = true;
  btn.textContent = t('settings.saving');
  try {
    const payload = {
      profiles: state.profiles.map((p) => ({
        id: p.id,
        label: p.label,
        provider: p.provider,
        base_url: p.base_url,
        model: p.model,
        api_key: editedKeys[p.id] !== undefined && editedKeys[p.id] !== '' ? editedKeys[p.id] : UNCHANGED,
        temperature: p.temperature,
        top_p: p.top_p,
        max_tokens: p.max_tokens,
        reasoning_effort: p.reasoning_effort,
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
      throw new Error(err.error || t('common.requestFailed', { status: res.status }));
    }
    state = await res.json();
    editedKeys = {};
    renderProfiles();
    renderAssignments();
    (window as any).showToast?.(t('settings.saved'));
  } catch (err: any) {
    (window as any).showToast?.(err.message || t('settings.saveFailed'), 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = t('settings.saveAll');
  }
}

document.getElementById('add-profile-btn')?.addEventListener('click', addProfile);
document.getElementById('save-settings-btn')?.addEventListener('click', save);

ensureModelDatalists();
load();
