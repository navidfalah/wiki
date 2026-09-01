const apiBase = document.querySelector('meta[name="api-base"]')?.getAttribute('content') ?? '';

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

interface RunSummary {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: 'running' | 'success' | 'error';
  force: boolean;
}

interface RunStep {
  name: string;
  status: 'running' | 'success' | 'error';
  started_at: string;
  finished_at: string | null;
  detail: string | null;
  error: string | null;
  data?: Record<string, unknown> | null;
}

interface TokenUsageRow {
  step: string;
  model: string;
  calls: number;
  cache_hits: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface LlmBackendInfo {
  mode: 'local' | 'cloud' | 'none';
  base_url: string;
  model: string;
}

interface RunDetail extends RunSummary {
  error: string | null;
  steps: RunStep[];
  token_usage: TokenUsageRow[];
  llm_backend: LlmBackendInfo;
}

let runs: RunSummary[] = [];
let selectedId: string | null = null;
let pollTimer: number | undefined;

const STATUS_TONES: Record<string, string> = {
  running: 'bg-amber-50 text-amber-700',
  success: 'bg-emerald-50 text-emerald-700',
  error: 'bg-red-50 text-red-700',
};

function statusBadge(status: string): string {
  const tone = STATUS_TONES[status] ?? 'bg-gray-100 text-gray-600';
  return `<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tone}">${escapeHtml(status)}</span>`;
}

function formatDuration(startedAt: string, finishedAt: string | null): string {
  const start = new Date(startedAt).getTime();
  const end = finishedAt ? new Date(finishedAt).getTime() : Date.now();
  const seconds = Math.max(0, (end - start) / 1000);
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${Math.round(seconds % 60)}s`;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function renderList() {
  const container = document.getElementById('pipeline-runs-list')!;
  if (!runs.length) {
    container.innerHTML = '<p class="p-5 text-sm text-gray-500">No pipeline runs yet. Run the compiler from the Dashboard.</p>';
    return;
  }
  container.innerHTML = runs
    .map((run) => {
      const active = run.id === selectedId;
      return `
      <button
        type="button"
        data-run-id="${escapeHtml(run.id)}"
        class="flex w-full flex-col gap-1 px-5 py-3 text-left transition-colors hover:bg-gray-50 ${active ? 'bg-accent/5' : ''}">
        <div class="flex items-center justify-between gap-2">
          <span class="truncate text-sm font-medium text-gray-900">${escapeHtml(run.id)}</span>
          ${statusBadge(run.status)}
        </div>
        <div class="flex items-center justify-between gap-2 text-xs text-gray-500">
          <span>${escapeHtml(formatTime(run.started_at))}${run.force ? ' · forced' : ''}</span>
          <span>${escapeHtml(formatDuration(run.started_at, run.finished_at))}</span>
        </div>
      </button>`;
    })
    .join('');

  container.querySelectorAll<HTMLButtonElement>('button[data-run-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedId = btn.dataset.runId ?? null;
      renderList();
      loadDetail();
    });
  });
}

function stepIcon(status: string): string {
  if (status === 'success') return '✓';
  if (status === 'error') return '✕';
  return '…';
}

function emptyUsageMessage(backend: LlmBackendInfo | undefined, status: string): string {
  if (status === 'running') return 'Still running — token usage totals are recorded once the run finishes.';
  if (!backend) return 'No token usage recorded for this run.';
  if (backend.mode === 'local') {
    return `Running a local model (${backend.model} via ${backend.base_url}) — this backend doesn't report token counts.`;
  }
  if (backend.mode === 'none') {
    return 'No OPENAI_API_KEY configured — this run used the no-LLM/extractive path, so there are no tokens to report.';
  }
  return 'No LLM calls were needed for this run (nothing new to extract or synthesize).';
}

function renderValueHtml(value: unknown): string {
  if (Array.isArray(value)) {
    if (!value.length) return '<span class="text-gray-400">(none)</span>';
    const shown = value.slice(0, 20);
    const extra = value.length - shown.length;
    return `<ul class="mt-0.5 list-disc space-y-0.5 pl-4">${shown
      .map((v) => `<li class="break-all">${escapeHtml(String(v))}</li>`)
      .join('')}</ul>${extra > 0 ? `<p class="mt-0.5 text-gray-400">+ ${extra} more</p>` : ''}`;
  }
  if (value && typeof value === 'object') {
    return `<ul class="mt-0.5 space-y-0.5">${Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `<li><span class="text-gray-500">${escapeHtml(k)}:</span> ${renderValueHtml(v)}</li>`)
      .join('')}</ul>`;
  }
  return escapeHtml(String(value));
}

