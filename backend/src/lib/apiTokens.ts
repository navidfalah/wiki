/**
 * Personal API tokens (data/api_tokens.json) -- long-lived credentials for
 * scripts and tools (the MCP server in mcp/, a cron job, curl) that can't
 * hold a browser session cookie.
 *
 * - A token is `wsb_` + 32 random bytes (base64url). Only its SHA-256 is
 *   stored: the value is shown once, at creation. A plain hash (not
 *   bcrypt) is enough because the secret is random, not a password, and it
 *   keeps the lookup on every request cheap.
 * - Scope `read` (the default) allows only GET/HEAD requests: enough to
 *   search, read pages and list sources. Scope `write` can do whatever the
 *   user can.
 * - A token acts with its owner's *current* role, looked up on every
 *   request, and stops working when the owner is deleted -- unlike a login
 *   session, it never carries a snapshot of the role.
 * - Tokens can only be created, listed and revoked from a signed-in
 *   session (see requireSession in authMiddleware.ts), so a leaked token
 *   can't mint more tokens for itself.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import { API_TOKENS_FILE } from '../paths';
import { atomicWriteJson } from './atomicWrite';
import { findUserById, type Role } from './users';

export const TOKEN_PREFIX = 'wsb_';
export type TokenScope = 'read' | 'write';
export const TOKEN_SCOPES: readonly TokenScope[] = ['read', 'write'];
const MAX_TOKENS_PER_USER = 20;
const MAX_NAME_LENGTH = 80;
// Writing last_used_at on every request would rewrite the file constantly;
// a minute's resolution is plenty for "is this token still in use".
const LAST_USED_RESOLUTION_MS = 60 * 1000;

interface TokenRecord {
  id: string;
  user_id: string;
  name: string;
  scope: TokenScope;
  token_hash: string;
  /** First characters of the token, so a user can tell tokens apart. */
  prefix: string;
  created_at: string;
  expires_at: string | null;
  last_used_at: string | null;
}

interface TokensFile {
  version: number;
  tokens: TokenRecord[];
}

export interface PublicToken {
  id: string;
  name: string;
  scope: TokenScope;
  prefix: string;
  created_at: string;
  expires_at: string | null;
  last_used_at: string | null;
  expired: boolean;
}

export class ApiTokenError extends Error {}

function load(): TokensFile {
  if (!fs.existsSync(API_TOKENS_FILE)) return { version: 1, tokens: [] };
  try {
    const data = JSON.parse(fs.readFileSync(API_TOKENS_FILE, 'utf-8'));
    return { version: data.version ?? 1, tokens: Array.isArray(data.tokens) ? data.tokens : [] };
  } catch {
    return { version: 1, tokens: [] };
  }
}

function save(data: TokensFile): void {
  atomicWriteJson(API_TOKENS_FILE, data);
}

function hash(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function isExpired(record: TokenRecord, now = Date.now()): boolean {
  return record.expires_at !== null && new Date(record.expires_at).getTime() <= now;
}

function toPublic(record: TokenRecord): PublicToken {
  return {
    id: record.id,
    name: record.name,
    scope: record.scope,
    prefix: record.prefix,
    created_at: record.created_at,
    expires_at: record.expires_at,
    last_used_at: record.last_used_at,
    expired: isExpired(record),
  };
}

export function isApiToken(value: string | undefined): boolean {
  return typeof value === 'string' && value.startsWith(TOKEN_PREFIX);
}

export function createApiToken(
  userId: string,
  input: { name?: unknown; scope?: unknown; expiresInDays?: unknown },
): { token: string; record: PublicToken } {
  const name = String(input.name ?? '').trim();
  if (!name) throw new ApiTokenError('A token needs a name');
  if (name.length > MAX_NAME_LENGTH) throw new ApiTokenError(`Token names are limited to ${MAX_NAME_LENGTH} characters`);
  const scope = (input.scope ?? 'read') as TokenScope;
  if (!TOKEN_SCOPES.includes(scope)) throw new ApiTokenError("Scope must be 'read' or 'write'");
  let expiresAt: string | null = null;
  if (input.expiresInDays !== undefined && input.expiresInDays !== null && input.expiresInDays !== '') {
    const days = Number(input.expiresInDays);
    if (!Number.isInteger(days) || days < 1 || days > 3650) throw new ApiTokenError('Expiry must be between 1 and 3650 days');
    expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  }

  const data = load();
  if (data.tokens.filter((t) => t.user_id === userId).length >= MAX_TOKENS_PER_USER) {
    throw new ApiTokenError(`At most ${MAX_TOKENS_PER_USER} tokens per user; revoke one first`);
  }
  const token = TOKEN_PREFIX + crypto.randomBytes(32).toString('base64url');
  const record: TokenRecord = {
    id: crypto.randomUUID(),
    user_id: userId,
    name,
    scope,
    token_hash: hash(token),
    prefix: token.slice(0, TOKEN_PREFIX.length + 6),
    created_at: new Date().toISOString(),
    expires_at: expiresAt,
    last_used_at: null,
  };
  data.tokens.push(record);
  save(data);
  return { token, record: toPublic(record) };
}

export function listApiTokens(userId: string): PublicToken[] {
  return load()
    .tokens.filter((t) => t.user_id === userId)
    .map(toPublic);
}

/** Revokes one of `userId`'s tokens. Returns false if it doesn't exist or belongs to someone else. */
export function revokeApiToken(userId: string, tokenId: string): boolean {
  const data = load();
  const before = data.tokens.length;
  data.tokens = data.tokens.filter((t) => !(t.id === tokenId && t.user_id === userId));
  if (data.tokens.length === before) return false;
  save(data);
  return true;
}

export function revokeApiTokensForUser(userId: string): number {
  const data = load();
  const before = data.tokens.length;
  data.tokens = data.tokens.filter((t) => t.user_id !== userId);
  if (data.tokens.length !== before) save(data);
  return before - data.tokens.length;
}

export interface TokenIdentity {
  user: { id: string; username: string; role: Role };
  scope: TokenScope;
  tokenId: string;
}

/** The user and scope behind a presented token, or null if it is unknown,
 * expired, or its owner no longer exists. */
export function resolveApiToken(token: string | undefined, now = Date.now()): TokenIdentity | null {
  if (!isApiToken(token)) return null;
  const digest = hash(token!);
  const data = load();
  const record = data.tokens.find(
    (t) => t.token_hash.length === digest.length && crypto.timingSafeEqual(Buffer.from(t.token_hash), Buffer.from(digest)),
  );
  if (!record || isExpired(record, now)) return null;
  const owner = findUserById(record.user_id);
  if (!owner) return null;

  const lastUsed = record.last_used_at ? new Date(record.last_used_at).getTime() : 0;
  if (now - lastUsed >= LAST_USED_RESOLUTION_MS) {
    record.last_used_at = new Date(now).toISOString();
    save(data);
  }
  return { user: { id: owner.id, username: owner.username, role: owner.role }, scope: record.scope, tokenId: record.id };
}
