declare global {
  interface Window {
    showToast?: (message: string, type?: string) => void;
  }
}

const apiBase = document.querySelector('meta[name="api-base"]')?.getAttribute('content') ?? '';

interface Correction {
  claim_id: string;
  group_id: string;
  verdict: string;
  note: string;
  quote_excerpt: string;
  reviewed_at: string;
}

interface Candidate {
  claim_id: string;
  group_id: string;
  reason: 'low_confidence' | 'unresolved_contradiction';
  score: number;
  quote: string;
  source_path: string;
  contradicts: string | null;
  source_type: string | null;
  date: string | null;
  correction: Correction | null;
}

const REASON_LABEL: Record<string, string> = {
  low_confidence: 'Low confidence',
  unresolved_contradiction: 'Unresolved contradiction',
};

const REASON_STYLE: Record<string, string> = {
  low_confidence: 'bg-amber-50 text-amber-700 border-amber-200',
  unresolved_contradiction: 'bg-red-50 text-red-700 border-red-200',
};

const VERDICT_LABEL: Record<string, string> = {
  confirm_correct: 'Correct',
  confirm_incorrect: 'Incorrect',
  confirm_superseded: 'Superseded',
  confirm_scope_dependent: 'Scope-dependent',
};

let allCandidates: Candidate[] = [];
let verdicts: string[] = [];
let currentFilter = 'all';

function escapeHtml(text: string | null | undefined): string {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

function statCard(value: string, label: string, warn = false): string {
  return `<div class="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-card">
    <p class="text-lg font-semibold ${warn ? 'text-red-600' : 'text-gray-900'}">${escapeHtml(value)}</p>
    <p class="mt-1 text-xs text-gray-500">${escapeHtml(label)}</p>
  </div>`;
}

function candidateKey(c: Candidate): string {
  return `${c.group_id}::${c.claim_id}`;
}

function verdictOptions(selected: string | undefined): string {
  return verdicts
    .map((v) => `<option value="${v}" ${v === selected ? 'selected' : ''}>${escapeHtml(VERDICT_LABEL[v] ?? v)}</option>`)
    .join('');
}

function candidateRow(candidate: Candidate): string {
  const key = candidateKey(candidate);
  const correction = candidate.correction;
  const contradictsNote = candidate.contradicts
    ? `<p class="mt-1 text-xs text-gray-500">Contradicts claim <code class="rounded bg-gray-100 px-1 py-0.5">${escapeHtml(candidate.contradicts)}</code></p>`
    : '';
  const reviewedNote = correction
    ? `<p class="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
        ✓ Reviewed as <strong>${escapeHtml(VERDICT_LABEL[correction.verdict] ?? correction.verdict)}</strong>${
          correction.note ? ` -- ${escapeHtml(correction.note)}` : ''
        }
      </p>`
    : '';

  return `<div class="review-row rounded-xl border border-gray-200 bg-white p-4 shadow-card" data-key="${escapeHtml(key)}" data-reason="${candidate.reason}" data-reviewed="${correction ? '1' : '0'}">
    <div class="flex flex-wrap items-start justify-between gap-2">
      <div class="flex flex-wrap items-center gap-2">
        <span class="rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${REASON_STYLE[candidate.reason]}">${REASON_LABEL[candidate.reason] ?? candidate.reason}</span>
        <span class="text-xs text-gray-400">score ${candidate.score.toFixed(2)}</span>
        <span class="text-xs text-gray-400">${escapeHtml(candidate.group_id)} / ${escapeHtml(candidate.claim_id)}</span>
      </div>
      <span class="text-xs text-gray-400">${escapeHtml(candidate.source_path)}</span>
    </div>
    <p class="mt-2 text-sm text-gray-800">"${escapeHtml(candidate.quote)}"</p>
    ${contradictsNote}
    ${reviewedNote}
    <form class="review-form mt-3 flex flex-wrap items-start gap-2" data-key="${escapeHtml(key)}">
      <select name="verdict" class="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20">
        ${verdictOptions(correction?.verdict)}
      </select>
      <input name="note" type="text" placeholder="Note (optional)" value="${escapeHtml(correction?.note)}"
        class="min-w-[220px] flex-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
      <button type="submit" class="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90">
        ${correction ? 'Update verdict' : 'Save verdict'}
      </button>
    </form>
  </div>`;
}

function matchesFilter(candidate: Candidate): boolean {
  if (currentFilter === 'all') return true;
  if (currentFilter === 'unreviewed') return !candidate.correction;
  return candidate.reason === currentFilter;
}

function render() {
  const list = document.getElementById('review-list')!;
  const empty = document.getElementById('review-empty')!;
  const filtered = allCandidates.filter(matchesFilter);

  if (!filtered.length) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    empty.textContent = allCandidates.length ? 'Nothing in this category.' : 'Nothing needs review right now.';
    return;
  }
  empty.classList.add('hidden');
  list.innerHTML = filtered.map(candidateRow).join('');
  list.querySelectorAll<HTMLFormElement>('.review-form').forEach((form) => {
    form.addEventListener('submit', onSubmitCorrection);
  });
}

async function onSubmitCorrection(event: SubmitEvent) {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const key = form.dataset.key!;
  const candidate = allCandidates.find((c) => candidateKey(c) === key);
  if (!candidate) return;

  const verdict = (form.elements.namedItem('verdict') as HTMLSelectElement).value;
  const note = (form.elements.namedItem('note') as HTMLInputElement).value;
  const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
  submitBtn.disabled = true;

  try {
    const res = await fetch(`${apiBase}/api/review-queue/correct`, {
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
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `API returned ${res.status}`);
    }
    const data = await res.json();
    candidate.correction = data.saved;
    window.showToast?.('Verdict saved', 'success');
    render();
  } catch (err: any) {
    window.showToast?.(err?.message || 'Could not save verdict.', 'error');
  } finally {
    submitBtn.disabled = false;
  }
}

async function load() {
  try {
    const res = await fetch(`${apiBase}/api/review-queue`);
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const data = await res.json();
    allCandidates = data.candidates ?? [];
    verdicts = data.verdicts ?? [];

    const reviewed = allCandidates.filter((c) => c.correction).length;
    document.getElementById('review-stats')!.innerHTML = [
      statCard(String(allCandidates.length), 'Flagged claims', allCandidates.length > reviewed),
      statCard(
        String(allCandidates.filter((c) => c.reason === 'low_confidence').length),
        'Low confidence',
      ),
      statCard(
        String(allCandidates.filter((c) => c.reason === 'unresolved_contradiction').length),
        'Unresolved contradictions',
      ),
      statCard(String(reviewed), 'Reviewed', false),
    ].join('');

    render();
  } catch (err) {
    document.getElementById('review-stats')!.innerHTML = `<p class="col-span-full text-sm text-red-600">Cannot reach API at ${escapeHtml(apiBase)}.</p>`;
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

load();
