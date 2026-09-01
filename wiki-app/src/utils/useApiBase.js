import { useCallback, useEffect, useState } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { DEFAULT_WIKI_API_URL } from './wikiApi';

const STORAGE_KEY = 'wiki:apiBaseUrl';

export function readStoredApiBase() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

function writeStoredApiBase(value) {
  if (typeof window === 'undefined') return;
  try {
    if (value) {
      window.localStorage.setItem(STORAGE_KEY, value);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // localStorage unavailable (private mode, etc.) -- setting just won't persist.
  }
}

/**
 * Resolves the compiler API base URL: a user override saved from the
 * Settings panel takes precedence over the build-time default
 * (docusaurus.config.js customFields.wikiApiUrl / WIKI_API_URL env var).
 * Returns [apiBase, setApiBase, isOverridden].
 */
export default function useApiBase() {
  const { siteConfig } = useDocusaurusContext();
  const defaultBase = siteConfig.customFields?.wikiApiUrl ?? DEFAULT_WIKI_API_URL;
  const [override, setOverride] = useState(null);

  useEffect(() => {
    setOverride(readStoredApiBase());
  }, []);

  const setApiBase = useCallback((value) => {
    const trimmed = (value || '').trim().replace(/\/+$/, '');
    writeStoredApiBase(trimmed || null);
    setOverride(trimmed || null);
  }, []);

  return [override || defaultBase, setApiBase, Boolean(override)];
}
