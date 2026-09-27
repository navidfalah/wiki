/**
 * Cross-corpus search -- one query across compiled wiki pages, ingested
 * emails, and cited resources, which previously only had independent
 * per-page filters (see documentation/36-feature-roadmap.md, "Search
 * across the whole app, not per-page"). Matching is AND-of-lowercase-terms
 * over title/tags/body, the same substring approach listResources() and
 * the logs/resources client-side filters already use -- this is not a
 * ranked retrieval engine (that's compiler/hybrid_retrieval.py, used by
 * chat/RAG over the compiled corpus).
 *
 * Deliberately data-only: no English strings baked into snippets or
 * labels -- the frontend owns all user-visible text via t()/th().
 */
import fs from 'node:fs';
import path from 'node:path';
import { OUTPUT_DIR } from '../paths';
import { parseFrontmatter, stripFrontmatter } from './docUtils';
import { listResources } from './resourcesEngine';

export type SearchHitType = 'wiki' | 'email' | 'resource';

export interface SearchHit {
  type: SearchHitType;
  title: string;
  path: string;
  snippet: string;
  score: number;
  meta?: Record<string, string>;
}

/** The subset of email_engine.py's list_emails() summary fields search needs. */
export interface EmailSummary {
  path: string;
  subject?: string;
  from?: string;
  date?: string | null;
  body_preview?: string;
}

function queryTerms(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

function matchesAll(terms: string[], combined: string): boolean {
  return terms.length > 0 && terms.every((term) => combined.includes(term));
}

function scoreHaystacks(terms: string[], title: string, meta: string, body: string): number {
  const titleLower = title.toLowerCase();
  const metaLower = meta.toLowerCase();
  const bodyLower = body.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (titleLower.includes(term)) score += 8;
    if (metaLower.includes(term)) score += 4;
    if (bodyLower.includes(term)) score += 1;
  }
  return score;
}

/** A window of `body` around the first matched term, collapsed to one line. */
export function makeSnippet(body: string, terms: string[], maxLen = 180): string {
  const flat = body.replace(/\s+/g, ' ').trim();
  if (!flat) return '';
  const lower = flat.toLowerCase();
  let hitIndex = -1;
  for (const term of terms) {
    const idx = lower.indexOf(term);
    if (idx !== -1 && (hitIndex === -1 || idx < hitIndex)) hitIndex = idx;
  }
  if (hitIndex === -1) return flat.length > maxLen ? `${flat.slice(0, maxLen)}…` : flat;
  const lead = Math.min(60, Math.floor(maxLen / 2));
  const start = Math.max(0, hitIndex - lead);
  const end = Math.min(flat.length, start + maxLen);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < flat.length ? '…' : '';
  return `${prefix}${flat.slice(start, end).trim()}${suffix}`;
}

function titleFromStem(stem: string): string {
  return stem.replace(/-/g, ' ').replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1));
}

function byScoreThenTitle(a: SearchHit, b: SearchHit): number {
  return b.score - a.score || a.title.localeCompare(b.title);
}

export function searchWikiPages(query: string, docsDir: string = OUTPUT_DIR): SearchHit[] {
  const terms = queryTerms(query);
  if (!terms.length || !fs.existsSync(docsDir)) return [];

  const hits: SearchHit[] = [];
  for (const name of fs.readdirSync(docsDir)) {
    if (!name.endsWith('.md')) continue;
    const filePath = path.join(docsDir, name);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const meta = parseFrontmatter(raw);
    const body = stripFrontmatter(raw);
    const stem = path.basename(name, '.md');
    const title = (typeof meta.title === 'string' && meta.title) || titleFromStem(stem);
    const tags = (meta.tags_list ?? []).join(' ');
    const combined = `${title} ${tags} ${body}`.toLowerCase();
    if (!matchesAll(terms, combined)) continue;
    hits.push({
      type: 'wiki',
      title,
      path: name,
      snippet: makeSnippet(body, terms),
      score: scoreHaystacks(terms, title, tags, body),
    });
  }
  return hits.sort(byScoreThenTitle);
}

export function searchResourceItems(query: string, docsDir: string = OUTPUT_DIR): SearchHit[] {
  const terms = queryTerms(query);
  if (!terms.length) return [];

  const hits: SearchHit[] = [];
  for (const item of listResources(docsDir).resources) {
    const citingTitles = item.citing_pages.map((p: { title: string }) => p.title);
    const combined = `${item.source} ${item.source_type} ${citingTitles.join(' ')}`.toLowerCase();
    if (!matchesAll(terms, combined)) continue;
    hits.push({
      type: 'resource',
      title: item.source,
      path: item.source,
      snippet: citingTitles.slice(0, 3).join(', '),
      score: scoreHaystacks(terms, item.source, item.source_type, citingTitles.join(' ')),
      meta: { sourceType: item.source_type, trust: item.trust, citationCount: String(item.citation_count) },
    });
  }
  return hits.sort(byScoreThenTitle);
}

export function searchEmails(query: string, emails: EmailSummary[]): SearchHit[] {
  const terms = queryTerms(query);
  if (!terms.length) return [];

  const hits: SearchHit[] = [];
  for (const email of emails) {
    const title = email.subject || '(no subject)';
    const body = email.body_preview ?? '';
    const metaText = `${email.from ?? ''} ${email.date ?? ''}`;
    const combined = `${title} ${metaText} ${body}`.toLowerCase();
    if (!matchesAll(terms, combined)) continue;
    hits.push({
      type: 'email',
      title,
      path: email.path,
      snippet: makeSnippet(body || metaText, terms),
      score: scoreHaystacks(terms, title, metaText, body),
      meta: { from: email.from ?? '', date: email.date ?? '' },
    });
  }
  return hits.sort(byScoreThenTitle);
}

export function searchCorpus(query: string, emails: EmailSummary[], docsDir: string = OUTPUT_DIR): SearchHit[] {
  const hits = [...searchWikiPages(query, docsDir), ...searchResourceItems(query, docsDir), ...searchEmails(query, emails)];
  return hits.sort(byScoreThenTitle);
}
