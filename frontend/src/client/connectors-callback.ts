import { t } from './lib/i18n';

const apiBase = document.querySelector('meta[name="api-base"]')?.getAttribute('content') ?? '';
const connectorId = (window as any).__connectorId as string;

const params = new URLSearchParams(window.location.search);
const code = params.get('code') ?? '';
const state = params.get('state') ?? '';
const providerError = params.get('error');

const errorBox = document.getElementById('callback-error') as HTMLElement;

if (providerError) {
  errorBox.classList.remove('hidden');
  errorBox.textContent = t('connectors-callback.errProvider', { error: providerError });
} else if (!code || !state) {
  errorBox.classList.remove('hidden');
  errorBox.textContent = t('connectors-callback.errMissing');
}

document.getElementById('callback-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const accountLabel = (form.elements.namedItem('account_label') as HTMLInputElement).value.trim();
  const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
  submitBtn.disabled = true;

  try {
    const res = await fetch(`${apiBase}/api/connectors/${encodeURIComponent(connectorId)}/oauth/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state, account_label: accountLabel }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || t('common.requestFailed', { status: res.status }));
    }
    (window as any).queueToast?.(t('connectors-callback.connected', { label: accountLabel }), 'success');
    window.location.href = '/resources?tab=connectors';
  } catch (err: any) {
    errorBox.classList.remove('hidden');
    errorBox.textContent = err.message || t('connectors-callback.failed');
    submitBtn.disabled = false;
  }
});
