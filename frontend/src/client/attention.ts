const apiBase = document.querySelector('meta[name="api-base"]')?.getAttribute('content') ?? '';

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

interface AttentionItem {
  kind: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  doc_path?: string;
  raw_path?: string;
}

const KIND_LABEL: Record<string, string> = {
  orphan_topic: 'Unreachable page',
  dead_end_topic: 'Dead end',
  dead_link: 'Dead link',
  ungrounded_topic: 'No source data',
  unprocessed_file: 'Unprocessed file',
  review_finding: 'Reviewer finding',
};

const SEVERITY_STYLE: Record<string, string> = {
  high: 'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
};

function statCard(value: string, label: string, warn = false): string {
  return `<div class="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-card">
    <p class="text-lg font-semibold ${warn ? 'text-red-600' : 'text-gray-900'}">${escapeHtml(value)}</p>
    <p class="mt-1 text-xs text-gray-500">${escapeHtml(label)}</p>
  </div>`;
}

function docLink(item: AttentionItem): string {
  if (item.doc_path) {
    const slug = item.doc_path.replace(/\.md$/, '');
    return `<a href="/wiki/${encodeURIComponent(slug)}" class="text-xs font-medium text-accent no-underline hover:underline">Open page →</a>`;
  }
  if (item.raw_path) {
    return `<span class="text-xs text-gray-400">${escapeHtml(item.raw_path)}</span>`;
  }
  return '';
}

function itemRow(item: AttentionItem): string {
  return `<div class="attention-row flex flex-wrap items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-card" data-kind="${item.kind}">
    <span class="mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${SEVERITY_STYLE[item.severity]}">${item.severity}</span>
    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-xs font-medium text-gray-400">${KIND_LABEL[item.kind] ?? item.kind}</span>
        <p class="truncate text-sm font-medium text-gray-900">${escapeHtml(item.title)}</p>
      </div>
      <p class="mt-0.5 text-sm text-gray-600">${escapeHtml(item.detail)}</p>
    </div>
    <div class="shrink-0">${docLink(item)}</div>
  </div>`;
}

let currentItems: AttentionItem[] = [];
let currentFilter = 'all';

function render() {
  const list = document.getElementById('attention-list')!;
  const empty = document.getElementById('attention-empty')!;
  const filtered = currentFilter === 'all' ? currentItems : currentItems.filter((i) => i.kind === currentFilter);

  if (!filtered.length) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    empty.textContent = currentItems.length ? 'Nothing in this category.' : 'Nothing needs attention right now.';
    return;
  }
  empty.classList.add('hidden');
  list.innerHTML = filtered.map(itemRow).join('');
}

async function load() {
  try {
    const res = await fetch(`${apiBase}/api/attention`);
    const data = await res.json();
    currentItems = data.items ?? [];

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

    render();
  } catch {
    document.getElementById('attention-cards')!.innerHTML = `<p class="col-span-full text-sm text-red-600">Cannot reach API at ${escapeHtml(apiBase)}.</p>`;
  }
}

document.querySelectorAll<HTMLButtonElement>('.attention-filter').forEach((btn) => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter ?? 'all';
    document.querySelectorAll('.attention-filter').forEach((b) => {
      b.classList.remove('bg-gray-900', 'text-white');
      b.classList.add('border', 'border-gray-300', 'bg-white', 'text-gray-700');
    });
    btn.classList.remove('border', 'border-gray-300', 'bg-white', 'text-gray-700');
    btn.classList.add('bg-gray-900', 'text-white');
    render();
  });
});

document.getElementById('attention-refresh')?.addEventListener('click', load);

load();
