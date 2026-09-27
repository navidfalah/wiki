import { saveCache, loadCache, showOfflineBanner, hideOfflineBanner, onReconnect } from './lib/cache';
import { copyButtonHtml, initCopyButtons } from './lib/copy';
import { t, th, tnh } from './lib/i18n';
import { buildMessage, runMessage, stepName } from './lib/serverText';
import { apiBase, apiFetch } from './lib/api';
import { el, escapeHtml } from './lib/dom';
import {
  type ActivityEvent,
  type DocSummary,
  latestRun,
  renderActivity,
  renderAttentionSummary,
  renderRecentPages,
  renderStatusCards,
} from './lib/dashboardHome';

// --- Offline / cached-data banner ----------------------------------------

// Several loaders below (stat cards, sources, files) can each fail
// independently, so track how many are currently falling back to cached
// data and only hide the banner once none of them are.
let offlineFailures = 0;

function markOffline(savedAt: number) {
  offlineFailures += 1;
  showOfflineBanner(savedAt);
}

function markOnline() {
  offlineFailures = Math.max(0, offlineFailures - 1);
  if (offlineFailures === 0) hideOfflineBanner();
}

// --- Home: status cards, attention, recent pages, activity -----------------

const HOME_CACHE_KEY = 'dashboard:home';

interface HomeData {
  analytics: any | null;
  attention: any | null;
  docs: DocSummary[] | null;
  runs: any[] | null;
  activity: ActivityEvent[] | null;
}

function renderHome(data: HomeData) {
  const m = data.analytics?.metrics;
  el('status-cards').innerHTML = renderStatusCards({
    pages: data.docs ? recentPagesTotal(data.docs) : (m?.wiki_pages_created ?? null),
    crossLinks: m?.cross_links_established ?? null,
    rawProcessed: m?.raw_files_processed ?? null,
    rawTotal: m?.raw_files_total ?? null,
    attentionTotal: data.attention?.counts?.total ?? null,
    deadLinks: data.attention?.counts?.dead_links ?? m?.dead_links ?? null,
    lastRun: data.runs ? latestRun(data.runs) : undefined,
  });
  el('attention-summary').innerHTML = renderAttentionSummary(data.attention?.counts, data.attention?.items ?? []);
  el('recent-pages').innerHTML = renderRecentPages(data.docs);
  el('recent-activity').innerHTML = renderActivity(data.activity);
}

function recentPagesTotal(docs: DocSummary[]): number {
  return docs.filter((d) => d.path !== 'index.md' && d.path !== 'log.md').length;
}

async function loadHome() {
  const cached = loadCache<HomeData>(HOME_CACHE_KEY);
  if (cached) renderHome(cached.data);

  // Each panel degrades on its own: a failing endpoint blanks one card, not the page.
  const get = (url: string) => apiFetch(url).catch(() => null);
  const [analytics, attention, docs, runs, activity] = await Promise.all([
    get('/api/analytics'),
    get('/api/attention'),
    get('/api/docs'),
    get('/api/pipelines'),
    get('/api/activity?limit=40'),
  ]);
  if (!analytics && !docs && !attention) {
    if (cached) markOffline(cached.savedAt);
    else renderHome({ analytics: null, attention: null, docs: null, runs: null, activity: null });
    return;
  }
  const data: HomeData = {
    analytics,
    attention,
    docs: docs?.pages ?? null,
    runs: runs?.runs ?? null,
    activity: activity?.events ?? null,
  };
  saveCache(HOME_CACHE_KEY, data);
  markOnline();
  renderHome(data);
}

// --- Build / run compiler -----------------------------------------------

function setBadge(status: 'idle' | 'running' | 'success' | 'error' | 'stopped') {
  const labels: Record<string, string> = {
    idle: t('dashboard.badge.idle'),
    running: t('dashboard.badge.running'),
    success: t('dashboard.badge.success'),
    error: t('dashboard.badge.error'),
    stopped: t('dashboard.badge.stopped'),
  };
  const tones: Record<string, string> = {
    idle: 'bg-gray-100 text-gray-600',
    running: 'bg-amber-50 text-amber-700',
    success: 'bg-emerald-50 text-emerald-700',
    error: 'bg-red-50 text-red-700',
    stopped: 'bg-gray-100 text-gray-600',
  };
  const badge = el('build-status-badge');
  badge.className = `inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tones[status]}`;
  badge.textContent = labels[status];
}

