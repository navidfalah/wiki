/**
 * Bridges to the Python compiler: build_runner-equivalent SSE streaming of
 * `python3 -u main.py`, and JSON-in/JSON-out calls into compiler/cli.py
 * for chat (rag_engine.py) and email parsing (email_engine.py) -- kept in
 * Python deliberately, see cli.py's module docstring.
 */
import { spawn } from 'node:child_process';
import type { Response } from 'express';
import { COMPILER_DIR, PYTHON_BIN } from '../paths';

// eslint-disable-next-line no-control-regex
const ANSI_ESCAPE_RE = /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g;

function stripAnsi(text: string): string {
  return text.replace(ANSI_ESCAPE_RE, '');
}

function sseEvent(res: Response, type: string, payload: Record<string, unknown>): void {
  res.write(`data: ${JSON.stringify({ type, ...payload })}\n\n`);
}

let buildRunning = false;

export function isBuildRunning(): boolean {
  return buildRunning;
}

export function streamCompilerBuild(res: Response, force: boolean): void {
  if (buildRunning) {
    res.status(409).json({ detail: 'A build is already running' });
    return;
  }
  buildRunning = true;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const args = ['-u', 'main.py', ...(force ? ['--force'] : [])];
  sseEvent(res, 'start', { message: 'Starting compiler pipeline…', command: `${PYTHON_BIN} ${args.join(' ')}` });

  const child = spawn(PYTHON_BIN, args, {
    cwd: COMPILER_DIR,
    env: { ...process.env, PYTHONUNBUFFERED: '1' },
  });

  let buffer = '';
  const handleChunk = (chunk: Buffer) => {
    buffer += chunk.toString('utf-8');
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const cleaned = stripAnsi(line).replace(/\r$/, '');
      if (cleaned) sseEvent(res, 'log', { message: cleaned });
    }
  };
  child.stdout.on('data', handleChunk);
  child.stderr.on('data', handleChunk);

  child.on('close', (code) => {
    if (buffer.trim()) sseEvent(res, 'log', { message: stripAnsi(buffer).replace(/\r$/, '') });
    const success = code === 0;
    sseEvent(res, 'done', {
      code,
      success,
      message: success ? 'Build complete.' : `Build failed (exit ${code}).`,
    });
    buildRunning = false;
    res.end();
  });

  child.on('error', (err) => {
    sseEvent(res, 'error', { message: `Failed to start compiler: ${err.message}` });
    sseEvent(res, 'done', { code: 1, success: false });
    buildRunning = false;
    res.end();
  });
}

export class PythonCliError extends Error {
  errorType?: string;
}

export function runCli<T = any>(command: string, input?: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON_BIN, ['cli.py', command], { cwd: COMPILER_DIR });
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
