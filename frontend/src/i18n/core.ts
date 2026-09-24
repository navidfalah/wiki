/**
 * Minimal i18n core shared by the server (EJS views, routes) and -- through
 * the JSON the server embeds per page -- the browser scripts.
 *
 * Keys are flat, namespaced strings (`dashboard.title`). Values may contain
 * `{name}` placeholders. Plurals use a `_one` / `_other` key pair and are
 * resolved by translatePlural(); English and German both have exactly these
 * two plural forms.
 */
export type Lang = 'en' | 'de';
export const LANGS: readonly Lang[] = ['en', 'de'];
export const DEFAULT_LANG: Lang = 'en';

export type Dict = Record<string, string>;
export type Vars = Record<string, string | number>;

export function isLang(value: unknown): value is Lang {
  return value === 'en' || value === 'de';
}

export function interpolate(template: string, vars?: Vars, escape?: (v: string) => string): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) => {
    if (!(name in vars)) return match;
    const value = String(vars[name]);
    return escape ? escape(value) : value;
  });
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function translate(dict: Dict, key: string, vars?: Vars, escape?: (v: string) => string): string {
  const template = dict[key];
  if (template === undefined) return key; // visible in the UI, and caught by scripts/check-i18n.mjs in CI
  return interpolate(template, vars, escape);
}

export function translatePlural(dict: Dict, key: string, count: number, vars?: Vars, escape?: (v: string) => string): string {
  const form = count === 1 ? `${key}_one` : `${key}_other`;
  return translate(dict, form, { count, ...vars }, escape);
}
