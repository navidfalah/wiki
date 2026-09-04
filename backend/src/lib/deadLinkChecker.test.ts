import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { findBrokenLinks, iterMarkdownFiles, resolveHref } from './deadLinkChecker';

describe('resolveHref', () => {
  const docsDir = path.join('/docs');

  it('skips external and protocol URLs', () => {
    const source = path.join(docsDir, 'a.md');
    expect(resolveHref('https://example.com', source, docsDir)).toBeNull();
    expect(resolveHref('http://example.com', source, docsDir)).toBeNull();
    expect(resolveHref('mailto:x@example.com', source, docsDir)).toBeNull();
    expect(resolveHref('tel:+15551234567', source, docsDir)).toBeNull();
  });

  it('skips empty and anchor-only hrefs', () => {
    const source = path.join(docsDir, 'a.md');
    expect(resolveHref('', source, docsDir)).toBeNull();
    expect(resolveHref('#', source, docsDir)).toBeNull();
    expect(resolveHref('#section', source, docsDir)).toBeNull();
  });

  it('skips non-markdown relative targets', () => {
    const source = path.join(docsDir, 'a.md');
    expect(resolveHref('./image.png', source, docsDir)).toBeNull();
  });

  it('resolves a relative markdown link', () => {
    const source = path.join(docsDir, 'a.md');
    expect(resolveHref('./b.md', source, docsDir)).toBe(path.join(docsDir, 'b.md'));
  });

  it('resolves a /docs/-absolute link', () => {
    const source = path.join(docsDir, 'sub', 'a.md');
    expect(resolveHref('/docs/b.md', source, docsDir)).toBe(path.join(docsDir, 'b.md'));
  });

  it('appends .md to a /docs/-absolute link with no extension', () => {
    const source = path.join(docsDir, 'a.md');
    expect(resolveHref('/docs/battery-life', source, docsDir)).toBe(
      path.join(docsDir, 'battery-life.md'),
    );
  });

  it('rejects a relative link that escapes the docs dir', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dlc-'));
    const docs = path.join(tmpDir, 'docs');
    fs.mkdirSync(docs);
    const source = path.join(docs, 'a.md');
    try {
      expect(resolveHref('../../etc/passwd.md', source, docs)).toBeNull();
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

describe('iterMarkdownFiles and findBrokenLinks', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dlc-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function write(relPath: string, content: string) {
    const full = path.join(tmpDir, relPath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf-8');
  }

  it('finds nested markdown files and ignores non-markdown files', () => {
    write('a.md', '# A\n');
    write('entities/b.md', '# B\n');
    write('c.txt', 'not markdown\n');

    const names = iterMarkdownFiles(tmpDir)
      .map((f) => path.relative(tmpDir, f).split(path.sep).join('/'))
      .sort();
    expect(names).toEqual(['a.md', 'entities/b.md']);
  });

  it('detects a missing link target', () => {
    write('a.md', '# A\n\nSee [B](./b.md) for details.\n');
    const broken = findBrokenLinks(tmpDir);
    expect(broken).toHaveLength(1);
    expect(broken[0]).toMatchObject({ source: 'a.md', text: 'B', href: './b.md', missing: 'b.md' });
  });

  it('ignores links that resolve to an existing file', () => {
    write('b.md', '# B\n');
    write('a.md', '# A\n\nSee [B](./b.md).\n');
    expect(findBrokenLinks(tmpDir)).toEqual([]);
  });

  it('ignores external and anchor links', () => {
    write('a.md', '# A\n\n[External](https://example.com) and [Anchor](#section) here.\n');
    expect(findBrokenLinks(tmpDir)).toEqual([]);
  });

  it('reports the correct 1-indexed line number', () => {
    write('a.md', '# A\n\nLine two.\n\nSee [Missing](./missing.md) here on line four.\n');
    const broken = findBrokenLinks(tmpDir);
    expect(broken).toHaveLength(1);
    expect(broken[0].line).toBe(5);
  });

  it('skips link-shaped text inside frontmatter', () => {
    write('a.md', '---\nid: a\ntitle: "[Fake](./nonexistent.md)"\n---\n\nReal body.\n');
    expect(findBrokenLinks(tmpDir)).toEqual([]);
  });

  it('handles a URL that itself contains parentheses', () => {
    write(
      'a.md',
      '[MQTT (Message Queuing Telemetry Transport)]' +
        '(./MQTT%20(Message%20Queuing%20Telemetry%20Transport).md)\n',
    );
    const broken = findBrokenLinks(tmpDir);
    expect(broken).toHaveLength(1);
    expect(broken[0].href).toBe('./MQTT%20(Message%20Queuing%20Telemetry%20Transport).md');
    expect(broken[0].missing).toBe('MQTT%20(Message%20Queuing%20Telemetry%20Transport).md');
  });

  it('resolves a parenthesized target that actually exists', () => {
    write('IP Rating (Ingress Protection).md', '# IP\n');
    write(
      'a.md',
      '[IP Rating (Ingress Protection)](./IP Rating (Ingress Protection).md)\n',
    );
    expect(findBrokenLinks(tmpDir)).toEqual([]);
  });

  it('aggregates broken links across multiple files', () => {
    write('a.md', '[X](./missing1.md)\n');
    write('b.md', '[Y](./missing2.md)\n');
    expect(findBrokenLinks(tmpDir)).toHaveLength(2);
  });
});
