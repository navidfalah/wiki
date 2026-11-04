/**
 * Tiny counting semaphore used to bound concurrent chat retrieval requests.
 */
export class Semaphore {
  private available: number;
  private readonly waiters: Array<() => void> = [];

  constructor(permits: number) {
    // A NaN or <1 value must not leave zero
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
