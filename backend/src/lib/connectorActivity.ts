/**
 * Append-only interaction log for external data connectors (Postgres,
 * Gmail, Drive, IMAP). Unlike activityLog.ts -- explicitly an audit trail
 * of *changes* only, with "read-only actions ... deliberately not logged
 * here" -- this also records read-only interactions (browsing/listing
 * tables), because the /database page's whole point is showing what has
 * actually happened against a connected external database, not just when
 * it was connected to or imported from.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { CONNECTOR_ACTIVITY_FILE } from '../paths';

const MAX_EVENTS = 500;

export type ConnectorActivityAction = 'connect' | 'browse' | 'import' | 'disconnect';

export interface ConnectorActivityEvent {
  id: string;
  at: string;
  username: string;
  connector_id: string;
  account_label: string | null;
  action: ConnectorActivityAction;
  detail: string;
  success: boolean;
  duration_ms: number | null;
  error: string | null;
}

interface ConnectorActivityFile {
  version: number;
  events: ConnectorActivityEvent[];
}

function load(): ConnectorActivityFile {
  if (!fs.existsSync(CONNECTOR_ACTIVITY_FILE)) return { version: 1, events: [] };
  try {
    const data = JSON.parse(fs.readFileSync(CONNECTOR_ACTIVITY_FILE, 'utf-8'));
    return { version: data.version ?? 1, events: Array.isArray(data.events) ? data.events : [] };
  } catch {
    return { version: 1, events: [] };
  }
}

function save(data: ConnectorActivityFile): void {
  fs.mkdirSync(path.dirname(CONNECTOR_ACTIVITY_FILE), { recursive: true });
  fs.writeFileSync(CONNECTOR_ACTIVITY_FILE, JSON.stringify(data, null, 2));
}

export function logConnectorEvent(params: {
  username: string | undefined;
  connectorId: string;
  accountLabel: string | null;
  action: ConnectorActivityAction;
  detail: string;
  success: boolean;
  durationMs?: number | null;
  error?: string | null;
}): void {
  const data = load();
  data.events.push({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    username: params.username ?? 'unknown',
    connector_id: params.connectorId,
    account_label: params.accountLabel,
    action: params.action,
    detail: params.detail,
    success: params.success,
    duration_ms: params.durationMs ?? null,
    error: params.error ?? null,
  });
  if (data.events.length > MAX_EVENTS) {
    data.events = data.events.slice(data.events.length - MAX_EVENTS);
  }
  save(data);
}

export function listConnectorEvents(connectorId?: string, limit = 200): ConnectorActivityEvent[] {
  const data = load();
  const filtered = connectorId ? data.events.filter((e) => e.connector_id === connectorId) : data.events;
  return filtered.slice(-limit).reverse();
}