function setMessage(text: string) {
  el('build-message').textContent = text;
}

// Fixed 5-step sequence main.py always runs, in order -- see
// _step_banner() calls in compiler/main.py. Hardcoded here so the
// dashboard can show all 5 as "pending" placeholders before a run (or
// before its first step has reported in), not just the ones seen so far.
const BUILD_STEP_NAMES = ['1. Data Reading', '2. Extraction', '3. Synthesis', '4. Indexing', '5. Cross-linking'];

interface LiveStep {
  name: string;
  status: 'running' | 'success' | 'error' | 'stopped';
  started_at: string;
  detail: string | null;
  error: string | null;
  progress?: { current: number; total: number; recent: string[] } | null;
}

// A rough ETA from elapsed-time-so-far × remaining/done items -- not a
// model of the pipeline's actual timing (early items are typically
// slower/faster than later ones, e.g. cache warm-up), just enough to tell
// "a couple minutes" from "almost done" while a step is running. Returns
// null until there's at least one completed item to extrapolate from.
function estimateRemaining(startedAt: string, current: number, total: number): string | null {
  if (current <= 0 || current >= total) return null;
  const elapsedMs = Date.now() - new Date(startedAt).getTime();
  if (elapsedMs <= 0) return null;
  const remainingMs = (elapsedMs / current) * (total - current);
  if (remainingMs < 5000) return t('dashboard.eta.lessThanMin');
  const minutes = Math.round(remainingMs / 60000);
  if (minutes < 1) return t('dashboard.eta.lessThanMin');
  if (minutes < 60) return t('dashboard.eta.minutes', { n: minutes });
  const hours = Math.round(minutes / 60);
  return t('dashboard.eta.hours', { n: hours });
}

function stepIcon(status: string): string {
  if (status === 'success') return '✓';
  if (status === 'error') return '✕';
  if (status === 'stopped') return '⏸';
  if (status === 'running') return '●';
  return '';
}

function stepTone(status: string): string {
  if (status === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'error') return 'border-red-200 bg-red-50 text-red-700';
  // Deliberately the same neutral as "pending" -- a user-requested stop
  // isn't a failure, just an incomplete step.
  if (status === 'stopped') return 'border-gray-200 bg-gray-100 text-gray-600';
  if (status === 'running') return 'border-amber-200 bg-amber-50 text-amber-700 animate-pulse';
  return 'border-gray-200 bg-gray-50 text-gray-300';
}

// Persists across renderBuildSteps() re-renders (polled every 1.2s while a
// build runs) so expanding a failed step's log doesn't snap shut on the next
// poll tick.
const expandedErrorSteps = new Set<string>();
const expandedProgressSteps = new Set<string>();

// Rendered left-to-right on desktop (top-to-bottom on narrow screens, where
// five side-by-side boxes wouldn't leave room for the step names) -- a
// chevron between boxes reads as a pipeline flowing forward instead of an
// unordered stack of cards.
const STEP_ARROW = `<span class="hidden shrink-0 self-center text-gray-300 md:block" aria-hidden="true">›</span>`;

