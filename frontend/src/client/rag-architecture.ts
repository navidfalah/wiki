const apiBase = document.querySelector('meta[name="api-base"]')?.getAttribute('content') ?? '';

type Architecture = 'hybrid' | 'naive' | 'hyde' | 'fusion' | 'graph' | 'corrective';
type RetrievalMode = 'bm25' | 'hybrid' | 'hybrid_rerank';
type AnswerMode = 'auto' | 'extractive';

interface RagSettings {
  architecture: Architecture;
  retrieval_mode: RetrievalMode;
  top_k: number;
  bm25_k1: number;
  bm25_b: number;
  use_vector_store: boolean;
  answer_mode: AnswerMode;
}

interface RagPreset {
  id: string;
  name: string;
  settings: RagSettings;
  created_at: string;
}

let presets: RagPreset[] = [];

function updateRetrievalTuningDisabledState(architecture: Architecture) {
  const disabled = architecture !== 'hybrid';
  document.querySelectorAll<HTMLInputElement>('input[name="retrieval_mode"]').forEach((el) => (el.disabled = disabled));
  document.getElementById('retrieval-mode-section')?.classList.toggle('opacity-50', disabled);
  document.getElementById('vector-store-hint')?.classList.toggle('hidden', !disabled);
}

function numberFields(): NodeListOf<HTMLInputElement> {
  return document.querySelectorAll('[data-field]');
}

function fillForm(settings: RagSettings) {
  numberFields().forEach((el) => {
    const key = el.dataset.field as keyof RagSettings;
    if (el.type === 'checkbox') {
      el.checked = Boolean(settings[key]);
    } else {
      el.value = String(settings[key] ?? '');
    }
  });
  document
    .querySelectorAll<HTMLInputElement>('input[name="architecture"]')
    .forEach((el) => (el.checked = el.value === settings.architecture));
  document
    .querySelectorAll<HTMLInputElement>('input[name="retrieval_mode"]')
    .forEach((el) => (el.checked = el.value === settings.retrieval_mode));
  document
    .querySelectorAll<HTMLInputElement>('input[name="answer_mode"]')
    .forEach((el) => (el.checked = el.value === settings.answer_mode));
  updateRetrievalTuningDisabledState(settings.architecture);
}

function readForm(): RagSettings {
  const result: any = {};
  numberFields().forEach((el) => {
    const key = el.dataset.field as keyof RagSettings;
    result[key] = el.type === 'checkbox' ? el.checked : Number(el.value);
  });
  const architectureInput = document.querySelector<HTMLInputElement>('input[name="architecture"]:checked');
  const retrievalInput = document.querySelector<HTMLInputElement>('input[name="retrieval_mode"]:checked');
  const answerInput = document.querySelector<HTMLInputElement>('input[name="answer_mode"]:checked');
  result.architecture = (architectureInput?.value ?? 'hybrid') as Architecture;
  result.retrieval_mode = (retrievalInput?.value ?? 'hybrid_rerank') as RetrievalMode;
  result.answer_mode = (answerInput?.value ?? 'auto') as AnswerMode;
  return result as RagSettings;
}

