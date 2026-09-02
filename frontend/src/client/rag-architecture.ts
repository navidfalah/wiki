const apiBase = document.querySelector('meta[name="api-base"]')?.getAttribute('content') ?? '';

type RetrievalMode = 'bm25' | 'hybrid' | 'hybrid_rerank';
type AnswerMode = 'auto' | 'extractive';

interface RagSettings {
  retrieval_mode: RetrievalMode;
  top_k: number;
  bm25_k1: number;
  bm25_b: number;
  use_vector_store: boolean;
  answer_mode: AnswerMode;
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
    .querySelectorAll<HTMLInputElement>('input[name="retrieval_mode"]')
    .forEach((el) => (el.checked = el.value === settings.retrieval_mode));
  document
    .querySelectorAll<HTMLInputElement>('input[name="answer_mode"]')
    .forEach((el) => (el.checked = el.value === settings.answer_mode));
}

function readForm(): RagSettings {
  const result: any = {};
  numberFields().forEach((el) => {
    const key = el.dataset.field as keyof RagSettings;
    result[key] = el.type === 'checkbox' ? el.checked : Number(el.value);
  });
  const retrievalInput = document.querySelector<HTMLInputElement>('input[name="retrieval_mode"]:checked');
  const answerInput = document.querySelector<HTMLInputElement>('input[name="answer_mode"]:checked');
  result.retrieval_mode = (retrievalInput?.value ?? 'hybrid_rerank') as RetrievalMode;
  result.answer_mode = (answerInput?.value ?? 'auto') as AnswerMode;
  return result as RagSettings;
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

load();
