/**
 * Cache-busting token for /css and /js URLs (`/css/app.css?v=<token>`).
 * Derived from the newest mtime under dist-static, so any rebuild yields a
 * new URL -- which is what lets those files be served with a year-long
 * immutable cache without pinning visitors to a stale stylesheet after a
 * deploy. Memoized briefly so it costs a handful of stat() calls per few
 * seconds, not per request.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(process.cwd(), 'dist-static');
const TTL_MS = 3000;

let cached = { at: 0, value: '0' };

function newestMtime(dir: string): number {
  let newest = 0;
  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) newest = Math.max(newest, newestMtime(full));
    else newest = Math.max(newest, fs.statSync(full).mtimeMs);
  }
  return newest;
}

export function assetVersion(): string {
  const now = Date.now();
  if (now - cached.at > TTL_MS) cached = { at: now, value: Math.floor(newestMtime(ROOT)).toString(36) };
  return cached.value;
}
