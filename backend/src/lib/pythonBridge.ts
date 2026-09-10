/**
 * Bridges to the Python compiler: build_runner-equivalent SSE streaming of
 * `python3 -u main.py`, and JSON-in/JSON-out calls into compiler/cli.py
 * for chat (rag_engine.py) and email parsing (email_engine.py) -- kept in
 * Python deliberately, see cli.py's module docstring.
 */
import { spawn, ChildProcess } from 'node:child_process';
import type { Response } from 'express';
import { COMPILER_DIR, PYTHON_BIN } from '../paths';
import { envOverridesForSpawn } from './llmSettings';
import { logSystemEvent } from './activityLog';
import { markRunAbandoned } from './pipelineRuns';

// eslint-disable-next-line no-control-regex
const ANSI_ESCAPE_RE = /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g;

function stripAnsi(text: string): string {
  return text.replace(ANSI_ESCAPE_RE, '');
}

function sseEvent(res: Response, type: string, payload: Record<string, unknown>): void {
  res.write(`data: ${JSON.stringify({ type, ...payload })}\n\n`);
}

let buildRunning = false;
let currentChild: ChildProcess | null = null;
let stopRequested = false;

/** At most one build waits behind the running one -- see streamCompilerBuild's
 * queuing note. A second concurrent request while one is already queued is
 * rejected rather than piling up further, same as the old flat 409 behavior. */
let queuedBuild: { res: Response; options: CompilerBuildOptions } | null = null;

export function isBuildRunning(): boolean {
  return buildRunning;
}

export function isBuildQueued(): boolean {
  return queuedBuild !== null;
}

export function stopBuild(): boolean {
  if (!buildRunning || !currentChild) return false;
  stopRequested = true;
  currentChild.kill('SIGTERM');
  return true;
}

export interface CompilerBuildOptions {
  force?: boolean;
  excludeFolders?: string[];
  criticPass?: boolean;
  criticSamples?: number;
  criticRegenerate?: boolean;
  useCorrections?: boolean;
  redactPii?: boolean;
  webSearch?: boolean;
  /** Per-run profile picks for "default" (extraction/indexing/linking) and
   *  "thinking" (synthesis), overriding the Settings page's standing
   *  assignments for just this build -- see llmSettings.ts's ProfileOverrides. */
  defaultProfileId?: string | null;
  thinkingProfileId?: string | null;
}

/**
 * Streams a compiler build over SSE. If one is already running, this queues
 * the request (at most one deep) instead of flatly rejecting it: the SSE
 * connection opens right away with a `queued` event, then transitions into
 * the normal `start`/`log`/`done` sequence once the current build finishes
 * and this one is dequeued -- see runQueuedBuildIfAny() in the `close`
 * handler below. A second request while one is already queued still gets
 * a 409, so at most two builds (one running, one waiting) are ever tracked.
 */
export function streamCompilerBuild(res: Response, options: CompilerBuildOptions): void {
  if (buildRunning) {
    if (queuedBuild) {
      res.status(409).json({ detail: 'A build is already running and another is already queued' });
      return;
    }
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    sseEvent(res, 'queued', {
      message: 'A build is already running -- this one will start automatically once it finishes.',
    });
    queuedBuild = { res, options };
    // If the waiting client disconnects before its turn comes, drop it
    // rather than writing to a dead response when it's dequeued.
    res.on('close', () => {
      if (queuedBuild?.res === res) queuedBuild = null;
    });
    return;
  }
  runBuildNow(res, options);
}

function runQueuedBuildIfAny(): void {
  if (!queuedBuild) return;
  const next = queuedBuild;
  queuedBuild = null;
  runBuildNow(next.res, next.options);
}

