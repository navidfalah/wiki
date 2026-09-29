/**
 * Source-to-wiki fact coverage (compiler/fact_coverage.py, doc 49) for the
 * app. The Python check reads every raw source (PDF, DOCX, XLSX ... text
 * extraction), which takes seconds, so the result is cached until a wiki
 * page or a raw source changes: the cache key is a hash of every such
 * file's path, size and modification time, which costs only stat() calls.
 * Concurrent requests while a computation runs share it instead of each
 * starting Python.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { OUTPUT_DIR, RAW_DIR } from '../paths';
import { runCli } from './pythonBridge';
import { discoverRawSourceFiles } from './rawFiles';

export interface SourceCoverage {
  source: string;
  facts: number;
  covered: number;
  elsewhere: number;
  recall: number | null;
  cited_by: string[];
  missing: string[];
}

export interface FactCoverageReport {
  pages: number;
  sources_with_facts: number;
  recall_cited: number | null;
  recall_any_page: number | null;
  facts_in_cited_sources: number;
  uncited_sources: { source: string; facts: number }[];
  sources: SourceCoverage[];
}

export interface FactCoverageResult {
  report: FactCoverageReport;
  computed_at: string;
  cached: boolean;
}

type Runner = () => Promise<FactCoverageReport>;

/** Changes whenever a wiki page or raw source is added, removed, or rewritten. */
export function inputsSignature(docsDir: string = OUTPUT_DIR, rawDir: string = RAW_DIR): string {
  const hash = crypto.createHash('sha1');
  const add = (label: string, file: string) => {
    try {
      const st = fs.statSync(file);
      hash.update(`${label}\0${file}\0${st.size}\0${st.mtimeMs}\n`);
    } catch {
      /* vanished between listing and stat: it simply isn't part of the key */
    }
  };
  if (fs.existsSync(docsDir)) {
    for (const name of fs.readdirSync(docsDir).sort()) if (name.endsWith('.md')) add('doc', path.join(docsDir, name));
  }
  if (fs.existsSync(rawDir)) for (const file of discoverRawSourceFiles(rawDir).sort()) add('raw', file);
  return hash.digest('hex');
}

let cache: { signature: string; result: Omit<FactCoverageResult, 'cached'> } | null = null;
let inFlight: { signature: string; promise: Promise<Omit<FactCoverageResult, 'cached'>> } | null = null;

export function clearFactCoverageCache(): void {
  cache = null;
  inFlight = null;
}

export async function getFactCoverage(
  runner: Runner = () => runCli<FactCoverageReport>('fact-coverage'),
  signature: string = inputsSignature(),
  now: () => Date = () => new Date(),
): Promise<FactCoverageResult> {
  if (cache && cache.signature === signature) return { ...cache.result, cached: true };
  if (!inFlight || inFlight.signature !== signature) {
    const promise = runner().then((report) => ({ report, computed_at: now().toISOString() }));
    inFlight = { signature, promise };
    promise.then(
      (result) => {
        if (inFlight?.promise === promise) {
          cache = { signature, result };
          inFlight = null;
        }
      },
      () => {
        if (inFlight?.promise === promise) inFlight = null; // a failure is never cached
      },
    );
  }
  return { ...(await inFlight.promise), cached: false };
}
