#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { fileURLToPath } = require('node:url');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_DOCS_DIR = path.join(ROOT, 'wiki-app', 'docs');
const LINK_RE = /\[([^\]]+)\]\(((?:[^()]|\([^()]*\))+)\)/g;
const SKIP_PREFIXES = ['http://', 'https://', 'mailto:', 'tel:', 'data:'];

function stripFrontmatter(content) {
  if (!content.startsWith('---')) return content;
  const parts = content.split('---', 3);
  return parts.length >= 3 ? parts[2].replace(/^\n+/, '') : content;
}

function iterMarkdownFiles(docsDir) {
  const files = [];
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile() && entry.name.endsWith('.md')) files.push(full);
    }
  };
  visit(docsDir);
  return files.sort();
}

function withinDocsDir(resolved, docsDir) {
  const root = path.resolve(docsDir);
  const full = path.resolve(resolved);
  return full === root || full.startsWith(`${root}${path.sep}`) ? full : null;
}

function resolveHref(href, sourceFile, docsDir) {
  href = href.trim();
  if (!href || href === '#' || href.startsWith('#') || SKIP_PREFIXES.some((prefix) => href.startsWith(prefix))) return null;
  if (href.startsWith('/docs/')) {
    const rel = decodeURIComponent(href.slice(6).replace(/^\/+/, ''));
    if (!rel) return null;
    return withinDocsDir(path.resolve(docsDir, rel.endsWith('.md') ? rel : `${rel}.md`), docsDir);
  }
  if (!href.endsWith('.md')) return null;
  const clean = href.startsWith('./') ? href.slice(2) : href;
  return withinDocsDir(path.resolve(path.dirname(sourceFile), clean), docsDir);
}

function findBrokenLinks(docsDir) {
  const broken = [];
  for (const sourceFile of iterMarkdownFiles(docsDir)) {
    const source = path.relative(docsDir, sourceFile).split(path.sep).join('/');
    const body = stripFrontmatter(fs.readFileSync(sourceFile, 'utf8'));
    body.split('\n').forEach((line, index) => {
      LINK_RE.lastIndex = 0;
      let match;
      while ((match = LINK_RE.exec(line))) {
        const [, text, hrefRaw] = match;
        const href = hrefRaw.trim();
        const resolved = resolveHref(href, sourceFile, docsDir);
        if (resolved && !fs.existsSync(resolved)) broken.push({
          source, line: index + 1, text, href,
          missing: path.relative(docsDir, resolved).split(path.sep).join('/'),
        });
      }
    });
  }
  return broken;
}

function main(argv = process.argv.slice(2)) {
  let docsDir = DEFAULT_DOCS_DIR;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--docs-dir') {
      if (!argv[i + 1]) { process.stderr.write('--docs-dir requires a path\n'); return 2; }
      docsDir = path.resolve(argv[++i]);
    } else if (argv[i] === '--help' || argv[i] === '-h') {
      process.stdout.write('Usage: node compiler/dead_link_checker.js [--docs-dir PATH]\n');
      return 0;
    } else { process.stderr.write(`Unknown option: ${argv[i]}\n`); return 2; }
  }
  if (!fs.existsSync(docsDir) || !fs.statSync(docsDir).isDirectory()) {
    process.stderr.write(`Docs directory not found: ${docsDir}\n`);
    return 2;
  }
  const broken = findBrokenLinks(docsDir);
  if (!broken.length) { process.stdout.write(`No broken markdown file links found in ${docsDir}\n`); return 0; }
  process.stdout.write(`Broken markdown file links in ${docsDir}: ${broken.length}\n\n`);
  for (const link of broken) process.stdout.write(`${link.source}:${link.line}\n  [${link.text}](${link.href})\n  -> missing: ${link.missing}\n\n`);
  return 1;
}

if (require.main === module) process.exitCode = main();
module.exports = { DEFAULT_DOCS_DIR, LINK_RE, stripFrontmatter, iterMarkdownFiles, resolveHref, findBrokenLinks, main };
