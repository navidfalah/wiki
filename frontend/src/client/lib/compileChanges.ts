/**
 * Rendering for a compiler run's "what changed" report on the Pipelines page
 * (backend/src/lib/compileReport.ts). No fetching here, so it can be unit
 * tested (test/unit/compile-changes.test.ts).
 */
import { esc, wikiHref } from './dashboardHome';
import { formatNumber, t, th } from './i18n';

export interface ChangeTotals {
  added: number;
  changed: number;
  removed: number;
  unchanged: number;
}

export interface ChangedPage {
  path: string;
  title: string;
  status: 'added' | 'changed' | 'removed';
  lines_added: number | null;
  lines_removed: number | null;
}

export interface CompileReport {
  run_id: string;
  totals: ChangeTotals;
  pages: ChangedPage[];
  truncated: boolean;
}

/** The one-line summary under a run in the list ("3 added · 5 changed · 1 removed"). */
export function renderChangesBadge(totals: ChangeTotals | null | undefined): string {
  if (!totals) return '';
  const touched = totals.added + totals.changed + totals.removed;
  const text = touched
    ? th('pipelines.changes.listBadge', { added: totals.added, changed: totals.changed, removed: totals.removed })
    : th('pipelines.changes.listNone');
  return `<p class="truncate text-xs ${touched ? 'text-gray-600' : 'text-gray-400'}" data-changes-badge>${text}</p>`;
}

const STATUS_TONES: Record<ChangedPage['status'], string> = {
  added: 'bg-emerald-50 text-emerald-700',
  changed: 'bg-amber-50 text-amber-700',
  removed: 'bg-red-50 text-red-700',
};

function lineText(page: ChangedPage): string {
  const { lines_added: added, lines_removed: removed } = page;
  if (page.status === 'added') return added === null ? '' : t('pipelines.changes.linesNew', { added: formatNumber(added) });
  if (page.status === 'removed') return removed === null ? '' : t('pipelines.changes.linesGone', { removed: formatNumber(removed) });
  return added === null || removed === null ? '' : t('pipelines.changes.lines', { added: formatNumber(added), removed: formatNumber(removed) });
}

function pageRow(page: ChangedPage): string {
  const title = page.status === 'removed' ? `<span class="text-gray-500 line-through">${esc(page.title)}</span>` : `<a href="${esc(wikiHref(page.path))}" class="font-medium text-gray-900 hover:text-accent">${esc(page.title)}</a>`;
  // Where the exact diff lives: page history keeps the version from before the run.
  const history = page.status === 'changed' ? ` · <a href="${esc(wikiHref(page.path))}/history" class="text-accent hover:underline">${th('pipelines.changes.history')}</a>` : '';
  return `<li class="flex flex-wrap items-center gap-2 py-1.5 text-sm" data-change-status="${page.status}">
  <span class="w-20 shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-medium ${STATUS_TONES[page.status]}">${th(`pipelines.changes.${page.status}`)}</span>
  <span class="min-w-0 flex-1 truncate">${title}</span>
  <span class="shrink-0 text-xs text-gray-500">${esc(lineText(page))}${history}</span>
</li>`;
}

/**
 * The detail section. `report` is null when the run has none; `runStatus`
 * tells "not yet" (still running) apart from "never" (older or pruned).
 */
export function renderChangesSection(report: CompileReport | null, runStatus: string): string {
  const heading = `<h3 class="mt-5 text-sm font-semibold text-gray-900">${th('pipelines.changes.title')}</h3>`;
  if (!report) {
    const message = runStatus === 'running' ? 'pipelines.changes.pending' : 'pipelines.changes.unavailable';
    return `${heading}<p class="mt-2 text-xs text-gray-500">${th(message)}</p>`;
  }
  const { totals } = report;
  const summary = `<p class="mt-2 text-xs text-gray-600" data-changes-summary>${th('pipelines.changes.summary', {
    added: totals.added,
    changed: totals.changed,
    removed: totals.removed,
    unchanged: totals.unchanged,
  })}</p>`;
  if (!report.pages.length) return `${heading}${summary}<p class="mt-1 text-xs text-gray-500">${th('pipelines.changes.none')}</p>`;
  const truncated = report.truncated ? `<p class="mt-1 text-xs text-gray-500">${th('pipelines.changes.truncated', { count: report.pages.length })}</p>` : '';
  return `${heading}${summary}<ul class="mt-1 divide-y divide-gray-100">${report.pages.map(pageRow).join('')}</ul>${truncated}`;
}
