// Small localStorage-backed cache so pages can show their last-known data
// immediately on load (before/without a network round-trip), instead of a
// blank state every time the page is left and revisited.

import { t } from './i18n';
import { ageLabel } from './serverText';

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

export function showOfflineBanner(savedAt: number): void {
  const el = document.getElementById('offline-banner');
  if (!el) return;
  el.textContent = t('common.offline', { age: ageLabel(savedAt) });
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
