import React, { useCallback, useRef, useState } from 'react';
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { buildStreamUrl, DEFAULT_WIKI_API_URL, fetchBuildStatus } from '@site/src/utils/wikiApi';
import BuildTerminal from './BuildTerminal';

const STATUS_CONFIG = {
  idle: {
    dot: 'bg-neutral-400',
    label: 'Ready',
    badge: 'bg-neutral-100 text-neutral-600 ring-neutral-200/80',
  },
  running: {
    dot: 'bg-amber-400 animate-pulse-soft',
    label: 'Compiling…',
    badge: 'bg-amber-50 text-amber-700 ring-amber-200/60',
  },
  success: {
    dot: 'bg-emerald-500',
    label: 'Build complete',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60',
  },
  error: {
    dot: 'bg-red-500',
    label: 'Build failed',
    badge: 'bg-red-50 text-red-700 ring-red-200/60',
  },
};

function ToggleOption({ label, hint, checked, disabled, onChange }) {
  return (
    <label
      className={clsx(
        'group flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-all duration-200',
        checked
          ? 'border-emerald-200/80 bg-emerald-50/50'
          : 'border-neutral-200/80 bg-white hover:border-neutral-300',
        disabled && 'cursor-not-allowed opacity-50',
      )}>
      <span className="relative inline-flex h-5 w-9 shrink-0 items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
        />
        <span
          className={clsx(
            'h-5 w-9 rounded-full transition-colors duration-200',
            checked ? 'bg-emerald-500' : 'bg-neutral-200 group-hover:bg-neutral-300',
          )}
        />
        <span
          className={clsx(
            'absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
            checked && 'translate-x-4',
          )}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-neutral-800">{label}</span>
        {hint && <span className="block text-[11px] text-neutral-500">{hint}</span>}
      </span>
    </label>
  );
}

export default function LiveBuild({ onComplete }) {
  const { siteConfig } = useDocusaurusContext();
  const apiBase = siteConfig.customFields?.wikiApiUrl ?? DEFAULT_WIKI_API_URL;

  const [lines, setLines] = useState([]);
  const [status, setStatus] = useState('idle');
  const [heuristicOnly, setHeuristicOnly] = useState(true);
  const [force, setForce] = useState(false);
  const [error, setError] = useState(null);
  const eventSourceRef = useRef(null);

  const closeStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const appendLine = useCallback((line) => {
    setLines((previous) => [...previous, line]);
  }, []);

  const runCompiler = useCallback(async () => {
    closeStream();
    setLines([]);
    setError(null);

    try {
      const buildStatus = await fetchBuildStatus(apiBase);
      if (buildStatus.running) {
        setError('A build is already running. Wait for it to finish.');
        setStatus('error');
        return;
      }
    } catch {
      setError(
        `Could not reach the wiki API at ${apiBase}. Start it with: cd compiler && python server.py`,
      );
      setStatus('error');
      return;
    }

    setStatus('running');

    const url = buildStreamUrl(apiBase, { heuristicOnly, force });
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      let payload;
      try {
        payload = JSON.parse(event.data);
      } catch {
        appendLine(event.data);
        return;
      }

      if (payload.type === 'start') {
        appendLine(`$ ${payload.command ?? 'python compiler/main.py'}`);
        if (payload.message) {
          appendLine(payload.message);
        }
        return;
      }

      if (payload.type === 'log') {
        appendLine(payload.message);
        return;
      }

      if (payload.type === 'error') {
        appendLine(`ERROR: ${payload.message}`);
        return;
      }

      if (payload.type === 'done') {
        appendLine(payload.message ?? (payload.success ? 'Build succeeded.' : 'Build failed.'));
        setStatus(payload.success ? 'success' : 'error');
        closeStream();
        if (onComplete) {
          onComplete(payload);
        }
      }
    };

    eventSource.onerror = () => {
      if (eventSource.readyState === EventSource.CLOSED) {
        return;
      }
      setError(
        `Lost connection to the build stream. Is the API running at ${apiBase}?`,
      );
      setStatus('error');
      closeStream();
    };
  }, [apiBase, appendLine, closeStream, force, heuristicOnly, onComplete]);

  const clearLogs = useCallback(() => {
    if (status !== 'running') {
      setLines([]);
      setError(null);
      setStatus('idle');
    }
  }, [status]);

  const isRunning = status === 'running';
  const config = STATUS_CONFIG[status];

  return (
    <section className="animate-fade-in overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-panel">
      <div className="border-b border-neutral-100 px-6 py-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold tracking-tight text-neutral-900">Live Build</h2>
              <span
                className={clsx(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1',
                  config.badge,
                )}>
                <span className={clsx('h-1.5 w-1.5 rounded-full', config.dot)} aria-hidden />
                {config.label}
              </span>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">
              Run{' '}
              <code className="rounded-md bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-neutral-700">
                compiler/main.py
              </code>{' '}
              and watch pipeline logs stream in real time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ToggleOption
              label="Heuristic"
              hint="Skip LLM calls"
              checked={heuristicOnly}
              disabled={isRunning}
              onChange={(event) => setHeuristicOnly(event.target.checked)}
            />
            <ToggleOption
              label="Force"
              hint="Reprocess all files"
              checked={force}
              disabled={isRunning}
              onChange={(event) => setForce(event.target.checked)}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-xl border border-neutral-200/80 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-card transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={clearLogs}
            disabled={isRunning}>
            Clear logs
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow-card transition-all duration-200 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={runCompiler}
            disabled={isRunning}>
            {isRunning ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Running…
              </>
            ) : (
              'Run compiler'
            )}
          </button>
        </div>
      </div>

      {isRunning && (
        <div className="relative h-0.5 overflow-hidden bg-neutral-100">
          <div className="absolute inset-y-0 w-1/3 animate-progress-indeterminate bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
        </div>
      )}

      <div className="space-y-3 px-6 py-5">
        {error && (
          <p className="animate-fade-in rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
            {error}
          </p>
        )}
        <BuildTerminal lines={lines} status={status} />
      </div>
    </section>
  );
}
