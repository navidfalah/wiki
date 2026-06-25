import React, { useCallback, useRef, useState } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { buildStreamUrl, DEFAULT_WIKI_API_URL, fetchBuildStatus } from '@site/src/utils/wikiApi';
import { PrimaryButton, SecondaryButton } from '@site/src/components/ui/Button';
import BuildTerminal from './BuildTerminal';

const STATUS_LABEL = {
  idle: 'Ready',
  running: 'Running…',
  success: 'Done',
  error: 'Failed',
};

export default function LiveBuild({ onComplete }) {
  const { siteConfig } = useDocusaurusContext();
  const apiBase = siteConfig.customFields?.wikiApiUrl ?? DEFAULT_WIKI_API_URL;

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
    <section className="rounded-lg border border-gray-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Compile</h2>
          <p className="text-xs text-gray-500">Status: {STATUS_LABEL[status]}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={force}
              disabled={isRunning}
              onChange={(event) => setForce(event.target.checked)}
              className="rounded border-gray-300"
            />
            Rebuild all files
          </label>
          <SecondaryButton onClick={() => setLines([])} disabled={isRunning}>
            Clear
          </SecondaryButton>
          <PrimaryButton onClick={runCompiler} disabled={isRunning}>
            {isRunning ? 'Running…' : 'Run compiler'}
          </PrimaryButton>
        </div>
      </div>

      <div className="p-4">
        {error && (
          <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
        <BuildTerminal lines={lines} status={status} />
      </div>
    </section>
  );
}
