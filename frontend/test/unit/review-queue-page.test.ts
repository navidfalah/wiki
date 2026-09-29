/**
 * The Review page script (src/client/review-queue.ts) against the real view
 * (src/views/review-queue.ejs, minus the head/foot partials) and a stubbed
 * API. Covers the three tabs' loading, filtering and the contradiction
 * actions -- the parts e2e only reaches with the sample corpus.
 */
import fs from 'node:fs';
import path from 'node:path';
import ejs from 'ejs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { dictionaries } from '../../src/i18n';
import { translate } from '../../src/i18n/core';

const VIEW = fs.readFileSync(path.join(__dirname, '../../src/views/review-queue.ejs'), 'utf-8').replace(/<%- include\([^)]*\) %>/g, '');

function renderView(lang: 'en' | 'de') {
  const dict = dictionaries[lang];
  const esc = (v: string) => v.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  return ejs.render(VIEW, { t: (k: string, v?: Record<string, unknown>) => translate(dict, k, v as never), th: (k: string, v?: Record<string, unknown>) => translate(dict, k, v as never, esc) });
}

const OPEN = { id: 'c1', page: 'battery.md', page_title: 'Battery', text: 'FAQ says 150 kWh; board said 100 kWh.', status: 'open', note: '', decided_by: null, decided_at: null };
const SETTLED = { id: 'c2', page: 'price.md', page_title: 'Price', text: 'Flyer said 200 euros.', status: 'resolved', note: 'Misprint.', decided_by: 'ana', decided_at: '2026-09-29T12:00:00Z' };

const ATTENTION = {
  counts: { total: 2, stale_pages: 1, open_contradictions: 1 },
  items: [
    { kind: 'stale_page', severity: 'medium', title: 'Battery', detail: 'Built from sources that changed since it was compiled: a.pdf. Recompile to bring the page up to date.', doc_path: 'battery.md' },
    { kind: 'open_contradiction', severity: 'medium', title: 'Battery', detail: 'Sources disagree: FAQ says 150 kWh.', doc_path: 'battery.md' },
  ],
  review_report: { exists: false },
};

interface Api {
  contradictions?: unknown;
  put?: (id: string, body: any) => { status: number; body: unknown };
  failAll?: boolean;
}

function stubApi(api: Api) {
  const calls: { method: string; url: string; body?: any }[] = [];
  const json = (body: unknown, status = 200) => Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body), text: () => Promise.resolve(JSON.stringify(body)) });
  const fetchMock = vi.fn((url: string, init: RequestInit = {}) => {
    const method = init.method ?? 'GET';
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method, url, body });
    if (api.failAll) return Promise.reject(new Error('offline'));
    if (url.endsWith('/api/review-queue')) return json({ candidates: [], corrections: [] });
    if (url.endsWith('/api/attention')) return json(ATTENTION);
    if (url.endsWith('/api/contradictions') && method === 'GET') return json(api.contradictions ?? { counts: { open: 1 }, items: [OPEN, SETTLED] });
    const put = /\/api\/contradictions\/([^/]+)$/.exec(url);
    if (put && method === 'PUT' && api.put) {
      const r = api.put(decodeURIComponent(put[1]), body);
      return json(r.body, r.status);
    }
    return json({ detail: 'not stubbed' }, 404);
  });
  vi.stubGlobal('fetch', fetchMock);
  return calls;
}

async function openPage(api: Api = {}, { lang = 'en' as 'en' | 'de', hash = '' } = {}) {
  vi.resetModules();
  document.documentElement.lang = lang;
  document.body.innerHTML = `<script type="application/json" id="i18n-data">${JSON.stringify(dictionaries[lang])}</script>${renderView(lang)}`;
  history.replaceState(null, '', `/review-queue${hash}`);
  const calls = stubApi(api);
  const toasts: string[] = [];
  window.showToast = (m: string) => void toasts.push(m);
  await import('../../src/client/review-queue');
  await settle();
  return { calls, toasts };
}

async function settle() {
  for (let i = 0; i < 10; i++) await new Promise((r) => setTimeout(r, 0));
}

