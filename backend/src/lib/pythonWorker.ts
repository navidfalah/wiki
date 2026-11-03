/**
 * A pool of long-lived `python3 cli.py --serve` workers (see serve() in
 * compiler/cli.py). A one-shot `cli.py <command>` spends ~0.6 s importing
 * the compiler before doing any work; a worker pays that once.
 *
 * Protocol: one JSON request per line on the worker's stdin
 * ({id, command, input, env}), one JSON response per line on its stdout
 * ({id, code, payload}). `env` carries the per-request LLM settings the
 * one-shot path used to pass as the child's environment.
 *
 * Each worker runs one request at a time. A worker that crashes or exits is
 * replaced on the next request. One that exceeds the request timeout is
 * killed. One that has served `maxRequestsPerWorker` requests, or sat idle
 * for `idleMs`, is shut down, which bounds memory growth and releases RAM
 * on a quiet server.
 */
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';

export interface WorkerPoolOptions {
  command: string;
  args: string[];
  cwd: string;
  size: number;
  requestTimeoutMs: number;
  maxRequestsPerWorker: number;
  idleMs: number;
  env?: NodeJS.ProcessEnv;
}

export interface WorkerResponse {
  code: number;
  payload: any;
}

export class WorkerError extends Error {}

interface Pending {
  id: number;
  resolve: (r: WorkerResponse) => void;
  reject: (e: Error) => void;
  timer: NodeJS.Timeout;
}

class Worker {
  private readonly child: ChildProcessWithoutNullStreams;
  private buffer = '';
  private stderrTail = '';
  private pending: Pending | null = null;
  private idleTimer: NodeJS.Timeout | undefined;
  alive = true;
  served = 0;

  constructor(
    private readonly opts: WorkerPoolOptions,
    private readonly onGone: (w: Worker) => void,
  ) {
    this.child = spawn(opts.command, opts.args, { cwd: opts.cwd, env: opts.env ?? process.env });
    this.child.stdout.setEncoding('utf8');
    this.child.stdout.on('data', (chunk: string) => this.onStdout(chunk));
    this.child.stderr.setEncoding('utf8');
    this.child.stderr.on('data', (chunk: string) => {
      this.stderrTail = (this.stderrTail + chunk).slice(-4000);
    });
    this.child.on('exit', (code, signal) => this.gone(`exited with ${signal ?? `code ${code}`}`));
    this.child.on('error', (err) => this.gone(err.message));
  }

  get pid(): number | undefined {
    return this.child.pid;
  }

  get busy(): boolean {
    return this.pending !== null;
  }

  request(id: number, command: string, input: unknown, env: Record<string, string>): Promise<WorkerResponse> {
    clearTimeout(this.idleTimer);
    return new Promise<WorkerResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.fail(new WorkerError(`Python worker timed out after ${this.opts.requestTimeoutMs} ms running ${command}`));
        // Leave the pool now, not on the async 'exit' event -- otherwise the
        // next request could be handed this dying worker.
        this.alive = false;
        clearTimeout(this.idleTimer);
        this.onGone(this);
        this.child.kill('SIGKILL');
      }, this.opts.requestTimeoutMs);
      this.pending = { id, resolve, reject, timer };
      this.child.stdin.write(`${JSON.stringify({ id, command, input: input ?? null, env })}\n`);
    });
  }

  shutdown(): void {
    if (!this.alive) return;
    this.alive = false;
    clearTimeout(this.idleTimer);
    this.child.stdin.end(); // serve() returns at EOF
    setTimeout(() => this.child.kill('SIGKILL'), 5000).unref();
    this.onGone(this);
  }

  private onStdout(chunk: string): void {
    this.buffer += chunk;
    let newline: number;
    while ((newline = this.buffer.indexOf('\n')) !== -1) {
      const line = this.buffer.slice(0, newline);
      this.buffer = this.buffer.slice(newline + 1);
      if (line.trim()) this.onLine(line);
    }
  }

  private onLine(line: string): void {
    let message: { id: number | null; code: number; payload: any };
    try {
      message = JSON.parse(line);
    } catch {
      return; // serve() keeps stdout clean; anything unparseable is not a response
    }
    const pending = this.pending;
    if (!pending || message.id !== pending.id) return;
    clearTimeout(pending.timer);
    this.pending = null;
    this.served += 1;
    pending.resolve({ code: message.code, payload: message.payload });
    if (this.served >= this.opts.maxRequestsPerWorker) {
      this.shutdown();
    } else {
      this.idleTimer = setTimeout(() => this.shutdown(), this.opts.idleMs);
      this.idleTimer.unref();
    }
  }

  private fail(error: Error): void {
    const pending = this.pending;
    if (!pending) return;
    clearTimeout(pending.timer);
    this.pending = null;
    pending.reject(error);
  }

  private gone(reason: string): void {
    const wasAlive = this.alive;
    this.alive = false;
    clearTimeout(this.idleTimer);
    this.fail(new WorkerError(`Python worker ${reason}${this.stderrTail ? `: ${this.stderrTail.trim()}` : ''}`));
    if (wasAlive) this.onGone(this);
  }
}

export class PythonWorkerPool {
  private readonly workers = new Set<Worker>();
  private readonly waiters: Array<(w: Worker) => void> = [];
  private nextId = 1;

  constructor(private readonly opts: WorkerPoolOptions) {}

  /** Number of live worker processes (for tests and diagnostics). */
  get size(): number {
    return this.workers.size;
  }

  get pids(): (number | undefined)[] {
    return [...this.workers].map((w) => w.pid);
  }

  async run(command: string, input: unknown, env: Record<string, string> = {}): Promise<WorkerResponse> {
    const worker = await this.acquire();
    try {
      return await worker.request(this.nextId++, command, input, env);
    } finally {
      this.release(worker);
    }
  }

  shutdown(): void {
    for (const worker of [...this.workers]) worker.shutdown();
  }

  private acquire(): Promise<Worker> {
    const idle = [...this.workers].find((w) => w.alive && !w.busy && !this.reserved.has(w));
    if (idle) return Promise.resolve(this.reserve(idle));
    if (this.workers.size < this.opts.size) return Promise.resolve(this.reserve(this.spawnWorker()));
    return new Promise((resolve) => this.waiters.push((w) => resolve(this.reserve(w))));
  }

  // A worker is reserved from acquire() until release(), covering the gap
  // before request() marks it busy.
  private readonly reserved = new Set<Worker>();

  private reserve(worker: Worker): Worker {
    this.reserved.add(worker);
    return worker;
  }

  private release(worker: Worker): void {
    this.reserved.delete(worker);
    const waiter = this.waiters.shift();
    if (!waiter) return;
    waiter(worker.alive ? worker : this.spawnWorker());
  }

  private spawnWorker(): Worker {
    const worker = new Worker(this.opts, (gone) => this.workers.delete(gone));
    this.workers.add(worker);
    return worker;
  }
}
