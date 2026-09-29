/**
 * Contradiction inbox: the "> **Contradiction:** ..." callouts the
 * synthesizer writes into pages when sources disagree, collected in one
 * list so someone can decide what to do about each.
 *
 * A callout is read straight from the page (consecutive "> " lines starting
 * with **Contradiction:**), so nothing is stored about the contradiction
 * itself. What a reviewer decides is stored in
 * data/contradiction_decisions.json, keyed by an id derived from the page
 * and the callout's text:
 *  - "resolved": a person checked the sources and the page now states the
 *    right value (or the note says which one is right);
 *  - "dismissed": not a real contradiction;
 *  - no entry: open.
 * Because the id includes the text, a recompile that rewrites a callout
 * gives it a new id and it comes back as open: an old decision never hides
 * a claim it was not made about.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { CONTRADICTION_DECISIONS_FILE, OUTPUT_DIR } from '../paths';
import { atomicWriteJson } from './atomicWrite';
import { parseFrontmatter } from './docUtils';

export type ContradictionStatus = 'open' | 'resolved' | 'dismissed';
export const MAX_NOTE_LENGTH = 500;
/** Decisions about callouts that no longer exist are dropped beyond this many. */
export const MAX_DECISIONS_KEPT = 2000;

export interface Decision {
  status: 'resolved' | 'dismissed';
  note: string;
  decided_by: string;
  decided_at: string;
}

export interface Contradiction {
  id: string;
  page: string;
  page_title: string;
  text: string;
  status: ContradictionStatus;
  note: string;
  decided_by: string | null;
  decided_at: string | null;
}

const CALLOUT_START_RE = /^>\s*\*\*Contradiction:\*\*\s*(.*)$/;

/** Text of every contradiction callout in a page, in order. */
export function extractCallouts(pageText: string): string[] {
  const found: string[] = [];
  let current: string[] | null = null;
  for (const line of pageText.split('\n')) {
    const start = CALLOUT_START_RE.exec(line);
    if (start) {
      if (current) found.push(current.join(' '));
      current = [start[1]];
    } else if (current && /^>\s?/.test(line) && line.replace(/^>\s?/, '').trim() !== '') {
      current.push(line.replace(/^>\s?/, '').trim());
    } else if (current) {
      found.push(current.join(' '));
      current = null;
    }
  }
  if (current) found.push(current.join(' '));
  return found.map((t) => t.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

export function contradictionId(page: string, text: string): string {
  return crypto.createHash('sha1').update(`${page}\n${text}`).digest('hex').slice(0, 12);
}

export function loadDecisions(file: string = CONTRADICTION_DECISIONS_FILE): Record<string, Decision> {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf-8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/** Every contradiction callout in the wiki with its current status. Identical callouts on one page count once. */
export function listContradictions(docsDir: string = OUTPUT_DIR, decisionsFile: string = CONTRADICTION_DECISIONS_FILE): Contradiction[] {
  const items: Contradiction[] = [];
  if (!fs.existsSync(docsDir)) return items;
  const decisions = loadDecisions(decisionsFile);
  for (const name of fs.readdirSync(docsDir).sort()) {
    if (!name.endsWith('.md') || name === 'index.md') continue;
    let text: string;
    try {
      text = fs.readFileSync(path.join(docsDir, name), 'utf-8');
    } catch {
      continue;
    }
    const callouts = [...new Set(extractCallouts(text))];
    if (!callouts.length) continue;
    const title = parseFrontmatter(text).title;
    const pageTitle = typeof title === 'string' && title ? title : name.replace(/\.md$/, '').replace(/-/g, ' ');
    for (const callout of callouts) {
      const id = contradictionId(name, callout);
      const d = decisions[id];
      items.push({
        id,
        page: name,
        page_title: pageTitle,
        text: callout,
        status: d?.status ?? 'open',
        note: d?.note ?? '',
        decided_by: d?.decided_by ?? null,
        decided_at: d?.decided_at ?? null,
      });
    }
  }
  return items;
}

export class UnknownContradictionError extends Error {}

/**
 * Record a decision, or reopen with status "open". The id must belong to a
 * callout that exists now: a decision can't be filed for something not shown.
 */
export function decide(
  id: string,
  status: ContradictionStatus,
  note: string,
  by: string,
  docsDir: string = OUTPUT_DIR,
  decisionsFile: string = CONTRADICTION_DECISIONS_FILE,
  now: Date = new Date(),
): Contradiction {
  const current = listContradictions(docsDir, decisionsFile).find((c) => c.id === id);
  if (!current) throw new UnknownContradictionError(`No contradiction with id ${id}`);
  const decisions = loadDecisions(decisionsFile);
  const cleanNote = note.trim().slice(0, MAX_NOTE_LENGTH);
  if (status === 'open') {
    delete decisions[id];
  } else {
    decisions[id] = { status, note: cleanNote, decided_by: by, decided_at: now.toISOString() };
  }
  // Keep the file bounded: drop the oldest decisions about callouts that are gone.
  const live = new Set(listContradictions(docsDir, decisionsFile).map((c) => c.id));
  const overflow = Object.keys(decisions).length - MAX_DECISIONS_KEPT;
  if (overflow > 0) {
    const gone = Object.keys(decisions)
      .filter((k) => !live.has(k))
      .sort((a, b) => decisions[a].decided_at.localeCompare(decisions[b].decided_at));
    for (const k of gone.slice(0, overflow)) delete decisions[k];
  }
  atomicWriteJson(decisionsFile, decisions);
  return { ...current, status, note: status === 'open' ? '' : cleanNote, decided_by: status === 'open' ? null : by, decided_at: status === 'open' ? null : now.toISOString() };
}
