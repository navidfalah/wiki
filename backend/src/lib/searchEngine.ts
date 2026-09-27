/**
 * Cross-corpus search: one query across compiled wiki pages, cited
 * resources and ingested emails (documentation/42-cross-corpus-search.md).
 *
 * Ranking is BM25 over one shared index, with field weights (title 3x,
 * metadata 2x, body 1x), light plural stemming and English/German
 * stopwords, so typed questions work as well as keywords. A document must
 * match at least one query term. A coordination factor (matched terms /
 * query terms, squared) keeps documents matching every term above ones
 * that match a single common term. The wiki/resource part of the index is
 * cached and rebuilt only when wiki-app/docs/ changes.
 *
 * Deliberately data-only: no English strings baked into snippets or labels.
 * The frontend owns all user-visible text via t()/th().
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

/** The subset of email_engine.py's list_emails() fields search needs. */
export interface EmailSummary {
  path: string;
  subject?: string;
  from?: string;
  date?: string | null;
  body_preview?: string;
  body?: string;
}

// --- Text processing ---------------------------------------------------------

const STOPWORDS = new Set(
  (
    'a an and are as at be been but by can could did do does for from had has have how i if in into is it its ' +
    'me my no not of on or our so than that the their them then there these they this those to was we were ' +
    'what when where which who whom why will with would you your about after all also any before both each ' +
    'more most other over same some such only own very just should now does did doing during until while ' +
    'der die das den dem des ein eine einer eines einem und oder aber ist sind war wie was wer wo warum ' +
    'mit von zu zum zur im in am auf fur für bei aus nach nicht auch es sie er ich wir ihr hat haben'
  ).split(' '),
);

const TOKEN_RE = /[\p{L}\p{N}]+(?:[.\-_/][\p{L}\p{N}]+)*/gu;

/** Light English plural stemming -- enough that "batteries" finds "battery". */
export function stem(token: string): string {
  if (token.length <= 3 || /\d/.test(token)) return token;
  if (token.endsWith('ies') && token.length > 4) return `${token.slice(0, -3)}y`;
  if (/(s|x|z|ch|sh)es$/.test(token)) return token.slice(0, -2);
  if (token.endsWith('s') && !token.endsWith('ss') && !token.endsWith('us') && !token.endsWith('is')) return token.slice(0, -1);
  return token;
}

/** Lowercased, stemmed terms. Compounds such as "mesh-118" or "0.3.9" are
 * kept whole and also split, so either form matches. */
export function tokenize(text: string, { dropStopwords = false } = {}): string[] {
  const out: string[] = [];
  for (const match of text.toLowerCase().matchAll(TOKEN_RE)) {
    const whole = match[0];
    const parts = whole.split(/[.\-_/]/);
    for (const term of parts.length > 1 ? [whole, ...parts] : [whole]) {
      if (!term || (dropStopwords && STOPWORDS.has(term))) continue;
      out.push(stem(term));
    }
  }
  return out;
}

export function queryTerms(query: string): string[] {
  const terms = [...new Set(tokenize(query, { dropStopwords: true }))];
  // A query made only of stopwords ("what is it") still searches for them.
  return terms.length ? terms : [...new Set(tokenize(query))];
}

// --- Index -------------------------------------------------------------------

const FIELD_WEIGHTS = { title: 3, meta: 2, body: 1 } as const;
const K1 = 1.2;
const B = 0.75;

interface IndexedDoc {
  type: SearchHitType;
  title: string;
  path: string;
  body: string;
  meta?: Record<string, string>;
  snippetFallback?: string;
  tf: Map<string, number>;
  length: number;
}

interface BuiltIndex {
  docs: IndexedDoc[];
  postings: Map<string, { doc: number; tf: number }[]>;
  avgLength: number;
}

function indexDoc(
  base: Omit<IndexedDoc, 'tf' | 'length'>,
  fields: { title: string; meta: string; body: string },
): IndexedDoc {
  const tf = new Map<string, number>();
  let length = 0;
  for (const [field, weight] of Object.entries(FIELD_WEIGHTS) as [keyof typeof FIELD_WEIGHTS, number][]) {
    for (const term of tokenize(fields[field])) {
      tf.set(term, (tf.get(term) ?? 0) + weight);
      length += weight;
    }
  }
  return { ...base, tf, length };
}

