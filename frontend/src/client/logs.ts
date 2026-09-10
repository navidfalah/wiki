import { copyButtonHtml, initCopyButtons } from './lib/copy';

const apiBase = document.querySelector('meta[name="api-base"]')?.getAttribute('content') ?? '';

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

interface ActivityEvent {
  id: string;
  at: string;
  username: string;
  action: string;
  detail: string;
  level: 'info' | 'warn' | 'error';
  category: string;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

const LEVEL_TONES: Record<string, string> = {
  error: 'bg-red-50 text-red-700',
  warn: 'bg-amber-50 text-amber-700',
  info: 'bg-gray-100 text-gray-600',
};

function levelBadge(level: string): string {
  const tone = LEVEL_TONES[level] ?? LEVEL_TONES.info;
  return `<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tone}">${escapeHtml(level)}</span>`;
}

function rowTone(level: string): string {
  if (level === 'error') return 'bg-red-50/60';
  if (level === 'warn') return 'bg-amber-50/60';
  return '';
}

let allEvents: ActivityEvent[] = [];
let autoRefreshTimer: number | undefined;

function populateCategoryFilter(events: ActivityEvent[]) {
  const select = document.getElementById('logs-category-filter') as HTMLSelectElement;
  const current = select.value;
  const categories = [...new Set(events.map((e) => e.category))].sort();
  select.innerHTML =
    '<option value="">All categories</option>' +
    categories.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  select.value = categories.includes(current) ? current : '';
}

function applyFiltersAndRender() {
  const level = (document.getElementById('logs-level-filter') as HTMLSelectElement).value;
  const category = (document.getElementById('logs-category-filter') as HTMLSelectElement).value;
  const search = (document.getElementById('logs-search') as HTMLInputElement).value.trim().toLowerCase();

  const filtered = allEvents.filter((e) => {
    if (level && e.level !== level) return false;
    if (category && e.category !== category) return false;
    if (search) {
      const haystack = `${e.username} ${e.action} ${e.detail}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  const status = document.getElementById('logs-status')!;
  const body = document.getElementById('logs-body')!;
  status.textContent =
    filtered.length === allEvents.length
      ? `${allEvents.length} event${allEvents.length === 1 ? '' : 's'}`
      : `${filtered.length} of ${allEvents.length} event${allEvents.length === 1 ? '' : 's'}`;

  body.innerHTML = filtered.length
    ? filtered
        .map((e) => {
          const line = `[${formatTime(e.at)}] ${e.level.toUpperCase()} ${e.category} ${e.username} -- ${e.action}${e.detail ? `: ${e.detail}` : ''}`;
          return `
      <tr class="copy-wrap ${rowTone(e.level)}">
        <td class="whitespace-nowrap px-4 py-2 text-xs text-gray-500">${escapeHtml(formatTime(e.at))}</td>
        <td class="whitespace-nowrap px-4 py-2">${levelBadge(e.level)}</td>
        <td class="whitespace-nowrap px-4 py-2 text-xs text-gray-500">${escapeHtml(e.category)}</td>
        <td class="whitespace-nowrap px-4 py-2 text-sm font-medium text-gray-900">${escapeHtml(e.username)}</td>
        <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-800">${escapeHtml(e.action)}</td>
        <td class="px-4 py-2 text-sm text-gray-500">${escapeHtml(e.detail)}</td>
        <td class="whitespace-nowrap px-2 py-2 text-right">
          <span class="copy-source hidden">${escapeHtml(line)}</span>
          ${copyButtonHtml('text-gray-400')}
        </td>
      </tr>`;
        })
        .join('')
    : `<tr><td colspan="7" class="px-4 py-8 text-center text-sm text-gray-400">${allEvents.length ? 'No events match these filters.' : 'No activity recorded yet.'}</td></tr>`;
}

async function load() {
  const status = document.getElementById('logs-status')!;
  try {
    const res = await fetch(`${apiBase}/api/activity?limit=1000`);
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    const data = await res.json();
    allEvents = data.events ?? [];
    populateCategoryFilter(allEvents);
    applyFiltersAndRender();
  } catch (err: any) {
    status.textContent = `Cannot reach API at ${apiBase}.`;
    document.getElementById('logs-body')!.innerHTML =
      `<tr><td colspan="7" class="px-4 py-8 text-center text-sm text-red-600">${escapeHtml(err.message)}</td></tr>`;
  }
}

document.getElementById('logs-refresh')!.addEventListener('click', load);
document.getElementById('logs-level-filter')!.addEventListener('change', applyFiltersAndRender);
document.getElementById('logs-category-filter')!.addEventListener('change', applyFiltersAndRender);
document.getElementById('logs-search')!.addEventListener('input', applyFiltersAndRender);
document.getElementById('logs-auto-refresh')!.addEventListener('change', (event) => {
  const checked = (event.target as HTMLInputElement).checked;
  if (autoRefreshTimer) window.clearInterval(autoRefreshTimer);
  autoRefreshTimer = checked ? window.setInterval(load, 5000) : undefined;
});

initCopyButtons();
load();
