import { describe, expect, it } from 'vitest';
import { escapeHtml, interpolate, isLang, translate, translatePlural } from '../../src/i18n/core';
import { dictionaries } from '../../src/i18n';

describe('i18n core', () => {
  it('interpolates placeholders and leaves unknown ones visible', () => {
    expect(interpolate('Hi {name}, {missing}', { name: 'Mira' })).toBe('Hi Mira, {missing}');
  });

  it('escapes only the interpolated values when given an escaper', () => {
    expect(translate({ k: '<b>{v}</b>' }, 'k', { v: '<img onerror=x>' }, escapeHtml)).toBe('<b>&lt;img onerror=x&gt;</b>');
  });

  it('falls back to the key for a missing translation', () => {
    expect(translate({}, 'nav.unknown')).toBe('nav.unknown');
  });

  it('picks _one/_other and fills {count}', () => {
    const dict = { 'x_one': '{count} page', 'x_other': '{count} pages' };
    expect(translatePlural(dict, 'x', 1)).toBe('1 page');
    expect(translatePlural(dict, 'x', 0)).toBe('0 pages');
    expect(translatePlural(dict, 'x', 7)).toBe('7 pages');
  });

  it('escapes all five HTML-significant characters', () => {
    expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe('&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;');
  });

  it('recognises only supported languages', () => {
    expect(isLang('de')).toBe(true);
    expect(isLang('fr')).toBe(false);
    expect(isLang(undefined)).toBe(false);
  });

  it('ships the search namespace in both languages', () => {
    expect(dictionaries.en['search.title']).toBe('Search');
    expect(dictionaries.de['search.title']).toBe('Suche');
  });
});
