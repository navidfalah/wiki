declare global {
  interface Window {
    showToast?: (message: string, type?: string) => void;
  }
}

const apiBase = document.querySelector('meta[name="api-base"]')?.getAttribute('content') ?? '';

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

// --- Tabs -------------------------------------------------------------
// Both panels' data loads up front (not lazily on first tab visit) so the
// tab buttons can show a live flagged-count badge without waiting for a
// click -- the whole point of merging these two pages onto one screen is
// seeing both at a glance, not hiding one behind an extra load.

function setTabBadge(tabName: string, count: number) {
  const btn = document.getElementById(`tab-btn-${tabName}`)!;
  const existing = btn.querySelector('.tab-badge');
  if (existing) existing.remove();
  if (count <= 0) return;
  const badge = document.createElement('span');
  badge.className = 'tab-badge ml-1.5 inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700';
  badge.textContent = String(count);
  btn.appendChild(badge);
}

document.querySelectorAll<HTMLButtonElement>('.review-attention-tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab!;
    document.querySelectorAll<HTMLButtonElement>('.review-attention-tab').forEach((b) => {
      const active = b === btn;
      b.classList.toggle('border-accent', active);
      b.classList.toggle('text-accent', active);
      b.classList.toggle('border-transparent', !active);
      b.classList.toggle('text-gray-500', !active);
    });
    document.querySelectorAll<HTMLElement>('.review-attention-panel').forEach((panel) => {
      panel.classList.toggle('hidden', panel.id !== `tab-panel-${tab}`);
    });
  });
});