function renderBuildSteps(liveSteps: LiveStep[]) {
  const byName = new Map(liveSteps.map((s) => [s.name, s]));
  el('build-steps').innerHTML = BUILD_STEP_NAMES.map((name, index) => {
    const step = byName.get(name);
    const status = step?.status ?? 'pending';
    const hasError = Boolean(step?.error);
    const hasProgress = status === 'running' && Boolean(step?.progress?.recent?.length);
    const canToggle = hasError || hasProgress;
    const expanded = (hasError && expandedErrorSteps.has(name)) || (hasProgress && expandedProgressSteps.has(name));
    const errorFirstLine = step?.error ? step.error.split('\n')[0] : '';
    const progressCounter = step?.progress ? `${step.progress.current}/${step.progress.total}` : '';
    const eta =
      step?.status === 'running' && step.progress ? estimateRemaining(step.started_at, step.progress.current, step.progress.total) : null;
    const box = `
      <div class="min-w-0 rounded-lg border ${stepTone(status)} md:flex-1">
        <button
          type="button"
          data-step-toggle="${escapeHtml(name)}"
          class="flex w-full items-center gap-2.5 px-3 py-1.5 text-left ${canToggle ? 'cursor-pointer' : 'cursor-default'}"
          ${canToggle ? '' : 'disabled'}>
          <span class="flex h-4 w-4 shrink-0 items-center justify-center text-[10px] font-bold">${stepIcon(status)}</span>
          <span class="min-w-0 flex-1 truncate text-xs font-medium">${escapeHtml(stepName(name).replace(/^\d+\.\s*/, ''))}</span>
          ${progressCounter ? `<span class="shrink-0 text-[11px] tabular-nums opacity-80">${escapeHtml(progressCounter)}</span>` : ''}
          ${eta ? `<span class="hidden shrink-0 text-[11px] opacity-70 sm:inline">${escapeHtml(eta)}</span>` : ''}
          ${step?.detail ? `<span class="hidden truncate text-[11px] opacity-80 lg:inline">${escapeHtml(step.detail)}</span>` : ''}
          ${step?.error ? `<span class="truncate text-[11px]">${escapeHtml(errorFirstLine)}</span>` : ''}
          ${hasError ? `<span class="shrink-0 text-[10px] underline opacity-80">${expanded ? th('dashboard.step.hideLog') : th('dashboard.step.viewLog')}</span>` : ''}
          ${!hasError && hasProgress ? `<span class="shrink-0 text-[10px] underline opacity-80">${expanded ? th('dashboard.step.hideActivity') : th('dashboard.step.viewActivity')}</span>` : ''}
        </button>
        ${
          expanded && hasError
            ? `<div class="copy-wrap relative border-t ${status === 'stopped' ? 'border-gray-200' : 'border-red-200'}">
                 <pre class="copy-source max-h-64 overflow-auto whitespace-pre-wrap break-words ${status === 'stopped' ? 'bg-gray-100/70 text-gray-700' : 'bg-red-50/70 text-red-800'} px-3 py-2 pr-8 font-mono text-[11px]">${escapeHtml(step!.error!)}</pre>
                 ${copyButtonHtml(`absolute right-1.5 top-1.5 ${status === 'stopped' ? 'bg-gray-100 text-gray-700' : 'bg-red-50 text-red-800'}`)}
               </div>`
            : ''
        }
        ${
          expanded && !hasError && hasProgress
            ? `<ul class="max-h-64 space-y-0.5 overflow-auto border-t border-amber-200 bg-amber-50/70 px-3 py-2 font-mono text-[11px] text-amber-900">${step!
                .progress!.recent.slice()
                .reverse()
                .map((item) => `<li class="truncate">${escapeHtml(item)}</li>`)
                .join('')}</ul>`
            : ''
        }
      </div>`;
    return index === 0 ? box : STEP_ARROW + box;
  }).join('');

  el('build-steps')
    .querySelectorAll<HTMLButtonElement>('[data-step-toggle]')
    .forEach((btn) => {
      btn.addEventListener('click', () => {
        const name = btn.dataset.stepToggle ?? '';
        const step = byName.get(name);
        if (step?.error) {
          if (expandedErrorSteps.has(name)) expandedErrorSteps.delete(name);
          else expandedErrorSteps.add(name);
        } else if (step?.progress?.recent?.length) {
          if (expandedProgressSteps.has(name)) expandedProgressSteps.delete(name);
          else expandedProgressSteps.add(name);
        } else {
          return;
        }
        renderBuildSteps(liveSteps);
      });
    });
}

interface RunSettings {
  default?: { model: string; base_url: string; available: boolean };
  thinking?: { model: string; base_url: string; available: boolean };
  embedding?: { model: string };
}

