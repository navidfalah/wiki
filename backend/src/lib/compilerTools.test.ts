import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
// The compiler is intentionally plain CommonJS JavaScript so its utilities
// also run without the backend's TypeScript loader.
const linkTools = require('../../../compiler/dead_link_checker.js');
const repairTools = require('../../../compiler/fix_dead_links.js');

let root: string | undefined;
afterEach(() => {
  if (root) fs.rmSync(root, { recursive: true, force: true });
  root = undefined;
});

describe('plain JavaScript compiler maintenance tools', () => {
  it('finds nested broken links and ignores frontmatter, anchors, and external URLs', () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-js-tools-'));
    fs.mkdirSync(path.join(root, 'nested'));
    fs.writeFileSync(path.join(root, 'nested', 'a.md'), '---\ntitle: "[fake](./fake.md)"\n---\n\n[Missing](./missing.md) [Web](https://example.org) [Anchor](#part)\n');
    const broken = linkTools.findBrokenLinks(root);
    expect(broken).toEqual([{ source: 'nested/a.md', line: 1, text: 'Missing', href: './missing.md', missing: 'nested/missing.md' }]);
  });

  it('removes only missing link wrappers and preserves frontmatter; dry run writes nothing', () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-js-tools-'));
    const file = path.join(root, 'page.md');
    const original = '---\nid: page\ntitle: Page\n---\n\nSee [Missing](./missing.md), [Local](./local.md), and [Web](https://example.org).\n';
    fs.writeFileSync(file, original);
    fs.writeFileSync(path.join(root, 'local.md'), '# Local\n');
    expect(repairTools.fixDoc(file, root, { dryRun: true })).toBe(1);
    expect(fs.readFileSync(file, 'utf8')).toBe(original);
    expect(repairTools.fixDoc(file, root)).toBe(1);
    const updated = fs.readFileSync(file, 'utf8');
    expect(updated.startsWith('---\nid: page\ntitle: Page\n---\n')).toBe(true);
    expect(updated).toContain('See Missing, [Local](./local.md), and [Web](https://example.org).');
    expect(repairTools.fixDoc(file, root)).toBe(0);
  });
});
