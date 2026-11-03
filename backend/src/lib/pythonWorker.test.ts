import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { PythonWorkerPool, WorkerError, type WorkerPoolOptions } from './pythonWorker';

const FAKE = path.join(__dirname, '__fixtures__', 'fakeWorker.cjs');
const pools: PythonWorkerPool[] = [];

function pool(overrides: Partial<WorkerPoolOptions> = {}): PythonWorkerPool {
  const p = new PythonWorkerPool({
    command: process.execPath,
    args: [FAKE],
    cwd: __dirname,
    size: 2,
    requestTimeoutMs: 5000,
    maxRequestsPerWorker: 100,
    idleMs: 60_000,
    ...overrides,
  });
  pools.push(p);
  return p;
}

afterEach(() => {
  for (const p of pools.splice(0)) p.shutdown();
});

describe('PythonWorkerPool', () => {
  it('round-trips input and per-request env, reusing one warm worker', async () => {
    const p = pool();
    const a = await p.run('echo', { q: 1 }, { WORKER_TEST_VAR: 'x' });
    const b = await p.run('echo', null);
    expect(a).toEqual({ code: 0, payload: { input: { q: 1 }, var: 'x', pid: a.payload.pid } });
    expect(b.payload.var).toBeNull();
    expect(b.payload.pid).toBe(a.payload.pid);
    expect(p.size).toBe(1);
  });

  it('passes error payloads through unchanged', async () => {
    await expect(pool().run('fail', {})).resolves.toEqual({ code: 1, payload: { error: 'no such email', error_type: 'not_found' } });
  });

  it('ignores stray stdout and responses for other ids', async () => {
    await expect(pool().run('noise', {})).resolves.toEqual({ code: 0, payload: { ok: true } });
  });

  it('rejects when the worker crashes, with its stderr, and replaces it', async () => {
    const p = pool();
    const first = (await p.run('echo', {})).payload.pid;
    await expect(p.run('crash', {})).rejects.toThrow(/exited with code 3: Traceback: boom/);
    const next = (await p.run('echo', {})).payload.pid;
    expect(next).not.toBe(first);
  });

  it('kills a worker that exceeds the request timeout', async () => {
    const p = pool({ requestTimeoutMs: 200 });
    await expect(p.run('hang', {})).rejects.toBeInstanceOf(WorkerError);
    await expect(p.run('echo', {})).resolves.toMatchObject({ code: 0 });
  });

  it('recycles a worker after maxRequestsPerWorker', async () => {
    const p = pool({ maxRequestsPerWorker: 2 });
    const pids = [];
    for (let i = 0; i < 4; i++) pids.push((await p.run('echo', {})).payload.pid);
    expect(pids[0]).toBe(pids[1]);
    expect(pids[2]).not.toBe(pids[1]);
    expect(pids[2]).toBe(pids[3]);
  });

  it('shuts idle workers down', async () => {
    const p = pool({ idleMs: 100 });
    await p.run('echo', {});
    expect(p.size).toBe(1);
    await new Promise((r) => setTimeout(r, 300));
    expect(p.size).toBe(0);
  });

  it('runs up to `size` requests in parallel and queues the rest', async () => {
    const p = pool({ size: 2 });
    const started = Date.now();
    const results = await Promise.all([1, 2, 3, 4].map(() => p.run('slow', {})));
    const elapsed = Date.now() - started;
    expect(new Set(results.map((r) => r.payload.pid)).size).toBe(2);
    expect(p.size).toBe(2);
    expect(elapsed).toBeGreaterThanOrEqual(380); // two rounds of ~200 ms
  });
});
