/**
 * Rendering for the Fact coverage panel on the Analytics page
 * (backend/src/lib/factCoverage.ts, doc 49). No fetching here, so it can be
 * unit tested (test/unit/fact-coverage.test.ts).
 */
import { esc, wikiHref } from './dashboardHome';
import { formatDateTime, t } from './i18n';

export interface SourceCoverage {
  source: string;
  facts: number;
  covered: number;
  elsewhere: number;
  recall: number | null;
  cited_by: string[];
  missing: string[];
}

export interface FactCoverageResponse {
  report: {
    pages: number;
    recall_cited: number | null;
    recall_any_page: number | null;
    facts_in_cited_sources: number;
    uncited_sources: { source: string; facts: number }[];
    sources: SourceCoverage[];
  };
  computed_at: string;
}

export const MAX_SOURCES_SHOWN = 12;
export const MAX_MISSING_SHOWN = 6;

const pct = (v: number | null) => (v === null ? '–' : `${Math.round(v * 1000) / 10} %`);

export function resourceHref(source: string): string {
  return `/resources?tab=files&open=${encodeURIComponent(source)}`;
}

/** Cited sources with facts missing from every page, most missing first. */
export function sourcesWithGaps(sources: SourceCoverage[]): SourceCoverage[] {
  return sources
    .filter((s) => s.cited_by.length > 0 && s.missing.length > 0)
    .sort((a, b) => b.missing.length - a.missing.length || a.source.localeCompare(b.source));
}

function sourceRow(s: SourceCoverage): string {
  const shown = s.missing.slice(0, MAX_MISSING_SHOWN).map((m) => `<code class="rounded bg-gray-100 px-1 py-0.5 text-[11px] text-gray-700">${esc(m)}</code>`);
  const more = s.missing.length > MAX_MISSING_SHOWN ? `<span class="text-[11px] text-gray-500">${esc(t('analytics.coverage.more', { n: s.missing.length - MAX_MISSING_SHOWN }))}</span>` : '';
  const pages = s.cited_by.map((p) => `<a href="${esc(wikiHref(p))}" class="text-accent no-underline hover:underline">${esc(p.replace(/\.md$/, ''))}</a>`).join(', ');
  return `<li class="border-b border-gray-100 py-2 last:border-0" data-coverage-source="${esc(s.source)}">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <a href="${esc(resourceHref(s.source))}" class="truncate text-sm font-medium text-gray-900 no-underline hover:underline">${esc(s.source)}</a>
      <span class="shrink-0 text-xs text-gray-500">${esc(t('analytics.coverage.inPages', { covered: s.covered, facts: s.facts }))}</span>
    </div>
    <p class="mt-1 text-xs text-gray-500">${esc(t('analytics.coverage.citedBy'))} ${pages}</p>
    <div class="mt-1 flex flex-wrap items-center gap-1" data-missing>${shown.join('')}${more}</div>
  </li>`;
}

export function renderFactCoverage(data: FactCoverageResponse | null, error?: string): string {
  if (!data) return `<p class="text-sm text-red-600">${esc(error || t('common.cannotReachApi'))}</p>`;
  const r = data.report;
  if (r.recall_cited === null) return `<p class="text-sm text-gray-500">${esc(t('analytics.coverage.nothing'))}</p>`;
  const gaps = sourcesWithGaps(r.sources);
  const uncited = r.uncited_sources.length
    ? `<p class="mt-3 text-xs text-amber-700" data-uncited>${esc(t('analytics.coverage.uncited', { n: r.uncited_sources.length, sources: r.uncited_sources.slice(0, 5).map((u) => u.source).join(', ') }))}</p>`
    : '';
  const list = gaps.length
    ? `<ul class="mt-3">${gaps.slice(0, MAX_SOURCES_SHOWN).map(sourceRow).join('')}</ul>${
        gaps.length > MAX_SOURCES_SHOWN ? `<p class="mt-2 text-xs text-gray-500">${esc(t('analytics.coverage.moreSources', { n: gaps.length - MAX_SOURCES_SHOWN }))}</p>` : ''
      }`
    : `<p class="mt-3 text-sm text-emerald-600">${esc(t('analytics.coverage.allCovered'))}</p>`;
  return `<div class="flex flex-wrap items-baseline gap-x-6 gap-y-1">
      <p><span class="text-lg font-semibold text-gray-900" data-recall>${esc(pct(r.recall_cited))}</span> <span class="text-xs text-gray-500">${esc(t('analytics.coverage.recallCited', { facts: r.facts_in_cited_sources }))}</span></p>
      <p><span class="text-sm font-medium text-gray-700">${esc(pct(r.recall_any_page))}</span> <span class="text-xs text-gray-500">${esc(t('analytics.coverage.recallAny'))}</span></p>
    </div>
    <p class="mt-2 text-xs text-gray-500">${esc(t('analytics.coverage.explain'))}</p>
    ${uncited}
    ${list}
    <p class="mt-3 text-[11px] text-gray-400">${esc(t('analytics.coverage.computed', { when: formatDateTime(data.computed_at) }))}</p>`;
}