function runBuildNow(res: Response, options: CompilerBuildOptions): void {
  buildRunning = true;
  stopRequested = false;

  // A queued request already wrote its SSE headers when it was accepted.
  if (!res.headersSent) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
  }

  const {
    force,
    excludeFolders,
    criticPass,
    criticSamples,
    criticRegenerate,
    useCorrections,
    redactPii,
    webSearch,
    defaultProfileId,
    thinkingProfileId,
  } = options;
  const args = [
    '-u',
    'main.py',
    ...(force ? ['--force'] : []),
    ...(excludeFolders?.length ? [`--exclude-folders=${excludeFolders.join(',')}`] : []),
    ...(criticPass ? ['--critic-pass'] : []),
    ...(criticPass && criticSamples && criticSamples > 1 ? [`--critic-samples=${criticSamples}`] : []),
    ...(criticPass && criticRegenerate ? ['--critic-regenerate'] : []),
    ...(useCorrections ? ['--use-corrections'] : []),
    ...(redactPii ? ['--redact-pii'] : []),
    ...(webSearch ? ['--web-search'] : []),
  ];
  sseEvent(res, 'start', { message: 'Starting compiler pipeline…', command: `${PYTHON_BIN} ${args.join(' ')}` });

  const child = spawn(PYTHON_BIN, args, {
    cwd: COMPILER_DIR,
    env: {
      ...process.env,
      ...envOverridesForSpawn({
        ...(defaultProfileId ? { default: defaultProfileId } : {}),
        ...(thinkingProfileId ? { thinking: thinkingProfileId } : {}),
      }),
      PYTHONUNBUFFERED: '1',
    },
  });
  currentChild = child;

  let buffer = '';
  let runId: string | null = null;
  const handleChunk = (chunk: Buffer) => {
    buffer += chunk.toString('utf-8');
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const cleaned = stripAnsi(line).replace(/\r$/, '');
      if (!cleaned) continue;
      const runIdMatch = cleaned.match(/^@@RUN_ID@@(.+)$/);
      if (runIdMatch) {
        runId = runIdMatch[1];
        sseEvent(res, 'run_id', { run_id: runId });
        continue;
      }
      sseEvent(res, 'log', { message: cleaned });
    }
  };
  child.stdout.on('data', handleChunk);
  child.stderr.on('data', handleChunk);

  child.on('close', (code) => {
    if (buffer.trim()) sseEvent(res, 'log', { message: stripAnsi(buffer).replace(/\r$/, '') });
    const wasStopped = stopRequested;
    const success = code === 0;
    sseEvent(res, 'done', {
      code,
      success,
      stopped: wasStopped,
      message: wasStopped ? 'Build stopped by user.' : success ? 'Build complete.' : `Build failed (exit ${code}).`,
    });
    buildRunning = false;
    currentChild = null;
    stopRequested = false;
    // A killed/crashed subprocess never gets to call PipelineRun.finish()
    // itself (SIGTERM in particular: Python only runs its own except/
    // finally blocks between bytecode instructions, so a signal handler
    // can't reliably beat a process kill to the punch) -- patch the run's
    // own status immediately instead of leaving it stuck on "running"
    // until the next backend restart's reconcileOrphanedPipelineRuns().
    // A no-op if Python's own run.finish() already wrote success/error.
    if (runId) {
      markRunAbandoned(runId, wasStopped ? 'Interrupted: stopped by user.' : `Interrupted: process exited with code ${code}.`);
    }
    // Success and a user-requested stop are already the Pipelines page's
    // own story (full step-by-step detail); only an unexpected failure is
    // worth surfacing in the general system log too.
    if (!success && !wasStopped) {
      logSystemEvent('Compiler build failed', `exit code ${code}`, 'error');
    }
    res.end();
    runQueuedBuildIfAny();
  });

  child.on('error', (err) => {
    sseEvent(res, 'error', { message: `Failed to start compiler: ${err.message}` });
    sseEvent(res, 'done', { code: 1, success: false });
    logSystemEvent('Compiler build failed to start', err.message, 'error');
    buildRunning = false;
    currentChild = null;
    stopRequested = false;
    res.end();
    runQueuedBuildIfAny();
  });
}

