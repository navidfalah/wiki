import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
const analytics = require('./analytics.js');

let root: string | undefined;
afterEach(() => {
  if (root) fs.rmSync(root, { recursive: true, force: true });
  root = undefined;
});

describe('JavaScript analytics implementation', () => {
  it('aggregates processed sources, page tags, cross-links, broken links, and details', () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-analytics-'));
    const docs = path.join(root, 'docs'), raw = path.join(root, 'raw'), manifest = path.join(root, 'extensions.json');
    fs.mkdirSync(docs); fs.mkdirSync(raw);
    const sourceText = 'Battery calibration notes';
    fs.writeFileSync(path.join(raw, 'notes.txt'), sourceText);
    fs.writeFileSync(manifest, JSON.stringify(['.txt']));
    fs.writeFileSync(path.join(docs, 'aurora.md'), '---\nid: aurora\ntitle: Aurora Labs\ntags:\n  - power\n---\n\nSee [Battery](./battery.md) and [Missing](./missing.md).\n');
    fs.writeFileSync(path.join(docs, 'battery.md'), '---\nid: battery\ntitle: Battery\ntags: [power, energy]\n---\n\nBattery overview.\n');
    const digest = crypto.createHash('md5').update(sourceText).digest('hex');
    const state = { files: { 'notes.txt': { md5: digest, chunks: [{ chunk_index: 0, text: sourceText, topics: ['Battery', 'Power'], entities: [{ name: 'Aurora Labs' }], concepts: [] }] } } };
    const result = analytics.buildAnalytics(docs, {
      rawDir: raw, manifestFile: manifest, state, topicIndex: { 'Aurora Labs': 'aurora.md', Battery: 'battery.md' },
    });
    expect(result.metrics).toEqual({ raw_files_processed: 1, raw_files_total: 1, wiki_pages_created: 2, cross_links_established: 1, dead_links: 1 });
    expect(result.dead_links[0]).toMatchObject({ source: 'aurora.md', text: 'Missing', missing: 'missing.md' });
    expect(result.tags.find((tag: { tag: string }) => tag.tag === 'battery')).toMatchObject({ count: 2, raw_count: 1, page_count: 1 });
    expect(analytics.getTagDetail('Battery', docs, {
      rawDir: raw, manifestFile: manifest, state, topicIndex: { 'Aurora Labs': 'aurora.md', Battery: 'battery.md' },
    }).label).toBe('Battery');
  });

  it('uses safe empty defaults for missing state and source folders', () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-analytics-'));
    const docs = path.join(root, 'docs'), raw = path.join(root, 'no-raw'), manifest = path.join(root, 'extensions.json');
    fs.mkdirSync(docs);
    fs.writeFileSync(manifest, JSON.stringify(['.txt']));
    const result = analytics.buildAnalytics(docs, { rawDir: raw, manifestFile: manifest, state: { files: {} }, topicIndex: {} });
    expect(result.metrics).toEqual({ raw_files_processed: 0, raw_files_total: 0, wiki_pages_created: 0, cross_links_established: 0, dead_links: 0 });
  });
});
