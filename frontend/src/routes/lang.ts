/**
 * GET /lang/:code?next=/path -- remembers the visitor's language in a cookie
 * and sends them back where they were. Public (no login needed), so the
 * sign-in page and the landing page can use it too.
 */
import { Router } from 'express';
import { isLang } from '../i18n/core';
import { setLangCookie } from '../lib/i18nMiddleware';

const router = Router();

function safeNext(next: unknown): string {
  const value = typeof next === 'string' ? next : '';
  return value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

router.get('/lang/:code', (req, res) => {
  const code = req.params.code;
  if (isLang(code)) setLangCookie(res, code);
  res.redirect(safeNext(req.query.next));
});

export default router;
