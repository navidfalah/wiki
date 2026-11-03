import { t } from './lib/i18n';
import { apiBase } from './lib/api';

const button = document.getElementById('save-rag-arch-btn') as HTMLButtonElement;
const count = document.getElementById('results-count') as HTMLInputElement;
const hint = document.getElementById('rag-arch-saved-hint')!;
function fill(settings: { retrieval_mode: string; top_k: number }) {
  document.querySelectorAll<HTMLInputElement>('input[name="retrieval_mode"]').forEach((input) => {
    input.checked = input.value === settings.retrieval_mode;
  });
  count.value = String(settings.top_k);
}
async function load() {
  try {
    const response = await fetch(`${apiBase}/api/settings/rag`);
    if (!response.ok) throw new Error(t('common.requestFailed', { status: response.status }));
    fill(await response.json());
  } catch { hint.textContent = t('common.cannotReachApi'); }
}
button.addEventListener('click', async () => {
  if (!count.reportValidity()) return;
  button.disabled = true;
  try {
    const response = await fetch(`${apiBase}/api/settings/rag`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ architecture: 'hybrid', answer_mode: 'extractive',
        retrieval_mode: document.querySelector<HTMLInputElement>('input[name="retrieval_mode"]:checked')?.value ?? 'bm25',
        top_k: Number(count.value), use_vector_store: true }),
    });
    if (!response.ok) throw new Error(t('common.requestFailed', { status: response.status }));
    fill(await response.json()); hint.textContent = t('rag-architecture.saved');
  } catch { hint.textContent = t('rag-architecture.saveFailed'); }
  finally { button.disabled = false; }
});
load();