/** Shows which LLM profile (per purpose) the running/last build actually
 * used -- see backend/src/lib/pipelineRuns.ts's PipelineRunSettings. Lets
 * the "Run compiler" panel answer "which settings is this working with"
 * without opening the Pipelines page's run detail. */
function renderSettingsHint(settings: RunSettings | null | undefined) {
  const hint = document.getElementById('build-settings-hint');
  if (!hint) return;
  if (!settings?.default) {
    hint.textContent = '';
    return;
  }
  const parts = [`${t('pipelines.settings.default')}: ${settings.default.model}`];
  if (settings.thinking && settings.thinking.model !== settings.default.model) {
    parts.push(`${t('pipelines.settings.thinking')}: ${settings.thinking.model}`);
  }
  if (settings.embedding?.model) parts.push(`${t('pipelines.settings.embedding')}: ${settings.embedding.model}`);
  hint.textContent = t('dashboard.workingWith', { parts: parts.join(' · ') });
}

let buildPollTimer: number | undefined;
let currentRunId: string | null = null;

function stopBuildPolling() {
  if (buildPollTimer) {
    window.clearInterval(buildPollTimer);
    buildPollTimer = undefined;
  }
}

// Set when polling notices a run it's watching has finished without an SSE
// 'done' event to tell it so -- i.e. a run resumed via attachToRunningBuild
// on page load rather than one started from this same page load. Read once
// by pollBuildSteps' caller-side finish handling below.
let onBuildFinishedWhilePolling: ((run: any) => void) | null = null;

async function pollBuildSteps() {
  if (!currentRunId) return;
  try {
    const run = await apiFetch(`/api/pipelines/${encodeURIComponent(currentRunId)}`);
    renderBuildSteps(run.steps ?? []);
    if (run.status !== 'running' && onBuildFinishedWhilePolling) {
      onBuildFinishedWhilePolling(run);
    }
    renderSettingsHint(run.settings);
  } catch {
    /* transient -- keep the last rendered state and try again next tick */
  }
}

function startBuildPolling() {
  stopBuildPolling();
  pollBuildSteps();
  buildPollTimer = window.setInterval(pollBuildSteps, 1200);
}

// --- Sources-to-include picker --------------------------------------------

let excludedTopFolders = new Set<string>();

function topLevelFolders(): string[] {
  const tops = new Set<string>();
  for (const f of foldersCache) tops.add(f.split('/')[0]);
  for (const f of filesCache) tops.add(f.path.split('/')[0]);
  return [...tops].sort();
}

function renderSourcesPicker() {
  const tops = topLevelFolders();
  // Drop exclusions for folders that no longer exist, so the count stays honest.
  excludedTopFolders = new Set([...excludedTopFolders].filter((t) => tops.includes(t)));

  const list = el('sources-picker-list');
  if (!tops.length) {
    list.innerHTML = `<p class="text-xs text-gray-400">${th('dashboard.picker.none')}</p>`;
  } else {
    list.innerHTML = tops
      .map((t) => {
        const checked = !excludedTopFolders.has(t);
        const managed = managedFolders.includes(t);
        return `
        <label class="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 ${
          checked ? '' : 'opacity-50'
        }">
          <input type="checkbox" data-top-folder="${escapeHtml(t)}" ${checked ? 'checked' : ''} class="rounded border-gray-300 text-accent focus:ring-accent/30" />
          <span class="font-mono text-xs text-gray-700">${escapeHtml(t)}</span>
          ${managed ? `<span class="text-[10px] text-source">${th('dashboard.picker.source')}</span>` : ''}
        </label>`;
      })
      .join('');
    list.querySelectorAll<HTMLInputElement>('[data-top-folder]').forEach((input) =>
      input.addEventListener('change', () => {
        const top = input.dataset.topFolder ?? '';
        if (input.checked) excludedTopFolders.delete(top);
        else excludedTopFolders.add(top);
        renderSourcesPicker();
      }),
    );
  }

  const total = tops.length;
  const included = total - excludedTopFolders.size;
  el('sources-picker-count').textContent = total ? `(${included}/${total})` : '';
}

