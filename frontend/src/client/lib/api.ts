/**
 * Shared API base + fetch helper for every client page -- previously
 * copy-pasted independently into 13 files (some as `apiFetch`, one as
 * `api`), which had drifted into two incompatible error shapes: one
 * checked a failed response's `.error` field, the other its `.detail`
 * field. Only `.detail` actually matches what the backend sends (see
 * backend/src/lib/httpError.ts) -- the `.error`-checking copy silently
 * dropped every real error message and fell back to a generic
 * "Request failed (nnn)" instead.
 */

export const apiBase = document.querySelector('meta[name="api-base"]')?.getAttribute('content') ?? '';

/** Always sends `Content-Type: application/json` unless the caller
 * overrides it (harmless on a bodyless GET/DELETE) -- so a caller sending
 * a JSON body doesn't have to set it manually every time, while one that
 * already does (unchanged from before this consolidation) still works. */
export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });
  if (!res.ok) {
    let message = await res.text();
    try {
      message = JSON.parse(message).detail ?? message;
    } catch {
      /* plain text body, use as-is */
    }
    throw new Error(message || `Request failed (${res.status})`);
  }
  return res.status === 204 ? (null as T) : res.json();
}
