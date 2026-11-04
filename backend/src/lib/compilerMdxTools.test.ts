import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
const mdx = require('../../../compiler/mdx_sanitize.js');
const fixer = require('../../../compiler/fix_mdx_body.js');

let root: string | undefined;
afterEach(() => {
  if (root) fs.rmSync(root, { recursive: true, force: true });
  root = undefined;
});

describe('plain JavaScript MDX utilities', () => {
  it('escapes JSX/expression characters outside protected markdown segments', () => {
    expect(mdx.sanitizeForMdx('value < 5 and > 2; use {curly} braces'))
      .toBe('value &lt; 5 and &gt; 2; use &#123;curly&#125; braces');
    expect(mdx.sanitizeForMdx('contact <me@example.com> now')).toContain('&lt;me@example.com&gt;');
    const code = 'run `a < b` and ```\nif (a < b) { return; }\n```';
    expect(mdx.sanitizeForMdx(code)).toBe(code);
    expect(mdx.sanitizeForMdx('see [MeshSync](./mesh.md)')).toBe('see [MeshSync](./mesh.md)');
  });

  it('repairs a document body while retaining its frontmatter and supports dry run', () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-mdx-'));
    const file = path.join(root, 'page.md');
    const source = '---\nid: page\ntitle: "A {Title}"\n---\n\nThe value {x} is < 5.\n';
    fs.writeFileSync(file, source);
    expect(fixer.fixDoc(file, { dryRun: true })).toBe(true);
    expect(fs.readFileSync(file, 'utf8')).toBe(source);
    expect(fixer.fixDoc(file)).toBe(true);
    const fixed = fs.readFileSync(file, 'utf8');
    expect(fixed).toContain('title: "A {Title}"');
    expect(fixed).toContain('The value &#123;x&#125; is &lt; 5.');
    expect(fixer.fixDoc(file)).toBe(false);
  });
});
