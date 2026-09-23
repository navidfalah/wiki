import { formatNumber, t, th, tnh } from './lib/i18n';

const apiBase = document.querySelector('meta[name="api-base"]')?.getAttribute('content') ?? '';

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

interface EntityCluster {
  id: string;
  canonical_name: string;
  aliases: string[];
  sources: string[];
  mention_count: number;
}

interface EntityGraphPayload {
  entities: EntityCluster[];
  counts: {
    total_entities: number;
    total_mentions: number;
    multi_source_entities: number;
    multi_alias_entities: number;
  };
}

function statCard(value: string, label: string): string {
  return `<div class="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-card">
    <p class="text-lg font-semibold text-gray-900">${escapeHtml(value)}</p>
    <p class="mt-1 text-xs text-gray-500">${escapeHtml(label)}</p>
  </div>`;
}

function entityRow(entity: EntityCluster): string {
  const otherAliases = entity.aliases.filter((a) => a !== entity.canonical_name);
  return `<div class="entity-row rounded-xl border border-gray-200 bg-white p-4 shadow-card" data-name="${escapeHtml(entity.canonical_name.toLowerCase())}">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="min-w-0">
        <p class="text-sm font-semibold text-gray-900">${escapeHtml(entity.canonical_name)}</p>
        ${otherAliases.length ? `<p class="mt-0.5 truncate text-xs text-gray-500">${th('entities.also', { names: otherAliases.join(', ') })}</p>` : ''}
      </div>
      <div class="flex shrink-0 items-center gap-2 text-xs text-gray-500">
        <span class="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5">${tnh('entities.sources', entity.sources.length)}</span>
        <span class="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5">${tnh('entities.mentions', entity.mention_count)}</span>
      </div>
    </div>
    <p class="mt-2 truncate text-xs text-gray-400">${entity.sources.map(escapeHtml).join(' · ')}</p>
  </div>`;
}

let currentEntities: EntityCluster[] = [];

function render() {
  const list = document.getElementById('entities-list')!;
  const empty = document.getElementById('entities-empty')!;
  const query = (document.getElementById('entities-search') as HTMLInputElement).value.trim().toLowerCase();
  const filtered = query ? currentEntities.filter((e) => e.canonical_name.toLowerCase().includes(query) || e.aliases.some((a) => a.toLowerCase().includes(query))) : currentEntities;

  if (!filtered.length) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    empty.textContent = currentEntities.length ? t('entities.noMatch') : t('entities.none');
    return;
  }
  empty.classList.add('hidden');
  list.innerHTML = filtered.map(entityRow).join('');
}

async function load() {
  try {
    const res = await fetch(`${apiBase}/api/entity-graph`);
    if (!res.ok) throw new Error(t('common.requestFailed', { status: res.status }));
    const data: EntityGraphPayload = await res.json();
    currentEntities = data.entities;

    document.getElementById('entities-cards')!.innerHTML = [
      statCard(formatNumber(data.counts.total_entities), t('entities.card.entities')),
      statCard(formatNumber(data.counts.total_mentions), t('entities.card.mentions')),
      statCard(formatNumber(data.counts.multi_source_entities), t('entities.card.multiSource')),
      statCard(formatNumber(data.counts.multi_alias_entities), t('entities.card.merged')),
    ].join('');

    render();
  } catch (err: any) {
    document.getElementById('entities-cards')!.innerHTML = `<p class="col-span-full text-sm text-red-600">${th('common.cannotReachApi')} ${escapeHtml(err.message || '')}</p>`;
  }
}

document.getElementById('entities-search')?.addEventListener('input', render);
document.getElementById('entities-refresh')?.addEventListener('click', load);

load();
