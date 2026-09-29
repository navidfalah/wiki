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