function buildIndex(docs: IndexedDoc[]): BuiltIndex {
  const postings = new Map<string, { doc: number; tf: number }[]>();
  docs.forEach((doc, i) => {
    for (const [term, tf] of doc.tf) {
      let list = postings.get(term);
      if (!list) postings.set(term, (list = []));
      list.push({ doc: i, tf });
    }
  });
  const avgLength = docs.length ? docs.reduce((sum, d) => sum + d.length, 0) / docs.length : 1;
  return { docs, postings, avgLength };
}

function titleFromStem(stemName: string): string {
  return stemName.replace(/-/g, ' ').replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1));
}

function wikiDocs(docsDir: string): IndexedDoc[] {
  if (!fs.existsSync(docsDir)) return [];
  return fs
    .readdirSync(docsDir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => {
      const raw = fs.readFileSync(path.join(docsDir, name), 'utf-8');
      const meta = parseFrontmatter(raw);
      const body = stripFrontmatter(raw);
      const title = (typeof meta.title === 'string' && meta.title) || titleFromStem(path.basename(name, '.md'));
      return indexDoc({ type: 'wiki', title, path: name, body }, { title, meta: (meta.tags_list ?? []).join(' '), body });
    });
}

function resourceDocs(docsDir: string): IndexedDoc[] {
  return listResources(docsDir).resources.map((item: any) => {
    const citing: string[] = item.citing_pages.map((p: { title: string }) => p.title);
    return indexDoc(
      {
        type: 'resource',
        title: item.source,
        path: item.source,
        body: '',
        snippetFallback: citing.slice(0, 3).join(', '),
        meta: { sourceType: item.source_type, trust: item.trust, citationCount: String(item.citation_count) },
      },
      { title: item.source.replace(/[/_.-]/g, ' '), meta: `${item.source_type} ${citing.join(' ')}`, body: '' },
    );
  });
}

function emailDocs(emails: EmailSummary[]): IndexedDoc[] {
  return emails.map((email) => {
    const title = email.subject || '(no subject)';
    const body = email.body ?? email.body_preview ?? '';
    const metaText = `${email.from ?? ''} ${email.date ?? ''}`;
    return indexDoc(
      { type: 'email', title, path: email.path, body, snippetFallback: metaText.trim(), meta: { from: email.from ?? '', date: email.date ?? '' } },
      { title, meta: metaText, body },
    );
  });
}

function docsFingerprint(docsDir: string): string {
  if (!fs.existsSync(docsDir)) return 'missing';
  const parts: string[] = [];
  for (const name of fs.readdirSync(docsDir).sort()) {
    if (!name.endsWith('.md')) continue;
    const stat = fs.statSync(path.join(docsDir, name));
    parts.push(`${name}:${stat.size}:${stat.mtimeMs}`);
  }
  return parts.join('|');
}

// Re-stat the docs directory at most this often. Pages are rewritten in
// place, so the directory's own mtime can't be used to spot changes.
const FINGERPRINT_TTL_MS = 2000;
const fingerprintCache = new Map<string, { at: number; value: string }>();

function cachedFingerprint(docsDir: string): string {
  const cached = fingerprintCache.get(docsDir);
  const now = Date.now();
  if (cached && now - cached.at < FINGERPRINT_TTL_MS) return cached.value;
  const value = docsFingerprint(docsDir);
  fingerprintCache.set(docsDir, { at: now, value });
  return value;
}

const docsCache = new Map<string, { fingerprint: string; docs: IndexedDoc[] }>();
const indexCache = new Map<string, { key: string; index: BuiltIndex }>();

/** Wiki + resource documents, rebuilt only when the docs directory changes. */
function staticDocs(docsDir: string): { fingerprint: string; docs: IndexedDoc[] } {
  const fingerprint = cachedFingerprint(docsDir);
  const cached = docsCache.get(docsDir);
  if (cached && cached.fingerprint === fingerprint) return cached;
  const entry = { fingerprint, docs: [...wikiDocs(docsDir), ...resourceDocs(docsDir)] };
  docsCache.set(docsDir, entry);
  return entry;
}

