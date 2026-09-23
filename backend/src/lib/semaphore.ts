/**
 * Tiny counting semaphore. Every chat/email/connector call spawns a fresh
 * `python3 cli.py ...` process (~100+ MB resident each), so on a small
 * server a burst of requests can exhaust RAM long before CPU matters.
 * Capping how many run at once trades a little latency for not getting
 * OOM-killed -- see pythonBridge.ts and PY_MAX_CONCURRENCY.
 */
export class Semaphore {
  private available: number;
  private readonly waiters: Array<() => void> = [];

  constructor(permits: number) {
    // A NaN (e.g. PY_MAX_CONCURRENCY=abc) or <1 value must not leave zero
    // permits: nothing would ever be granted and every caller would hang.
    this.available = Number.isFinite(permits) ? Math.max(1, Math.floor(permits)) : 1;
  }

  /** Resolves with a release function once a permit is free. Call it exactly once. */
  acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const grant = () => {
        let released = false;
        resolve(() => {
          if (released) return;
          released = true;
          this.release();
        });
      };
      if (this.available > 0) {
        this.available--;
        grant();
      } else {
        this.waiters.push(grant);
      }
    });
  }

  private release(): void {
    const next = this.waiters.shift();
    if (next) next();
    else this.available++;
  }

  get waiting(): number {
    return this.waiters.length;
  }
}
