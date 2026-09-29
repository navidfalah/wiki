import type { NextFunction, Request, Response } from 'express';
import { isApiToken, resolveApiToken, type TokenScope } from './apiTokens';
import { getSessionUser } from './sessions';
import { langFromRequest, localizeMessage } from './localizeMessage';
import type { Role } from './users';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; username: string; role: Role };
      /** How req.user authenticated: a login session, or a personal API token (with its scope). */
      auth?: { method: 'session' } | { method: 'token'; scope: TokenScope; tokenId: string };
    }
  }
}

function bearerToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return undefined;
  return header.slice('Bearer '.length).trim();
}

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * GET routes a read-only token must still not reach, because a GET there is
 * not a read:
 *  - /api/admin/*: includes the backup download, and a backup holds
 *    data/sessions.json (login session tokens in the clear) and the password
 *    hashes. A read token owned by an admin could otherwise be traded for a
 *    full login session. The admin console needs a real sign-in.
 *  - /api/build/stream: a GET that *starts* a compile (LLM spend, rewrites the wiki).
 *  - /api/chat/sessions/:id/stream: a GET that appends to the chat history and
 *    calls the LLM.
 * A write-scope token can do anything its owner can, so it is not restricted here.
 */
const READ_TOKEN_DENIED: RegExp[] = [/^\/api\/admin(\/|$)/, /^\/api\/build\/stream$/, /^\/api\/chat\/sessions\/[^/]+\/stream$/];

/** Express matches routes case-insensitively, ignores a trailing slash and decodes %xx, so
 * the path is put in that same form before it is compared: /API/Admin, /api//admin and
 * /api/%61dmin must not slip past a check that only knows /api/admin. */
export function isReadTokenDenied(path: string): boolean {
  let decoded = path;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    return true; // a path Express could not decode is not one to let through
  }
  const clean = decoded.toLowerCase().replace(/\/{2,}/g, '/').replace(/\/+$/, '') || '/';
  return READ_TOKEN_DENIED.some((re) => re.test(clean));
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const presented = bearerToken(req);
  if (isApiToken(presented)) {
    const identity = resolveApiToken(presented);
    if (!identity) {
      res.status(401).json({ detail: localizeMessage('Not authenticated', langFromRequest(req)) });
      return;
    }
    if (identity.scope === 'read' && !READ_METHODS.has(req.method)) {
      res.status(403).json({ detail: localizeMessage('This API token is read-only', langFromRequest(req)) });
      return;
    }
    if (identity.scope === 'read' && isReadTokenDenied(req.originalUrl.split('?')[0])) {
      res.status(403).json({ detail: localizeMessage('This API token is read-only', langFromRequest(req)) });
      return;
    }
    req.user = identity.user;
    req.auth = { method: 'token', scope: identity.scope, tokenId: identity.tokenId };
    next();
    return;
  }
  const user = getSessionUser(presented);
  if (!user) {
    res.status(401).json({ detail: localizeMessage('Not authenticated', langFromRequest(req)) });
    return;
  }
  req.user = user;
  req.auth = { method: 'session' };
  next();
}

/** Mount after requireAuth -- refuses API tokens, for routes that manage
 * credentials (a leaked token must not be able to mint new ones). */
export function requireSession(req: Request, res: Response, next: NextFunction): void {
  if (req.auth?.method !== 'session') {
    res.status(403).json({ detail: localizeMessage('Sign in to manage API tokens', langFromRequest(req)) });
    return;
  }
  next();
}

/** Mount after requireAuth -- gates a route to the 'admin' role (e.g. user management). */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ detail: localizeMessage('Admin access required', langFromRequest(req)) });
    return;
  }
  next();
}
