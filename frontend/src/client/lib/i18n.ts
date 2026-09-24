/**
 * Browser-side translations. The server embeds the current language's
 * `common.*` + this page's namespace as JSON in #i18n-data (see
 * views/partials/foot.ejs), so no dictionary is bundled into the scripts.
 */
type Vars = Record<string, string | number>;

const lang = document.documentElement.lang === 'de' ? 'de' : 'en';
let dict: Record<string, string> = {};
try {
  dict = JSON.parse(document.getElementById('i18n-data')?.textContent ?? '{}');
} catch {
  /* fall back to keys */
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function fill(template: string, vars?: Vars, escape?: (v: string) => string): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? (escape ? escape(String(vars[name])) : String(vars[name])) : m));
}

/** Plain-text translation (textContent, toasts, confirm(), attributes set via DOM APIs). */
export function t(key: string, vars?: Vars): string {
  return fill(dict[key] ?? key, vars);
}

/** Translation for innerHTML templates: interpolated values are HTML-escaped. */
export function th(key: string, vars?: Vars): string {
  return fill(dict[key] ?? key, vars, escapeHtml);
}

/** Plural-aware (`key_one` / `key_other`), `{count}` is filled in automatically. */
export function tn(key: string, count: number, vars?: Vars): string {
  return t(`${key}_${count === 1 ? 'one' : 'other'}`, { count, ...vars });
}

export function tnh(key: string, count: number, vars?: Vars): string {
  return th(`${key}_${count === 1 ? 'one' : 'other'}`, { count, ...vars });
}

export const currentLang: 'en' | 'de' = lang;

/** Locale-aware formatting that follows the UI language, not the OS locale. */
export function formatDateTime(value: string | number | Date): string {
  try {
    return new Date(value).toLocaleString(lang === 'de' ? 'de-DE' : 'en-GB');
  } catch {
    return String(value);
  }
}
export function formatDate(value: string | number | Date): string {
  try {
    return new Date(value).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB');
  } catch {
    return String(value);
  }
}
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return value.toLocaleString(lang === 'de' ? 'de-DE' : 'en-GB', options);
}
