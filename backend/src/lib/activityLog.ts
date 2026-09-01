/**
 * Append-only activity log for the "Logs" page -- every state-changing
 * action (file uploaded/deleted/moved, folder created/deleted, source
 * added/removed, compiler started/stopped, etc.) gets one row here, who
 * did it (from req.user, set by requireAuth) and what. Read-only actions
 * (browsing, previewing, chat Q&A) are deliberately not logged here --
 * this is an audit trail of changes, not a request log.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ACTIVITY_LOG_FILE } from '../paths';

const MAX_EVENTS = 1000;

export interface ActivityEvent {
  id: string;
  at: string;
  username: string;
  action: string;
  detail: string;
}

interface ActivityLogFile {
  version: number;
  events: ActivityEvent[];
}

function load(): ActivityLogFile {
  if (!fs.existsSync(ACTIVITY_LOG_FILE)) return { version: 1, events: [] };
  try {
    const data = JSON.parse(fs.readFileSync(ACTIVITY_LOG_FILE, 'utf-8'));
    return { version: data.version ?? 1, events: Array.isArray(data.events) ? data.events : [] };
  } catch {
    return { version: 1, events: [] };
  }
}

function save(data: ActivityLogFile): void {
  fs.mkdirSync(path.dirname(ACTIVITY_LOG_FILE), { recursive: true });
  fs.writeFileSync(ACTIVITY_LOG_FILE, JSON.stringify(data, null, 2));
}

export function logEvent(username: string | undefined, action: string, detail = ''): void {
  const data = load();
  data.events.push({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    username: username ?? 'unknown',
    action,
    detail,
  });
  if (data.events.length > MAX_EVENTS) {
    data.events = data.events.slice(data.events.length - MAX_EVENTS);
  }
  save(data);
}

export function listEvents(limit = 200): ActivityEvent[] {
  const data = load();
  return data.events.slice(-limit).reverse();
}
