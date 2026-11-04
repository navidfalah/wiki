/** Typed route facade over the plain JavaScript analytics implementation. */
export interface AnalyticsResult {
  metrics: {
    raw_files_processed: number;
    raw_files_total: number;
    wiki_pages_created: number;
    cross_links_established: number;
    dead_links: number;
  };
  tags: { tag: string; label: string; count: number; raw_count: number; page_count: number }[];
  tag_details: Record<string, unknown>;
  dead_links: { source: string; line: number; text: string; href: string; missing: string }[];
}

interface AnalyticsImplementation {
  buildAnalytics(docsDir?: string): AnalyticsResult;
  getTagDetail(tag: string, docsDir?: string): unknown | null;
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const implementation = require('./analytics.js') as AnalyticsImplementation;

export const buildAnalytics = implementation.buildAnalytics;
export const getTagDetail = implementation.getTagDetail;
