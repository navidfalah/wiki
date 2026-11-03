/**
 * Scores searchCorpus() against data/qa_benchmark.json: for each question,
 * is one of the gold sources in the top k results? A wiki-page hit counts
 * when the page's References table cites a gold source; a resource hit
 * counts when it *is* one. Byte-identical copies in data/raw/ count as the
 * same source. Email hits aren't scored (they need the Python bridge).
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { OUTPUT_DIR, PROJECT_ROOT, RAW_DIR } from '../paths';
import { walkEntries } from './fsWalk';
import { parseReferencesTable } from './resourcesEngine';
import { searchCorpus } from './searchEngine';

export interface BenchmarkQuestion {
  id: string;
  question: string;
  keywords: string;
  sources: string[];
}

export const BENCHMARK_PATH = path.join(PROJECT_ROOT, 'data', 'qa_benchmark.json');

export function loadBenchmark(file: string = BENCHMARK_PATH): BenchmarkQuestion[] {
  return JSON.parse(fs.readFileSync(file, 'utf-8')).questions;
}

function contentKeys(rawDir: string): Map<string, string> {
  const keys = new Map<string, string>();
  const walk = (dir: string) =>
    walkEntries(dir, (full, _name, stat) => {
      if (stat.isDirectory()) walk(full);
      else keys.set(path.relative(rawDir, full).split(path.sep).join('/'), crypto.createHash('md5').update(fs.readFileSync(full)).digest('hex'));
    });
  walk(rawDir);
  return keys;
}

export function searchHitRate(
  questions: BenchmarkQuestion[],
  queryOf: (q: BenchmarkQuestion) => string,
  k = 5,
  docsDir: string = OUTPUT_DIR,
  rawDir: string = RAW_DIR,
): number {
  const keys = contentKeys(rawDir);
  const canon = (p: string) => keys.get(p) ?? p;
  const pageSources = new Map<string, Set<string>>();
  for (const name of fs.readdirSync(docsDir)) {
    if (!name.endsWith('.md')) continue;
    const refs = parseReferencesTable(fs.readFileSync(path.join(docsDir, name), 'utf-8'));
    pageSources.set(name, new Set(refs.map((r) => canon(r.source))));
  }
  let hits = 0;
  for (const q of questions) {
    const gold = new Set(q.sources.map(canon));
    const top = searchCorpus(queryOf(q), [], docsDir).slice(0, k);
    const hit = top.some((h) =>
      h.type === 'wiki' ? [...(pageSources.get(h.path) ?? [])].some((s) => gold.has(s)) : gold.has(canon(h.path)),
    );
    if (hit) hits += 1;
  }
  return hits / questions.length;
}
