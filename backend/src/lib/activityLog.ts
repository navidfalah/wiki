/**
 * Append-only activity log for the "Logs" page. Two kinds of rows share
 * this one log rather than living in separate files, distinguished by
 * `category`/`level`:
 *
 *  - User actions: every state-changing action (file uploaded/deleted/
 *    moved, folder created/deleted, source added/removed, compiler
 *    started/stopped, settings updated, etc.), attributed to who did it
 *    (from req.user, set by requireAuth). Read-only browsing (previewing
 *    a file, asking chat a question) is still deliberately not logged --
 *    this stays an audit trail of changes and notable events, not a full
 *    request log.
 *  - System events: things the app itself does or notices, not tied to
 *    one user action -- backend startup, a crash-recovered pipeline run,
 *    a failed login attempt, an unhandled request error. Username is
 *    `"system"` for these.
 *
 * `category` defaults to a best-effort guess from the action text
 * (inferCategory) so every historical call site gets a useful category
 * with zero changes -- pass an explicit one only where the guess would be
 * wrong or ambiguous. `level` defaults to 'info'; pass 'warn'/'error' for
 * anything that represents a problem, so the Logs page can surface those
 * without reading every row.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ACTIVITY_LOG_FILE } from '../paths';

const MAX_EVENTS = 5000;

export type ActivityLevel = 'info' | 'warn' | 'error';

export interface ActivityEvent {
  id: string;
  at: string;
  username: string;
  action: string;
  detail: string;
  level: ActivityLevel;
  category: string;
}

export interface LogEventOptions {
  level?: ActivityLevel;
  category?: string;
}

interface ActivityLogFile {
  version: number;
  events: ActivityEvent[];
}

function load(): ActivityLogFile {
  if (!fs.existsSync(ACTIVITY_LOG_FILE)) return { version: 2, events: [] };
  try {
    const data = JSON.parse(fs.readFileSync(ACTIVITY_LOG_FILE, 'utf-8'));
    const events = Array.isArray(data.events) ? data.events : [];
    // Rows written before `level`/`category` existed (version 1) still
    // have neither field -- backfill them at read time rather than
    // rewriting the whole file, so old rows still filter/sort sensibly.
    return {
      version: data.version ?? 1,
      events: events.map((e: Partial<ActivityEvent>) => ({
        id: e.id ?? crypto.randomUUID(),
        at: e.at ?? new Date(0).toISOString(),
        username: e.username ?? 'unknown',
        action: e.action ?? '',
        detail: e.detail ?? '',
        level: e.level ?? 'info',
        category: e.category ?? inferCategory(e.action ?? ''),
      })),
    };
  } catch {
    return { version: 2, events: [] };
  }
}

function save(data: ActivityLogFile): void {
  fs.mkdirSync(path.dirname(ACTIVITY_LOG_FILE), { recursive: true });
  fs.writeFileSync(ACTIVITY_LOG_FILE, JSON.stringify({ version: 2, events: data.events }, null, 2));
}

// Longest/most-specific phrases first, same convention as
// modelPricing.ts's SORTED_KEYS -- "source folder" must match before the
// more general "folder".
const CATEGORY_RULES: Array<[string, string]> = [
  ['logged in', 'auth'],
  ['logged out', 'auth'],
  ['login attempt', 'auth'],
  ['source folder', 'sources'],
  ['user ', 'users'],
  ['email', 'emails'],
  ['wiki page', 'wiki'],
  ['file', 'files'],
  ['folder', 'files'],
  ['upload', 'files'],
  ['compiler', 'pipeline'],
  ['pipeline', 'pipeline'],
  ['link override', 'review'],
  ['review correction', 'review'],
  ['chat session', 'chat'],
  ['rag preset', 'settings'],
  ['settings', 'settings'],
  ['external account', 'connectors'],
  ['connector', 'connectors'],
];

export function inferCategory(action: string): string {
  const needle = action.toLowerCase();
  for (const [phrase, category] of CATEGORY_RULES) {
    if (needle.includes(phrase)) return category;
  }
  return 'general';
}

export function logEvent(username: string | undefined, action: string, detail = '', options: LogEventOptions = {}): void {
  const data = load();
  data.events.push({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    username: username ?? 'unknown',
    action,
    detail,
    level: options.level ?? 'info',
    category: options.category ?? inferCategory(action),
  });
  if (data.events.length > MAX_EVENTS) {
    data.events = data.events.slice(data.events.length - MAX_EVENTS);
  }
  save(data);
}

/** Convenience wrapper for events not tied to a signed-in user's action
 * (backend startup, crash recovery, unhandled errors) -- always
 * username="system", category defaults to "system" rather than being
 * guessed from the message. */
export function logSystemEvent(action: string, detail = '', level: ActivityLevel = 'info'): void {
  logEvent('system', action, detail, { level, category: 'system' });
}

export function listEvents(limit = 200): ActivityEvent[] {
  const data = load();
  return data.events.slice(-limit).reverse();
}