function initSourcesPicker() {
  const toggle = el('sources-picker-toggle');
  const panel = el('sources-picker');
  toggle.addEventListener('click', () => {
    const open = panel.classList.contains('hidden');
    panel.classList.toggle('hidden', !open);
    toggle.setAttribute('aria-expanded', String(open));
  });
}

// --- Run options (critic pass, corrections, PII redaction) ----------------

function updateRunOptionsCount() {
  const criticOn = (el('run-opt-critic-pass') as HTMLInputElement).checked;
  const correctionsOn = (el('run-opt-use-corrections') as HTMLInputElement).checked;
  const redactOn = (el('run-opt-redact-pii') as HTMLInputElement).checked;
  const webSearchOn = (el('run-opt-web-search') as HTMLInputElement).checked;
  const defaultModelOn = (el('run-opt-default-model') as HTMLSelectElement).value !== '';
  const thinkingModelOn = (el('run-opt-thinking-model') as HTMLSelectElement).value !== '';
  const count = [criticOn, correctionsOn, redactOn, webSearchOn, defaultModelOn, thinkingModelOn].filter(Boolean).length;
  el('run-options-count').textContent = count ? `(${count})` : '';
}

interface LlmProfile {
  id: string;
  label: string;
  model: string;
}

/** Populates the per-run "Extraction/linking model" and "Synthesis model"
 *  pickers from the Settings page's providers -- overriding "default"/
 *  "thinking" for just this build (see routes/index.ts's /api/build/stream
 *  and pythonBridge.ts's streamCompilerBuild). */
