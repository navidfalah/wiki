/**
 * Port of compiler/moc_generator.py's categorization logic -- groups
 * compiled wiki pages into folder-like categories (by their most common
 * shared tags) for the /wiki listing's default "folders" view. The flat
 * "file mode" view bypasses this and lists every page in one layer.
 */

const META_TAGS = new Set(['wiki', 'auto-ingest', 'llm-ingest', 'index', 'moc', 'overview']);
const FALLBACK_CATEGORY = 'General Reference';
const MAX_CATEGORIES = 8;
const MIN_PAGES_PER_CATEGORY = 2;

export interface CategorizablePage {
  path: string;
  id?: string | string[] | null;
  tags: string[];
}

function docIdFor(page: CategorizablePage): string {
  const id = Array.isArray(page.id) ? page.id[0] : page.id;
  return id || page.path.replace(/\.md$/, '');
}

function meaningfulTags(tags: string[], docId: string): Set<string> {
  const result = new Set<string>();
  for (const tag of tags) {
    const t = tag.toLowerCase().trim();
    if (t && !META_TAGS.has(t) && t !== docId) result.add(t);
  }
  return result;
}

function titleCase(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

/** tag -> "Title Case" category name, ordered most-frequent tag first. */
function dynamicTagCategories(pages: CategorizablePage[]): Map<string, string> {
  const counts = new Map<string, number>();
  for (const page of pages) {
    const docId = docIdFor(page);
    for (const tag of meaningfulTags(page.tags, docId)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  const frequent = [...counts.entries()]
    .filter(([, count]) => count >= MIN_PAGES_PER_CATEGORY)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_CATEGORIES)
    .map(([tag]) => tag);

  return new Map(frequent.map((tag) => [tag, titleCase(tag)]));
}

function assignCategory(page: CategorizablePage, tagCategories: Map<string, string>): string {
  const docId = docIdFor(page);
  if (docId === 'overview' || page.path === 'overview.md') return 'Overview';

  const tagSet = meaningfulTags(page.tags, docId);
  for (const [tag, categoryName] of tagCategories) {
    if (tagSet.has(tag)) return categoryName;
  }

  return FALLBACK_CATEGORY;
}

/** path -> category name, for every page (excluding index.md, which the caller skips). */
export function categorizePages(pages: CategorizablePage[]): Map<string, string> {
  const tagCategories = dynamicTagCategories(pages);
  const result = new Map<string, string>();
  for (const page of pages) {
    if (page.path === 'index.md') continue;
    result.set(page.path, assignCategory(page, tagCategories));
  }
  return result;
}
