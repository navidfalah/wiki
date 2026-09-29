import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dictionaries } from '../../src/i18n';

// dashboardHome imports the client i18n module, which reads #i18n-data and
// <html lang> once at import -- load it fresh with the real dictionary.
async function load(lang: 'en' | 'de' = 'en') {
  vi.resetModules();
  document.documentElement.lang = lang;
  document.body.innerHTML = `<script type="application/json" id="i18n-data">${JSON.stringify(dictionaries[lang])}</script>`;
  return import('../../src/client/lib/dashboardHome');
}

const NOW = Date.parse('2026-09-27T12:00:00Z');
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const HOUR = 3600_000;

let home: Awaited<ReturnType<typeof load>>;
beforeEach(async () => {
  home = await load();
});

function dom(html: string): HTMLElement {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div;
}

describe('helpers', () => {
  it('esc() escapes text and attribute metacharacters', () => {
    expect(home.esc(`<a href="x" onclick='y'>&`)).toBe('&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;');
    expect(home.esc(null)).toBe('');
  });

  it('wikiHref() drops .md and URL-encodes the slug', () => {
    expect(home.wikiHref('aurora-labs.md')).toBe('/wiki/aurora-labs');
    expect(home.wikiHref('a"b.md')).toBe('/wiki/a%22b');
  });

  it('relativeTime() speaks the UI language and tolerates junk', async () => {
    expect(home.relativeTime(ago(3 * HOUR), NOW)).toBe('3 hours ago');
    expect(home.relativeTime(ago(10_000), NOW)).toBe('this minute');
    expect(home.relativeTime(ago(2 * 24 * HOUR), NOW)).toBe('2 days ago');
    expect(home.relativeTime('not a date', NOW)).toBe('');
    expect(home.relativeTime(undefined, NOW)).toBe('');
    const de = await load('de');
    expect(de.relativeTime(ago(3 * HOUR), NOW)).toBe('vor 3 Stunden');
  });

  it('latestRun() picks by start time, not list order', () => {
    const runs = [
      { id: 'b', started_at: '2026-09-20T10:00:00Z' },
      { id: 'c', started_at: '2026-09-26T10:00:00Z' },
      { id: 'a', started_at: '2026-09-01T10:00:00Z' },
    ];
    expect(home.latestRun(runs)?.id).toBe('c');
    expect(home.latestRun([])).toBeNull();
    expect(home.latestRun(null)).toBeNull();
  });
});

describe('status cards', () => {
  const base = {
    pages: 226,
    crossLinks: 1959,
    rawProcessed: 80,
    rawTotal: 83,
    attentionTotal: 5,
    deadLinks: 2,
    lastRun: { status: 'success', started_at: ago(2 * HOUR), finished_at: ago(HOUR) },
  };

  it('renders four linked cards with the numbers', () => {
    const root = dom(home.renderStatusCards(base, NOW));
    const cards = [...root.querySelectorAll<HTMLAnchorElement>('a[data-card]')];
    expect(cards.map((c) => [c.dataset.card, c.getAttribute('href')])).toEqual([
      ['pages', '/wiki'],
      ['sources', '/resources'],
      ['attention', '/review-queue'],
      ['compile', '/pipelines'],
    ]);
    expect(cards[0].textContent).toContain('226');
    expect(cards[0].textContent).toContain('1959 cross-links');
    expect(cards[1].textContent).toContain('80 / 83');
    expect(cards[1].textContent).toContain('3 waiting');
    expect(cards[2].textContent).toContain('2 broken links');
    expect(cards[3].textContent).toContain('Succeeded');
    expect(cards[3].textContent).toContain('1 hour ago');
  });

  it('a wiki that was never compiled points the last card at the compiler', () => {
    const root = dom(home.renderStatusCards({ ...base, lastRun: null }, NOW));
    const card = root.querySelector<HTMLAnchorElement>('[data-card="compile"]')!;
    expect(card.getAttribute('href')).toBe('#compile');
    expect(card.textContent).toContain('Never');
  });

  it('says so when there is nothing to do', () => {
    const root = dom(home.renderStatusCards({ ...base, rawProcessed: 83, attentionTotal: 0 }, NOW));
    expect(root.textContent).toContain('Everything is compiled');
    expect(root.textContent).toContain('Nothing to fix right now');
  });

  it('shows a dash, not 0, when a number is unknown', () => {
    const root = dom(
      home.renderStatusCards({ pages: null, crossLinks: null, rawProcessed: null, rawTotal: null, attentionTotal: null, deadLinks: null, lastRun: undefined }, NOW),
    );
    expect(root.querySelector('[data-card="pages"]')!.textContent).toContain('–');
    expect(root.querySelector('[data-card="pages"]')!.textContent).not.toMatch(/\b0\b/);
  });
});

