import { apiBase } from './lib/api';
import { escapeHtml } from './lib/dom';

declare global {
  interface Window {
    showToast?: (message: string, type?: string) => void;
  }
}

import { formatDateTime, t, th } from './lib/i18n';
import { attentionDetail } from './lib/serverText';

function statCard(value: string, label: string, warn = false): string {
  return `<div class="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-card">
    <p class="text-lg font-semibold ${warn ? 'text-red-600' : 'text-gray-900'}">${escapeHtml(value)}</p>
    <p class="mt-1 text-xs text-gray-500">${escapeHtml(label)}</p>
  </div>`;
}

// --- Attention (wiki health) --------------------------------------------

interface AttentionItem {
  kind: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  doc_path?: string;
  raw_path?: string;
}

const attentionKindLabel = (kind: string): string => {
  const key = `review-queue.kind.${kind}`;
  const label = t(key);
  return label === key ? kind : label;
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
    return `<a href="/wiki/${encodeURIComponent(slug)}" class="text-xs font-medium text-accent no-underline hover:underline">${th('review-queue.openPage')}</a>`;
  }
  if (item.raw_path) {
    return `<span class="text-xs text-gray-400">${escapeHtml(item.raw_path)}</span>`;
  }
  return '';
}

function attentionRow(item: AttentionItem): string {
  return `<div class="attention-row flex flex-wrap items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-card" data-kind="${escapeHtml(item.kind)}">
    <span class="mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${ATTENTION_SEVERITY_STYLE[item.severity]}">${escapeHtml(t(`review-queue.severity.${item.severity}`))}</span>
    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-xs font-medium text-gray-400">${escapeHtml(attentionKindLabel(item.kind))}</span>
        <p class="truncate text-sm font-medium text-gray-900">${escapeHtml(item.title)}</p>
      </div>
      <p class="mt-0.5 text-sm text-gray-600">${escapeHtml(attentionDetail(item.detail))}</p>
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
    empty.textContent = attentionItems.length ? t('review-queue.nothingCategory') : t('review-queue.nothingAttention');
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
      statCard(String(c.total ?? 0), t('review-queue.card.total'), (c.total ?? 0) > 0),
      statCard(String(c.orphan_or_dead_end_topics ?? 0), t('review-queue.card.unreachable'), (c.orphan_or_dead_end_topics ?? 0) > 0),
      statCard(String(c.dead_links ?? 0), t('review-queue.card.deadLinks'), (c.dead_links ?? 0) > 0),
      statCard(String(c.ungrounded_topics ?? 0), t('review-queue.card.ungrounded'), (c.ungrounded_topics ?? 0) > 0),
      statCard(String(c.unprocessed_files ?? 0), t('review-queue.card.unprocessed'), (c.unprocessed_files ?? 0) > 0),
      statCard(String(c.review_findings ?? 0), t('review-queue.card.reviewer'), (c.review_findings ?? 0) > 0),
    ].join('');

    const note = document.getElementById('attention-review-note')!;
    if (data.review_report?.exists) {
      note.classList.remove('hidden');
      const when = data.review_report.generated_at ? formatDateTime(data.review_report.generated_at) : t('review-queue.unknownTime');
      note.innerHTML = th('review-queue.reportNoteHtml', { when });
    } else {
      note.classList.remove('hidden');
      note.innerHTML = t('review-queue.noReportHtml');
    }

    renderAttention();
  } catch {
    document.getElementById('attention-cards')!.innerHTML = `<p class="col-span-full text-sm text-red-600">${th('common.cannotReachApi')}</p>`;
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

loadAttention();
