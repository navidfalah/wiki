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

export function isBuildRunning(): boolean {
  return buildRunning;
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
}

export function streamCompilerBuild(res: Response, options: CompilerBuildOptions): void {
  if (buildRunning) {
    res.status(409).json({ detail: 'A build is already running' });
    return;
  }
  buildRunning = true;
  stopRequested = false;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const { force, excludeFolders, criticPass, criticSamples, criticRegenerate, useCorrections, redactPii } = options;
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
  ];
  sseEvent(res, 'start', { message: 'Starting compiler pipeline…', command: `${PYTHON_BIN} ${args.join(' ')}` });

  const child = spawn(PYTHON_BIN, args, {
    cwd: COMPILER_DIR,
    env: { ...process.env, ...envOverridesForSpawn(), PYTHONUNBUFFERED: '1' },
  });
  currentChild = child;

  let buffer = '';
  const handleChunk = (chunk: Buffer) => {
    buffer += chunk.toString('utf-8');
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const cleaned = stripAnsi(line).replace(/\r$/, '');
      if (!cleaned) continue;
      const runIdMatch = cleaned.match(/^@@RUN_ID@@(.+)$/);
      if (runIdMatch) {
        sseEvent(res, 'run_id', { run_id: runIdMatch[1] });
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
    res.end();
  });

  child.on('error', (err) => {
    sseEvent(res, 'error', { message: `Failed to start compiler: ${err.message}` });
    sseEvent(res, 'done', { code: 1, success: false });
    buildRunning = false;
    currentChild = null;
    stopRequested = false;
    res.end();
  });
}

export interface ChatStreamInput {
  message: string;
  history: { role: string; content: string }[];
  docScope: string[] | null;
}

export interface ChatStreamResult {
  answer: string;
  sources: Array<{ doc_path: string; title: string; heading?: string; score?: number }>;
  mode: string;
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
      env: { ...process.env, ...envOverridesForSpawn() },
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
        resolve({ answer: event.answer ?? '', sources: latestSources, mode: event.mode });
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

    child.stdin.write(JSON.stringify(input));
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
