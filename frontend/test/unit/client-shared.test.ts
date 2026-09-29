import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dictionaries } from '../../src/i18n';

// Client modules read #i18n-data and <html lang> once at import: load them
// fresh against the real English (or German) dictionary.
function setPage(lang: 'en' | 'de' = 'en', html = '') {
  vi.resetModules();
  document.documentElement.lang = lang;
  document.body.innerHTML = `<script type="application/json" id="i18n-data">${JSON.stringify(dictionaries[lang])}</script>${html}`;
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('escapeHtml', () => {
  it('escapes quotes so values are safe inside attributes', async () => {
    setPage();
    const { escapeHtml } = await import('../../src/client/lib/dom');
    expect(escapeHtml(`a" onmouseover="x' & <b>`)).toBe('a&quot; onmouseover=&quot;x&#39; &amp; &lt;b&gt;');
    const div = document.createElement('div');
    div.innerHTML = `<span data-path="${escapeHtml('evil" data-pwned="1')}">${escapeHtml('<i>x</i>')}</span>`;
    const span = div.querySelector('span')!;
    expect(span.dataset.path).toBe('evil" data-pwned="1');
    expect(span.hasAttribute('data-pwned')).toBe(false);
    expect(span.textContent).toBe('<i>x</i>');
  });

  it('el() finds by id or throws a useful error', async () => {
    setPage('en', '<p id="here"></p>');
    const { el } = await import('../../src/client/lib/dom');
    expect(el('here').tagName).toBe('P');
    expect(() => el('gone')).toThrow('Missing #gone');
  });
});

describe('cache', () => {
  beforeEach(() => setPage('en', '<div id="offline-banner" class="hidden"></div>'));

  it('round-trips data with a timestamp', async () => {
    const { saveCache, loadCache } = await import('../../src/client/lib/cache');
    vi.spyOn(Date, 'now').mockReturnValue(1_000);
    saveCache('k', { n: 1 });
    expect(loadCache('k')).toEqual({ data: { n: 1 }, savedAt: 1_000 });
    expect(loadCache('missing')).toBeNull();
  });

  it('survives corrupt entries and unavailable storage', async () => {
    const { saveCache, loadCache } = await import('../../src/client/lib/cache');
    localStorage.setItem('wiki:cache:bad', '{not json');
    expect(loadCache('bad')).toBeNull();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });
    expect(() => saveCache('k', 1)).not.toThrow();
  });

  it('shows and hides the offline banner with the age of the data', async () => {
    const { showOfflineBanner, hideOfflineBanner } = await import('../../src/client/lib/cache');
    showOfflineBanner(Date.now() - 5 * 60_000);
    const banner = document.getElementById('offline-banner')!;
    expect(banner.classList.contains('hidden')).toBe(false);
    expect(banner.textContent).toContain('5 min');
    hideOfflineBanner();
    expect(banner.classList.contains('hidden')).toBe(true);
  });

  it('calls back when the browser comes back online', async () => {
    const { onReconnect } = await import('../../src/client/lib/cache');
    const cb = vi.fn();
    onReconnect(cb);
    window.dispatchEvent(new Event('online'));
    expect(cb).toHaveBeenCalledTimes(1);
  });
});

