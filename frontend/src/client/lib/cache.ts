// Small localStorage-backed cache so pages can show their last-known data
// immediately on load (before/without a network round-trip), instead of a
// blank state every time the page is left and revisited.

const PREFIX = 'wiki:cache:';

export interface CacheEntry<T> {
  data: T;
  savedAt: number;
}

export function saveCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {
    /* storage unavailable (private mode, quota) -- caching is best-effort */
  }
}

export function loadCache<T>(key: string): CacheEntry<T> | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as CacheEntry<T>) : null;
  } catch {
    return null;
  }
}

function cacheAgeLabel(savedAt: number): string {
  const minutes = Math.round((Date.now() - savedAt) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)} day(s) ago`;
}

export function showOfflineBanner(savedAt: number): void {
  const el = document.getElementById('offline-banner');
  if (!el) return;
  el.textContent = `Can't reach the server -- showing cached data from ${cacheAgeLabel(savedAt)}.`;
  el.classList.remove('hidden');
}

export function hideOfflineBanner(): void {
  document.getElementById('offline-banner')?.classList.add('hidden');
}

// Calls `onReconnect` once whenever the browser regains connectivity, so a
// page that fell back to cached data can retry without a manual reload.
export function onReconnect(callback: () => void): void {
  window.addEventListener('online', callback);
}
