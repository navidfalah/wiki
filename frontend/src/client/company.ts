import { t } from './lib/i18n';
import { apiFetch } from './lib/api';

interface CompanySettings {
  company_name: string;
  industry: string;
  website: string;
  size: string;
  location: string;
  description: string;
  tone_of_voice: string;
  target_audience: string;
  additional_notes: string;
}

function fields(): NodeListOf<HTMLInputElement | HTMLTextAreaElement> {
  return document.querySelectorAll('#company-form [data-field]');
}

function fillForm(settings: CompanySettings) {
  fields().forEach((el) => {
    const key = el.dataset.field as keyof CompanySettings;
    el.value = settings[key] ?? '';
  });
}

function readForm(): CompanySettings {
  const result = {} as CompanySettings;
  fields().forEach((el) => {
    const key = el.dataset.field as keyof CompanySettings;
    result[key] = el.value;
  });
  return result;
}

async function load() {
  try {
    fillForm(await apiFetch('/api/settings/company'));
  } catch {
    (window as any).showToast?.(t('common.cannotReachApi'), 'error');
  }
}

async function save() {
  const btn = document.getElementById('save-company-btn') as HTMLButtonElement;
  const hint = document.getElementById('company-saved-hint') as HTMLElement;
  btn.disabled = true;
  btn.textContent = t('company.saving');
  try {
    fillForm(await apiFetch('/api/settings/company', { method: 'PUT', body: JSON.stringify(readForm()) }));
    hint.textContent = t('company.savedAt', { time: new Date().toLocaleTimeString(document.documentElement.lang === 'de' ? 'de-DE' : 'en-GB') });
    (window as any).showToast?.(t('company.saved'));
  } catch (err: any) {
    (window as any).showToast?.(err.message || t('company.saveFailed'), 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = t('common.save');
  }
}

document.getElementById('save-company-btn')?.addEventListener('click', save);

load();