// --- Review queue -------------------------------------------------------

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
let reviewFilter = 'all';

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
        <span class="rounded-full border px-2 py-0.5 text-[11px] font-medium ${REASON_STYLE[candidate.reason]}">${REASON_LABEL[candidate.reason] ?? candidate.reason}</span>
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
      <button type="submit" class="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-dark">
        ${correction ? 'Update verdict' : 'Save verdict'}
      </button>
    </form>
  </div>`;
}

function matchesReviewFilter(candidate: Candidate): boolean {
  if (reviewFilter === 'all') return true;
  if (reviewFilter === 'unreviewed') return !candidate.correction;
  return candidate.reason === reviewFilter;
}

function renderReview() {
  const list = document.getElementById('review-list')!;
  const empty = document.getElementById('review-empty')!;
  const filtered = allCandidates.filter(matchesReviewFilter);

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
    renderReview();
    setTabBadge('review', allCandidates.filter((c) => !c.correction).length);
  } catch (err: any) {
    window.showToast?.(err?.message || 'Could not save verdict.', 'error');
  } finally {
    submitBtn.disabled = false;
  }
}

async function loadReview() {
  try {
    const res = await fetch(`${apiBase}/api/review-queue`);
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const data = await res.json();
    allCandidates = data.candidates ?? [];
    verdicts = data.verdicts ?? [];

    const reviewed = allCandidates.filter((c) => c.correction).length;
    document.getElementById('review-stats')!.innerHTML = [
      statCard(String(allCandidates.length), 'Flagged claims', allCandidates.length > reviewed),
      statCard(String(allCandidates.filter((c) => c.reason === 'low_confidence').length), 'Low confidence'),
      statCard(String(allCandidates.filter((c) => c.reason === 'unresolved_contradiction').length), 'Unresolved contradictions'),
      statCard(String(reviewed), 'Reviewed', false),
    ].join('');

    setTabBadge('review', allCandidates.length - reviewed);
    renderReview();
  } catch {
    document.getElementById('review-stats')!.innerHTML = `<p class="col-span-full text-sm text-red-600">Cannot reach API at ${escapeHtml(apiBase)}.</p>`;
  }
}

document.querySelectorAll<HTMLButtonElement>('.review-filter').forEach((btn) => {
  btn.addEventListener('click', () => {
    reviewFilter = btn.dataset.filter ?? 'all';
    document.querySelectorAll('.review-filter').forEach((b) => {
      b.classList.remove('bg-gray-900', 'text-white');
      b.classList.add('border', 'border-gray-300', 'bg-white', 'text-gray-700');
    });
    btn.classList.remove('border', 'border-gray-300', 'bg-white', 'text-gray-700');
    btn.classList.add('bg-gray-900', 'text-white');
    renderReview();
  });
});

document.getElementById('review-refresh')?.addEventListener('click', loadReview);

// --- Attention (wiki health) --------------------------------------------

interface AttentionItem {
  kind: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  doc_path?: string;
  raw_path?: string;
}

const ATTENTION_KIND_LABEL: Record<string, string> = {
  orphan_topic: 'Unreachable page',
  dead_end_topic: 'Dead end',
  dead_link: 'Dead link',
  ungrounded_topic: 'No source data',
  unprocessed_file: 'Unprocessed file',
  review_finding: 'Reviewer finding',
};

const ATTENTION_SEVERITY_STYLE: Record<string, string> = {
  high: 'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
};

let attentionItems: AttentionItem[] = [];
let attentionFilter = 'all';

function attentionDocLink(item: AttentionItem): string {
  if (item.doc_path) {
    const slug = item.doc_path.replace(/\.md$/, '');
    return `<a href="/wiki/${encodeURIComponent(slug)}" class="text-xs font-medium text-accent no-underline hover:underline">Open page →</a>`;
  }
  if (item.raw_path) {
    return `<span class="text-xs text-gray-400">${escapeHtml(item.raw_path)}</span>`;
  }
  return '';
}

function attentionRow(item: AttentionItem): string {
  return `<div class="attention-row flex flex-wrap items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-card" data-kind="${item.kind}">
    <span class="mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${ATTENTION_SEVERITY_STYLE[item.severity]}">${item.severity}</span>
    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-xs font-medium text-gray-400">${ATTENTION_KIND_LABEL[item.kind] ?? item.kind}</span>
        <p class="truncate text-sm font-medium text-gray-900">${escapeHtml(item.title)}</p>
      </div>
      <p class="mt-0.5 text-sm text-gray-600">${escapeHtml(item.detail)}</p>
    </div>
    <div class="shrink-0">${attentionDocLink(item)}</div>
  </div>`;
}

function renderAttention() {
  const list = document.getElementById('attention-list')!;
  const empty = document.getElementById('attention-empty')!;
  const filtered = attentionFilter === 'all' ? attentionItems : attentionItems.filter((i) => i.kind === attentionFilter);

  if (!filtered.length) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    empty.textContent = attentionItems.length ? 'Nothing in this category.' : 'Nothing needs attention right now.';
    return;
  }
  empty.classList.add('hidden');
  list.innerHTML = filtered.map(attentionRow).join('');
}

async function loadAttention() {
  try {
    const res = await fetch(`${apiBase}/api/attention`);
    const data = await res.json();
    attentionItems = data.items ?? [];

    const c = data.counts ?? {};
    document.getElementById('attention-cards')!.innerHTML = [
      statCard(String(c.total ?? 0), 'Total flagged', (c.total ?? 0) > 0),
      statCard(String(c.orphan_or_dead_end_topics ?? 0), 'Unreachable / dead-end pages', (c.orphan_or_dead_end_topics ?? 0) > 0),
      statCard(String(c.dead_links ?? 0), 'Dead links', (c.dead_links ?? 0) > 0),
      statCard(String(c.ungrounded_topics ?? 0), 'No source data', (c.ungrounded_topics ?? 0) > 0),
      statCard(String(c.unprocessed_files ?? 0), 'Unprocessed files', (c.unprocessed_files ?? 0) > 0),
      statCard(String(c.review_findings ?? 0), 'Reviewer findings', (c.review_findings ?? 0) > 0),
    ].join('');

    const note = document.getElementById('attention-review-note')!;
    if (data.review_report?.exists) {
      note.classList.remove('hidden');
      const when = data.review_report.generated_at ? new Date(data.review_report.generated_at).toLocaleString() : 'unknown time';
      note.innerHTML = `Reviewer findings come from <code class="rounded bg-gray-100 px-1 py-0.5">compiler/review_report.txt</code>, generated ${escapeHtml(when)}. Run <code class="rounded bg-gray-100 px-1 py-0.5">python compiler/reviewer.py</code> again to refresh them.`;
    } else {
      note.classList.remove('hidden');
      note.innerHTML = `No review report found yet -- run <code class="rounded bg-gray-100 px-1 py-0.5">python compiler/reviewer.py</code> to have the LLM check pages against their sources.`;
    }

    setTabBadge('attention', c.total ?? 0);
    renderAttention();
  } catch {
    document.getElementById('attention-cards')!.innerHTML = `<p class="col-span-full text-sm text-red-600">Cannot reach API at ${escapeHtml(apiBase)}.</p>`;
  }
}

document.querySelectorAll<HTMLButtonElement>('.attention-filter').forEach((btn) => {
  btn.addEventListener('click', () => {
    attentionFilter = btn.dataset.filter ?? 'all';
    document.querySelectorAll('.attention-filter').forEach((b) => {
      b.classList.remove('bg-gray-900', 'text-white');
      b.classList.add('border', 'border-gray-300', 'bg-white', 'text-gray-700');
    });
    btn.classList.remove('border', 'border-gray-300', 'bg-white', 'text-gray-700');
    btn.classList.add('bg-gray-900', 'text-white');
    renderAttention();
  });
});

document.getElementById('attention-refresh')?.addEventListener('click', loadAttention);

loadReview();
loadAttention();
