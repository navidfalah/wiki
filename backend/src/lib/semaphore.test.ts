import { describe, expect, it } from 'vitest';
import { Semaphore } from './semaphore';

describe('Semaphore', () => {
  it('grants up to `permits` immediately and queues the rest', async () => {
    const sem = new Semaphore(2);
    const a = await sem.acquire();
    await sem.acquire();
    let thirdGranted = false;
    const third = sem.acquire().then((release) => {
      thirdGranted = true;
      return release;
    });
    await Promise.resolve();
    expect(thirdGranted).toBe(false);
    expect(sem.waiting).toBe(1);

    a();
    const releaseThird = await third;
    expect(thirdGranted).toBe(true);
    expect(sem.waiting).toBe(0);
    releaseThird();
  });

  it('ignores a double release', async () => {
    const sem = new Semaphore(1);
    const release = await sem.acquire();
    release();
    release();
    const first = await sem.acquire();
    let secondGranted = false;
    void sem.acquire().then(() => {
      secondGranted = true;
    });
    await Promise.resolve();
    expect(secondGranted).toBe(false);
    first();
  });

  it('serves waiters in FIFO order', async () => {
    const sem = new Semaphore(1);
    const first = await sem.acquire();
    const order: number[] = [];
    const p1 = sem.acquire().then((r) => (order.push(1), r));
    const p2 = sem.acquire().then((r) => (order.push(2), r));
    first();
    (await p1)();
    (await p2)();
    expect(order).toEqual([1, 2]);
  });
});