async function loadRunOptionModels() {
  const defaultSelect = el('run-opt-default-model') as HTMLSelectElement;
  const thinkingSelect = el('run-opt-thinking-model') as HTMLSelectElement;
  try {
    const settings = await apiFetch('/api/settings/llm');
    const profiles: LlmProfile[] = settings.profiles ?? [];
    const optionsHtml =
      `<option value="">${th('dashboard.opt.defaultOption')}</option>` +
      profiles.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.label)} — ${escapeHtml(p.model)}</option>`).join('');
    defaultSelect.innerHTML = optionsHtml;
    thinkingSelect.innerHTML = optionsHtml;
  } catch {
    /* leave the "Default (from Settings)" fallback option in place */
  }
}

function initRunOptions() {
  const toggle = el('run-options-toggle');
  const panel = el('run-options');
  toggle.addEventListener('click', () => {
    const open = panel.classList.contains('hidden');
    panel.classList.toggle('hidden', !open);
    toggle.setAttribute('aria-expanded', String(open));
  });

  const criticPass = el('run-opt-critic-pass') as HTMLInputElement;
  const criticSamplesLabel = el('run-opt-critic-samples-label');
  const criticRegenerateLabel = el('run-opt-critic-regenerate-label');

  const syncCriticSubOptions = () => {
    criticSamplesLabel.classList.toggle('hidden', !criticPass.checked);
    criticRegenerateLabel.classList.toggle('hidden', !criticPass.checked);
  };
  syncCriticSubOptions();

  ['run-opt-critic-pass', 'run-opt-use-corrections', 'run-opt-redact-pii', 'run-opt-web-search'].forEach((id) =>
    el(id).addEventListener('change', () => {
      syncCriticSubOptions();
      updateRunOptionsCount();
    }),
  );
  ['run-opt-default-model', 'run-opt-thinking-model'].forEach((id) => el(id).addEventListener('change', updateRunOptionsCount));
  updateRunOptionsCount();
  loadRunOptionModels();
}

function runOptionsParams(): Record<string, string> {
  const criticPass = (el('run-opt-critic-pass') as HTMLInputElement).checked;
  const criticSamples = (el('run-opt-critic-samples') as HTMLInputElement).value.trim();
  const criticRegenerate = (el('run-opt-critic-regenerate') as HTMLInputElement).checked;
  const useCorrections = (el('run-opt-use-corrections') as HTMLInputElement).checked;
  const redactPii = (el('run-opt-redact-pii') as HTMLInputElement).checked;
  const webSearch = (el('run-opt-web-search') as HTMLInputElement).checked;
  const defaultProfileId = (el('run-opt-default-model') as HTMLSelectElement).value;
  const thinkingProfileId = (el('run-opt-thinking-model') as HTMLSelectElement).value;

  const params: Record<string, string> = {};
  if (criticPass) {
    params.critic_pass = 'true';
    if (criticSamples && Number(criticSamples) > 1) params.critic_samples = criticSamples;
    if (criticRegenerate) params.critic_regenerate = 'true';
  }
  if (useCorrections) params.use_corrections = 'true';
  if (redactPii) params.redact_pii = 'true';
  if (webSearch) params.web_search = 'true';
  if (defaultProfileId) params.default_profile_id = defaultProfileId;
  if (thinkingProfileId) params.thinking_profile_id = thinkingProfileId;
  return params;
}

function initBuild() {
  const runButton = el('run-build') as HTMLButtonElement;
  const stopButton = el('stop-build') as HTMLButtonElement;
  const forceCheckbox = el('force-rebuild') as HTMLInputElement;

  renderBuildSteps([]);

  stopButton.addEventListener('click', async () => {
    stopButton.disabled = true;
    try {
      const res = await fetch(`${apiBase}/api/build/stop`, { method: 'POST' });
      const data = await res.json();
      if (!data.stopped) setMessage(t('dashboard.nothingToStop'));
    } catch {
      setMessage(t('dashboard.stopFailed'));
    }
  });

  runButton.addEventListener('click', async () => {
    let alreadyRunning = false;
    try {
      const status = await apiFetch('/api/build/status');
      alreadyRunning = Boolean(status.running);
    } catch {
      setMessage(t('common.cannotReachApi'));
      return;
    }

    currentRunId = null;
    renderBuildSteps([]);
    renderSettingsHint(null);
    // A build already running doesn't block this one -- /api/build/stream
    // queues it (one deep) and starts it automatically once the current
    // build finishes, rather than rejecting the request outright.
    setMessage(alreadyRunning ? t('dashboard.queuing') : t('common.build.starting'));
    setBadge('running');
    runButton.disabled = true;
    stopButton.classList.remove('hidden');
    stopButton.disabled = false;

    const params = new URLSearchParams();
    if (forceCheckbox.checked) params.set('force', 'true');
    if (excludedTopFolders.size) params.set('exclude_folders', [...excludedTopFolders].join(','));
    for (const [key, value] of Object.entries(runOptionsParams())) params.set(key, value);
    const source = new EventSource(`${apiBase}/api/build/stream?${params.toString()}`);

    source.onmessage = (event) => {
      let payload: any;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }
      if (payload.type === 'run_id') {
        currentRunId = payload.run_id;
        startBuildPolling();
      } else if (payload.type === 'queued') {
        setMessage(buildMessage(payload.message));
      } else if (payload.type === 'error') {
        setMessage(t('dashboard.errorPrefix', { message: buildMessage(payload.message) }));
      } else if (payload.type === 'done') {
        stopBuildPolling();
        pollBuildSteps(); // one last fetch -- the process has exited, so this is guaranteed to see the final step state
        setMessage(payload.message ? buildMessage(payload.message) : payload.success ? t('dashboard.finished') : t('dashboard.failed'));
        setBadge(payload.stopped ? 'stopped' : payload.success ? 'success' : 'error');
        runButton.disabled = false;
        stopButton.classList.add('hidden');
        source.close();
        if (payload.success) {
          loadHome();
          loadFiles();
        }
      }
    };
    source.onerror = () => {
      if (source.readyState === EventSource.CLOSED) return;
      stopBuildPolling();
      setMessage(t('dashboard.lostConnection'));
      setBadge('error');
      runButton.disabled = false;
      stopButton.classList.add('hidden');
      source.close();
    };
  });

  attachToRunningBuildIfAny(runButton, stopButton);
}

/**
 * Reattaches to an already-running build on page load -- e.g. the user
 * started a build, navigated to Wiki, and came back to Dashboard. The run
 * itself already lives on disk (data/pipeline_runs/<id>.json) independent
 * of this page; the only thing that resets on navigation is this module's
 * in-memory `currentRunId`/SSE connection, so all this needs to do is find
 * the run again and resume polling it -- no separate state store (Redis or
 * otherwise) required, since the backend was never the part that forgot.
 * There's no SSE stream to reattach to (that's tied to the one HTTP
 * response that started it), so pollBuildSteps' terminal-status check
 * (see onBuildFinishedWhilePolling) is what notices this run finishing.
 */
async function attachToRunningBuildIfAny(runButton: HTMLButtonElement, stopButton: HTMLButtonElement) {
  try {
    const status = await apiFetch('/api/build/status');
    if (!status.running) return;
    const { runs } = await apiFetch('/api/pipelines');
    const liveRun = (runs ?? []).find((r: any) => r.status === 'running');
    if (!liveRun) return;

    currentRunId = liveRun.id;
    setMessage(t('dashboard.reattached'));
    setBadge('running');
    runButton.disabled = true;
    stopButton.classList.remove('hidden');
    stopButton.disabled = false;
    onBuildFinishedWhilePolling = (run) => {
      stopBuildPolling();
      onBuildFinishedWhilePolling = null;
      if (run.status === 'stopped') {
        setMessage(t('common.build.stopped'));
      } else if (run.status === 'error') {
        setMessage(t('dashboard.buildFailed', { error: runMessage(run.error) || t('dashboard.unknownError') }));
      } else {
        setMessage(t('dashboard.finished'));
      }
      setBadge(run.status === 'success' ? 'success' : run.status === 'stopped' ? 'stopped' : 'error');
      runButton.disabled = false;
      stopButton.classList.add('hidden');
      if (run.status === 'success') {
        loadHome();
        loadFiles();
      }
    };
    startBuildPolling();
  } catch {
    /* Cannot reach the API right now -- next page load tries again; not
     * worth a retry loop for a one-time reattachment check. */
  }
}

// --- Source folders ------------------------------------------------------

let sourcesCache: any[] = [];

const SOURCES_CACHE_KEY = 'dashboard:sources';

function applySourcesData(data: any) {
  sourcesCache = data.sources;
  el('sources-subtitle').innerHTML = th('dashboard.sources.alwaysHtml', { dir: data.raw_dir }) + (sourcesCache.length ? th('dashboard.sources.plus') : '');
  renderSourcesGrid();
}

async function loadSources() {
  const cached = loadCache<any>(SOURCES_CACHE_KEY);
  if (cached) applySourcesData(cached.data);

  try {
    const data = await apiFetch('/api/sources');
    saveCache(SOURCES_CACHE_KEY, data);
    markOnline();
    applySourcesData(data);
  } catch {
    if (cached) markOffline(cached.savedAt);
    else el('sources-grid').innerHTML = `<p class="col-span-full text-sm text-red-600">${th('common.cannotReachApi')}</p>`;
  }
}

function renderSourcesGrid() {
  if (sourcesCache.length === 0) {
    el('sources-grid').innerHTML =
      `<p class="col-span-full rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400">${th('dashboard.sources.none')}</p>`;
    return;
  }
  el('sources-grid').innerHTML = sourcesCache
    .map(
      (s) => `
    <div class="group relative flex flex-col gap-2 rounded-xl border ${
      s.enabled ? 'border-source-border' : 'border-gray-200 opacity-60'
    } bg-white p-4 shadow-card">
      <div class="flex items-start justify-between gap-2">
        <div class="flex min-w-0 items-center gap-2.5">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            s.enabled ? 'bg-source-bg text-source' : 'bg-gray-100 text-gray-400'
          }">📁</span>
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-gray-900">${escapeHtml(s.label)}</p>
            <p class="truncate font-mono text-xs text-gray-400" title="${escapeHtml(s.path)}">${escapeHtml(s.path)}</p>
          </div>
        </div>
        <button data-remove="${s.id}" class="rounded-lg p-1.5 text-gray-400 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100">✕</button>
      </div>
      <div class="flex items-center justify-between pt-1">
        <span class="text-xs text-gray-500">${
          s.exists ? tnh('dashboard.sources.files', s.file_count) : `<span class="text-red-500">${th('dashboard.sources.notFound')}</span>`
        }</span>
        <button data-toggle="${s.id}" data-enabled="${s.enabled}" class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          s.enabled ? 'bg-accent' : 'bg-gray-300'
        }">
          <span class="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform" style="transform:translateX(${
            s.enabled ? '18px' : '2px'
          })"></span>
        </button>
      </div>
    </div>`,
    )
    .join('');

  el('sources-grid')
    .querySelectorAll<HTMLButtonElement>('[data-remove]')
    .forEach((btn) =>
      btn.addEventListener('click', async () => {
        await apiFetch(`/api/sources/${btn.dataset.remove}`, { method: 'DELETE' });
        await loadSources();
        await loadFiles();
      }),
    );
  el('sources-grid')
    .querySelectorAll<HTMLButtonElement>('[data-toggle]')
    .forEach((btn) =>
      btn.addEventListener('click', async () => {
        const enabled = btn.dataset.enabled !== 'true';
        await apiFetch(`/api/sources/${btn.dataset.toggle}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled }),
        });
        await loadSources();
        await loadFiles();
      }),
    );
}

