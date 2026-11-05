import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { getResourceDetail, listResources, parseReferencesTable } from './resourcesEngine';

let root = '';
afterEach(() => {
  if (root) fs.rmSync(root, { recursive: true, force: true });
  root = '';
});

function fixture() {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'resources-engine-'));
  const docs = path.join(root, 'docs');
  fs.mkdirSync(docs);
  return { root, docs };
}

function writePage(docs: string, filename: string, title: string, rows: { source: string; source_type: string; trust: string }[]) {
  const table = rows.map((row, index) => `| ${index + 1} | \`${row.source}\` | ${row.source_type} | ${row.trust} |`).join('\n');
  fs.writeFileSync(path.join(docs, filename), `---\ntitle: ${title}\n---\n\nBody.\n\n## References & Trust\n\n| # | Source | Type | Trust |\n|---|--------|------|-------|\n${table}\n`);
}

describe('parseReferencesTable', () => {
  it('extracts reference rows and ignores headings or malformed rows', () => {
    expect(parseReferencesTable([
      '## References & Trust', '', '| # | Source | Type | Trust |', '|---|--------|------|-------|',
      '| 1 | `notes/meshsync-debug.md` | text | Medium |', '| 2 | `emails/thread.eml` | email | High |', '| a | b | c |',
    ].join('\n'))).toEqual([
      { source: 'notes/meshsync-debug.md', source_type: 'text', trust: 'Medium' },
      { source: 'emails/thread.eml', source_type: 'email', trust: 'High' },
    ]);
  });
});

describe('listResources', () => {
  it('deduplicates citations, counts pages, and filters by type and query', () => {
    const { docs } = fixture();
    writePage(docs, 'a.md', 'Page A', [{ source: 'emails/thread.eml', source_type: 'email', trust: 'Medium' }]);
    writePage(docs, 'b.md', 'Page B', [
      { source: 'emails/thread.eml', source_type: 'email', trust: 'Medium' },
      { source: 'notes/other.md', source_type: 'text', trust: 'High' },
    ]);

    const result = listResources(docs);
    const bySource = Object.fromEntries(result.resources.map((item: any) => [item.source, item]));
    expect(bySource['emails/thread.eml'].citation_count).toBe(2);
    expect(bySource['emails/thread.eml'].citing_pages.map((page: any) => page.title)).toEqual(['Page A', 'Page B']);
    expect(bySource['notes/other.md'].citation_count).toBe(1);
    expect(listResources(docs, undefined, 'text').resources.map((item: any) => item.source)).toEqual(['notes/other.md']);
    expect(listResources(docs, 'thread').resources.map((item: any) => item.source)).toEqual(['emails/thread.eml']);
  });
});

describe('getResourceDetail', () => {
  it('returns a raw-file preview for a known source', () => {
    const { root, docs } = fixture();
    const raw = path.join(root, 'raw');
    fs.mkdirSync(path.join(raw, 'notes'), { recursive: true });
    fs.writeFileSync(path.join(raw, 'notes', 'other.md'), 'Original raw content.');
    writePage(docs, 'a.md', 'Page A', [{ source: 'notes/other.md', source_type: 'text', trust: 'High' }]);

    expect(getResourceDetail('notes/other.md', docs, raw)?.preview).toBe('Original raw content.');
  });

  it('returns null for an unknown source', () => {
    const { docs } = fixture();
    expect(getResourceDetail('missing.md', docs)).toBeNull();
  });
});
