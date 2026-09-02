const apiBase = document.querySelector('meta[name="api-base"]')?.getAttribute('content') ?? '';

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

function splitAddrs(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
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
          <div class="flex shrink-0 items-center gap-1">
            <button id="edit-email" class="rounded-lg px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100">Edit</button>
            <button id="delete-email" class="rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>
            <button id="close-email" class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">✕</button>
          </div>
        </div>
        <div class="flex-1 overflow-auto p-5 text-sm" id="email-body">Loading…</div>
      </div>
    </div>`;
  const close = () => {
    modal.classList.add('hidden');
    modal.innerHTML = '';
  };
  document.getElementById('close-email')!.addEventListener('click', close);
  document.getElementById('delete-email')!.addEventListener('click', async () => {
    if (!confirm(`Delete this email (${path})? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${apiBase}/api/emails/${path.split('/').map(encodeURIComponent).join('/')}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.detail || 'Delete failed');
      close();
      load();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  });

  try {
    const res = await fetch(`${apiBase}/api/emails/${path.split('/').map(encodeURIComponent).join('/')}`);
    const data = await res.json();
    document.getElementById('email-body')!.innerHTML = `
      <p class="mb-1"><strong>From:</strong> ${escapeHtml(data.from ?? '')}</p>
      <p class="mb-1"><strong>To:</strong> ${escapeHtml((data.to ?? []).join(', '))}</p>
      ${data.cc?.length ? `<p class="mb-1"><strong>Cc:</strong> ${escapeHtml(data.cc.join(', '))}</p>` : ''}
      <p class="mb-3"><strong>Date:</strong> ${escapeHtml(data.date ?? '')}</p>
      <pre class="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-xs">${escapeHtml(data.body ?? '')}</pre>`;
    document.getElementById('edit-email')!.addEventListener('click', () => openForm(data));
  } catch (err: any) {
    document.getElementById('email-body')!.textContent = `Error: ${err.message}`;
  }
}

function openForm(existing?: any) {
  const modal = document.getElementById('email-modal')!;
  const isEdit = !!existing;
  modal.classList.remove('hidden');
  modal.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
      <div class="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-panel">
        <div class="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <h2 class="text-sm font-medium text-gray-900">${isEdit ? 'Edit email' : 'Add email'}</h2>
          <button id="close-form" class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">✕</button>
        </div>
        <form id="email-form" class="flex-1 space-y-3 overflow-auto p-5 text-sm">
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-600">Subject</label>
            <input name="subject" required class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value="${escapeHtml(existing?.subject ?? '')}" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-600">From</label>
            <input name="from" required class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value="${escapeHtml(existing?.from ?? '')}" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-600">To <span class="font-normal text-gray-400">(comma-separated)</span></label>
            <input name="to" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value="${escapeHtml((existing?.to ?? []).join(', '))}" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-600">Cc <span class="font-normal text-gray-400">(comma-separated)</span></label>
            <input name="cc" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value="${escapeHtml((existing?.cc ?? []).join(', '))}" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-600">Date <span class="font-normal text-gray-400">(optional — RFC 2822, e.g. Tue, 02 Jun 2026 09:14:00 -0700)</span></label>
            <input name="date" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value="${escapeHtml(existing?.date ?? '')}" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-600">Body</label>
            <textarea name="body" rows="8" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">${escapeHtml(existing?.body ?? '')}</textarea>
          </div>
          <p id="form-error" class="hidden text-sm text-red-600"></p>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" id="cancel-form" class="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
            <button type="submit" class="rounded-lg bg-generated px-4 py-2 text-sm font-medium text-white hover:opacity-90">Save</button>
          </div>
        </form>
      </div>
    </div>`;

  const close = () => {
    modal.classList.add('hidden');
    modal.innerHTML = '';
  };
  document.getElementById('close-form')!.addEventListener('click', close);
  document.getElementById('cancel-form')!.addEventListener('click', close);

  document.getElementById('email-form')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const payload = {
      subject: String(fd.get('subject') ?? '').trim(),
      from: String(fd.get('from') ?? '').trim(),
      to: splitAddrs(String(fd.get('to') ?? '')),
      cc: splitAddrs(String(fd.get('cc') ?? '')),
      date: String(fd.get('date') ?? '').trim(),
      body: String(fd.get('body') ?? ''),
    };
    const errorEl = document.getElementById('form-error')!;
    errorEl.classList.add('hidden');
    try {
      const url = isEdit
        ? `${apiBase}/api/emails/${String(existing.path).split('/').map(encodeURIComponent).join('/')}`
        : `${apiBase}/api/emails`;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.detail || `Save failed (${res.status})`);
      }
      close();
      load();
    } catch (err: any) {
      errorEl.textContent = `Error: ${err.message}`;
      errorEl.classList.remove('hidden');
    }
  });
}

document.getElementById('add-email')!.addEventListener('click', () => openForm());

load();
