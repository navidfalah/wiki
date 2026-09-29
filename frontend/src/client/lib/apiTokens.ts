/**
 * Rendering for the Settings page's "API tokens" section, kept free of
 * fetch/DOM wiring so it can be unit-tested (test/unit/api-tokens.test.ts).
 */
import { esc, relativeTime } from './dashboardHome';
import { formatDate, t, th } from './i18n';

export interface ApiToken {
  id: string;
  name: string;
  scope: 'read' | 'write';
  prefix: string;
  created_at: string;
  expires_at: string | null;
  last_used_at: string | null;
  expired: boolean;
}

export function scopeLabel(scope: ApiToken['scope']): string {
  return scope === 'write' ? t('settings.tokens.scopeWrite') : t('settings.tokens.scopeRead');
}

function statusText(token: ApiToken, now: number): string {
  if (token.expired) return th('settings.tokens.expired');
  const used = token.last_used_at ? th('settings.tokens.lastUsed', { when: relativeTime(token.last_used_at, now) }) : th('settings.tokens.neverUsed');
  const expires = token.expires_at ? th('settings.tokens.expires', { date: formatDate(token.expires_at) }) : th('settings.tokens.noExpiry');
  return `${used} · ${expires}`;
}

export function renderTokens(tokens: ApiToken[] | null, now: number = Date.now()): string {
  if (!tokens) return `<p class="p-5 text-sm text-red-600">${th('settings.tokens.loadFailed')}</p>`;
  if (!tokens.length) return `<p class="p-5 text-sm text-gray-500">${th('settings.tokens.none')}</p>`;
  const rows = [...tokens]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((token) => {
      const badge =
        token.scope === 'write'
          ? 'bg-amber-50 text-amber-700 ring-amber-200'
          : 'bg-gray-50 text-gray-600 ring-gray-200';
      return `<li class="flex flex-wrap items-center gap-3 px-5 py-3${token.expired ? ' opacity-60' : ''}" data-token-id="${esc(token.id)}">
  <div class="min-w-0 flex-1">
    <p class="truncate text-sm font-medium text-gray-900">${esc(token.name)}</p>
    <p class="mt-0.5 text-xs text-gray-500"><code class="rounded bg-gray-100 px-1 py-0.5">${esc(token.prefix)}…</code> · ${statusText(token, now)}</p>
  </div>
  <span class="rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${badge}">${esc(scopeLabel(token.scope))}</span>
  <button type="button" data-revoke="${esc(token.id)}" class="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">${th('settings.tokens.revoke')}</button>
</li>`;
    });
  return `<ul class="divide-y divide-gray-100">${rows.join('')}</ul>`;
}
