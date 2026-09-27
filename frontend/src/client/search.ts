import { t, th, tn } from './lib/i18n';
import { apiFetch } from './lib/api';
import { el, escapeHtml } from './lib/dom';

type HitType = 'wiki' | 'resource' | 'email';
type Filter = 'all' | HitType;

interface SearchHit {
  type: HitType;
  title: string;
  path: string;
  snippet: string;
  score: number;
  meta?: Record<string, string>;
}

const TYPE_LABEL_KEY: Record<HitType, string> = {
  wiki: 'search.type.wiki',
  resource: 'search.type.resource',
  email: 'search.type.email',
};

const TYPE_BADGE_TONE: Record<HitType, string> = {
  wiki: 'bg-accent/10 text-accent',
  resource: 'bg-amber-50 text-amber-700',
  email: 'bg-blue-50 text-blue-700',
};

function hitHref(hit: SearchHit): string {
  if (hit.type === 'wiki') return `/wiki/${hit.path.replace(/\.md$/, '')}`;
  const tab = hit.type === 'resource' ? 'files' : 'emails';
  return `/resources?tab=${tab}&open=${encodeURIComponent(hit.path)}`;
}

function hitMetaLine(hit: SearchHit): string {
  if (hit.type === 'resource' && hit.meta) return th('search.meta.resource', { type: hit.meta.sourceType ?? '', trust: hit.meta.trust ?? '' });
  if (hit.type === 'email' && hit.meta) return th('search.meta.email', { from: hit.meta.from ?? '', date: hit.meta.date ?? '' });
  return '';
}

function hitCardHtml(hit: SearchHit): string {
  const metaLine = hitMetaLine(hit);
  return `
    <a href="${escapeHtml(hitHref(hit))}" class="block rounded-xl border border-gray-200 bg-white p-4 shadow-card no-underline transition-colors hover:border-accent/40">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${TYPE_BADGE_TONE[hit.type]}">${th(TYPE_LABEL_KEY[hit.type])}</span>
            <h2 class="truncate text-sm font-semibold text-gray-900">${escapeHtml(hit.title)}</h2>
          </div>
          ${metaLine ? `<p class="mt-1 text-xs text-gray-500">${metaLine}</p>` : ''}
          ${hit.snippet ? `<p class="mt-1.5 text-sm text-gray-600">${escapeHtml(hit.snippet)}</p>` : ''}
        </div>
        <span class="shrink-0 whitespace-nowrap text-xs font-medium text-accent">${th(hitViewLabelKey(hit.type))} →</span>
      </div>
    </a>`;
}

function hitViewLabelKey(type: HitType): string {
  if (type === 'wiki') return 'search.viewWiki';
  if (type === 'resource') return 'search.viewResource';
  return 'search.viewEmail';
}

let allHits: SearchHit[] = [];
let totalMatches = 0;
let activeFilter: Filter = 'all';
let currentQuery = '';

function render() {
  const resultsEl = el('search-results');
  const countEl = el('search-count');

  const filtered = activeFilter === 'all' ? allHits : allHits.filter((h) => h.type === activeFilter);

  if (!currentQuery) {
    countEl.textContent = '';
    resultsEl.innerHTML = `<p class="mt-2 text-sm text-gray-400">${th('search.empty')}</p>`;
    return;
  }

  // The API returns the top 100 hits; the unfiltered count is the full total.
  countEl.textContent = tn('search.result', activeFilter === 'all' ? totalMatches : filtered.length);

  if (!filtered.length) {
    resultsEl.innerHTML = `<p class="mt-2 text-sm text-gray-400">${th('search.noMatch', { query: currentQuery })}</p>`;
    return;
  }

  resultsEl.innerHTML = filtered.map(hitCardHtml).join('');
}

let debounceTimer: number | undefined;

async function runSearch(query: string) {
  currentQuery = query.trim();

  const url = new URL(window.location.href);
  if (currentQuery) url.searchParams.set('q', currentQuery);
  else url.searchParams.delete('q');
  window.history.replaceState(null, '', url.toString());

  if (!currentQuery) {
    allHits = [];
    render();
    return;
  }

  try {
    const data = await apiFetch<{ total: number; results: SearchHit[] }>(`/api/search?q=${encodeURIComponent(currentQuery)}`);
    allHits = data.results ?? [];
    totalMatches = data.total ?? allHits.length;
  } catch (err: any) {
    allHits = [];
    el('search-count').textContent = '';
    el('search-results').innerHTML = `<p class="mt-2 text-sm text-red-600">${escapeHtml(err.message ?? t('common.cannotReachApi'))}</p>`;
    return;
  }
  render();
}

const input = el('search-input') as HTMLInputElement;
input.addEventListener('input', () => {
  if (debounceTimer) window.clearTimeout(debounceTimer);
  const value = input.value;
  debounceTimer = window.setTimeout(() => runSearch(value), 200);
});

document.querySelectorAll<HTMLButtonElement>('.search-filter').forEach((btn) => {
  btn.addEventListener('click', () => {
    activeFilter = btn.dataset.filter as Filter;
    document.querySelectorAll<HTMLButtonElement>('.search-filter').forEach((b) => {
      const isActive = b === btn;
      b.classList.toggle('border-accent', isActive);
      b.classList.toggle('bg-accent/10', isActive);
      b.classList.toggle('text-accent', isActive);
      b.classList.toggle('border-gray-300', !isActive);
      b.classList.toggle('bg-white', !isActive);
      b.classList.toggle('text-gray-600', !isActive);
    });
    render();
  });
});

const initialQuery = new URLSearchParams(window.location.search).get('q') ?? '';
if (initialQuery) {
  input.value = initialQuery;
  runSearch(initialQuery);
} else {
  render();
}
