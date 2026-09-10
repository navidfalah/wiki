import { copyButtonHtml, initCopyButtons } from './lib/copy';

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
  progress?: { current: number; total: number; recent: string[] } | null;
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
let buildIsRunning = false;
const openStepDetails = new Set<number>();
const openStepErrors = new Set<number>();

const STATUS_TONES: Record<string, string> = {
  running: 'bg-amber-50 text-amber-700',
  success: 'bg-emerald-50 text-emerald-700',
  error: 'bg-red-50 text-red-700',
};

function statusBadge(status: string): string {
  const tone = STATUS_TONES[status] ?? 'bg-gray-100 text-gray-600';
  return `<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tone}">${escapeHtml(status)}</span>`;
}

// Scales through s -> m -> h -> d instead of collapsing everything into
// minutes:seconds -- a run interrupted by a server restart (see
// reconcileOrphanedPipelineRuns on the backend) can carry a multi-day gap
// between started_at and the reconciled finished_at, which read as a
// nonsensical "5501m 44s" before this handled that range.
function formatDuration(startedAt: string, finishedAt: string | null): string {
  const start = new Date(startedAt).getTime();
  const end = finishedAt ? new Date(finishedAt).getTime() : Date.now();
  const seconds = Math.max(0, (end - start) / 1000);
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${Math.round(seconds % 60)}s`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
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
    container.innerHTML = '<p class="p-5 text-sm text-gray-500">No pipeline runs yet. Click "Run compiler" above to start one.</p>';
    return;
  }
  container.innerHTML = runs
    .map((run) => {
      const active = run.id === selectedId;
      return `
      <div class="group relative flex w-full items-start gap-2 px-5 py-3 transition-colors hover:bg-gray-50 ${active ? 'bg-accent/5' : ''}">
        <button
          type="button"
          data-run-id="${escapeHtml(run.id)}"
          class="flex min-w-0 flex-1 flex-col gap-1 text-left">
          <div class="flex items-center justify-between gap-2">
            <span class="truncate text-sm font-medium text-gray-900">${escapeHtml(formatTime(run.started_at))}${run.force ? ' · forced' : ''}</span>
            ${statusBadge(run.status)}
          </div>
          <div class="flex items-center justify-between gap-2 text-xs text-gray-500">
            <span class="truncate font-mono">${escapeHtml(run.id)}</span>
            <span class="shrink-0">${escapeHtml(formatDuration(run.started_at, run.finished_at))}</span>
          </div>
        </button>
        <button
          type="button"
          data-delete-run-id="${escapeHtml(run.id)}"
          title="${run.status === 'running' && buildIsRunning ? 'Stop and delete this run' : 'Delete this run'}"
          class="mt-0.5 shrink-0 rounded-md p-1 text-gray-300 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-0">
          ✕
        </button>
      </div>`;
    })
    .join('');

  container.querySelectorAll<HTMLButtonElement>('button[data-run-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.runId !== selectedId) openStepDetails.clear();
      selectedId = btn.dataset.runId ?? null;
      renderList();
      loadDetail();
    });
  });

  container.querySelectorAll<HTMLButtonElement>('button[data-delete-run-id]').forEach((btn) => {
    btn.addEventListener('click', async (event) => {
      event.stopPropagation();
      const id = btn.dataset.deleteRunId;
      if (!id) return;
      const run = runs.find((r) => r.id === id);
      const confirmMessage =
        run?.status === 'running' && buildIsRunning
          ? `Run ${id} is still in progress. Deleting it will stop the build. Continue?`
          : `Delete run ${id}? This cannot be undone.`;
      if (!window.confirm(confirmMessage)) return;
      btn.disabled = true;
      try {
        const res = await fetch(`${apiBase}/api/pipelines/${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail ?? `Request failed (${res.status})`);
        }
        runs = runs.filter((r) => r.id !== id);
        if (selectedId === id) {
          selectedId = runs.length ? runs[0].id : null;
          document.getElementById('pipeline-run-detail')!.innerHTML =
            '<p class="text-sm text-gray-500">Select a run to see its steps.</p>';
        }
        renderList();
        if (selectedId) loadDetail();
      } catch (err: any) {
        window.alert(err.message ?? 'Could not delete this run.');
        btn.disabled = false;
      }
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

