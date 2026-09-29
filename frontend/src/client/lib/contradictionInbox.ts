/**
 * Rendering for the contradiction inbox tab on the Review page
 * (backend/src/lib/contradictions.ts). No fetching here, so it can be unit
 * tested (test/unit/contradiction-inbox.test.ts).
 */
import { esc, wikiHref } from './dashboardHome';
import { formatDateTime, t } from './i18n';

export type ContradictionStatus = 'open' | 'resolved' | 'dismissed';

export interface Contradiction {
  id: string;
  page: string;
  page_title: string;
  text: string;
  status: ContradictionStatus;
  note: string;
  decided_by: string | null;
  decided_at: string | null;
}

export const NOTE_MAX = 500;

const STATUS_STYLE: Record<ContradictionStatus, string> = {
  open: 'bg-amber-50 text-amber-700 border-amber-200',
  resolved: 'bg-green-50 text-green-700 border-green-200',
  dismissed: 'bg-gray-100 text-gray-600 border-gray-200',
};

function decisionLine(c: Contradiction): string {
  if (c.status === 'open' || !c.decided_at) return '';
  const who = c.decided_by ?? '';
  return `<p class="mt-1 text-xs text-gray-500" data-decision>${esc(t('review-queue.contra.decidedBy', { who, when: formatDateTime(c.decided_at) }))}${c.note ? ` — ${esc(c.note)}` : ''}</p>`;
}

function actions(c: Contradiction): string {
  const btn = (action: ContradictionStatus, label: string, primary = false) =>
    `<button type="button" data-contra-action="${action}" class="rounded-lg border px-3 py-1.5 text-xs font-medium ${primary ? 'border-accent bg-accent text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}">${esc(label)}</button>`;
  if (c.status !== 'open') return btn('open', t('review-queue.contra.reopen'));
  return `<input type="text" maxlength="${NOTE_MAX}" data-contra-note placeholder="${esc(t('review-queue.contra.notePlaceholder'))}" aria-label="${esc(t('review-queue.contra.notePlaceholder'))}" class="min-w-0 flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs" />
    ${btn('resolved', t('review-queue.contra.resolve'), true)}${btn('dismissed', t('review-queue.contra.dismiss'))}`;
}

export function renderContradiction(c: Contradiction): string {
  return `<div class="contradiction-row rounded-xl border border-gray-200 bg-white p-4 shadow-card" data-contradiction-id="${esc(c.id)}" data-status="${c.status}">
    <div class="flex flex-wrap items-center gap-2">
      <span class="rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[c.status]}">${esc(t(`review-queue.contra.status.${c.status}`))}</span>
      <a href="${wikiHref(c.page)}" class="text-sm font-medium text-accent no-underline hover:underline">${esc(c.page_title)}</a>
    </div>
    <p class="mt-2 text-sm text-gray-800">${esc(c.text)}</p>
    ${decisionLine(c)}
    <div class="mt-3 flex flex-wrap items-center gap-2">${actions(c)}</div>
  </div>`;
}

export function renderContradictionList(items: Contradiction[], filter: ContradictionStatus | 'all'): string {
  const shown = filter === 'all' ? items : items.filter((c) => c.status === filter);
  return shown.map(renderContradiction).join('');
}

export function emptyMessage(total: number, filter: ContradictionStatus | 'all'): string {
  if (total === 0) return t('review-queue.contra.none');
  return filter === 'open' ? t('review-queue.contra.allSettled') : t('review-queue.nothingCategory');
}