function renderPresetSelect() {
  const select = document.getElementById('rag-preset-select') as HTMLSelectElement;
  const loadBtn = document.getElementById('rag-preset-load-btn') as HTMLButtonElement;
  const deleteBtn = document.getElementById('rag-preset-delete-btn') as HTMLButtonElement;
  const previousValue = select.value;
  if (!presets.length) {
    select.innerHTML = '<option value="">No presets saved yet</option>';
    loadBtn.disabled = true;
    deleteBtn.disabled = true;
    return;
  }
  select.innerHTML = presets
    .map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`)
    .join('');
  select.value = presets.some((p) => p.id === previousValue) ? previousValue : presets[0].id;
  loadBtn.disabled = false;
  deleteBtn.disabled = false;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

async function loadPresets() {
  try {
    const res = await fetch(`${apiBase}/api/settings/rag/presets`);
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    const data = await res.json();
    presets = data.presets ?? [];
  } catch {
    presets = [];
  }
  renderPresetSelect();
}

async function saveAsPreset() {
  const nameInput = document.getElementById('rag-preset-name-input') as HTMLInputElement;
  const hint = document.getElementById('rag-preset-hint') as HTMLElement;
  const name = nameInput.value.trim();
  if (!name) {
    (window as any).showToast?.('Give the preset a name first.', 'error');
    return;
  }
  try {
    const res = await fetch(`${apiBase}/api/settings/rag/presets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, settings: readForm() }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Request failed (${res.status})`);
    }
    const saved: RagPreset = await res.json();
    nameInput.value = '';
    await loadPresets();
    (document.getElementById('rag-preset-select') as HTMLSelectElement).value = saved.id;
    hint.textContent = `Saved preset "${saved.name}".`;
    (window as any).showToast?.('RAG preset saved.');
  } catch (err: any) {
    (window as any).showToast?.(err.message || 'Could not save preset.', 'error');
  }
}

async function loadSelectedPreset() {
  const select = document.getElementById('rag-preset-select') as HTMLSelectElement;
  const hint = document.getElementById('rag-preset-hint') as HTMLElement;
  if (!select.value) return;
  try {
    const res = await fetch(`${apiBase}/api/settings/rag/presets/${encodeURIComponent(select.value)}/apply`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Request failed (${res.status})`);
    }
    fillForm(await res.json());
    const preset = presets.find((p) => p.id === select.value);
    hint.textContent = preset ? `Loaded "${preset.name}" -- now the active architecture.` : 'Loaded preset.';
    (window as any).showToast?.('RAG preset applied.');
  } catch (err: any) {
    (window as any).showToast?.(err.message || 'Could not load preset.', 'error');
  }
}

async function deleteSelectedPreset() {
  const select = document.getElementById('rag-preset-select') as HTMLSelectElement;
  const hint = document.getElementById('rag-preset-hint') as HTMLElement;
  if (!select.value) return;
  const preset = presets.find((p) => p.id === select.value);
  if (!window.confirm(`Delete preset "${preset?.name ?? select.value}"?`)) return;
  try {
    const res = await fetch(`${apiBase}/api/settings/rag/presets/${encodeURIComponent(select.value)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Request failed (${res.status})`);
    }
    await loadPresets();
    hint.textContent = 'Preset deleted.';
  } catch (err: any) {
    (window as any).showToast?.(err.message || 'Could not delete preset.', 'error');
  }
}

async function load() {
  try {
    const res = await fetch(`${apiBase}/api/settings/rag`);
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    fillForm(await res.json());
  } catch {
    (window as any).showToast?.(`Cannot reach API at ${apiBase}.`, 'error');
  }
}

async function save() {
  const btn = document.getElementById('save-rag-arch-btn') as HTMLButtonElement;
  const hint = document.getElementById('rag-arch-saved-hint') as HTMLElement;
  btn.disabled = true;
  btn.textContent = 'Saving…';
  try {
    const res = await fetch(`${apiBase}/api/settings/rag`, {
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
    (window as any).showToast?.('RAG architecture saved.');
  } catch (err: any) {
    (window as any).showToast?.(err.message || 'Could not save RAG architecture.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save';
  }
}

document.getElementById('save-rag-arch-btn')?.addEventListener('click', save);
document
  .querySelectorAll<HTMLInputElement>('input[name="architecture"]')
  .forEach((el) => el.addEventListener('change', () => updateRetrievalTuningDisabledState(el.value as Architecture)));

document.getElementById('rag-preset-save-btn')?.addEventListener('click', saveAsPreset);
document.getElementById('rag-preset-load-btn')?.addEventListener('click', loadSelectedPreset);
document.getElementById('rag-preset-delete-btn')?.addEventListener('click', deleteSelectedPreset);

load();
loadPresets();
