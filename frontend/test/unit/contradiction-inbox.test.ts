import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dictionaries } from '../../src/i18n';

async function load(lang: 'en' | 'de' = 'en') {
  vi.resetModules();
  document.documentElement.lang = lang;
  document.body.innerHTML = `<script type="application/json" id="i18n-data">${JSON.stringify(dictionaries[lang])}</script>`;
  return import('../../src/client/lib/contradictionInbox');
}

const open = { id: 'abc123', page: 'share-price.md', page_title: 'Share <price>', text: 'Flyer says "200"; correct is 250 & final.', status: 'open' as const, note: '', decided_by: null, decided_at: null };
const resolved = { ...open, id: 'def456', status: 'resolved' as const, note: 'Page states 250.', decided_by: 'ana', decided_at: '2026-09-29T12:00:00Z' };
const dismissed = { ...open, id: 'ghi789', status: 'dismissed' as const, note: '', decided_by: 'bo', decided_at: '2026-09-29T12:00:00Z' };

function dom(html: string): HTMLElement {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div;
}

let inbox: Awaited<ReturnType<typeof load>>;
beforeEach(async () => {
  inbox = await load();
});

describe('renderContradiction', () => {
  it('escapes page title and text, links to the page, and offers resolve/dismiss with a note field when open', () => {
    const row = dom(inbox.renderContradiction(open));
    expect(row.querySelector('a')!.getAttribute('href')).toBe('/wiki/share-price');
    expect(row.querySelector('a')!.textContent).toBe('Share <price>');
    expect(row.querySelector('p')!.textContent).toBe('Flyer says "200"; correct is 250 & final.');
    expect(row.querySelector('[data-contradiction-id]')!.getAttribute('data-contradiction-id')).toBe('abc123');
    expect([...row.querySelectorAll('[data-contra-action]')].map((b) => b.getAttribute('data-contra-action'))).toEqual(['resolved', 'dismissed']);
    expect(row.querySelector('[data-contra-note]')!.getAttribute('maxlength')).toBe('500');
    expect(row.querySelector('[data-decision]')).toBeNull();
  });

  it('shows who decided and the note, and only a reopen button, once settled', () => {
    const row = dom(inbox.renderContradiction(resolved));
    expect(row.querySelector('[data-decision]')!.textContent).toContain('ana');
    expect(row.querySelector('[data-decision]')!.textContent).toContain('Page states 250.');
    expect([...row.querySelectorAll('[data-contra-action]')].map((b) => b.getAttribute('data-contra-action'))).toEqual(['open']);
    expect(row.querySelector('[data-contra-note]')).toBeNull();
    expect(dom(inbox.renderContradiction(dismissed)).querySelector('[data-decision]')!.textContent).not.toContain('—');
  });

  it('escapes a hostile note', () => {
    const row = dom(inbox.renderContradiction({ ...resolved, note: '<img src=x onerror=alert(1)>' }));
    expect(row.querySelector('img')).toBeNull();
  });

  it('speaks German', async () => {
    const de = await load('de');
    expect(dom(de.renderContradiction(open)).textContent).toContain('Kein Widerspruch');
  });
});

describe('renderContradictionList / emptyMessage', () => {
  it('filters by status', () => {
    const items = [open, resolved, dismissed];
    expect(dom(inbox.renderContradictionList(items, 'open')).querySelectorAll('[data-contradiction-id]')).toHaveLength(1);
    expect(dom(inbox.renderContradictionList(items, 'resolved')).querySelector('[data-contradiction-id]')!.getAttribute('data-contradiction-id')).toBe('def456');
    expect(dom(inbox.renderContradictionList(items, 'all')).querySelectorAll('[data-contradiction-id]')).toHaveLength(3);
    expect(inbox.renderContradictionList([], 'open')).toBe('');
  });

  it('says why the list is empty', () => {
    expect(inbox.emptyMessage(0, 'open')).toMatch(/No contradiction callouts/);
    expect(inbox.emptyMessage(2, 'open')).toMatch(/settled/);
    expect(inbox.emptyMessage(2, 'resolved')).not.toMatch(/settled/);
  });
});
