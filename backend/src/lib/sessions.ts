/**
 * File-backed login sessions (data/sessions.json) -- deliberately not an
 * in-memory Map, so a `docker compose restart backend` (which happens
 * often during development, and on every image rebuild) doesn't silently
 * log everyone out. Opaque random tokens, not JWTs: revocation is just
 * deleting a row, no signing-key rotation story to get wrong.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { SESSIONS_FILE } from '../paths';
import type { PublicUser, Role } from './users';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface SessionRecord {
  token: string;
  user_id: string;
  username: string;
  role: Role;
  created_at: string;
  expires_at: string;
}

interface SessionsFile {
  version: number;
  sessions: SessionRecord[];
}

function load(): SessionsFile {
  if (!fs.existsSync(SESSIONS_FILE)) return { version: 1, sessions: [] };
  try {
    const data = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8'));
    return { version: data.version ?? 1, sessions: Array.isArray(data.sessions) ? data.sessions : [] };
  } catch {
    return { version: 1, sessions: [] };
  }
}

function save(data: SessionsFile): void {
  fs.mkdirSync(path.dirname(SESSIONS_FILE), { recursive: true });
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(data, null, 2));
}

function pruneExpired(data: SessionsFile): SessionsFile {
  const now = Date.now();
  data.sessions = data.sessions.filter((s) => new Date(s.expires_at).getTime() > now);
  return data;
}

export function createSession(user: PublicUser): string {
  const data = pruneExpired(load());
  const token = crypto.randomBytes(32).toString('base64url');
  const now = new Date();
  data.sessions.push({
    token,
    user_id: user.id,
    username: user.username,
    role: user.role,
    created_at: now.toISOString(),
    expires_at: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
  });
  save(data);
  return token;
}

export function getSessionUser(token: string | undefined): { id: string; username: string; role: Role } | null {
  if (!token) return null;
  const data = pruneExpired(load());
  const session = data.sessions.find((s) => s.token === token);
  if (!session) return null;
  return { id: session.user_id, username: session.username, role: session.role };
}

export function deleteSession(token: string | undefined): void {
  if (!token) return;
  const data = load();
  data.sessions = data.sessions.filter((s) => s.token !== token);
  save(data);
}
