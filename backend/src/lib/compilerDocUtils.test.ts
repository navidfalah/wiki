import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
const docUtils = require('../../../compiler/doc_utils.js');

let root: string | undefined;
afterEach(() => {
  if (root) fs.rmSync(root, { recursive: true, force: true });
  root = undefined;
});

describe('plain JavaScript compiler document utilities', () => {
  it('parses scalar metadata and block or flow tag lists', () => {
    expect(docUtils.parseFrontmatter('---\nid: battery\ntitle: "Battery"\ntags:\n  - power\n  - \'hardware\'\n---\nBody'))
      .toEqual({ id: 'battery', title: 'Battery', tags_list: ['power', 'hardware'] });
    expect(docUtils.parseFrontmatter('---\ntags: [ "power" , \'hardware\' ]\n---\nBody').tags_list)
      .toEqual(['power', 'hardware']);
    expect(docUtils.parseFrontmatter('---\ntags: []\n---\nBody')).toEqual({});
    expect(docUtils.parseFrontmatter('---\nid: truncated')).toEqual({});
  });

  it('strips frontmatter, extracts links and normalizes escaped quotes', () => {
    expect(docUtils.stripFrontmatter('---\ntitle: A\n---\nBody\n')).toBe('Body\n');
    expect(docUtils.extractLinks('See [Battery](./battery.md) and [Power](./power.md).'))
      .toEqual([{ text: 'Battery', href: './battery.md' }, { text: 'Power', href: './power.md' }]);
    expect(docUtils.normalizeTopic('  \\"Aurora Labs\\"  ')).toBe('"Aurora Labs"');
  });

  it('loads a topic index, resolves normalized names, and falls back to a slug file', () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-doc-utils-'));
    const docs = path.join(root, 'docs'), indexFile = path.join(root, 'index.json');
    fs.mkdirSync(docs);
    fs.writeFileSync(indexFile, JSON.stringify({ topics: { 'Aurora Labs': 'aurora.md' } }));
    fs.writeFileSync(path.join(docs, 'new-topic.md'), '# New Topic\n');
    expect(docUtils.loadTopicIndex(indexFile)).toEqual({ 'Aurora Labs': 'aurora.md' });
    expect(docUtils.topicFilename({ '"Aurora Labs"': 'aurora.md' }, '\\"Aurora Labs\\"', docs)).toBe('aurora.md');
    expect(docUtils.topicFilename({}, 'New Topic', docs)).toBe('new-topic.md');
    expect(docUtils.topicFilename({}, 'Missing Topic', docs)).toBeNull();
  });

  it('deduplicates source metadata and returns document payloads', () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-doc-utils-'));
    const doc = path.join(root, 'power-budgeting.md');
    fs.writeFileSync(doc, '---\nid: power\nslug: /concepts/power\ntags:\n  - energy\n---\nSee [Battery](./battery.md).\n');
    const result = docUtils.collectSourceMetadata({ chunks: [
      { topics: ['Battery', 'Battery'], entities: [{ name: 'Aurora' }], concepts: [{ name: 'Energy' }] },
      { topics: ['Power'], entities: [{ name: 'Aurora' }, { name: 'Nova' }] },
    ] });
    expect(result.topics).toEqual(['Battery', 'Power']);
    expect(result.entities).toEqual([{ name: 'Aurora' }, { name: 'Nova' }]);
    expect(result.concepts).toEqual([{ name: 'Energy' }]);
    const payload = docUtils.readDocPayload(doc, root);
    expect(payload).toMatchObject({ path: 'power-budgeting.md', title: 'Power Budgeting', id: 'power', slug: '/concepts/power', tags: ['energy'] });
    expect(payload.links).toEqual([{ text: 'Battery', href: './battery.md' }]);
    expect(docUtils.rawFileStatus('source.txt', 'x', { files: { 'source.txt': { md5: 'x' } } })).toBe('Processed');
  });

  it('builds pages for topic references from an injected index file', () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-doc-utils-'));
    const docs = path.join(root, 'docs'), indexFile = path.join(root, 'index.json');
    fs.mkdirSync(docs);
    fs.writeFileSync(indexFile, JSON.stringify({ topics: { Battery: 'battery.md' } }));
    fs.writeFileSync(path.join(docs, 'battery.md'), '---\ntitle: Battery\n---\nSee [Power](./power.md).\n');
    const pages = docUtils.synthesizedPagesForTopics(['Battery', 'Unknown'], [{ name: 'Aurora' }], [], docs, indexFile);
    expect(pages).toHaveLength(1);
    expect(pages[0]).toMatchObject({ topic: 'Battery', doc_path: 'battery.md', title: 'Battery' });
    expect(pages[0].links).toEqual([{ text: 'Power', href: './power.md' }]);
  });
});
