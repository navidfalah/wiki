import { describe, expect, it, vi } from 'vitest';
import { dictionaries } from '../../src/i18n';

async function load(lang: 'en' | 'de' = 'en') {
  vi.resetModules();
  document.documentElement.lang = lang;
  document.body.innerHTML = `<script type="application/json" id="i18n-data">${JSON.stringify(dictionaries[lang])}</script>`;
  return import('../../src/client/lib/compileChanges');
}

function dom(html: string): HTMLElement {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div;
}

const REPORT = {
  run_id: '20260929-120000-abcdef',
  totals: { added: 1, changed: 1, removed: 1, unchanged: 12 },
  truncated: false,
  pages: [
    { path: 'fresh-page.md', title: 'Fresh page', status: 'added' as const, lines_added: 1234, lines_removed: null },
    { path: 'battery-storage.md', title: 'Battery storage', status: 'changed' as const, lines_added: 4, lines_removed: 2 },
    { path: 'old-page.md', title: 'Old page', status: 'removed' as const, lines_added: null, lines_removed: 30 },
  ],
};

describe('renderChangesBadge', () => {
  it('summarises a run in the list, and says when it touched nothing', async () => {
    const m = await load();
    expect(dom(m.renderChangesBadge({ added: 3, changed: 5, removed: 1, unchanged: 9 })).textContent).toBe('3 added · 5 changed · 1 removed');
    expect(dom(m.renderChangesBadge({ added: 0, changed: 0, removed: 0, unchanged: 9 })).textContent).toBe('no page changes');
  });

  it('renders nothing for a run without a report', async () => {
    const m = await load();
    expect(m.renderChangesBadge(null)).toBe('');
    expect(m.renderChangesBadge(undefined)).toBe('');
  });

  it('speaks German', async () => {
    const m = await load('de');
    expect(dom(m.renderChangesBadge({ added: 1, changed: 0, removed: 2, unchanged: 0 })).textContent).toBe('1 neu · 0 geändert · 2 entfernt');
  });
});

describe('renderChangesSection', () => {
  it('shows the totals and one row per page, with line counts and links', async () => {
    const m = await load();
    const html = dom(m.renderChangesSection(REPORT, 'success'));
    expect(html.querySelector('[data-changes-summary]')!.textContent).toBe('1 added, 1 changed, 1 removed, 12 unchanged');
    const rows = html.querySelectorAll<HTMLElement>('li');
    expect([...rows].map((r) => r.dataset.changeStatus)).toEqual(['added', 'changed', 'removed']);
    expect(rows[0].textContent).toContain('1,234 lines');
    expect(rows[0].querySelector('a')!.getAttribute('href')).toBe('/wiki/fresh-page');
    expect(rows[1].textContent).toContain('+4 −2 lines');
    expect(rows[2].textContent).toContain('30 lines');
  });

  it('links changed pages to their history (where the exact diff is), and never links a removed page', async () => {
    const m = await load();
    const rows = dom(m.renderChangesSection(REPORT, 'success')).querySelectorAll<HTMLElement>('li');
    expect([...rows[1].querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual(['/wiki/battery-storage', '/wiki/battery-storage/history']);
    expect(rows[0].querySelectorAll('a')).toHaveLength(1);
    expect(rows[2].querySelectorAll('a')).toHaveLength(0);
    expect(rows[2].innerHTML).toContain('line-through');
  });

  it('omits line counts it does not have', async () => {
    const m = await load();
    const html = dom(
      m.renderChangesSection({ ...REPORT, pages: [{ path: 'a.md', title: 'A', status: 'changed', lines_added: null, lines_removed: null }] }, 'success'),
    );
    expect(html.querySelector('li')!.textContent).not.toMatch(/lines/);
  });

  it('says when a run changed nothing', async () => {
    const m = await load();
    const html = dom(m.renderChangesSection({ ...REPORT, totals: { added: 0, changed: 0, removed: 0, unchanged: 5 }, pages: [] }, 'success'));
    expect(html.textContent).toContain('This run did not change any page.');
    expect(html.querySelectorAll('li')).toHaveLength(0);
  });

  it('notes a truncated list', async () => {
    const m = await load();
    expect(dom(m.renderChangesSection({ ...REPORT, truncated: true }, 'success')).textContent).toContain('Showing the first 3 pages; the totals above count all of them.');
  });

  it('tells "not yet" from "never" when there is no report', async () => {
    const m = await load();
    expect(dom(m.renderChangesSection(null, 'running')).textContent).toContain('The report appears when the run finishes.');
    expect(dom(m.renderChangesSection(null, 'success')).textContent).toContain('predates reports, or it was pruned');
  });

  it('escapes titles and paths in text and attributes', async () => {
    const m = await load();
    const evil = '"><img src=x onerror=alert(1)>';
    const html = m.renderChangesSection({ ...REPORT, pages: [{ path: `${evil}.md`, title: evil, status: 'changed', lines_added: 1, lines_removed: 1 }] }, 'success');
    expect(html).not.toContain('<img');
    expect(dom(html).querySelector('a')!.textContent).toBe(evil);
  });

  it('speaks German', async () => {
    const m = await load('de');
    const html = dom(m.renderChangesSection(REPORT, 'success'));
    expect(html.textContent).toContain('Von diesem Lauf geänderte Seiten');
    expect(html.querySelector('[data-changes-summary]')!.textContent).toBe('1 neu, 1 geändert, 1 entfernt, 12 unverändert');
    expect(html.textContent).toContain('Verlauf');
  });
});