// Live per-item activity while a step is still running -- e.g. which
// chunk Extraction is on right now, out of how many -- instead of a
// running step just sitting there with no visibility into what it's
// doing. `recent` is a small rolling window main.py caps at 20 items,
// newest last; shown newest-first here since that's what you actually
// want to watch scroll by.
function renderStepProgressHtml(progress: RunStep['progress']): string {
  if (!progress || !progress.recent.length) return '';
  const items = progress.recent
    .slice()
    .reverse()
    .map((item) => `<li class="truncate">${escapeHtml(item)}</li>`)
    .join('');
  return `
    <div class="mt-1.5">
      <p class="text-[11px] font-medium text-amber-700">${progress.current}/${progress.total} processed</p>
      <ul class="mt-1 max-h-40 space-y-0.5 overflow-auto rounded-lg border border-amber-100 bg-amber-50/70 px-2.5 py-1.5 font-mono text-[11px] leading-snug text-amber-900">${items}</ul>
    </div>`;
}

function renderStepErrorHtml(error: string, stepIndex: number): string {
  // error is often a full Python traceback (see main.py's exception handler
  // in run_compiler()), not a one-line message -- render it as a scrollable
  // monospace log rather than squashing newlines into an unreadable <p>.
  const firstLine = error.split('\n')[0];
  const isMultiline = error.includes('\n');
  if (!isMultiline) {
    return `<div class="copy-wrap mt-0.5 flex items-start gap-1">
      <p class="copy-source text-xs text-red-600">${escapeHtml(error)}</p>
      ${copyButtonHtml('text-red-600')}
    </div>`;
  }
  const isOpen = openStepErrors.has(stepIndex);
  return `
    <details class="mt-1.5" data-step-error-index="${stepIndex}"${isOpen ? ' open' : ''}>
      <summary class="cursor-pointer text-xs text-red-600 hover:underline">${escapeHtml(firstLine)}</summary>
      <div class="copy-wrap relative mt-1.5">
        <pre class="copy-source max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-red-100 bg-red-50 p-2.5 pr-8 font-mono text-[11px] leading-snug text-red-800">${escapeHtml(error)}</pre>
        ${copyButtonHtml('absolute right-1.5 top-1.5 bg-red-50 text-red-600')}
      </div>
    </details>`;
}

function renderStepDataHtml(data: Record<string, unknown> | null | undefined, stepIndex: number): string {
  if (!data) return '';
  const sections = ['input', 'output']
    .filter((key) => data[key] !== undefined)
    .map((key) => {
      const heading = key === 'input' ? 'Input' : 'Output';
      const tone = key === 'input' ? 'text-source' : 'text-generated';
      return `<div><p class="text-[11px] font-semibold ${tone}">${heading}</p><div class="mt-1 text-xs text-gray-700">${renderValueHtml(
        data[key],
      )}</div></div>`;
    });
  if (!sections.length) return '';
  const isOpen = openStepDetails.has(stepIndex);
  return `
    <details class="mt-1.5" data-step-index="${stepIndex}"${isOpen ? ' open' : ''}>
      <summary class="cursor-pointer text-xs font-medium text-accent hover:underline">Show input / output</summary>
      <div class="mt-2 grid gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 sm:grid-cols-2">${sections.join('')}</div>
    </details>`;
}

