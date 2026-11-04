import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
const moc = require('../../../compiler/moc_generator.js');

let root: string | undefined;
afterEach(() => {
  if (root) fs.rmSync(root, { recursive: true, force: true });
  root = undefined;
});

function page(title: string, rel_path: string, tags: string[], doc_id = rel_path.replace(/\.md$/, '')) {
  return { title, rel_path, doc_id, tags, summary: '', link_path: `./${rel_path}`, folder: rel_path.includes('/') ? rel_path.split('/')[0] : null };
}

describe('plain JavaScript MOC generator', () => {
  it('derives frequent categories from corpus tags and prefers common matches', () => {
    const pages = [page('A', 'a.md', ['mesh', 'rare']), page('B', 'b.md', ['mesh']), page('C', 'c.md', ['mesh']), page('D', 'd.md', ['rare'])];
    const categories = moc.dynamicTagCategories(pages, { minPages: 2 });
    expect([...categories.keys()]).toEqual(['mesh', 'rare']);
    expect(moc.assignCategory(page('Overview', 'overview.md', [], 'overview'), categories)).toBe('Overview');
    expect(moc.assignCategory(page('Entity', 'entities/person.md', []), categories)).toBe('Entities');
    expect(moc.assignCategory(page('A', 'a.md', ['mesh', 'rare']), categories)).toBe('Mesh');
    expect(moc.assignCategory(page('U', 'u.md', []), categories)).toBe(moc.FALLBACK_CATEGORY);
  });

  it('extracts a prose summary and parses page metadata with fallbacks', () => {
    expect(moc.extractSummary('# Heading\n\n- bullet\n\nThis has a [link](./x.md), **bold** and `code` in a useful sentence.'))
      .toBe('This has a link, bold and code in a useful sentence.');
    expect(moc.extractSummary('x'.repeat(90), 40)).toBe(`${'x'.repeat(40)}…`);
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-moc-'));
    const file = path.join(root, 'battery.md');
    fs.writeFileSync(file, '---\nid: battery\ntitle: "Battery"\ntags:\n  - power\n---\n\n# Battery\n\nBattery charge can be measured over time.\n');
    expect(moc.parsePage(file, root)).toMatchObject({ title: 'Battery', doc_id: 'battery', tags: ['power'], rel_path: 'battery.md' });
    fs.writeFileSync(path.join(root, 'index.md'), '# Index');
    expect(moc.parsePage(path.join(root, 'index.md'), root)).toBeNull();
  });

  it('groups and sorts pages, skips index, and keeps general references last', () => {
    const grouped = moc.categorizePages([
      page('Zebra', 'z.md', ['shared']), page('Alpha', 'a.md', ['shared']),
      page('Overview', 'overview.md', [], 'overview'), page('General', 'g.md', []), page('Index', 'index.md', []),
    ]);
    expect(grouped.get('Shared').map((entry: { title: string }) => entry.title)).toEqual(['Alpha', 'Zebra']);
    const body = moc.renderMocBody(grouped, { totalPages: 4, now: '2026-01-01T00:00:00.000Z' });
    expect(body.indexOf('## Overview')).toBeLessThan(body.indexOf('## Shared'));
    expect(body.indexOf('## Shared')).toBeLessThan(body.indexOf('## General Reference'));
    expect(body).not.toContain('./index.md');
  });

  it('writes a Docusaurus index and returns category counts', () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-moc-'));
    fs.writeFileSync(path.join(root, 'a.md'), '---\ntitle: A\ntags:\n  - topic\n---\n\nA useful long description is here.\n');
    fs.writeFileSync(path.join(root, 'b.md'), '---\ntitle: B\ntags:\n  - topic\n---\n\nAnother useful long description is here.\n');
    const output = path.join(root, 'generated.md');
    const result = moc.generateMoc(root, output, { now: '2026-01-01T00:00:00.000Z' });
    expect(result.page_count).toBe(2);
    expect(result.categories.Topic).toBe(2);
    expect(fs.readFileSync(output, 'utf8')).toContain('slug: /index');
    expect(fs.readFileSync(output, 'utf8')).toContain('[A](./a.md)');
  });
});
