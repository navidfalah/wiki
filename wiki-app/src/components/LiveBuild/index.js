import React, { useCallback, useRef, useState } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { buildStreamUrl, DEFAULT_WIKI_API_URL, fetchBuildStatus } from '@site/src/utils/wikiApi';
import BuildTerminal from './BuildTerminal';
import styles from './styles.module.css';

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

  return (
    <section className={styles.liveBuild}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Live Build</h2>
          <p className={styles.subtitle}>
            Run <code>compiler/main.py</code> and watch pipeline logs stream in real time.
          </p>
        </div>
        <div className={styles.actions}>
          <label className={styles.option}>
            <input
              type="checkbox"
              checked={heuristicOnly}
              disabled={isRunning}
              onChange={(event) => setHeuristicOnly(event.target.checked)}
            />
            Heuristic only
          </label>
          <label className={styles.option}>
            <input
              type="checkbox"
              checked={force}
              disabled={isRunning}
              onChange={(event) => setForce(event.target.checked)}
            />
            Force rebuild
          </label>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={clearLogs}
            disabled={isRunning}>
            Clear
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={runCompiler}
            disabled={isRunning}>
            {isRunning ? 'Running…' : 'Run Compiler'}
          </button>
        </div>
      </div>

      <div className={styles.statusBar}>
        <span className={`${styles.statusDot} ${styles[status]}`} />
        <span className={styles.statusText}>
          {status === 'idle' && 'Ready'}
          {status === 'running' && 'Compiling…'}
          {status === 'success' && 'Build complete'}
          {status === 'error' && 'Build failed'}
        </span>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      <BuildTerminal lines={lines} status={status} />
    </section>
  );
}
