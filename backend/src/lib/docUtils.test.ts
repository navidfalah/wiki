import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  collectSourceMetadata,
  extractLinks,
  normalizeTopic,
  parseFrontmatter,
  rawFileStatus,
  slugify,
  stripFrontmatter,
  topicFilename,
} from './docUtils';

describe('slugify', () => {
  it('lowercases and hyphenates whitespace', () => {
    expect(slugify('Battery Life Improvements')).toBe('battery-life-improvements');
  });

  it('strips punctuation', () => {
    expect(slugify("Aurora Labs: Q3 Report!")).toBe('aurora-labs-q3-report');
  });

  it('collapses underscores and repeated whitespace into single hyphens', () => {
    expect(slugify('foo_bar   baz')).toBe('foo-bar-baz');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  -leading and trailing-  ')).toBe('leading-and-trailing');
  });

  it('truncates to 80 characters', () => {
    const long = 'word '.repeat(40);
    expect(slugify(long).length).toBeLessThanOrEqual(80);
  });
});

describe('parseFrontmatter', () => {
  it('returns an empty object when there is no frontmatter block', () => {
    expect(parseFrontmatter('# Just a heading\n\nbody text')).toEqual({});
  });

  it('parses scalar fields', () => {
    const content = '---\ntitle: Aurora Labs\nslug: /entities/aurora-labs\n---\nbody';
    const meta = parseFrontmatter(content);
    expect(meta.title).toBe('Aurora Labs');
    expect(meta.slug).toBe('/entities/aurora-labs');
  });

  it('strips matching surrounding quotes from scalar values', () => {
    const content = '---\ntitle: "Quoted Title"\n---\nbody';
    expect(parseFrontmatter(content).title).toBe('Quoted Title');
  });

  it('parses a YAML list under tags into tags_list', () => {
    const content = '---\ntags:\n  - firmware\n  - battery-life\n---\nbody';
    expect(parseFrontmatter(content).tags_list).toEqual(['firmware', 'battery-life']);
  });

  it('handles an empty tags list without setting tags_list', () => {
    const content = '---\ntitle: Foo\ntags: []\n---\nbody';
    expect(parseFrontmatter(content).tags_list).toBeUndefined();
  });

  it('unquotes individual list items', () => {
    const content = "---\ntags:\n  - 'firmware'\n  - \"battery\"\n---\nbody";
    expect(parseFrontmatter(content).tags_list).toEqual(['firmware', 'battery']);
  });
});

describe('stripFrontmatter', () => {
  it('removes the frontmatter block and leading blank lines', () => {
    const content = '---\ntitle: Foo\n---\n\n\nBody text here';
    expect(stripFrontmatter(content)).toBe('Body text here');
  });

  it('returns the content unchanged when there is no frontmatter', () => {
    expect(stripFrontmatter('Body text here')).toBe('Body text here');
  });

  it('returns the content unchanged when the closing delimiter is missing', () => {
    const content = '---\ntitle: Foo\nno closing delimiter';
    expect(stripFrontmatter(content)).toBe(content);
  });
});

describe('extractLinks', () => {
  it('extracts markdown link text and href pairs', () => {
    const body = 'See [Aurora Labs](/docs/entities/aurora-labs) and [docs](https://example.com).';
    expect(extractLinks(body)).toEqual([
      { text: 'Aurora Labs', href: '/docs/entities/aurora-labs' },
      { text: 'docs', href: 'https://example.com' },
    ]);
  });

  it('returns an empty array when there are no links', () => {
    expect(extractLinks('No links in this text.')).toEqual([]);
  });
});

describe('normalizeTopic', () => {
  it('unescapes backslash-escaped quotes', () => {
    expect(normalizeTopic('Aurora Labs\\\'s Q3 Report')).toBe("Aurora Labs's Q3 Report");
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeTopic('  Aurora Labs  ')).toBe('Aurora Labs');
  });
});

describe('topicFilename', () => {
  let docsDir: string;

  beforeEach(() => {
    docsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-utils-test-'));
  });

  afterEach(() => {
    fs.rmSync(docsDir, { recursive: true, force: true });
  });

  it('returns the direct index match', () => {
    const index = { 'Aurora Labs': 'aurora-labs.md' };
    expect(topicFilename(index, 'Aurora Labs', docsDir)).toBe('aurora-labs.md');
  });

  it('matches an index key after normalizing escaped quotes', () => {
    const index = { "Aurora Labs\\'s Team": 'aurora-labs-team.md' };
    expect(topicFilename(index, "Aurora Labs's Team", docsDir)).toBe('aurora-labs-team.md');
  });

  it('falls back to a slugified filename that exists on disk', () => {
    fs.writeFileSync(path.join(docsDir, 'wireless-mesh-networking.md'), '# stub');
    expect(topicFilename({}, 'Wireless Mesh Networking', docsDir)).toBe('wireless-mesh-networking.md');
  });

  it('returns null when nothing matches and no file exists on disk', () => {
    expect(topicFilename({}, 'Nonexistent Topic', docsDir)).toBeNull();
  });
});

describe('collectSourceMetadata', () => {
  it('deduplicates topics, entities, and concepts by name across chunks', () => {
    const stateEntry = {
      chunks: [
        { topics: ['Battery Life'], entities: [{ name: 'Aurora Labs' }], concepts: [{ name: 'IoT' }] },
        { topics: ['Battery Life', 'Firmware'], entities: [{ name: 'Aurora Labs' }], concepts: [{ name: 'IoT' }] },
      ],
    };
    const result = collectSourceMetadata(stateEntry);
    expect(result.topics).toEqual(['Battery Life', 'Firmware']);
    expect(result.entities).toEqual([{ name: 'Aurora Labs' }]);
    expect(result.concepts).toEqual([{ name: 'IoT' }]);
  });

  it('returns empty collections when there are no chunks', () => {
    const result = collectSourceMetadata({});
    expect(result).toEqual({ topics: [], entities: [], concepts: [], chunks: [] });
  });

  it('skips entities and concepts with an empty or missing name', () => {
    const stateEntry = { chunks: [{ entities: [{ name: '' }, {}], concepts: [{ name: '' }] }] };
    const result = collectSourceMetadata(stateEntry);
    expect(result.entities).toEqual([]);
    expect(result.concepts).toEqual([]);
  });
});

describe('rawFileStatus', () => {
  it('reports Processed when the stored md5 matches', () => {
    const state = { files: { 'notes.txt': { md5: 'abc123' } } };
    expect(rawFileStatus('notes.txt', 'abc123', state)).toBe('Processed');
  });

  it('reports Unprocessed when the md5 differs', () => {
    const state = { files: { 'notes.txt': { md5: 'abc123' } } };
    expect(rawFileStatus('notes.txt', 'def456', state)).toBe('Unprocessed');
  });

  it('reports Unprocessed when the file has no state entry', () => {
    expect(rawFileStatus('unknown.txt', 'abc123', { files: {} })).toBe('Unprocessed');
  });

  it('reports Unprocessed when state has no files map at all', () => {
    expect(rawFileStatus('notes.txt', 'abc123', {})).toBe('Unprocessed');
  });
});
