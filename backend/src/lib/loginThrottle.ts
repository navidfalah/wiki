/**
 * In-memory brute-force throttle for POST /api/auth/login. Now that the app
 * sits on a public domain the login form is reachable by anyone; without a
 * limit the only cost to guessing passwords is bandwidth.
 *
 * Only *failed* attempts count, keyed by client IP and (more loosely) by
 * username. State is per-process and resets on restart -- acceptable for a
 * single small instance, and it avoids yet another file on disk.
 */

interface Bucket {
  count: number;
  windowStart: number;
}

export interface ThrottleOptions {
  windowMs?: number;
  maxPerIp?: number;
  maxPerUser?: number;
  now?: () => number;
}

export class LoginThrottle {
  private readonly ipBuckets = new Map<string, Bucket>();
  private readonly userBuckets = new Map<string, Bucket>();
  private readonly windowMs: number;
  private readonly maxPerIp: number;
  private readonly maxPerUser: number;
  private readonly now: () => number;

  constructor(opts: ThrottleOptions = {}) {
    this.windowMs = opts.windowMs ?? 15 * 60 * 1000;
    this.maxPerIp = opts.maxPerIp ?? 10;
    this.maxPerUser = opts.maxPerUser ?? 30;
    this.now = opts.now ?? Date.now;
  }

  /** Seconds the caller must wait, or 0 if the attempt may proceed. */
  retryAfterSeconds(ip: string, username: string): number {
    const waits = [
      this.remaining(this.ipBuckets, ip, this.maxPerIp),
      this.remaining(this.userBuckets, username.toLowerCase(), this.maxPerUser),
    ];
    return Math.max(...waits);
  }

  recordFailure(ip: string, username: string): void {
    this.bump(this.ipBuckets, ip);
    this.bump(this.userBuckets, username.toLowerCase());
    this.prune();
  }

  /** A successful login clears that IP's slate (typo followed by the right password). */
  recordSuccess(ip: string): void {
    this.ipBuckets.delete(ip);
  }

  private remaining(map: Map<string, Bucket>, key: string, max: number): number {
    const bucket = map.get(key);
    if (!bucket) return 0;
    const elapsed = this.now() - bucket.windowStart;
    if (elapsed >= this.windowMs) {
      map.delete(key);
      return 0;
    }
    return bucket.count >= max ? Math.ceil((this.windowMs - elapsed) / 1000) : 0;
  }

  private bump(map: Map<string, Bucket>, key: string): void {
    const now = this.now();
    const bucket = map.get(key);
    if (!bucket || now - bucket.windowStart >= this.windowMs) {
      map.set(key, { count: 1, windowStart: now });
    } else {
      bucket.count++;
    }
  }

  /** Bounds memory: drop expired buckets so a spray of random IPs/usernames can't grow the maps forever. */
  private prune(): void {
    if (this.ipBuckets.size + this.userBuckets.size < 1000) return;
    const now = this.now();
    for (const map of [this.ipBuckets, this.userBuckets]) {
      for (const [key, bucket] of map) {
        if (now - bucket.windowStart >= this.windowMs) map.delete(key);
      }
    }
  }
}