describe('serverText', () => {
  it('translates known machine strings and passes the rest through (en + de)', async () => {
    setPage('de');
    const s = await import('../../src/client/lib/serverText');
    expect(s.buildMessage('Build complete.')).toBe(dictionaries.de['common.build.complete']);
    expect(s.buildMessage('Build failed (exit 2).')).toContain('2');
    expect(s.buildMessage('Failed to start compiler: ENOENT')).toContain('ENOENT');
    expect(s.buildMessage('something custom')).toBe('something custom');
    expect(s.stepName('3. Synthesis')).toBe(dictionaries.de['common.step.3']);
    expect(s.stepName('custom step')).toBe('custom step');
    expect(s.statusLabel('nonsense')).toBe('nonsense');
    expect(s.runMessage('Stopped by user.')).toBe(dictionaries.de['common.run.stoppedByUser']);
    expect(s.runMessage('Interrupted: process exited with code 137.')).toContain('137');
    expect(s.runMessage(null)).toBe('');
    expect(s.attentionDetail('Broken link in api.md:25 -- target file does not exist.')).toContain('api.md:25');
    expect(s.attentionDetail('free text')).toBe('free text');
  });

  const STALE = 'Built from sources that changed since it was compiled: a.pdf, b.docx (and 2 more); and no longer in data/raw/: c.txt. Recompile to bring the page up to date.';

  it('translates the out-of-date and contradiction details, including the "and N more" tail (en + de)', async () => {
    setPage('en');
    let s = await import('../../src/client/lib/serverText');
    expect(s.attentionDetail(STALE)).toBe(STALE);
    expect(s.attentionDetail('Sources disagree: 150 kWh vs 100 kWh.')).toBe('Sources disagree: 150 kWh vs 100 kWh.');

    setPage('de');
    s = await import('../../src/client/lib/serverText');
    const de = s.attentionDetail(STALE);
    expect(de).toContain('a.pdf, b.docx (und 2 weitere)');
    expect(de).toContain('c.txt');
    expect(de).toContain('Neu kompilieren');
    expect(de).not.toMatch(/Recompile|changed since/);
    expect(s.attentionDetail('Built from sources that no longer in data/raw/: x.txt. Recompile to bring the page up to date.')).toContain('x.txt');
    expect(s.attentionDetail('Sources disagree: 150 kWh vs 100 kWh.')).toBe('Quellen widersprechen sich: 150 kWh vs 100 kWh.');
    // free text that merely resembles a prefix is left alone
    expect(s.attentionDetail('Sources disagree')).toBe('Sources disagree');
  });

  it('ageLabel covers minutes, hours and days', async () => {
    setPage('en');
    const { ageLabel } = await import('../../src/client/lib/serverText');
    const now = Date.now();
    expect(ageLabel(now)).toBe(dictionaries.en['common.age.justNow']);
    expect(ageLabel(now - 3 * 3600_000)).toContain('3');
    expect(ageLabel(now - 2 * 24 * 3600_000)).toContain('2');
  });
});

describe('modal a11y', () => {
  it('marks the dialog, focuses inside, closes on Escape and restores focus', async () => {
    setPage('en', '<button id="opener">open</button><div id="m"><button id="inside">ok</button></div>');
    const { wireModalA11y } = await import('../../src/client/lib/modal');
    const opener = document.getElementById('opener') as HTMLButtonElement;
    opener.focus();
    const hide = vi.fn();
    const modal = document.getElementById('m')!;
    wireModalA11y(modal, hide);
    expect(modal.getAttribute('role')).toBe('dialog');
    expect(modal.getAttribute('aria-modal')).toBe('true');
    expect(document.activeElement?.id).toBe('inside');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(hide).toHaveBeenCalledTimes(1);
    expect(document.activeElement?.id).toBe('opener');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(hide).toHaveBeenCalledTimes(1); // listener removed
  });
});

describe('copy buttons', () => {
  it('copies the sibling source text and flashes a check mark', async () => {
    setPage('en', '<div class="copy-wrap"><pre class="copy-source">Traceback line</pre><span id="slot"></span></div>');
    const { copyButtonHtml, initCopyButtons } = await import('../../src/client/lib/copy');
    document.getElementById('slot')!.outerHTML = copyButtonHtml('extra');
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    initCopyButtons();
    initCopyButtons(); // idempotent
    const btn = document.querySelector<HTMLButtonElement>('.copy-btn')!;
    expect(btn.className).toContain('extra');
    const before = btn.innerHTML;
    btn.click();
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith('Traceback line');
    await Promise.resolve();
    await Promise.resolve();
    expect(btn.innerHTML).not.toBe(before);
  });

  it('reports a clipboard failure as a toast', async () => {
    setPage('en', '<div class="copy-wrap"><pre class="copy-source">x</pre><span id="slot"></span></div>');
    const { copyButtonHtml, initCopyButtons } = await import('../../src/client/lib/copy');
    document.getElementById('slot')!.outerHTML = copyButtonHtml();
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
    const toast = vi.fn();
    (window as any).showToast = toast;
    initCopyButtons();
    document.querySelector<HTMLButtonElement>('.copy-btn')!.click();
    await new Promise((r) => setTimeout(r, 0));
    expect(toast).toHaveBeenCalledWith(dictionaries.en['common.copyFailed'], 'error');
  });
});

