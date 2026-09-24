/**
 * Per-request language: `lang` cookie (set by the switcher) wins, otherwise
 * the browser's Accept-Language, otherwise English. Exposes t()/th()/tn() to
 * every EJS view and `clientI18n` -- the slice of the dictionary the page's
 * browser script needs -- as JSON to embed.
 */
import type { NextFunction, Request, Response } from 'express';
import { COOKIE_SECURE } from '../config';
import { DEFAULT_LANG, Lang, LANGS, escapeHtml, isLang, translate, translatePlural, Vars } from '../i18n/core';
import { dictionaries, pickNamespaces } from '../i18n';

export const LANG_COOKIE = 'lang';

/** The visitor's stated preference (cookie, then Accept-Language), or null when there is none. */
export function explicitLang(req: Request): Lang | null {
  const cookie = req.cookies?.[LANG_COOKIE];
  if (isLang(cookie)) return cookie;
  const header = String(req.headers['accept-language'] ?? '');
  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.find((p) => p.trim().startsWith('q='));
      return { tag: tag.toLowerCase(), q: q ? Number(q.trim().slice(2)) : 1 };
    })
    .filter((entry) => entry.tag && !Number.isNaN(entry.q))
    .sort((a, b) => b.q - a.q);
  for (const { tag } of ranked) {
    const base = tag.split('-')[0];
    if ((LANGS as readonly string[]).includes(base)) return base as Lang;
  }
  return null;
}

export function detectLang(req: Request): Lang {
  return explicitLang(req) ?? DEFAULT_LANG;
}

export function setLangCookie(res: Response, lang: Lang): void {
  res.cookie(LANG_COOKIE, lang, {
    sameSite: 'lax',
    secure: COOKIE_SECURE,
    maxAge: 365 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function i18nMiddleware(req: Request, res: Response, next: NextFunction): void {
  const lang = detectLang(req);
  const dict = dictionaries[lang];
  res.locals.lang = lang;
  res.locals.t = (key: string, vars?: Vars) => translate(dict, key, vars);
  // Same as t(), but escapes the interpolated values -- for keys whose text
  // itself contains trusted markup and is printed with <%- %>.
  res.locals.th = (key: string, vars?: Vars) => translate(dict, key, vars, escapeHtml);
  res.locals.tn = (key: string, count: number, vars?: Vars) => translatePlural(dict, key, count, vars);
  // Slice for the page script: common.* plus the script's own namespace.
  res.locals.clientI18n = (scriptName?: string) =>
    JSON.stringify(pickNamespaces(dict, ['common.', ...(scriptName ? [`${scriptName}.`] : [])])).replace(/</g, '\\u003c');
  next();
}