describe('needs attention', () => {
  it('lists only the kinds that have problems, each with its fix', () => {
    const root = dom(home.renderAttentionSummary({ dead_links: 14, unprocessed_files: 83, review_findings: 0, total: 97 }, []));
    const rows = [...root.querySelectorAll('li > a')];
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('14');
    expect(rows[0].textContent).toContain('Broken links');
    expect(rows[0].getAttribute('href')).toBe('/review-queue');
    expect(rows[1].getAttribute('href')).toBe('#compile');
  });

  it('lists out-of-date pages with the compile action, between unprocessed files and unreachable pages', () => {
    const root = dom(home.renderAttentionSummary({ unprocessed_files: 2, stale_pages: 5, orphan_or_dead_end_topics: 1, total: 8 }, []));
    const rows = [...root.querySelectorAll('li > a')].map((a) => a.textContent ?? '');
    expect(rows).toHaveLength(3);
    expect(rows[1]).toContain('5');
    expect(rows[1]).toContain('Out-of-date pages');
    expect([...root.querySelectorAll('li > a')][1].getAttribute('href')).toBe('#compile');
    expect(rows[2]).toContain('1');
  });

  it('lists open contradictions with a link that opens the Contradictions tab', () => {
    const root = dom(home.renderAttentionSummary({ open_contradictions: 3, total: 3 }, []));
    const link = root.querySelector('li > a')!;
    expect(link.textContent).toContain('3');
    expect(link.textContent).toContain('Open contradictions');
    expect(link.getAttribute('href')).toBe('/review-queue#contradictions');
  });

  it('"Fix" on broken links jumps straight to the first affected page', () => {
    const items = [{ kind: 'dead_link', severity: 'high', title: '[X] → x.md', detail: '', doc_path: 'api.md' }];
    const root = dom(home.renderAttentionSummary({ dead_links: 1, total: 1 }, items));
    expect(root.querySelector('li > a')!.getAttribute('href')).toBe('/wiki/api');
    expect(root.textContent).toContain('Top issues');
    expect(root.textContent).toContain('api.md');
  });

  it('all clear when every count is zero', () => {
    expect(dom(home.renderAttentionSummary({ total: 0 })).textContent).toContain('All clear');
  });

  it('shows an error when the report could not be loaded', () => {
    expect(home.renderAttentionSummary(null)).toContain(dictionaries.en['common.cannotReachApi']);
  });

  it('escapes page titles coming from the corpus', () => {
    const items = [{ kind: 'dead_link', severity: 'high', title: '<img src=x onerror=alert(1)>', detail: '', doc_path: 'a.md' }];
    const root = dom(home.renderAttentionSummary({ dead_links: 1 }, items));
    expect(root.querySelector('img')).toBeNull();
  });
});

describe('recent pages', () => {
  const pages = [
    { path: 'old.md', title: 'Old', modified_at: ago(48 * HOUR) },
    { path: 'index.md', title: 'Index', modified_at: ago(0) },
    { path: 'new.md', title: 'New', modified_at: ago(HOUR), category: 'Products' },
    { path: 'untimed.md', title: 'Untimed' },
  ];

  it('newest first, skipping index and log, undated pages last', () => {
    expect(home.recentPages(pages).map((p) => p.path)).toEqual(['new.md', 'old.md', 'untimed.md']);
    expect(home.recentPages(pages, 1)).toHaveLength(1);
  });

  it('links each page to the wiki with its category and age', () => {
    const root = dom(home.renderRecentPages(pages, NOW));
    const first = root.querySelector('a')!;
    expect(first.getAttribute('href')).toBe('/wiki/new');
    expect(first.textContent).toContain('Products');
    expect(first.textContent).toContain('1 hour ago');
  });

  it('empty wiki offers to run the compiler', () => {
    const root = dom(home.renderRecentPages([], NOW));
    expect(root.querySelector('a')!.getAttribute('href')).toBe('#compile');
  });

  it('escapes titles', () => {
    const root = dom(home.renderRecentPages([{ path: 'x.md', title: '<script>bad()</script>' }], NOW));
    expect(root.querySelector('script')).toBeNull();
    expect(root.textContent).toContain('<script>bad()</script>');
  });
});

describe('team activity', () => {
  const events = [
    { at: ago(1000), username: 'admin', action: 'Logged in', category: 'auth' },
    { at: ago(2000), username: 'system', action: 'Backend started', category: 'system' },
    { at: ago(3000), username: 'mia', action: 'Edited wiki page', detail: 'aurora-labs.md', category: 'wiki' },
    { at: ago(4000), username: 'mia', action: 'Deleted wiki page', detail: 'gone.md', category: 'wiki' },
    { at: ago(5000), username: 'admin', action: 'Restored wiki page version', detail: 'nova.md @ 20260927-1', category: 'wiki' },
    { at: ago(6000), username: 'admin', action: 'Created backup', detail: 'b.tar.gz', category: 'general' },
  ];

  it('drops sign-ins and server housekeeping', () => {
    expect(home.meaningfulActivity(events).map((e) => e.action)).toEqual([
      'Edited wiki page',
      'Deleted wiki page',
      'Restored wiki page version',
      'Created backup',
    ]);
  });

  it('links edits to the page, but not deletions', () => {
    expect(home.activityPage(events[2])).toBe('aurora-labs.md');
    expect(home.activityPage(events[3])).toBeNull();
    expect(home.activityPage(events[4])).toBe('nova.md');
    expect(home.activityPage(events[5])).toBeNull();
    const root = dom(home.renderActivity(events, NOW));
    expect([...root.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual(['/wiki/aurora-labs', '/wiki/nova']);
  });

  it('empty and unavailable states', () => {
    expect(dom(home.renderActivity([events[0]], NOW)).textContent).toContain('No changes yet');
    expect(dom(home.renderActivity(null, NOW)).textContent).toContain('not available');
  });
});
