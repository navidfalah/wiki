import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const { tmpRoot, docsDir, rawDir, indexJson, stateFile, linkOverridesFile, reviewReportPath } = vi.hoisted(() => {
  const fs: typeof import('node:fs') = require('node:fs');
  const os: typeof import('node:os') = require('node:os');
  const path: typeof import('node:path') = require('node:path');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'attention-engine-test-'));
  return {
    tmpRoot: root,
    docsDir: path.join(root, 'docs'),
    rawDir: path.join(root, 'raw'),
    indexJson: path.join(root, 'index.json'),
    stateFile: path.join(root, 'state.json'),
    linkOverridesFile: path.join(root, 'link_overrides.json'),
    reviewReportPath: path.join(root, 'review_report.txt'),
  };
});

vi.mock('../paths', () => ({
  OUTPUT_DIR: docsDir,
  RAW_DIR: rawDir,
  INDEX_JSON: indexJson,
  STATE_FILE: stateFile,
  LINK_OVERRIDES_FILE: linkOverridesFile,
  REVIEW_REPORT_PATH: reviewReportPath,
}));

import { buildAttentionReport } from './attentionEngine';

function md5(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex');
}

function writeDoc(filename: string, frontmatterTitle: string, body: string) {
  fs.writeFileSync(path.join(docsDir, filename), `---\ntitle: ${frontmatterTitle}\n---\n${body}\n`, 'utf-8');
}