function renderDetail(run: RunDetail) {
  const container = document.getElementById('pipeline-run-detail')!;

  const stepsHtml = run.steps
    .map((step, stepIndex) => {
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
          ${step.status === 'running' ? renderStepProgressHtml(step.progress) : ''}
          ${step.error ? renderStepErrorHtml(step.error, stepIndex) : ''}
          ${renderStepDataHtml(step.data, stepIndex)}
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
    ${
      run.error
        ? `<div class="copy-wrap relative mt-3">
             <pre class="copy-source max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-red-50 px-3 py-2 pr-8 font-mono text-[11px] leading-snug text-red-700">${escapeHtml(run.error)}</pre>
             ${copyButtonHtml('absolute right-1.5 top-1.5 bg-red-50 text-red-700')}
           </div>`
        : ''
    }
    <div class="mt-4 flex flex-col gap-2">${stepsHtml}</div>
    <h3 class="mt-5 text-sm font-semibold text-gray-900">Token usage</h3>
    ${usageHtml}
  `;

  container.querySelectorAll<HTMLDetailsElement>('details[data-step-index]').forEach((details) => {
    const stepIndex = Number(details.dataset.stepIndex);
    details.addEventListener('toggle', () => {
      if (details.open) openStepDetails.add(stepIndex);
      else openStepDetails.delete(stepIndex);
    });
  });

  container.querySelectorAll<HTMLDetailsElement>('details[data-step-error-index]').forEach((details) => {
    const stepIndex = Number(details.dataset.stepErrorIndex);
    details.addEventListener('toggle', () => {
      if (details.open) openStepErrors.add(stepIndex);
      else openStepErrors.delete(stepIndex);
    });
  });
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

// --- Run / stop the compiler from this page -------------------------------
// Reuses the same /api/build/* endpoints as the Dashboard's "Run compiler"
// panel. Only one build can run at a time backend-side, so a build started
// from the Dashboard (or another tab) is picked up here via syncBuildStatus().

let buildEventSource: EventSource | null = null;

function setBuildMessage(message: string) {
  document.getElementById('pipeline-build-message')!.textContent = message;
}

function setBuildButtonsRunning(running: boolean) {
  buildIsRunning = running;
  const runButton = document.getElementById('pipeline-run-build') as HTMLButtonElement;
  const stopButton = document.getElementById('pipeline-stop-build') as HTMLButtonElement;
  const badge = document.getElementById('pipeline-build-badge')!;
  runButton.disabled = running;
  stopButton.classList.toggle('hidden', !running);
  stopButton.disabled = false;
  badge.classList.toggle('hidden', !running);
  renderList();
}

async function syncBuildStatus() {
  if (buildEventSource) return; // we own the live stream; don't fight our own state
  try {
    const res = await fetch(`${apiBase}/api/build/status`);
    if (!res.ok) return;
    const data = await res.json();
    setBuildButtonsRunning(Boolean(data.running));
  } catch {
    // ignore -- list polling already surfaces connectivity issues
  }
}

function initBuildControls() {
  const runButton = document.getElementById('pipeline-run-build') as HTMLButtonElement;
  const stopButton = document.getElementById('pipeline-stop-build') as HTMLButtonElement;
  const forceCheckbox = document.getElementById('pipeline-force-rebuild') as HTMLInputElement;

  stopButton.addEventListener('click', async () => {
    stopButton.disabled = true;
    try {
      const res = await fetch(`${apiBase}/api/build/stop`, { method: 'POST' });
      const data = await res.json();
      if (!data.stopped) setBuildMessage('Nothing to stop — no build is running.');
    } catch {
      setBuildMessage('ERROR: Could not reach the API to stop the build.');
    }
  });

  runButton.addEventListener('click', async () => {
    let alreadyRunning = false;
    try {
      const res = await fetch(`${apiBase}/api/build/status`);
      const status = await res.json();
      alreadyRunning = Boolean(status.running);
    } catch {
      setBuildMessage(`Cannot reach API at ${apiBase}.`);
      return;
    }

    // A build already running doesn't block this one -- /api/build/stream
    // queues it (one deep) and starts it automatically once the current
    // build finishes, rather than rejecting the request outright.
    setBuildMessage(alreadyRunning ? 'A build is already running — queuing this one…' : 'Starting…');
    setBuildButtonsRunning(true);

    const params = new URLSearchParams();
    if (forceCheckbox.checked) params.set('force', 'true');
    const source = new EventSource(`${apiBase}/api/build/stream?${params.toString()}`);
    buildEventSource = source;

    source.onmessage = (event) => {
      let payload: any;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }
      if (payload.type === 'start' || payload.type === 'log' || payload.type === 'queued') {
        setBuildMessage(payload.message);
      } else if (payload.type === 'error') {
        setBuildMessage(`Error: ${payload.message}`);
      } else if (payload.type === 'done') {
        setBuildMessage(payload.message ?? (payload.success ? 'Finished.' : 'Failed.'));
        setBuildButtonsRunning(false);
        source.close();
        buildEventSource = null;
        loadList();
      }
    };
    source.onerror = () => {
      if (source.readyState === EventSource.CLOSED) return;
      setBuildMessage('Lost connection to the build stream.');
      setBuildButtonsRunning(false);
      source.close();
      buildEventSource = null;
    };
  });
}

async function tick() {
  await loadList();
  await loadDetail();
  await syncBuildStatus();
  const anyRunning = runs.some((r) => r.status === 'running');
  pollTimer = window.setTimeout(tick, anyRunning ? 2000 : 8000);
}

window.addEventListener('beforeunload', () => {
  if (pollTimer) window.clearTimeout(pollTimer);
  buildEventSource?.close();
});

initBuildControls();
initCopyButtons();
tick();
