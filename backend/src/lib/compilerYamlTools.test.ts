import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
const yamlTools = require('../../../compiler/yaml_frontmatter.js');
const fixer = require('../../../compiler/fix_frontmatter.js');

let root: string | undefined;
afterEach(() => {
  if (root) fs.rmSync(root, { recursive: true, force: true });
  root = undefined;
});

describe('plain JavaScript YAML/frontmatter utilities', () => {
  it('quotes unsafe YAML values and preserves safe values', () => {
    expect(yamlTools.yamlQuote('MeshSync')).toBe('MeshSync');
    for (const value of ['Battery: Life', '- leading dash', 'true', '42', ' padded ', '[array]']) {
      expect(yamlTools.yamlQuote(value).startsWith('"')).toBe(true);
    }
    expect(yamlTools.yamlQuote('')).toBe('""');
  });

  it('inserts and strips generated banners without disturbing unrelated comments', () => {
    const content = '---\nid: foo\n---\n\n# Foo\n';
    const inserted = yamlTools.insertGeneratedBanner(content, '<!-- AUTO-GENERATED DRAFT — note -->');
    expect(inserted).toContain('---\nid: foo\n---\n\n<!-- AUTO-GENERATED DRAFT');
    expect(yamlTools.stripGeneratedBanner(inserted.slice(inserted.indexOf('---\n\n') + 5))).toBe('# Foo\n');
    expect(yamlTools.stripGeneratedBanner('<!-- other -->\n\n# Foo\n')).toBe('<!-- other -->\n\n# Foo\n');
  });

  it('fixes unsafe scalar fields, leaves body and unrelated YAML fields intact, and supports dry-run', () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-yaml-'));
    const file = path.join(root, 'page.md');
    const original = '---\ntitle: Battery: Power\nid: battery\ntags:\n  - power: budget\n---\nBody text.\n';
    fs.writeFileSync(file, original);
    expect(fixer.fixDoc(file, { dryRun: true })).toBe(1);
    expect(fs.readFileSync(file, 'utf8')).toBe(original);
    expect(fixer.fixDoc(file)).toBe(1);
    expect(fs.readFileSync(file, 'utf8')).toBe('---\ntitle: "Battery: Power"\nid: battery\ntags:\n  - power: budget\n---\nBody text.\n');
    expect(fixer.fixDoc(file)).toBe(0);
  });
});
