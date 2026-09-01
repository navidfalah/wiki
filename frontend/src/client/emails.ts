const apiBase = document.querySelector('meta[name="api-base"]')?.getAttribute('content') ?? '';

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

async function load() {
  const container = document.getElementById('emails-list')!;
  try {
    const res = await fetch(`${apiBase}/api/emails`);
    const data = await res.json();
    if (!data.emails.length) {
      container.innerHTML = '<p class="text-sm text-gray-400">No .eml sources found under data/raw/.</p>';
      return;
    }
    container.innerHTML = data.emails
      .map(
        (email: any) => `
      <button data-path="${escapeHtml(email.path)}" class="email-row rounded-xl border border-gray-200 bg-white p-4 text-left shadow-card hover:shadow-md">
        <div class="flex items-center justify-between gap-2">
          <p class="truncate text-sm font-medium text-gray-900">${escapeHtml(email.subject)}</p>
          <span class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            email.status === 'Processed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          }">${escapeHtml(email.status)}</span>
        </div>
        <p class="mt-1 text-xs text-gray-500">From ${escapeHtml(email.from ?? '')} · ${escapeHtml(email.date ?? '')}</p>
        <p class="mt-2 text-sm text-gray-600">${escapeHtml(email.body_preview ?? '')}</p>
      </button>`,
      )
      .join('');

    container.querySelectorAll<HTMLButtonElement>('.email-row').forEach((btn) => {
      btn.addEventListener('click', () => openEmail(btn.dataset.path ?? ''));
    });
  } catch {
    container.innerHTML = `<p class="text-sm text-red-600">Cannot reach API at ${escapeHtml(apiBase)}.</p>`;
  }
}

async function openEmail(path: string) {
  const modal = document.getElementById('email-modal')!;
  modal.classList.remove('hidden');
  modal.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
      <div class="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-panel">
        <div class="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <h2 class="truncate text-sm font-medium text-gray-900">${escapeHtml(path)}</h2>
          <button id="close-email" class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">✕</button>
        </div>
        <div class="flex-1 overflow-auto p-5 text-sm" id="email-body">Loading…</div>
      </div>
    </div>`;
  document.getElementById('close-email')!.addEventListener('click', () => {
    modal.classList.add('hidden');
    modal.innerHTML = '';
  });
  try {
    const res = await fetch(`${apiBase}/api/emails/${path.split('/').map(encodeURIComponent).join('/')}`);
    const data = await res.json();
    document.getElementById('email-body')!.innerHTML = `
      <p class="mb-1"><strong>From:</strong> ${escapeHtml(data.from ?? '')}</p>
      <p class="mb-1"><strong>To:</strong> ${escapeHtml((data.to ?? []).join(', '))}</p>
      <p class="mb-3"><strong>Date:</strong> ${escapeHtml(data.date ?? '')}</p>
      <pre class="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-xs">${escapeHtml(data.body ?? '')}</pre>`;
  } catch (err: any) {
    document.getElementById('email-body')!.textContent = `Error: ${err.message}`;
  }
}

load();