function initSources() {
  const toggle = el('add-source-toggle');
  const form = el('add-source-form');
  toggle.addEventListener('click', () => {
    form.classList.toggle('hidden');
    toggle.setAttribute('aria-expanded', String(!form.classList.contains('hidden')));
    if (!form.classList.contains('hidden')) {
      form.innerHTML = `
        <form id="add-source-real-form" class="rounded-xl border border-dashed border-source-border bg-source-bg/60 p-4">
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="text-xs font-medium text-gray-600">${th('dashboard.sources.formPath')}
              <input name="path" type="text" placeholder="/home/user/Documents/exports" class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm" />
            </label>
            <label class="text-xs font-medium text-gray-600">${th('dashboard.sources.formLabel')}
              <input name="label" type="text" placeholder="${th('dashboard.sources.formLabelPh')}" class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm" />
            </label>
          </div>
          <p id="add-source-error" class="mt-2 text-xs text-red-600"></p>
          <div class="mt-3 flex gap-2">
            <button type="submit" class="inline-flex items-center justify-center gap-2 rounded-lg bg-source px-4 py-2 text-sm font-medium text-white hover:bg-source-light">${th('dashboard.sources.formSubmit')}</button>
          </div>
        </form>`;
      form.querySelector('form')!.addEventListener('submit', async (event) => {
        event.preventDefault();
        const data = new FormData(event.target as HTMLFormElement);
        try {
          await apiFetch('/api/sources', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: data.get('path'), label: data.get('label') || null }),
          });
          form.classList.add('hidden');
          await loadSources();
          await loadFiles();
        } catch (err: any) {
          el('add-source-error').textContent = err.message;
        }
      });
    }
  });
}

// --- Raw folder listing (feeds the "Sources to include" picker) -------------

let filesCache: any[] = [];
let foldersCache: string[] = [];
let managedFolders: string[] = [];

const FILES_CACHE_KEY = 'dashboard:files';

function applyFilesData(data: any) {
  filesCache = data.files;
  foldersCache = data.folders;
  managedFolders = data.managed_folders;
  renderSourcesPicker();
}

async function loadFiles() {
  const cached = loadCache<any>(FILES_CACHE_KEY);
  if (cached) applyFilesData(cached.data);

  try {
    const data = await apiFetch('/api/raw-files');
    saveCache(FILES_CACHE_KEY, data);
    markOnline();
    applyFilesData(data);
  } catch {
    if (cached) markOffline(cached.savedAt);
  }
}

initBuild();
initCopyButtons();
initSourcesPicker();
initRunOptions();
initSources();
onReconnect(() => {
  loadHome();
  loadSources();
  loadFiles();
});
loadHome();
loadSources();
loadFiles();