function renderStepDataHtml(data: Record<string, unknown> | null | undefined): string {
  if (!data) return '';
  const sections = ['input', 'output']
    .filter((key) => data[key] !== undefined)
    .map((key) => {
      const heading = key === 'input' ? 'Input' : 'Output';
      const tone = key === 'input' ? 'text-source' : 'text-generated';
      return `<div><p class="text-[11px] font-semibold uppercase tracking-wide ${tone}">${heading}</p><div class="mt-1 text-xs text-gray-700">${renderValueHtml(
        data[key],
      )}</div></div>`;
    });
  if (!sections.length) return '';
  return `
    <details class="mt-1.5">
      <summary class="cursor-pointer text-xs font-medium text-accent hover:underline">Show input / output</summary>
      <div class="mt-2 grid gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 sm:grid-cols-2">${sections.join('')}</div>
    </details>`;
}

function renderDetail(run: RunDetail) {
  const container = document.getElementById('pipeline-run-detail')!;

  const stepsHtml = run.steps
    .map((step) => {
      const tone =
        step.status === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : step.status === 'error'
            ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-amber-200 bg-amber-50 text-amber-700';
      return `
      <div class="flex gap-3 rounded-lg border border-gray-200 px-4 py-3">
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${tone}">${stepIcon(step.status)}</span>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-sm font-medium text-gray-900">${escapeHtml(step.name)}</span>
            <span class="text-xs text-gray-500">${escapeHtml(formatDuration(step.started_at, step.finished_at))}</span>
          </div>
          ${step.detail ? `<p class="mt-0.5 text-xs text-gray-600">${escapeHtml(step.detail)}</p>` : ''}
          ${step.error ? `<p class="mt-0.5 text-xs text-red-600">${escapeHtml(step.error)}</p>` : ''}
          ${renderStepDataHtml(step.data)}
        </div>
      </div>`;
    })
    .join('');

  const usageRows = run.token_usage ?? [];
  const grandTotal = usageRows.reduce((sum, row) => sum + row.total_tokens, 0);
  const usageHtml = usageRows.length
    ? `
      <table class="mt-2 w-full text-left text-xs">
        <thead>
          <tr class="text-gray-500">
            <th class="py-1 pr-2 font-medium">Step</th>
            <th class="py-1 pr-2 font-medium">Model</th>
            <th class="py-1 pr-2 text-right font-medium">Calls</th>
            <th class="py-1 pr-2 text-right font-medium">Cache hits</th>
            <th class="py-1 text-right font-medium">Total tokens</th>
          </tr>
        </thead>
        <tbody>
          ${usageRows
            .map(
              (row) => `
            <tr class="border-t border-gray-100">
              <td class="py-1 pr-2 text-gray-700">${escapeHtml(row.step)}</td>
              <td class="py-1 pr-2 text-gray-700">${escapeHtml(row.model)}</td>
              <td class="py-1 pr-2 text-right text-gray-700">${row.calls}</td>
              <td class="py-1 pr-2 text-right text-gray-700">${row.cache_hits}</td>
              <td class="py-1 text-right font-medium text-gray-900">${row.total_tokens.toLocaleString()}</td>
            </tr>`,
            )
            .join('')}
        </tbody>
        <tfoot>
          <tr class="border-t border-gray-200">
            <td colspan="4" class="py-1 pr-2 text-right text-xs font-medium text-gray-600">Grand total</td>
            <td class="py-1 text-right text-xs font-semibold text-gray-900">${grandTotal.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>`
    : `<p class="mt-2 text-xs text-gray-500">${escapeHtml(emptyUsageMessage(run.llm_backend, run.status))}</p>`;

  container.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <p class="text-sm font-semibold text-gray-900">${escapeHtml(run.id)}</p>
        <p class="text-xs text-gray-500">${escapeHtml(formatTime(run.started_at))}${run.force ? ' · forced rebuild' : ''}</p>
      </div>
      ${statusBadge(run.status)}
    </div>
    ${run.error ? `<p class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">${escapeHtml(run.error)}</p>` : ''}
    <div class="mt-4 flex flex-col gap-2">${stepsHtml}</div>
    <h3 class="mt-5 text-sm font-semibold text-gray-900">Token usage</h3>
    ${usageHtml}
  `;
}

async function loadList() {
  try {
    const res = await fetch(`${apiBase}/api/pipelines`);
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    const data = await res.json();
    runs = data.runs ?? [];
    if (!selectedId && runs.length) selectedId = runs[0].id;
    renderList();
  } catch {
    document.getElementById('pipeline-runs-list')!.innerHTML =
      `<p class="p-5 text-sm text-red-600">Cannot reach API at ${escapeHtml(apiBase)}.</p>`;
  }
}

async function loadDetail() {
  if (!selectedId) return;
  const container = document.getElementById('pipeline-run-detail')!;
  try {
    const res = await fetch(`${apiBase}/api/pipelines/${encodeURIComponent(selectedId)}`);
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    const run: RunDetail = await res.json();
    renderDetail(run);
  } catch {
    container.innerHTML = '<p class="text-sm text-red-600">Could not load this run.</p>';
  }
}

async function tick() {
  await loadList();
  await loadDetail();
  const anyRunning = runs.some((r) => r.status === 'running');
  pollTimer = window.setTimeout(tick, anyRunning ? 2000 : 8000);
}

window.addEventListener('beforeunload', () => {
  if (pollTimer) window.clearTimeout(pollTimer);
});

tick();