describe('buildAttentionReport', () => {
  describe('on an empty project', () => {
    it('returns no items and a missing review report', () => {
      fs.rmSync(docsDir, { recursive: true, force: true });
      fs.rmSync(rawDir, { recursive: true, force: true });
      fs.rmSync(indexJson, { force: true });
      fs.rmSync(stateFile, { force: true });
      fs.rmSync(reviewReportPath, { force: true });

      const report = buildAttentionReport(docsDir);

      expect(report.items).toEqual([]);
      expect(report.counts.total).toBe(0);
      expect(report.review_report.exists).toBe(false);
      expect(report.review_report.generated_at).toBeNull();
    });
  });

  describe('with a populated wiki', () => {
    const batteryNotesRel = 'notes/battery-notes.txt';
    const batteryNotesContent = 'Battery chemistry notes.\n';
    const changedRel = 'notes/changed.txt';

    beforeAll(() => {
      fs.mkdirSync(docsDir, { recursive: true });
      fs.mkdirSync(path.join(rawDir, 'notes'), { recursive: true });

      // Battery links out to Power (real) and to a page that doesn't exist
      // (a dead link); nothing links back to Battery, so it's an orphan
      // with outgoing edges.
      writeDoc('battery.md', 'Battery', 'See [Power](./power.md) and [Ghost](./ghost.md).');
      // Power has one incoming link (from Battery) but links to nothing --
      // a dead end.
      writeDoc('power.md', 'Power', 'No outgoing links here.');
      // Orphan has no incoming and no outgoing links -- fully isolated.
      writeDoc('orphan.md', 'Orphan', 'Nothing links here and this links nowhere.');

      fs.writeFileSync(
        indexJson,
        JSON.stringify({ topics: { Battery: 'battery.md', Power: 'power.md', Orphan: 'orphan.md' } }),
        'utf-8',
      );

      // Raw source files: one processed (md5 matches state), one changed
      // since last processed (md5 differs), one never processed at all.
      fs.writeFileSync(path.join(rawDir, batteryNotesRel), batteryNotesContent, 'utf-8');
      fs.writeFileSync(path.join(rawDir, changedRel), 'Updated content.\n', 'utf-8');
      fs.writeFileSync(path.join(rawDir, 'notes/unprocessed.txt'), 'Never seen before.\n', 'utf-8');

      fs.writeFileSync(
        stateFile,
        JSON.stringify({
          files: {
            [batteryNotesRel]: { md5: md5(batteryNotesContent), chunks: [{ topics: ['Battery'] }] },
            [changedRel]: { md5: 'stale-hash-that-does-not-match', chunks: [{ topics: ['Unrelated Topic'] }] },
          },
        }),
        'utf-8',
      );

      fs.writeFileSync(
        reviewReportPath,
        [
          'PAGE: Battery',
          'FILE: /abs/path/to/battery.md',
          'SEVERITY: MAJOR',
          'SUMMARY: Missing citation for the capacity claim.',
          '----------',
          'PAGE: Orphan',
          'FILE: /abs/path/to/orphan.md',
          'SEVERITY: MINOR',
        ].join('\n'),
        'utf-8',
      );
    });

    afterAll(() => {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    });

    it('flags a topic with outgoing links but no incoming ones as a medium orphan', () => {
      const report = buildAttentionReport(docsDir);
      const item = report.items.find((i) => i.kind === 'orphan_topic' && i.title === 'Battery');
      expect(item).toBeDefined();
      expect(item?.severity).toBe('medium');
      expect(item?.doc_path).toBe('battery.md');
    });

    it('flags a fully isolated topic (no incoming, no outgoing) as a high-severity orphan', () => {
      const report = buildAttentionReport(docsDir);
      const item = report.items.find((i) => i.kind === 'orphan_topic' && i.title === 'Orphan');
      expect(item).toBeDefined();
      expect(item?.severity).toBe('high');
    });

    it('flags a topic with incoming links but no outgoing ones as a dead end', () => {
      const report = buildAttentionReport(docsDir);
      const item = report.items.find((i) => i.kind === 'dead_end_topic' && i.title === 'Power');
      expect(item).toBeDefined();
      expect(item?.severity).toBe('low');
    });

    it('reports a link to a nonexistent page as a dead link', () => {
      const report = buildAttentionReport(docsDir);
      const item = report.items.find((i) => i.kind === 'dead_link');
      expect(item).toBeDefined();
      expect(item?.severity).toBe('high');
      expect(item?.title).toContain('Ghost');
      expect(item?.doc_path).toBe('battery.md');
      expect(report.counts.dead_links).toBe(1);
    });

    it('flags topics with no grounding raw-source chunk as ungrounded', () => {
      const report = buildAttentionReport(docsDir);
      const ungrounded = report.items.filter((i) => i.kind === 'ungrounded_topic').map((i) => i.title);
      // Only "Battery" is grounded via state.json's chunk topics.
      expect(ungrounded.sort()).toEqual(['Orphan', 'Power']);
      expect(report.counts.ungrounded_topics).toBe(2);
    });

    it('flags a never-processed raw file and a changed one as needing attention', () => {
      const report = buildAttentionReport(docsDir);
      const unprocessed = report.items.filter((i) => i.kind === 'unprocessed_file');
      expect(unprocessed.map((i) => i.raw_path).sort()).toEqual(['notes/changed.txt', 'notes/unprocessed.txt']);

      const neverProcessed = unprocessed.find((i) => i.raw_path === 'notes/unprocessed.txt');
      expect(neverProcessed?.detail).toMatch(/never processed/i);

      const changed = unprocessed.find((i) => i.raw_path === 'notes/changed.txt');
      expect(changed?.detail).toMatch(/changed since/i);

      expect(report.counts.unprocessed_files).toBe(2);
    });

    it('does not flag a raw file whose md5 still matches its state entry', () => {
      const report = buildAttentionReport(docsDir);
      const flagged = report.items.some((i) => i.kind === 'unprocessed_file' && i.raw_path === batteryNotesRel);
      expect(flagged).toBe(false);
    });

    it('parses the review report into findings, mapping MAJOR/MINOR to high/medium', () => {
      const report = buildAttentionReport(docsDir);
      const findings = report.items.filter((i) => i.kind === 'review_finding');
      expect(findings).toHaveLength(2);

      const major = findings.find((i) => i.title === 'Battery');
      expect(major?.severity).toBe('high');
      expect(major?.detail).toBe('Missing citation for the capacity claim.');
      expect(major?.doc_path).toBe('battery.md');

      const minor = findings.find((i) => i.title === 'Orphan');
      expect(minor?.severity).toBe('medium');
      expect(minor?.detail).toMatch(/flagged by the llm reviewer/i);

      expect(report.counts.review_findings).toBe(2);
      expect(report.review_report.exists).toBe(true);
      expect(report.review_report.generated_at).not.toBeNull();
    });

    it('sorts items by severity (high, medium, low) then by kind', () => {
      const report = buildAttentionReport(docsDir);
      const severityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
      for (let i = 1; i < report.items.length; i++) {
        const prevRank = severityRank[report.items[i - 1].severity];
        const currRank = severityRank[report.items[i].severity];
        expect(prevRank).toBeLessThanOrEqual(currRank);
        if (prevRank === currRank) {
          expect(report.items[i - 1].kind.localeCompare(report.items[i].kind)).toBeLessThanOrEqual(0);
        }
      }
    });

    it('sets counts.total to the full item count across all categories', () => {
      const report = buildAttentionReport(docsDir);
      expect(report.counts.total).toBe(report.items.length);
      expect(report.items.length).toBeGreaterThan(0);
    });
  });
});
