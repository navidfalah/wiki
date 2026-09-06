const apiBase = document.querySelector('meta[name="api-base"]')?.getAttribute('content') ?? '';

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

interface Correction {
  claim_id: string;
  group_id: string;
  verdict: string;
  note: string;
  quote_excerpt: string;
  reviewed_at: string;
}

interface ReviewCandidate {
  claim_id: string;
  group_id: string;
  reason: 'low_confidence' | 'unresolved_contradiction';
  score: number;
  quote: string;
  source_path: string;
  contradicts: string | null;
  correction: Correction | null;
}

const REASON_LABEL: Record<string, string> = {
  low_confidence: 'Low confidence',
  unresolved_contradiction: 'Unresolved contradiction',
};

const VERDICTS = [
  { value: 'confirm_correct', label: 'Correct' },
  { value: 'confirm_incorrect', label: 'Incorrect' },
  { value: 'confirm_superseded', label: 'Superseded' },
  { value: 'confirm_scope_dependent', label: 'Scope-dependent' },
];

function statCard(value: string, label: string, warn = false): string {
  return `<div class="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-card">
    <p class="text-lg font-semibold ${warn ? 'text-red-600' : 'text-gray-900'}">${escapeHtml(value)}</p>
    <p class="mt-1 text-xs text-gray-500">${escapeHtml(label)}</p>
  </div>`;
}

function candidateCard(candidate: ReviewCandidate): string {
  const reviewed = Boolean(candidate.correction);
  const scorePct = Math.round(candidate.score * 100);
  const options = VERDICTS.map(
    (v) =>
      `<option value="${v.value}" ${candidate.correction?.verdict === v.value ? 'selected' : ''}>${v.label}</option>`,
  ).join('');

  return `<div class="review-card flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-card" data-claim-id="${escapeHtml(candidate.claim_id)}" data-reason="${candidate.reason}" data-reviewed="${reviewed}">
    <div class="flex flex-wrap items-start justify-between gap-2">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <span class="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-500">${REASON_LABEL[candidate.reason] ?? candidate.reason}</span>
          <span class="text-xs font-medium text-gray-400">${escapeHtml(candidate.group_id)} · ${escapeHtml(candidate.claim_id)}</span>
          ${reviewed ? '<span class="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700 border border-green-200">Reviewed</span>' : ''}
        </div>
        <p class="mt-1 text-sm text-gray-900">&ldquo;${escapeHtml(candidate.quote)}&rdquo;</p>
        <p class="mt-0.5 text-xs text-gray-500">
          ${escapeHtml(candidate.source_path)} · trust score ${scorePct}%
          ${candidate.contradicts ? ` · contradicts <code class="rounded bg-gray-100 px-1 py-0.5">${escapeHtml(candidate.contradicts)}</code>` : ''}
        </p>
      </div>
    </div>
    <form class="review-form flex flex-wrap items-end gap-2 border-t border-gray-100 pt-3">
      <label class="flex flex-col gap-1 text-xs font-medium text-gray-600">
        Verdict
        <select name="verdict" class="rounded-lg border border-gray-300 px-2 py-1.5 text-sm">${options}</select>
      </label>
      <label class="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs font-medium text-gray-600">
        Note
        <input name="note" type="text" value="${escapeHtml(candidate.correction?.note ?? '')}" placeholder="why -- e.g. verified against the spec" class="rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
      </label>
      <button type="submit" class="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800">${reviewed ? 'Update' : 'Submit'}</button>
    </form>
  </div>`;
}

let currentItems: ReviewCandidate[] = [];
let currentFilter = 'all';

function render() {
  const list = document.getElementById('review-list')!;
  const empty = document.getElementById('review-empty')!;
  const filtered = currentItems.filter((c) => {
    if (currentFilter === 'all') return true;
    if (currentFilter === 'pending') return !c.correction;
    if (currentFilter === 'reviewed') return Boolean(c.correction);
    return c.reason === currentFilter;
  });

  if (!filtered.length) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    empty.textContent = currentItems.length ? 'Nothing in this category.' : 'Nothing needs review right now.';
    return;
  }
  empty.classList.add('hidden');
  list.innerHTML = filtered.map(candidateCard).join('');
}

async function load() {
  try {
    const res = await fetch(`${apiBase}/api/review/candidates`);
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    const data = await res.json();
    currentItems = data.candidates ?? [];

    const reviewed = currentItems.filter((c) => c.correction).length;
    document.getElementById('review-cards')!.innerHTML = [
      statCard(String(currentItems.length), 'Flagged claims', currentItems.length > 0),
      statCard(String(currentItems.length - reviewed), 'Pending review', currentItems.length - reviewed > 0),
      statCard(String(reviewed), 'Reviewed'),
      statCard(String(currentItems.filter((c) => c.reason === 'unresolved_contradiction').length), 'Contradictions'),
    ].join('');

    render();
  } catch {
    document.getElementById('review-cards')!.innerHTML = `<p class="col-span-full text-sm text-red-600">Cannot reach API at ${escapeHtml(apiBase)}.</p>`;
  }
}

document.querySelectorAll<HTMLButtonElement>('.review-filter').forEach((btn) => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter ?? 'all';
    document.querySelectorAll('.review-filter').forEach((b) => {
      b.classList.remove('bg-gray-900', 'text-white');
      b.classList.add('border', 'border-gray-300', 'bg-white', 'text-gray-700');
    });
    btn.classList.remove('border', 'border-gray-300', 'bg-white', 'text-gray-700');
    btn.classList.add('bg-gray-900', 'text-white');
    render();
  });
});

document.getElementById('review-refresh')?.addEventListener('click', load);

document.getElementById('review-list')?.addEventListener('submit', async (event) => {
  const form = event.target as HTMLFormElement;
  if (!form.classList.contains('review-form')) return;
  event.preventDefault();

  const card = form.closest('.review-card') as HTMLElement;
  const claimId = card.dataset.claimId!;
  const candidate = currentItems.find((c) => c.claim_id === claimId);
  if (!candidate) return;

  const verdict = (form.elements.namedItem('verdict') as HTMLSelectElement).value;
  const note = (form.elements.namedItem('note') as HTMLInputElement).value;
  const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
  submitBtn.disabled = true;

  try {
    const res = await fetch(`${apiBase}/api/review/corrections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        claim_id: candidate.claim_id,
        group_id: candidate.group_id,
        verdict,
        note,
        quote: candidate.quote,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Request failed (${res.status})`);
    }
    const { correction } = await res.json();
    candidate.correction = correction;
    (window as any).showToast?.('Correction saved.', 'success');
    render();
  } catch (err: any) {
    (window as any).showToast?.(err.message || 'Failed to save correction.', 'error');
  } finally {
    submitBtn.disabled = false;
  }
});

load();
