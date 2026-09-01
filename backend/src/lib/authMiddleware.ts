import type { NextFunction, Request, Response } from 'express';
import { getSessionUser } from './sessions';
import type { Role } from './users';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; username: string; role: Role };
    }
  }
}

function bearerToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return undefined;
  return header.slice('Bearer '.length).trim();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const user = getSessionUser(bearerToken(req));
  if (!user) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }
  req.user = user;
  next();
}

/** Mount after requireAuth -- gates a route to the 'admin' role (e.g. user management). */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ detail: 'Admin access required' });
    return;
  }
  next();
}
