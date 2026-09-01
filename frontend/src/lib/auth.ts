/**
 * The frontend's half of the login story: it never validates a session
 * itself (the backend's data/sessions.json is the source of truth) -- it
 * just carries the session token as an HttpOnly cookie on its own origin,
 * forwards it as `Authorization: Bearer <token>` on every server-side
 * fetch, and asks the backend "who is this" via GET /api/auth/me.
 */
import type { Request, Response } from 'express';
import { BACKEND_API_URL } from '../config';

export const SESSION_COOKIE = 'session_token';

export interface CurrentUser {
  id: string;
  username: string;
  role: 'admin' | 'user';
}

export function getToken(req: Request): string | undefined {
  return req.cookies?.[SESSION_COOKIE];
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // set true behind HTTPS; see README for reverse-proxy deployment notes
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

export async function fetchCurrentUser(token: string | undefined): Promise<CurrentUser | null> {
  if (!token) return null;
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { user?: CurrentUser };
    return data.user ?? null;
  } catch {
    return null;
  }
}
