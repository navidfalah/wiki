/**
 * Port of compiler/dead_link_checker.py -- find markdown links in compiled
 * docs whose target file doesn't exist. Includes the balanced-parens link
 * regex fix (see documentation/07-linking-moc-and-pages.md): a naive
 * "stop at the first )" regex truncates any URL containing its own
 * parentheses.
 */
import fs from 'node:fs';
import path from 'node:path';
import { stripFrontmatter } from './docUtils';
import { walkEntries } from './fsWalk';

const LINK_RE = /\[([^\]]+)\]\(((?:[^()]|\([^()]*\))+)\)/g;
const SKIP_PREFIXES = ['http://', 'https://', 'mailto:', 'tel:', 'data:'];

export function iterMarkdownFiles(docsDir: string): string[] {
  const files: string[] = [];
  const walk = (dir: string) => {
    walkEntries(dir, (full, name, stat) => {
      if (stat.isDirectory()) walk(full);
      else if (stat.isFile() && name.endsWith('.md')) files.push(full);
    });
  };
  walk(docsDir);
  return files.sort();
}

export function resolveHref(href: string, sourceFile: string, docsDir: string): string | null {
  href = href.trim();
  if (href === '' || href === '#' || href.startsWith('#')) return null;
  if (SKIP_PREFIXES.some((p) => href.startsWith(p))) return null;

  if (href.startsWith('/docs/')) {
    const rel = decodeURIComponent(href.slice('/docs/'.length).replace(/^\/+/, ''));
    if (!rel) return null;
    return path.join(docsDir, rel.endsWith('.md') ? rel : `${rel}.md`);
  }

  if (!href.endsWith('.md')) return null;
  const clean = href.startsWith('./') ? href.slice(2) : href;
  const sourceDir = path.dirname(sourceFile);
  const resolved = path.resolve(sourceDir, clean);
  const docsResolved = path.resolve(docsDir);
  if (resolved !== docsResolved && !resolved.startsWith(docsResolved + path.sep)) return null;
  return resolved;
}

export interface BrokenLink {
  source: string;
  line: number;
  text: string;
  href: string;
  missing: string;
}

export function findBrokenLinks(docsDir: string): BrokenLink[] {
  const broken: BrokenLink[] = [];
  for (const sourceFile of iterMarkdownFiles(docsDir)) {
    const relSource = path.relative(docsDir, sourceFile).split(path.sep).join('/');
    const body = stripFrontmatter(fs.readFileSync(sourceFile, 'utf-8'));
    const lines = body.split('\n');

    lines.forEach((line, index) => {
      LINK_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = LINK_RE.exec(line))) {
        const [, linkText, hrefRaw] = match;
        const href = hrefRaw.trim();
        const resolved = resolveHref(href, sourceFile, docsDir);
        if (resolved === null) continue;
        if (!fs.existsSync(resolved)) {
          broken.push({
            source: relSource,
            line: index + 1,
            text: linkText,
            href,
            missing: path.relative(docsDir, resolved).split(path.sep).join('/'),
          });
        }
      }
    });
  }
  return broken;
}
