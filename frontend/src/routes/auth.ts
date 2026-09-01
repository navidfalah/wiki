import express, { Router } from 'express';
import { BACKEND_API_URL } from '../config';
import { clearSessionCookie, getToken, setSessionCookie } from '../lib/auth';

const router = Router();
const formParser = express.urlencoded({ extended: true });

function safeNext(next: unknown): string {
  const value = typeof next === 'string' ? next : '';
  return value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard';
}

router.get('/login', (req, res) => {
  res.render('login', { next: safeNext(req.query.next), error: null });
});

router.post('/login', formParser, async (req, res) => {
  const username = String(req.body?.username ?? '').trim();
  const password = String(req.body?.password ?? '');
  const next = safeNext(req.body?.next);

  try {
    const backendRes = await fetch(`${BACKEND_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!backendRes.ok) {
      res.status(401).render('login', { next, error: 'Invalid username or password.' });
      return;
    }
    const data = (await backendRes.json()) as { token: string };
    setSessionCookie(res, data.token);
    res.redirect(next);
  } catch {
    res.status(500).render('login', { next, error: `Cannot reach the API at ${BACKEND_API_URL}.` });
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
