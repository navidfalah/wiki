import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it } from 'vitest';
import { detectLang, explicitLang, i18nMiddleware } from '../../src/lib/i18nMiddleware';

function req(headers: Record<string, string> = {}, cookies: Record<string, string> = {}): Request {
  return { headers, cookies } as unknown as Request;
}

describe('language detection', () => {
  it('prefers the lang cookie over Accept-Language', () => {
    expect(explicitLang(req({ 'accept-language': 'en-US' }, { lang: 'de' }))).toBe('de');
  });

  it('ranks Accept-Language by q value and matches on the base tag', () => {
    expect(explicitLang(req({ 'accept-language': 'fr;q=0.9, de-AT;q=0.8, en;q=0.1' }))).toBe('de');
  });

  it('ignores an unsupported cookie value', () => {
    expect(explicitLang(req({}, { lang: 'xx' }))).toBeNull();
  });

  it('defaults to English', () => {
    expect(detectLang(req({ 'accept-language': 'fr, es' }))).toBe('en');
  });
});

describe('i18nMiddleware', () => {
  function run(r: Request) {
    const res = { locals: {} as Record<string, any> } as unknown as Response;
    let called = false;
    i18nMiddleware(r, res, (() => (called = true)) as NextFunction);
    return { locals: res.locals, called };
  }

  it('exposes translators for the detected language and calls next()', () => {
    const { locals, called } = run(req({ 'accept-language': 'de' }));
    expect(called).toBe(true);
    expect(locals.lang).toBe('de');
    expect(locals.t('nav.search')).toBe('Suche');
  });

  it('th() escapes interpolated values', () => {
    const { locals } = run(req());
    expect(locals.th('search.noMatch', { query: '<script>' })).toContain('&lt;script&gt;');
  });

  it('clientI18n embeds only common.* plus the page namespace, safe inside <script>', () => {
    const { locals } = run(req());
    const json: string = locals.clientI18n('search');
    expect(json).not.toContain('<');
    const dict = JSON.parse(json);
    const prefixes = new Set(Object.keys(dict).map((k) => k.split('.')[0]));
    expect([...prefixes].sort()).toEqual(['common', 'search']);
  });
});