export interface ChatStreamInput {
  message: string;
  history: { role: string; content: string }[];
  docScope: string[] | null;
  corpusSource: 'wiki' | 'raw';
  /** Chat-purpose profile id to use for this call, overriding the Settings
   *  page's standing "chat" assignment -- see llmSettings.ts's ProfileOverrides. */
  llmProfileId?: string | null;
}

export interface ChatFaithfulness {
  basis: 'extractive' | 'heuristic';
  unsupported_rate: number;
  checkable_count: number;
}

export interface ChatStreamResult {
  answer: string;
  sources: Array<{ doc_path: string; title: string; heading?: string; score?: number }>;
  mode: string;
  faithfulness?: ChatFaithfulness;
}

/** Streams `cli.py chat-stream`'s NDJSON events out as SSE (same shape as
 * streamCompilerBuild's stdout buffering), and resolves with the final
 * "done" event's payload once the process closes -- the caller persists
 * that as the chat session's new turn. */
export function streamChat(res: Response, input: ChatStreamInput): Promise<ChatStreamResult> {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON_BIN, ['cli.py', 'chat-stream'], {
      cwd: COMPILER_DIR,
      env: {
        ...process.env,
        ...envOverridesForSpawn(input.llmProfileId ? { chat: input.llmProfileId } : {}),
      },
    });

    let settled = false;
    let buffer = '';
    let stderr = '';
    let latestSources: ChatStreamResult['sources'] = [];

    const handleLine = (line: string) => {
      if (!line.trim()) return;
      let event: any;
      try {
        event = JSON.parse(line);
      } catch {
        return; // ignore non-JSON stray output
      }
      sseEvent(res, event.type, event);
      if (event.type === 'sources') {
        latestSources = event.sources ?? [];
      } else if (event.type === 'done') {
        settled = true;
        resolve({ answer: event.answer ?? '', sources: latestSources, mode: event.mode, faithfulness: event.faithfulness });
      } else if (event.type === 'error') {
        settled = true;
        reject(new PythonCliError(event.message || 'Chat stream failed'));
      }
    };

    child.stdout.on('data', (chunk: Buffer) => {
      buffer += chunk.toString('utf-8');
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) handleLine(line);
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf-8');
    });

    child.on('close', () => {
      if (buffer.trim()) handleLine(buffer);
      if (!settled) {
        const message = stderr || 'Chat stream produced no result';
        sseEvent(res, 'error', { message });
        reject(new PythonCliError(message));
      }
      res.end();
    });
    child.on('error', (err) => {
      if (!settled) {
        sseEvent(res, 'error', { message: err.message });
        reject(new PythonCliError(err.message));
      }
      res.end();
    });

    // cli.py's chat-stream reads snake_case keys off stdin JSON (see
    // cmd_chat_stream in cli.py) -- translate this interface's camelCase
    // fields explicitly rather than JSON.stringify(input) directly.
    child.stdin.write(
      JSON.stringify({
        message: input.message,
        history: input.history,
        doc_scope: input.docScope,
        corpus_source: input.corpusSource,
      }),
    );
    child.stdin.end();
  });
}

export class PythonCliError extends Error {
  errorType?: string;
}

export function runCli<T = any>(command: string, input?: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON_BIN, ['cli.py', command], {
      cwd: COMPILER_DIR,
      env: { ...process.env, ...envOverridesForSpawn() },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('close', (code) => {
      let parsed: any;
      try {
        parsed = JSON.parse(stdout);
      } catch {
        reject(new PythonCliError(stderr || `cli.py ${command} produced no JSON output`));
        return;
      }
      if (code !== 0 || parsed?.error) {
        const err = new PythonCliError(parsed?.error || `cli.py ${command} failed`);
        err.errorType = parsed?.error_type;
        reject(err);
        return;
      }
      resolve(parsed as T);
    });
    child.on('error', (err) => reject(new PythonCliError(err.message)));
    if (input !== undefined) {
      child.stdin.write(JSON.stringify(input));
    }
    child.stdin.end();
  });
}
