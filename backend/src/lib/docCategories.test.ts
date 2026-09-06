import { describe, expect, it } from 'vitest';
import { categorizePages, type CategorizablePage } from './docCategories';

function page(path: string, tags: string[], id?: string | string[]): CategorizablePage {
  return { path, tags, id };
}

describe('categorizePages', () => {
  it('excludes index.md from the result', () => {
    const result = categorizePages([page('index.md', ['wiki', 'index'])]);
    expect(result.has('index.md')).toBe(false);
  });

  it('assigns Overview to the page whose id is "overview"', () => {
    const result = categorizePages([page('start.md', ['random'], 'overview')]);
    expect(result.get('start.md')).toBe('Overview');
  });

  it('assigns Overview to overview.md even without a matching id', () => {
    const result = categorizePages([page('overview.md', ['random'], 'something-else')]);
    expect(result.get('overview.md')).toBe('Overview');
  });

  it('groups pages by their most common shared tag, in Title Case', () => {
    const pages = [
      page('a.md', ['firmware'], 'a'),
      page('b.md', ['firmware'], 'b'),
      page('c.md', ['firmware'], 'c'),
    ];
    const result = categorizePages(pages);
    expect(result.get('a.md')).toBe('Firmware');
    expect(result.get('b.md')).toBe('Firmware');
    expect(result.get('c.md')).toBe('Firmware');
  });

  it('title-cases multi-word hyphenated tags', () => {
    const pages = [
      page('a.md', ['battery-life'], 'a'),
      page('b.md', ['battery-life'], 'b'),
    ];
    const result = categorizePages(pages);
    expect(result.get('a.md')).toBe('Battery Life');
  });

  it('falls back to General Reference when a tag appears on only one page', () => {
    const pages = [page('a.md', ['unique-tag'], 'a')];
    const result = categorizePages(pages);
    expect(result.get('a.md')).toBe('General Reference');
  });

  it('falls back to General Reference when there are no meaningful tags', () => {
    const pages = [page('a.md', [], 'a'), page('b.md', [], 'b')];
    const result = categorizePages(pages);
    expect(result.get('a.md')).toBe('General Reference');
  });

  it('ignores meta tags like "wiki" and "auto-ingest" when building categories', () => {
    const pages = [
      page('a.md', ['wiki', 'auto-ingest', 'llm-ingest', 'moc'], 'a'),
      page('b.md', ['wiki', 'auto-ingest', 'llm-ingest', 'moc'], 'b'),
    ];
    const result = categorizePages(pages);
    expect(result.get('a.md')).toBe('General Reference');
    expect(result.get('b.md')).toBe('General Reference');
  });

  it('ignores a tag that is identical to a page\'s own doc id, on that page only', () => {
    const pages = [
      page('a.md', ['a', 'shared-topic'], 'a'),
      page('b.md', ['a', 'shared-topic'], 'b'),
    ];
    const result = categorizePages(pages);
    // Tag "a" is dropped for page "a" (self-referential) but kept for page
    // "b", so it only ever counts once and never clears MIN_PAGES_PER_CATEGORY;
    // "shared-topic" counts on both and wins the category for both pages.
    expect(result.get('a.md')).toBe('Shared Topic');
    expect(result.get('b.md')).toBe('Shared Topic');
  });

  it('prefers the more frequent tag, breaking ties alphabetically', () => {
    const pages = [
      page('a.md', ['rare-tag', 'common-tag'], 'a'),
      page('b.md', ['common-tag'], 'b'),
      page('c.md', ['common-tag'], 'c'),
      page('d.md', ['rare-tag'], 'd'),
    ];
    const result = categorizePages(pages);
    // "common-tag" appears on 3 pages, "rare-tag" on 2 -- more frequent wins.
    expect(result.get('a.md')).toBe('Common Tag');
  });

  it('treats tags case-insensitively when counting and matching', () => {
    const pages = [
      page('a.md', ['Firmware'], 'a'),
      page('b.md', ['firmware'], 'b'),
    ];
    const result = categorizePages(pages);
    expect(result.get('a.md')).toBe('Firmware');
    expect(result.get('b.md')).toBe('Firmware');
  });

  it('only considers the top 8 most frequent tags as categories', () => {
    // 9 distinct tags, each shared by exactly 2 pages -- tag9 is the least
    // frequent alphabetically-tiebroken tag and should be dropped, leaving
    // its page with no matching category.
    const pages: CategorizablePage[] = [];
    for (let i = 1; i <= 9; i++) {
      pages.push(page(`p${i}a.md`, [`tag${i}`], `p${i}a`));
      pages.push(page(`p${i}b.md`, [`tag${i}`], `p${i}b`));
    }
    const result = categorizePages(pages);
    expect(result.get('p1a.md')).toBe('Tag1');
    expect(result.get('p9a.md')).toBe('General Reference');
    expect(result.get('p9b.md')).toBe('General Reference');
  });

  it('uses the first element of an array id', () => {
    const pages = [page('a.md', ['topic'], ['overview', 'alt-id']), page('b.md', ['topic'], 'b')];
    const result = categorizePages(pages);
    expect(result.get('a.md')).toBe('Overview');
  });
});
