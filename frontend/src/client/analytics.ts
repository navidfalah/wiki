import { th, t } from './lib/i18n';
import { apiFetch } from './lib/api';
import { escapeHtml } from './lib/dom';

function statCard(value: string, label: string, warn = false): string {
  return `<div class="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-card">
    <p class="text-lg font-semibold ${warn ? 'text-red-600' : 'text-gray-900'}">${escapeHtml(value)}</p>
    <p class="mt-1 text-xs text-gray-500">${escapeHtml(label)}</p>
  </div>`;
}

async function load() {
  try {
    const data = await apiFetch('/api/analytics');
    const m = data.metrics;
    document.getElementById('analytics-cards')!.innerHTML = [
      statCard(`${m.raw_files_processed} / ${m.raw_files_total}`, t('analytics.card.rawFiles')),
      statCard(String(m.wiki_pages_created), t('analytics.card.wikiPages')),
      statCard(String(m.cross_links_established), t('analytics.card.crossLinks')),
      statCard(String(m.dead_links), t('analytics.card.deadLinks'), m.dead_links > 0),
      statCard(String(data.tags.length), t('analytics.card.tags')),
    ].join('');

    document.getElementById('dead-links-list')!.innerHTML = data.dead_links.length
      ? data.dead_links
          .map(
            (d: any) => `<div class="mb-2 border-b border-gray-100 pb-2">
        <code class="text-xs text-gray-700">${escapeHtml(d.source)}:${d.line}</code>
        <p class="text-xs text-red-600">[${escapeHtml(d.text)}](${escapeHtml(d.href)})</p>
      </div>`,
          )
          .join('')
      : `<p class="text-sm text-emerald-600">${th('analytics.noBroken')}</p>`;

    document.getElementById('tags-list')!.innerHTML = data.tags.length
      ? `<div class="flex flex-wrap gap-2">${data.tags
          .slice(0, 60)
          .map((tag: any) => `<span class="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">${escapeHtml(tag.label)} (${tag.count})</span>`)
          .join('')}</div>`
      : `<p class="text-sm text-gray-400">${th('analytics.noTags')}</p>`;
  } catch (err: any) {
    // apiFetch's thrown message is already the backend's real .detail (see
    // client/lib/api.ts) when the request reached it, or a generic
    // connectivity message otherwise -- shown across all three panels, not
    // just the stat cards, so a real backend error isn't silently missed.
    const message = escapeHtml(err?.message || t('common.cannotReachApi'));
    document.getElementById('analytics-cards')!.innerHTML = `<p class="col-span-full text-sm text-red-600">${message}</p>`;
    document.getElementById('dead-links-list')!.innerHTML = `<p class="text-sm text-red-600">${message}</p>`;
    document.getElementById('tags-list')!.innerHTML = `<p class="text-sm text-red-600">${message}</p>`;
  }
}

load();
