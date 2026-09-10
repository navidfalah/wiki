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

// Rounds a max value up to a "clean" number for axis ticks (1/2/2.5/5 x a
// power of ten) -- e.g. 0.0734 -> 0.08, 460 -> 500, 12,400 -> 15,000 --
// so gridlines read as round numbers instead of whatever the data happens
// to peak at.
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const exponent = Math.floor(Math.log10(value));
  const base = Math.pow(10, exponent);
  const fraction = value / base;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  return niceFraction * base;
}

interface BarChartOptions {
  valueOf: (row: UsageBucket) => number;
  formatValue: (value: number, row: UsageBucket) => string;
  formatAxisTick: (value: number) => string;
}

// A single-series (one hue -- no legend needed, the section title already
// names the measure) daily bar chart: <=24px bars with a 4px rounded cap,
// a 2px gap between bars, hairline gridlines at clean rounded values, and
// a hover tooltip + lift on every bar (the mark itself is the hit target).
function renderBarChart(containerId: string, rows: UsageBucket[], options: BarChartOptions) {
  const container = document.getElementById(containerId)!;
  if (!rows.length) {
    container.innerHTML = '<p class="text-sm text-gray-500">No token usage recorded yet.</p>';
    return;
  }

  const width = 640;
  const height = 220;
  const marginLeft = 56;
  const marginBottom = 28;
  const marginTop = 12;
  const plotWidth = width - marginLeft - 12;
  const plotHeight = height - marginTop - marginBottom;

  const values = rows.map(options.valueOf);
  const maxValue = niceMax(Math.max(...values, 0));
  const barSlot = plotWidth / rows.length;
  const barWidth = Math.min(24, barSlot - 2);
  const tickCount = 4;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (maxValue / tickCount) * i);

  // Show at most ~8 x-axis labels so days don't overlap into an unreadable smear.
  const labelEvery = Math.max(1, Math.ceil(rows.length / 8));

  const gridlines = ticks
    .map((tick) => {
      const y = marginTop + plotHeight - (tick / maxValue) * plotHeight;
      return `<line x1="${marginLeft}" y1="${y}" x2="${width - 12}" y2="${y}" stroke="#e5e7eb" stroke-width="1" />
              <text x="${marginLeft - 8}" y="${y}" text-anchor="end" dominant-baseline="middle" class="fill-gray-400" font-size="10">${escapeHtml(options.formatAxisTick(tick))}</text>`;
    })
    .join('');

  const bars = rows
    .map((row, i) => {
      const value = options.valueOf(row);
      const barHeight = maxValue > 0 ? (value / maxValue) * plotHeight : 0;
      const x = marginLeft + i * barSlot + (barSlot - barWidth) / 2;
      const y = marginTop + plotHeight - barHeight;
      const showLabel = i % labelEvery === 0 || i === rows.length - 1;
      return `
        <g class="usage-bar-group" data-tooltip="${escapeHtml(`${formatDay(row.key)}: ${options.formatValue(value, row)}`)}">
          <rect x="${x - 4}" y="${marginTop}" width="${barWidth + 8}" height="${plotHeight}" fill="transparent" class="usage-bar-hit" tabindex="0" />
          <rect x="${x}" y="${y}" width="${barWidth}" height="${Math.max(barHeight, 1)}" rx="3" class="usage-bar fill-accent transition-colors" />
          ${
            showLabel
              ? `<text x="${x + barWidth / 2}" y="${height - 8}" text-anchor="middle" class="fill-gray-500" font-size="10">${escapeHtml(formatDay(row.key).replace(/, \d{4}$/, ''))}</text>`
              : ''
          }
        </g>`;
    })
    .join('');

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" class="w-full" role="img" aria-label="Daily chart">
      <line x1="${marginLeft}" y1="${marginTop + plotHeight}" x2="${width - 12}" y2="${marginTop + plotHeight}" stroke="#d1d5db" stroke-width="1" />
      ${gridlines}
      ${bars}
    </svg>`;

  const tooltip = document.getElementById('usage-chart-tooltip')!;
  container.querySelectorAll<SVGGElement>('.usage-bar-group').forEach((group) => {
    const bar = group.querySelector('.usage-bar') as SVGRectElement;
    const show = (event: Event) => {
      bar.classList.add('fill-accent-dark');
      const text = group.dataset.tooltip ?? '';
      tooltip.textContent = text;
      tooltip.classList.remove('hidden');
      const rect = (event.currentTarget as Element).getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const parentRect = container.parentElement!.getBoundingClientRect();
      tooltip.style.left = `${rect.left + rect.width / 2 - parentRect.left}px`;
      tooltip.style.top = `${containerRect.top - parentRect.top - 8}px`;
      tooltip.style.transform = 'translate(-50%, -100%)';
    };
    const hide = () => {
      bar.classList.remove('fill-accent-dark');
      tooltip.classList.add('hidden');
    };
    group.addEventListener('pointerenter', show);
    group.addEventListener('pointerleave', hide);
    group.addEventListener('focus', show, true);
    group.addEventListener('blur', hide, true);
  });
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

  renderBarChart('usage-daily-cost-chart', data.by_day, {
    valueOf: (row) => row.cost,
    formatValue: (value, row) => formatCost(value, row.has_unpriced),
    formatAxisTick: (value) => `$${value < 1 ? value.toFixed(2) : value.toFixed(0)}`,
  });
  renderBarChart('usage-daily-tokens-chart', data.by_day, {
    valueOf: (row) => row.total_tokens,
    formatValue: (value) => `${value.toLocaleString()} tokens`,
    formatAxisTick: (value) => (value >= 1000 ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K` : value.toFixed(0)),
  });
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
