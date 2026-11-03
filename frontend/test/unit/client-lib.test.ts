import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The client i18n module reads #i18n-data and <html lang> once, at import.
async function loadI18n(dict: Record<string, string>, lang = 'en') {
  vi.resetModules();
  document.documentElement.lang = lang;
  document.body.innerHTML = `<script type="application/json" id="i18n-data">${JSON.stringify(dict)}</script>`;
  return import('../../src/client/lib/i18n');
}

describe('client i18n', () => {
  it('t() leaves values raw; th() escapes them for innerHTML', async () => {
    const { t, th } = await loadI18n({ 'k': 'Hello {name}' });
    expect(t('k', { name: '<b>' })).toBe('Hello <b>');
    expect(th('k', { name: '<b>' })).toBe('Hello &lt;b&gt;');
  });

  it('tn() picks the plural form', async () => {
    const { tn } = await loadI18n({ 'n_one': '{count} result', 'n_other': '{count} results' });
    expect(tn('n', 1)).toBe('1 result');
    expect(tn('n', 3)).toBe('3 results');
  });

  it('falls back to the key when the embedded dictionary is missing or broken', async () => {
    vi.resetModules();
    document.body.innerHTML = '<script type="application/json" id="i18n-data">{not json</script>';
    const { t } = await import('../../src/client/lib/i18n');
    expect(t('some.key')).toBe('some.key');
  });

  it('follows the page language for number formatting', async () => {
    const { formatNumber, currentLang } = await loadI18n({}, 'de');
    expect(currentLang).toBe('de');
    expect(formatNumber(1234.5)).toBe('1.234,5');
  });
});

describe('escapeHtml (dom)', () => {
  it('neutralises markup', async () => {
    const { escapeHtml } = await import('../../src/client/lib/dom');
    expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe('&lt;img src=x onerror=alert(1)&gt;');
    expect(escapeHtml(null)).toBe('');
  });
});

describe('apiFetch', () => {
  const fetchMock = vi.fn();

  beforeEach(async () => {
    await loadI18n({ 'common.requestFailed': 'Request failed ({status})' });
    document.head.innerHTML = '<meta name="api-base" content="" />';
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('sends JSON by default and returns the parsed body', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: 1 }), { status: 200 }));
    const { apiFetch } = await import('../../src/client/lib/api');
    await expect(apiFetch('/api/x')).resolves.toEqual({ ok: 1 });
    expect(fetchMock.mock.calls[0][1].headers['Content-Type']).toBe('application/json');
  });

  it("surfaces the backend's `detail` message on error", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ detail: 'Not authenticated' }), { status: 401 }));
    const { apiFetch } = await import('../../src/client/lib/api');
    await expect(apiFetch('/api/x')).rejects.toThrow('Not authenticated');
  });

  it('falls back to a localized status message for an empty error body', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 502 }));
    const { apiFetch } = await import('../../src/client/lib/api');
    await expect(apiFetch('/api/x')).rejects.toThrow('Request failed (502)');
  });

  it('returns null for 204 No Content', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const { apiFetch } = await import('../../src/client/lib/api');
    await expect(apiFetch('/api/x', { method: 'DELETE' })).resolves.toBeNull();
  });
});
