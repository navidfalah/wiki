import { describe, expect, it, vi } from 'vitest';
import { dictionaries } from '../../src/i18n';

async function load(lang: 'en' | 'de' = 'en') {
  vi.resetModules();
  document.documentElement.lang = lang;
  document.body.innerHTML = `<script type="application/json" id="i18n-data">${JSON.stringify(dictionaries[lang])}</script>`;
  return import('../../src/client/lib/apiTokens');
}

const NOW = Date.parse('2026-09-29T12:00:00Z');

function token(overrides: Record<string, unknown> = {}) {
  return {
    id: 't1',
    name: 'MCP laptop',
    scope: 'read' as const,
    prefix: 'wsb_abc123',
    created_at: '2026-09-28T10:00:00Z',
    expires_at: null,
    last_used_at: null,
    expired: false,
    ...overrides,
  };
}

function dom(html: string): HTMLElement {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div;
}

describe('renderTokens', () => {
  it('shows name, prefix, scope, usage and a revoke button per token', async () => {
    const m = await load();
    const html = dom(m.renderTokens([token({ last_used_at: new Date(NOW - 3 * 3600_000).toISOString() })], NOW));
    expect(html.textContent).toContain('MCP laptop');
    expect(html.textContent).toContain('wsb_abc123…');
    expect(html.textContent).toContain('Read only');
    expect(html.textContent).toContain('last used 3 hours ago');
    expect(html.textContent).toContain('no expiry');
    expect(html.querySelector('[data-revoke="t1"]')).not.toBeNull();
  });

  it('marks write tokens, expiry dates and expired tokens', async () => {
    const m = await load();
    const html = dom(
      m.renderTokens(
        [
          token({ id: 'w', scope: 'write', expires_at: '2026-12-28T10:00:00Z' }),
          token({ id: 'x', name: 'old', expired: true, created_at: '2026-01-01T00:00:00Z' }),
        ],
        NOW,
      ),
    );
    const rows = html.querySelectorAll('li');
    expect(rows[0].textContent).toContain('Read and write');
    expect(rows[0].textContent).toContain('expires 28/12/2026');
    expect(rows[0].textContent).toContain('never used');
    expect(rows[1].textContent).toContain('expired');
    expect(rows[1].className).toContain('opacity-60');
  });

  it('escapes token names', async () => {
    const m = await load();
    const html = m.renderTokens([token({ name: '<img src=x onerror=alert(1)>' })], NOW);
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });

  it('has empty and error states, in German too', async () => {
    const m = await load();
    expect(dom(m.renderTokens([], NOW)).textContent).toBe('No tokens yet.');
    expect(dom(m.renderTokens(null, NOW)).textContent).toBe('Could not load your tokens.');
    const de = await load('de');
    expect(dom(de.renderTokens([], NOW)).textContent).toBe('Noch keine Tokens.');
    expect(dom(de.renderTokens([token()], NOW)).textContent).toContain('Nur lesen');
  });
});
