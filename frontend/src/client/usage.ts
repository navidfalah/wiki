import { saveCache, loadCache, showOfflineBanner, hideOfflineBanner, onReconnect } from './lib/cache';

const apiBase = document.querySelector('meta[name="api-base"]')?.getAttribute('content') ?? '';
const CACHE_KEY = 'usage:summary';

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

interface UsageBucket {
  key: string;
  calls: number;
  cache_hits: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost: number;
  has_unpriced: boolean;
}

interface UsageSummary {
  by_process: UsageBucket[];
  by_model: UsageBucket[];
  by_day: UsageBucket[];
  totals: UsageBucket;
  unpriced_models: string[];
  runs_counted: number;
  llm_backend: { mode: 'local' | 'cloud' | 'none'; base_url: string; model: string };
}

function statCard(value: string, label: string): string {
  return `<div class="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-card">
    <p class="text-lg font-semibold text-gray-900">${escapeHtml(value)}</p>
    <p class="mt-1 text-xs text-gray-500">${escapeHtml(label)}</p>
  </div>`;
}

function formatCost(cost: number, hasUnpriced: boolean): string {
  const amount = `$${cost.toFixed(cost < 1 ? 4 : 2)}`;
  return hasUnpriced ? `${amount}+` : amount;
}

function formatDay(day: string): string {
  if (day === 'unknown') return 'Unknown date';
  try {
    return new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return day;
  }
}

function bucketTable(rows: UsageBucket[], keyLabel: string): string {
  if (!rows.length) return '<p class="text-sm text-gray-500">No token usage recorded yet.</p>';
  return `
    <table class="w-full text-left text-xs">
      <thead>
        <tr class="text-gray-500">
          <th class="py-1 pr-2 font-medium">${escapeHtml(keyLabel)}</th>
          <th class="py-1 pr-2 text-right font-medium">Calls</th>
          <th class="py-1 pr-2 text-right font-medium">Cache hits</th>
          <th class="py-1 pr-2 text-right font-medium">Total tokens</th>
          <th class="py-1 text-right font-medium">Est. cost</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
          <tr class="border-t border-gray-100">
            <td class="py-1 pr-2 text-gray-700">${escapeHtml(row.key)}</td>
            <td class="py-1 pr-2 text-right text-gray-700">${row.calls.toLocaleString()}</td>
            <td class="py-1 pr-2 text-right text-gray-700">${row.cache_hits.toLocaleString()}</td>
            <td class="py-1 pr-2 text-right font-medium text-gray-900">${row.total_tokens.toLocaleString()}</td>
            <td class="py-1 text-right font-medium text-gray-900">${formatCost(row.cost, row.has_unpriced)}</td>
          </tr>`,
          )
          .join('')}
      </tbody>
    </table>`;
}

function dailySpendHtml(rows: UsageBucket[]): string {
  if (!rows.length) return '<p class="text-sm text-gray-500">No token usage recorded yet.</p>';
  const maxCost = Math.max(...rows.map((r) => r.cost), 0.0001);
  return `
    <div class="flex flex-col gap-2">
      ${rows
        .map((row) => {
          const pct = Math.max(2, Math.round((row.cost / maxCost) * 100));
          return `
        <div class="flex items-center gap-3 text-xs">
          <span class="w-24 shrink-0 text-gray-600">${escapeHtml(formatDay(row.key))}</span>
          <div class="h-4 flex-1 overflow-hidden rounded bg-gray-100">
            <div class="h-full rounded bg-accent/70" style="width: ${pct}%"></div>
          </div>
          <span class="w-20 shrink-0 text-right font-medium text-gray-900">${formatCost(row.cost, row.has_unpriced)}</span>
          <span class="w-28 shrink-0 text-right text-gray-500">${row.total_tokens.toLocaleString()} tok</span>
        </div>`;
        })
        .join('')}
    </div>`;
}

function render(data: UsageSummary) {
  document.getElementById('usage-cards')!.innerHTML = [
    statCard(formatCost(data.totals.cost, data.totals.has_unpriced), 'Estimated total spend'),
    statCard(data.totals.total_tokens.toLocaleString(), 'Total tokens'),
    statCard(data.totals.calls.toLocaleString(), 'LLM calls'),
    statCard(data.totals.cache_hits.toLocaleString(), 'Cache hits'),
  ].join('');

  const noteEl = document.getElementById('usage-note')!;
  if (data.runs_counted === 0) {
    noteEl.innerHTML = `<p class="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">No pipeline runs with recorded token usage yet. Run the compiler on the <a href="/pipelines" class="font-medium text-accent hover:underline">Pipelines</a> page to see usage here.</p>`;
  } else if (data.llm_backend.mode === 'local') {
    noteEl.innerHTML = `<p class="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">Currently running a local model (${escapeHtml(data.llm_backend.model)}) -- it doesn't report token counts, so any figures below are from earlier cloud runs.</p>`;
  } else if (data.unpriced_models.length) {
    noteEl.innerHTML = `<p class="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">Costs are estimated from published list prices. No price is on file for: ${escapeHtml(data.unpriced_models.join(', '))} -- totals marked "+" don't include their usage.</p>`;
  } else {
    noteEl.innerHTML = `<p class="text-xs text-gray-400">Costs are estimated from published list prices, not your actual invoice.</p>`;
  }

  document.getElementById('usage-daily')!.innerHTML = dailySpendHtml(data.by_day);
  document.getElementById('usage-by-process')!.innerHTML = bucketTable(data.by_process, 'Process');
  document.getElementById('usage-by-model')!.innerHTML = bucketTable(data.by_model, 'Model');
}

async function load() {
  const cached = loadCache<UsageSummary>(CACHE_KEY);
  if (cached) render(cached.data);

  try {
    const res = await fetch(`${apiBase}/api/usage`);
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    const data: UsageSummary = await res.json();
    saveCache(CACHE_KEY, data);
    hideOfflineBanner();
    render(data);
  } catch {
    if (cached) {
      showOfflineBanner(cached.savedAt);
    } else {
      document.getElementById('usage-cards')!.innerHTML = `<p class="col-span-full text-sm text-red-600">Cannot reach API at ${escapeHtml(apiBase)}.</p>`;
    }
  }
}

onReconnect(load);
load();
