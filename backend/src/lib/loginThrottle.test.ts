import { describe, expect, it } from 'vitest';
import { LoginThrottle } from './loginThrottle';

function makeThrottle() {
  let t = 1_000_000;
  const throttle = new LoginThrottle({ windowMs: 60_000, maxPerIp: 3, maxPerUser: 5, now: () => t });
  return { throttle, advance: (ms: number) => (t += ms) };
}

describe('LoginThrottle', () => {
  it('allows attempts until the per-IP limit is reached', () => {
    const { throttle } = makeThrottle();
    for (let i = 0; i < 3; i++) {
      expect(throttle.retryAfterSeconds('1.1.1.1', 'admin')).toBe(0);
      throttle.recordFailure('1.1.1.1', 'admin');
    }
    expect(throttle.retryAfterSeconds('1.1.1.1', 'admin')).toBeGreaterThan(0);
    // A different IP is unaffected (username budget is larger).
    expect(throttle.retryAfterSeconds('2.2.2.2', 'admin')).toBe(0);
  });

  it('locks a username across many IPs once its own limit is hit', () => {
    const { throttle } = makeThrottle();
    for (let i = 0; i < 5; i++) throttle.recordFailure(`10.0.0.${i}`, 'Admin');
    expect(throttle.retryAfterSeconds('9.9.9.9', 'admin')).toBeGreaterThan(0);
  });

  it('forgets failures after the window passes', () => {
    const { throttle, advance } = makeThrottle();
    for (let i = 0; i < 3; i++) throttle.recordFailure('1.1.1.1', 'admin');
    expect(throttle.retryAfterSeconds('1.1.1.1', 'admin')).toBeGreaterThan(0);
    advance(61_000);
    expect(throttle.retryAfterSeconds('1.1.1.1', 'admin')).toBe(0);
  });

  it('clears the IP bucket on success', () => {
    const { throttle } = makeThrottle();
    throttle.recordFailure('1.1.1.1', 'admin');
    throttle.recordFailure('1.1.1.1', 'admin');
    throttle.recordSuccess('1.1.1.1');
    throttle.recordFailure('1.1.1.1', 'admin');
    expect(throttle.retryAfterSeconds('1.1.1.1', 'admin')).toBe(0);
  });
});
