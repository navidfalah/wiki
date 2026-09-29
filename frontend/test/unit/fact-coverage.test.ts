import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dictionaries } from '../../src/i18n';

async function load(lang: 'en' | 'de' = 'en') {
  vi.resetModules();
  document.documentElement.lang = lang;
  document.body.innerHTML = `<script type="application/json" id="i18n-data">${JSON.stringify(dictionaries[lang])}</script>`;
  return import('../../src/client/lib/factCoverage');
}

const src = (source: string, missing: string[], cited_by = ['page.md'], facts = 10) => ({ source, facts, covered: facts - missing.length, elsewhere: 0, recall: 0.5, cited_by, missing });

const DATA = {
  report: {
    pages: 3,
    recall_cited: 0.7053,
    recall_any_page: 0.787,
    facts_in_cited_sources: 207,
    uncited_sources: [{ source: 'notes/orphan.txt', facts: 2 }],
    sources: [
      src('monitoring/daily.csv', ['2026-08-20', '2026-08-21', '2026-08-24', '2026-08-25', '2026-08-26', '2026-08-28', '2026-08-29', '2026-08-30']),
      src('project/<plan>.docx', ['31 March 2026'], ['financing-and-budget.md', 'plant-size.md']),
      src('notes/complete.txt', []),
      src('notes/orphan.txt', ['5000 EUR'], []),
    ],
  },
  computed_at: '2026-09-29T12:00:00Z',
};

function dom(html: string): HTMLElement {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div;
}

let fc: Awaited<ReturnType<typeof load>>;
beforeEach(async () => {
  fc = await load();
});

describe('renderFactCoverage', () => {
  it('shows the headline rates and the uncited sources', () => {
    const root = dom(fc.renderFactCoverage(DATA));
    expect(root.querySelector('[data-recall]')!.textContent).toBe('70.5 %');
    expect(root.textContent).toContain('207');
    expect(root.textContent).toContain('78.7 %');
    expect(root.querySelector('[data-uncited]')!.textContent).toContain('notes/orphan.txt');
  });

  it('lists only cited sources with gaps, most missing first, and does not list an uncited one as a gap', () => {
    const rows = [...dom(fc.renderFactCoverage(DATA)).querySelectorAll<HTMLElement>('[data-coverage-source]')].map((r) => r.dataset.coverageSource);
    expect(rows).toEqual(['monitoring/daily.csv', 'project/<plan>.docx']);
  });

  it('links each source to the resource viewer and each citing page to the wiki, escaping names', () => {
    const row = dom(fc.renderFactCoverage(DATA)).querySelector('[data-coverage-source="project/<plan>.docx"]')!;
    const links = [...row.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(links).toEqual(['/resources?tab=files&open=project%2F%3Cplan%3E.docx', '/wiki/financing-and-budget', '/wiki/plant-size']);
    expect(row.querySelector('a')!.textContent).toBe('project/<plan>.docx');
    expect(row.querySelector('plan')).toBeNull();
  });

  it('caps the missing figures shown per source and says how many more', () => {
    const row = dom(fc.renderFactCoverage(DATA)).querySelector('[data-coverage-source="monitoring/daily.csv"] [data-missing]')!;
    expect(row.querySelectorAll('code')).toHaveLength(fc.MAX_MISSING_SHOWN);
    expect(row.textContent).toContain('and 2 more');
  });

  it('caps the number of sources listed', () => {
    const many = { ...DATA, report: { ...DATA.report, sources: Array.from({ length: fc.MAX_SOURCES_SHOWN + 3 }, (_, i) => src(`s${i}.txt`, ['1 kg'])) } };
    const root = dom(fc.renderFactCoverage(many));
    expect(root.querySelectorAll('[data-coverage-source]')).toHaveLength(fc.MAX_SOURCES_SHOWN);
    expect(root.textContent).toContain('3 more sources');
  });

  it('says when everything is covered, when there is nothing to check, and when the request failed', () => {
    const covered = { ...DATA, report: { ...DATA.report, uncited_sources: [], sources: [src('a.txt', [])] } };
    expect(dom(fc.renderFactCoverage(covered)).textContent).toContain('Every figure and date');
    expect(dom(fc.renderFactCoverage({ ...DATA, report: { ...DATA.report, recall_cited: null } })).textContent).toBe(dictionaries.en['analytics.coverage.nothing']);
    expect(dom(fc.renderFactCoverage(null, '<b>boom</b>')).textContent).toBe('<b>boom</b>');
  });

  it('speaks German', async () => {
    const de = await load('de');
    const text = dom(de.renderFactCoverage(DATA)).textContent!;
    expect(text).toContain('Zitiert von');
    expect(text).toContain('und 2 weitere');
  });
});
