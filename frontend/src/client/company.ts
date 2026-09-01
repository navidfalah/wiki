const apiBase = document.querySelector('meta[name="api-base"]')?.getAttribute('content') ?? '';

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
    const res = await fetch(`${apiBase}/api/settings/company`);
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    fillForm(await res.json());
  } catch {
    (window as any).showToast?.(`Cannot reach API at ${apiBase}.`, 'error');
  }
}

async function save() {
  const btn = document.getElementById('save-company-btn') as HTMLButtonElement;
  const hint = document.getElementById('company-saved-hint') as HTMLElement;
  btn.disabled = true;
  btn.textContent = 'Saving…';
  try {
    const res = await fetch(`${apiBase}/api/settings/company`, {
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
    (window as any).showToast?.('Company profile saved.');
  } catch (err: any) {
    (window as any).showToast?.(err.message || 'Could not save company profile.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save';
  }
}

document.getElementById('save-company-btn')?.addEventListener('click', save);

load();
