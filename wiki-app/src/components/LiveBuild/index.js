import React, { useCallback, useRef, useState } from 'react';
import useApiBase from '@site/src/utils/useApiBase';
import { buildStreamUrl, fetchBuildStatus } from '@site/src/utils/wikiApi';
import { PrimaryButton, SecondaryButton, Badge } from '@site/src/components/ui/Button';
import { PlayIcon } from '@site/src/components/ui/Icons';
import BuildTerminal from './BuildTerminal';

const STATUS_TONE = {
  idle: 'gray',
  running: 'amber',
  success: 'green',
  error: 'red',
};

const STATUS_LABEL = {
  idle: 'Ready',
  running: 'Running…',
  success: 'Done',
  error: 'Failed',
};

export default function LiveBuild({ onComplete }) {
  const [apiBase] = useApiBase();

  const [lines, setLines] = useState([]);
  const [status, setStatus] = useState('idle');
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
        setError('A build is already running.');
        setStatus('error');
        return;
      }
    } catch {
      setError(`Cannot reach API at ${apiBase}. Run: cd compiler && ./run_server.sh`);
      setStatus('error');
      return;
    }

    setStatus('running');
    const eventSource = new EventSource(buildStreamUrl(apiBase, { force }));
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
        appendLine(payload.message ?? 'Starting compiler…');
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
        appendLine(payload.message ?? (payload.success ? 'Finished.' : 'Failed.'));
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
      setError('Lost connection to the build stream.');
      setStatus('error');
      closeStream();
    };
  }, [apiBase, appendLine, closeStream, force, onComplete]);

  const isRunning = status === 'running';

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-gray-900">Run compiler</h2>
          <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={force}
              disabled={isRunning}
              onChange={(event) => setForce(event.target.checked)}
              className="rounded border-gray-300 text-accent focus:ring-accent/30"
            />
            Rebuild all files
          </label>
          <SecondaryButton onClick={() => setLines([])} disabled={isRunning}>
            Clear log
          </SecondaryButton>
          <PrimaryButton onClick={runCompiler} disabled={isRunning}>
            <PlayIcon size={15} />
            {isRunning ? 'Running…' : 'Run compiler'}
          </PrimaryButton>
        </div>
      </div>

      <div className="p-4">
        {error && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
        <BuildTerminal lines={lines} status={status} />
      </div>
    </section>
  );
}