function emailsKey(emails: EmailSummary[]): string {
  return emails.map((e) => `${e.path}:${e.date ?? ''}:${(e.body ?? e.body_preview ?? '').length}`).join('|');
}

function cachedIndex(slot: string, key: string, build: () => IndexedDoc[]): BuiltIndex {
  const cached = indexCache.get(slot);
  if (cached && cached.key === key) return cached.index;
  const index = buildIndex(build());
  indexCache.set(slot, { key, index });
  return index;
}

/** Test hook: forget cached fingerprints and indexes. */
export function clearSearchCache(): void {
  fingerprintCache.clear();
  docsCache.clear();
  indexCache.clear();
}

// --- Query ---------------------------------------------------------------------

/** A window of `body` around the first matched term, collapsed to one line. */
export function makeSnippet(body: string, terms: string[], maxLen = 180): string {
  const flat = body.replace(/\s+/g, ' ').trim();
  if (!flat) return '';
  const lower = flat.toLowerCase();
  let hitIndex = -1;
  for (const term of terms) {
    const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'u');
    const idx = lower.search(re);
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

export interface SearchPage {
  total: number;
  results: SearchHit[];
}

function rank(index: BuiltIndex, terms: string[], types?: Set<SearchHitType>, limit = Infinity): SearchPage {
  const n = index.docs.length;
  const scores = new Map<number, { score: number; matched: number }>();
  for (const term of terms) {
    const list = index.postings.get(term);
    if (!list) continue;
    const idf = Math.log(1 + (n - list.length + 0.5) / (list.length + 0.5));
    for (const { doc, tf } of list) {
      if (types && !types.has(index.docs[doc].type)) continue;
      const norm = K1 * (1 - B + (B * index.docs[doc].length) / index.avgLength);
      const entry = scores.get(doc) ?? { score: 0, matched: 0 };
      entry.score += idf * ((tf * (K1 + 1)) / (tf + norm));
      entry.matched += 1;
      scores.set(doc, entry);
    }
  }
  const ranked = [...scores.entries()]
    .map(([doc, { score, matched }]) => ({ doc: index.docs[doc], score: Math.round(score * (matched / terms.length) ** 2 * 1000) / 1000 }))
    .sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title));
  const results = ranked.slice(0, limit).map(({ doc, score }) => ({
    type: doc.type,
    title: doc.title,
    path: doc.path,
    snippet: doc.body ? makeSnippet(doc.body, terms) : doc.snippetFallback ?? '',
    score,
    ...(doc.meta ? { meta: doc.meta } : {}),
  }));
  return { total: ranked.length, results };
}

function search(query: string, index: BuiltIndex, types?: Set<SearchHitType>, limit = Infinity): SearchPage {
  const terms = queryTerms(query);
  if (!terms.length || !index.docs.length) return { total: 0, results: [] };
  return rank(index, terms, types, limit);
}

function staticIndex(docsDir: string): BuiltIndex {
  const { fingerprint, docs } = staticDocs(docsDir);
  return cachedIndex(`static:${docsDir}`, fingerprint, () => docs);
}

export function searchWikiPages(query: string, docsDir: string = OUTPUT_DIR): SearchHit[] {
  return search(query, staticIndex(docsDir), new Set(['wiki'])).results;
}

export function searchResourceItems(query: string, docsDir: string = OUTPUT_DIR): SearchHit[] {
  return search(query, staticIndex(docsDir), new Set(['resource'])).results;
}

export function searchEmails(query: string, emails: EmailSummary[]): SearchHit[] {
  return search(query, buildIndex(emailDocs(emails))).results;
}

/** All three corpora in one index, so term rarity (IDF) is shared. Returns
 * the top `limit` hits plus the total number of matches. */
export function searchCorpusPage(query: string, emails: EmailSummary[], docsDir: string = OUTPUT_DIR, limit = 100): SearchPage {
  const { fingerprint, docs } = staticDocs(docsDir);
  const index = cachedIndex(`corpus:${docsDir}`, `${fingerprint}#${emailsKey(emails)}`, () => [...docs, ...emailDocs(emails)]);
  return search(query, index, undefined, limit);
}

export function searchCorpus(query: string, emails: EmailSummary[], docsDir: string = OUTPUT_DIR): SearchHit[] {
  return searchCorpusPage(query, emails, docsDir, Infinity).results;
}