const $ = (sel: string) => document.querySelector<HTMLElement>(sel)!;
const $$ = (sel: string) => [...document.querySelectorAll<HTMLElement>(sel)];
const click = async (sel: string) => {
  $(sel).click();
  await settle();
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Review page: contradictions tab', () => {
  it('loads the inbox, badges the tab with the open count, and shows only open ones first', async () => {
    await openPage();
    expect($('#tab-btn-contradictions .tab-badge').textContent).toBe('1');
    expect($$('#contra-list [data-contradiction-id]').map((r) => r.dataset.contradictionId)).toEqual(['c1']);
    await click('.contra-filter[data-filter="resolved"]');
    expect($$('#contra-list [data-contradiction-id]').map((r) => r.dataset.contradictionId)).toEqual(['c2']);
    expect($('.contra-filter[data-filter="resolved"]').classList.contains('bg-gray-900')).toBe(true);
    expect($('.contra-filter[data-filter="open"]').classList.contains('bg-gray-900')).toBe(false);
    await click('.contra-filter[data-filter="dismissed"]');
    expect($('#contra-empty').classList.contains('hidden')).toBe(false);
  });

  it('switches tabs, and opens the contradictions tab straight away for #contradictions', async () => {
    await openPage();
    expect($('#tab-panel-contradictions').classList.contains('hidden')).toBe(true);
    await click('#tab-btn-contradictions');
    expect($('#tab-panel-contradictions').classList.contains('hidden')).toBe(false);
    expect($('#tab-panel-review').classList.contains('hidden')).toBe(true);

    await openPage({}, { hash: '#contradictions' });
    expect($('#tab-panel-contradictions').classList.contains('hidden')).toBe(false);
  });

  it('resolving sends the status and note, moves the item out of Open, drops the badge and reloads attention', async () => {
    const { calls } = await openPage({ put: (id, body) => ({ status: 200, body: { ...OPEN, id, status: body.status, note: body.note, decided_by: 'me', decided_at: '2026-09-29T13:00:00Z' } }) });
    (document.querySelector('[data-contradiction-id="c1"] [data-contra-note]') as HTMLInputElement).value = 'Board minutes win.';
    const attentionLoadsBefore = calls.filter((c) => c.url.endsWith('/api/attention')).length;
    await click('[data-contradiction-id="c1"] [data-contra-action="resolved"]');

    expect(calls.find((c) => c.method === 'PUT')).toMatchObject({ url: expect.stringContaining('/api/contradictions/c1'), body: { status: 'resolved', note: 'Board minutes win.' } });
    expect($$('#contra-list [data-contradiction-id]')).toHaveLength(0);
    expect($('#contra-empty').textContent).toMatch(/settled/);
    expect($('#tab-btn-contradictions .tab-badge')).toBeNull();
    expect(calls.filter((c) => c.url.endsWith('/api/attention')).length).toBe(attentionLoadsBefore + 1);
  });

  it('a failed decision shows the server message and re-enables the button', async () => {
    const { toasts } = await openPage({ put: () => ({ status: 404, body: { detail: 'No contradiction with id c1' } }) });
    await click('[data-contradiction-id="c1"] [data-contra-action="dismissed"]');
    expect(toasts).toEqual(['No contradiction with id c1']);
    expect((document.querySelector('[data-contradiction-id="c1"] [data-contra-action="dismissed"]') as HTMLButtonElement).disabled).toBe(false);
  });

  it('says so when there are no callouts at all', async () => {
    await openPage({ contradictions: { counts: { open: 0 }, items: [] } });
    expect($('#contra-empty').textContent).toBe(dictionaries.en['review-queue.contra.none']);
    expect($('#tab-btn-contradictions .tab-badge')).toBeNull();
  });
});

describe('Review page: attention tab', () => {
  it('shows the stale and contradiction cards and rows, translated and filterable (de)', async () => {
    await openPage({}, { lang: 'de' });
    const cards = $('#attention-cards').textContent!;
    expect(cards).toContain(dictionaries.de['review-queue.card.stale']);
    expect(cards).toContain(dictionaries.de['review-queue.card.contradictions']);
    expect($$('.attention-row')).toHaveLength(2);
    expect($('#attention-list').textContent).toContain('Neu kompilieren');
    expect($('#attention-list').textContent).toContain('Quellen widersprechen sich');
    await click('.attention-filter[data-filter="open_contradiction"]');
    expect($$('.attention-row').map((r) => r.dataset.kind)).toEqual(['open_contradiction']);
    expect($('.attention-row a')!.getAttribute('href')).toBe('/wiki/battery');
  });
});

describe('Review page: offline', () => {
  it('shows the cannot-reach message on every tab instead of throwing', async () => {
    await openPage({ failAll: true });
    expect($('#attention-cards').textContent).toContain(dictionaries.en['common.cannotReachApi'].replace(/<[^>]+>/g, '').slice(0, 10));
    expect($('#contra-list').textContent!.length).toBeGreaterThan(0);
  });
});
