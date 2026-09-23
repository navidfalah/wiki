import express, { Router } from 'express';
import { BACKEND_API_URL, SHOW_DEFAULT_LOGIN_HINT } from '../config';
import { clearSessionCookie, getToken, setSessionCookie } from '../lib/auth';

const router = Router();
const formParser = express.urlencoded({ extended: true });

function safeNext(next: unknown): string {
  const value = typeof next === 'string' ? next : '';
  return value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard';
}

router.get('/login', (req, res) => {
  res.render('login', { next: safeNext(req.query.next), error: null, showDefaultLogin: SHOW_DEFAULT_LOGIN_HINT });
});

router.post('/login', formParser, async (req, res) => {
  const username = String(req.body?.username ?? '').trim();
  const password = String(req.body?.password ?? '');
  const next = safeNext(req.body?.next);

  try {
    const backendRes = await fetch(`${BACKEND_API_URL}/api/auth/login`, {
      method: 'POST',
      // X-Client-IP lets the backend's login throttle see the real visitor
      // rather than this container (req.ip honours Caddy's X-Forwarded-For
      // via `trust proxy`, see index.ts).
      headers: { 'Content-Type': 'application/json', 'X-Client-IP': req.ip ?? '', 'X-Lang': res.locals.lang },
      body: JSON.stringify({ username, password }),
    });
    if (backendRes.status === 429) {
      const minutes = Math.max(1, Math.ceil(Number(backendRes.headers.get('retry-after') ?? 900) / 60));
      res.status(429).render('login', { next, error: res.locals.tn('login.errorThrottled', minutes), showDefaultLogin: SHOW_DEFAULT_LOGIN_HINT });
      return;
    }
    if (!backendRes.ok) {
      res.status(401).render('login', { next, error: res.locals.t('login.errorInvalid'), showDefaultLogin: SHOW_DEFAULT_LOGIN_HINT });
      return;
    }
    const data = (await backendRes.json()) as { token: string };
    setSessionCookie(res, data.token);
    res.redirect(next);
  } catch {
    res.status(500).render('login', { next, error: res.locals.t('login.errorUnreachable'), showDefaultLogin: SHOW_DEFAULT_LOGIN_HINT });
  }
});

router.post('/logout', async (req, res) => {
  const token = getToken(req);
  try {
    await fetch(`${BACKEND_API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  } catch {
    /* best-effort */
  }
  clearSessionCookie(res);
  res.redirect('/login');
});

export default router;
