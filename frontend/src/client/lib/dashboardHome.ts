/**
 * The "home" half of the dashboard: status cards, what needs attention,
 * recently updated pages and team activity. Pure render functions (data in,
 * HTML out) so they can be unit-tested without a server; dashboard.ts does
 * the fetching and wiring.
 */
import { currentLang, t, th } from './i18n';

/** HTML-escape for text *and* attribute values (quotes included). */
export function esc(text: unknown): string {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** `/wiki/<slug>` for a compiled page file (`aurora-labs.md`). */
export function wikiHref(docPath: string): string {
  return `/wiki/${encodeURIComponent(docPath.replace(/\.md$/, ''))}`;
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/** "3 hours ago" / "vor 3 Stunden" in the UI language; '' for unparsable input. */
export function relativeTime(iso: string | null | undefined, now: number = Date.now()): string {
  const at = iso ? Date.parse(iso) : NaN;
  if (Number.isNaN(at)) return '';
  const seconds = Math.round((at - now) / 1000);
  const fmt = new Intl.RelativeTimeFormat(currentLang, { numeric: 'auto' });
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return fmt.format(Math.round(seconds / size), unit);
  }
  return fmt.format(0, 'minute');
}

// --- Status cards ---------------------------------------------------------

export interface StatusInput {
  pages: number | null;
  crossLinks: number | null;
  rawProcessed: number | null;
  rawTotal: number | null;
  attentionTotal: number | null;
  deadLinks: number | null;
  lastRun: { status: string; started_at: string; finished_at: string | null } | null | undefined;
}

type Tone = 'accent' | 'source' | 'generated' | 'warn' | 'ok' | 'neutral';

const TONES: Record<Tone, string> = {
  accent: 'bg-accent/10 text-accent',
  source: 'bg-source-bg text-source',
  generated: 'bg-generated-bg text-generated',
  warn: 'bg-red-50 text-red-600',
  ok: 'bg-emerald-50 text-emerald-700',
  neutral: 'bg-gray-100 text-gray-500',
};

const ICONS = {
  pages: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline>',
  sources: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>',
  attention: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>',
  compile: '<polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>',
};

function icon(inner: string): string {
  return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}

function statusCard(opts: { href: string; tone: Tone; icon: string; value: string; label: string; hint: string; cta: string; id: string }): string {
  return `
    <a href="${esc(opts.href)}" data-card="${esc(opts.id)}" class="group flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 no-underline shadow-card transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40">
      <div class="flex items-center justify-between gap-2">
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONES[opts.tone]}">${icon(opts.icon)}</span>
        <span class="text-xs font-medium text-gray-400 transition group-hover:text-accent">${esc(opts.cta)} →</span>
      </div>
      <div>
        <p class="text-2xl font-semibold leading-none tracking-tight text-gray-900">${esc(opts.value)}</p>
        <p class="mt-1.5 text-sm font-medium text-gray-700">${esc(opts.label)}</p>
        <p class="mt-0.5 truncate text-xs text-gray-500">${esc(opts.hint)}</p>
      </div>
    </a>`;
}

/** Newest run by start time -- the runs index is appended by the compiler, so don't trust its order. */
export function latestRun<T extends { started_at: string }>(runs: T[] | null | undefined): T | null {
  if (!runs?.length) return null;
  return runs.reduce((best, r) => ((Date.parse(r.started_at) || 0) > (Date.parse(best.started_at) || 0) ? r : best));
}

function runStatusLabel(status: string): string {
  if (status === 'running') return t('dashboard.home.run.running');
  if (status === 'success') return t('dashboard.home.run.success');
  if (status === 'stopped') return t('dashboard.home.run.stopped');
  if (status === 'error') return t('dashboard.home.run.error');
  return status;
}

export function renderStatusCards(s: StatusInput, now: number = Date.now()): string {
  const dash = '–';
  const pending = s.rawTotal != null && s.rawProcessed != null ? Math.max(0, s.rawTotal - s.rawProcessed) : null;
  const attention = s.attentionTotal ?? null;
  const run = s.lastRun;

  return [
    statusCard({
      id: 'pages',
      href: '/wiki',
      tone: 'generated',
      icon: ICONS.pages,
      value: s.pages == null ? dash : String(s.pages),
      label: t('dashboard.home.card.pages'),
      hint: s.crossLinks == null ? '' : t('dashboard.home.card.pagesHint', { links: s.crossLinks }),
      cta: t('dashboard.home.card.browse'),
    }),
    statusCard({
      id: 'sources',
      href: '/resources',
      tone: 'source',
      icon: ICONS.sources,
      value: s.rawTotal == null ? dash : `${s.rawProcessed ?? 0} / ${s.rawTotal}`,
      label: t('dashboard.home.card.sources'),
      hint: pending == null ? '' : pending > 0 ? t('dashboard.home.card.sourcesPending', { count: pending }) : t('dashboard.home.card.sourcesDone'),
      cta: t('dashboard.home.card.manage'),
    }),
    statusCard({
      id: 'attention',
      href: '/review-queue',
      tone: attention ? 'warn' : attention === 0 ? 'ok' : 'neutral',
      icon: ICONS.attention,
      value: attention == null ? dash : String(attention),
      label: t('dashboard.home.card.attention'),
      hint:
        attention == null ? '' : attention === 0 ? t('dashboard.home.card.attentionNone') : t('dashboard.home.card.attentionHint', { count: s.deadLinks ?? 0 }),
      cta: t('dashboard.home.card.review'),
    }),
    statusCard({
      id: 'compile',
      href: run ? '/pipelines' : '#compile',
      tone: !run ? 'neutral' : run.status === 'error' ? 'warn' : run.status === 'success' ? 'ok' : 'accent',
      icon: ICONS.compile,
      value: run ? runStatusLabel(run.status) : t('dashboard.home.card.neverRun'),
      label: t('dashboard.home.card.lastCompile'),
      hint: run ? relativeTime(run.finished_at || run.started_at, now) : t('dashboard.home.card.neverRunHint'),
      cta: run ? t('dashboard.home.card.history') : t('dashboard.home.card.runNow'),
    }),
  ].join('');
}

// --- Needs attention --------------------------------------------------------

export interface AttentionCounts {
  orphan_or_dead_end_topics?: number;
  dead_links?: number;
  ungrounded_topics?: number;
  unprocessed_files?: number;
  review_findings?: number;
  total?: number;
}

export interface AttentionItem {
  kind: string;
  severity: string;
  title: string;
  detail: string;
  doc_path?: string;
}

/** One row per kind of problem, each with the action that fixes it -- most urgent first. */
export function renderAttentionSummary(counts: AttentionCounts | null | undefined, items: AttentionItem[] = []): string {
  if (!counts) return `<p class="px-5 py-6 text-sm text-gray-500">${th('common.cannotReachApi')}</p>`;
  const all: { n: number; label: string; hint: string; href: string; cta: string; tone: Tone }[] = [
    {
      n: counts.dead_links ?? 0,
      label: t('dashboard.home.att.deadLinks'),
      hint: t('dashboard.home.att.deadLinksHint'),
      href: firstDocHref(items, 'dead_link') ?? '/review-queue',
      cta: t('dashboard.home.att.fix'),
      tone: 'warn',
    },
    {
      n: counts.review_findings ?? 0,
      label: t('dashboard.home.att.findings'),
      hint: t('dashboard.home.att.findingsHint'),
      href: '/review-queue',
      cta: t('dashboard.home.att.review'),
      tone: 'warn',
    },
    {
      n: counts.unprocessed_files ?? 0,
      label: t('dashboard.home.att.unprocessed'),
      hint: t('dashboard.home.att.unprocessedHint'),
      href: '#compile',
      cta: t('dashboard.home.att.compile'),
      tone: 'accent',
    },
    {
      n: counts.orphan_or_dead_end_topics ?? 0,
      label: t('dashboard.home.att.orphans'),
      hint: t('dashboard.home.att.orphansHint'),
      href: '/review-queue',
      cta: t('dashboard.home.att.review'),
      tone: 'neutral',
    },
    {
      n: counts.ungrounded_topics ?? 0,
      label: t('dashboard.home.att.ungrounded'),
      hint: t('dashboard.home.att.ungroundedHint'),
      href: '/review-queue',
      cta: t('dashboard.home.att.review'),
      tone: 'neutral',
    },
  ];
  const rows = all.filter((r) => r.n > 0);

  if (!rows.length) {
    return `<div class="flex items-center gap-3 px-5 py-6 text-sm text-gray-600">
      <span class="flex h-8 w-8 items-center justify-center rounded-full ${TONES.ok}" aria-hidden="true">✓</span>
      ${th('dashboard.home.att.allClear')}
    </div>`;
  }
  const top = items.filter((i) => i.doc_path && (i.severity === 'high' || i.kind === 'review_finding')).slice(0, 4);
  const topHtml = top.length
    ? `<div class="border-t border-gray-100 px-5 pb-3 pt-3">
        <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-400">${th('dashboard.home.att.topIssues')}</p>
        <ul class="mt-1.5 space-y-1">${top
          .map(
            (i) => `<li><a href="${esc(wikiHref(i.doc_path!))}" class="flex items-center gap-2 rounded-md py-1 text-xs no-underline hover:bg-gray-50" title="${esc(i.title)}">
              <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden="true"></span>
              <span class="shrink-0 font-medium text-gray-700">${esc(i.doc_path)}</span>
              <span class="min-w-0 truncate text-gray-500">${esc(i.title)}</span>
            </a></li>`,
          )
          .join('')}</ul>
      </div>`
    : '';
  return `<ul class="divide-y divide-gray-100">${rows
    .map(
      (r) => `<li><a href="${esc(r.href)}" class="flex items-center gap-3 px-5 py-3 no-underline hover:bg-gray-50">
        <span class="flex h-8 min-w-[2rem] shrink-0 items-center justify-center rounded-lg px-1.5 text-sm font-semibold ${TONES[r.tone]}">${r.n}</span>
        <span class="min-w-0 flex-1">
          <span class="block text-sm font-medium text-gray-900">${esc(r.label)}</span>
          <span class="block truncate text-xs text-gray-500">${esc(r.hint)}</span>
        </span>
        <span class="shrink-0 text-xs font-medium text-accent">${esc(r.cta)} →</span>
      </a></li>`,
    )
    .join('')}</ul>${topHtml}`;
}

function firstDocHref(items: AttentionItem[], kind: string): string | null {
  const hit = items.find((i) => i.kind === kind && i.doc_path);
  return hit?.doc_path ? wikiHref(hit.doc_path) : null;
}

// --- Recently updated pages ---------------------------------------------------

export interface DocSummary {
  path: string;
  title: string;
  modified_at?: string;
  category?: string | null;
}

/** Newest first; pages without a timestamp (older backends) sink to the bottom. */
export function recentPages(pages: DocSummary[], limit = 6): DocSummary[] {
  const ts = (p: DocSummary) => (p.modified_at ? Date.parse(p.modified_at) || 0 : 0);
  return pages
    .filter((p) => p.path !== 'index.md' && p.path !== 'log.md')
    .slice()
    .sort((a, b) => ts(b) - ts(a) || a.title.localeCompare(b.title))
    .slice(0, limit);
}

export function renderRecentPages(pages: DocSummary[] | null, now: number = Date.now()): string {
  if (pages == null) return `<p class="px-5 py-6 text-sm text-gray-500">${th('common.cannotReachApi')}</p>`;
  const recent = recentPages(pages);
  if (!recent.length) {
    return `<div class="px-5 py-6 text-sm text-gray-500">${th('dashboard.home.recent.empty')}
      <a href="#compile" class="ml-1 font-medium text-accent no-underline hover:underline">${th('dashboard.home.recent.emptyCta')}</a></div>`;
  }
  return `<ul class="divide-y divide-gray-100">${recent
    .map(
      (p) => `<li><a href="${esc(wikiHref(p.path))}" class="flex items-center gap-3 px-5 py-2.5 no-underline hover:bg-gray-50">
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm font-medium text-gray-900">${esc(p.title)}</span>
          ${p.category ? `<span class="block truncate text-xs text-gray-500">${esc(p.category)}</span>` : ''}
        </span>
        <span class="shrink-0 text-xs text-gray-400">${esc(relativeTime(p.modified_at, now))}</span>
      </a></li>`,
    )
    .join('')}</ul>`;
}

// --- Team activity ----------------------------------------------------------

export interface ActivityEvent {
  at: string;
  username?: string | null;
  action: string;
  detail?: string;
  category?: string;
  level?: string;
}

/**
 * Sign-ins and server housekeeping (restarts, scheduled jobs) are noise on a
 * home screen -- keep the events where a person changed something.
 */
export function meaningfulActivity(events: ActivityEvent[], limit = 6): ActivityEvent[] {
  return events.filter((e) => e.category !== 'auth' && e.category !== 'system').slice(0, limit);
}

/** The wiki page an event is about ("aurora-labs.md" or "aurora-labs.md @ v3"), unless it was deleted. */
export function activityPage(e: ActivityEvent): string | null {
  if (e.category !== 'wiki' || /delet/i.test(e.action)) return null;
  const m = /^([A-Za-z0-9][A-Za-z0-9._-]*\.md)\b/.exec(e.detail ?? '');
  return m ? m[1] : null;
}

export function renderActivity(events: ActivityEvent[] | null, now: number = Date.now()): string {
  if (events == null) return `<p class="px-5 py-6 text-sm text-gray-500">${th('dashboard.home.activity.unavailable')}</p>`;
  const shown = meaningfulActivity(events);
  if (!shown.length) return `<p class="px-5 py-6 text-sm text-gray-500">${th('dashboard.home.activity.empty')}</p>`;
  return `<ul class="divide-y divide-gray-100">${shown
    .map(
      (e) => {
        const page = activityPage(e);
        const detail = page
          ? `<a href="${esc(wikiHref(page))}" class="truncate text-accent no-underline hover:underline" title="${esc(e.detail)}">${esc(e.detail)}</a>`
          : e.detail
            ? `<span class="truncate" title="${esc(e.detail)}">${esc(e.detail)}</span>`
            : '';
        return `<li class="flex items-start gap-3 px-5 py-2.5">
        <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold uppercase text-gray-600" aria-hidden="true">${esc((e.username || '?').slice(0, 1))}</span>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm text-gray-900" title="${esc(e.action)}"><span class="font-medium">${esc(e.username || t('dashboard.home.activity.system'))}</span> · ${esc(e.action)}</span>
          <span class="flex min-w-0 items-center gap-1.5 text-xs text-gray-500">${detail}${detail ? '<span aria-hidden="true">·</span>' : ''}<span class="shrink-0 text-gray-400">${esc(relativeTime(e.at, now))}</span></span>
        </span>
      </li>`;
      },
    )
    .join('')}</ul>`;
}