describe('search page script', () => {
  const PAGE = `
    <input id="search-input" />
    <button class="search-filter" data-filter="all"></button>
    <button class="search-filter" data-filter="wiki"></button>
    <button class="search-filter" data-filter="email"></button>
    <span id="search-count"></span>
    <div id="search-results"></div>`;

  async function openSearch(query: string, response: unknown, ok = true) {
    window.history.replaceState(null, '', query ? `/search?q=${encodeURIComponent(query)}` : '/search');
    document.head.innerHTML = '<meta name="api-base" content="" />';
    const fetchMock = vi.fn().mockResolvedValue({
      ok,
      status: ok ? 200 : 500,
      json: async () => response,
      text: async () => JSON.stringify(response),
    });
    vi.stubGlobal('fetch', fetchMock);
    setPage('en', PAGE);
    await import('../../src/client/search');
    await new Promise((r) => setTimeout(r, 0));
    return fetchMock;
  }

  const hits = {
    total: 250,
    results: [
      { type: 'wiki', title: 'Nova <b>Widget</b>', path: 'nova-widget.md', snippet: 'uses a <script>x</script> cell', score: 3 },
      { type: 'resource', title: 'spec.pdf', path: 'docs/a "quoted" name.pdf', snippet: '', score: 2, meta: { sourceType: 'pdf', trust: 'High' } },
      { type: 'email', title: 'Relay', path: 'emails/relay.eml', snippet: 'sleep timer', score: 1, meta: { from: 'mia@x', date: '2026-01-01' } },
    ],
  };

  it('runs the ?q= query and renders escaped, linked hits with the true total', async () => {
    const fetchMock = await openSearch('nova', hits);
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/search?q=nova');
    const results = document.getElementById('search-results')!;
    const links = [...results.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(links).toEqual(['/wiki/nova-widget', `/resources?tab=files&open=${encodeURIComponent('docs/a "quoted" name.pdf')}`, '/resources?tab=emails&open=emails%2Frelay.eml']);
    expect(results.querySelector('b')).toBeNull();
    expect(results.querySelector('script')).toBeNull();
    expect(results.textContent).toContain('Nova <b>Widget</b>');
    expect(results.textContent).toContain('mia@x');
    expect(document.getElementById('search-count')!.textContent).toContain('250');
  });

  it('filters by type', async () => {
    await openSearch('nova', hits);
    document.querySelector<HTMLButtonElement>('[data-filter="email"]')!.click();
    const links = [...document.querySelectorAll('#search-results a')];
    expect(links).toHaveLength(1);
    expect(document.getElementById('search-count')!.textContent).toContain('1');
    document.querySelector<HTMLButtonElement>('[data-filter="wiki"]')!.click();
    expect(document.querySelector('#search-results a')!.getAttribute('href')).toBe('/wiki/nova-widget');
  });

  it('an empty page shows the prompt and makes no request', async () => {
    const fetchMock = await openSearch('', hits);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(document.getElementById('search-results')!.textContent).toContain(dictionaries.en['search.empty']);
  });

  it('no matches echoes the query safely', async () => {
    await openSearch('<img src=x>', { total: 0, results: [] });
    const results = document.getElementById('search-results')!;
    expect(results.querySelector('img')).toBeNull();
    expect(results.textContent).toContain('<img src=x>');
  });

  it('typing debounces into one request and updates the URL', async () => {
    const fetchMock = await openSearch('', hits);
    vi.useFakeTimers();
    const input = document.getElementById('search-input') as HTMLInputElement;
    for (const v of ['n', 'no', 'nov']) {
      input.value = v;
      input.dispatchEvent(new Event('input'));
    }
    await vi.advanceTimersByTimeAsync(250);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('q=nov');
    expect(window.location.search).toBe('?q=nov');
  });
});
