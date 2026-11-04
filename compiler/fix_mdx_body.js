#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { OUTPUT_DIR } = require('./doc_utils.js');
const { sanitizeForMdx } = require('./mdx_sanitize.js');

function splitFrontmatter(content) {
  if (!content.startsWith('---')) return { frontmatter: null, body: content };
  const first = content.indexOf('---'), second = content.indexOf('---', first + 3);
  if (second < 0) return { frontmatter: null, body: content };
  return { frontmatter: content.slice(first + 3, second).trim(), body: content.slice(second + 3) };
}

function fixDoc(file, { dryRun = false } = {}) {
  const content = fs.readFileSync(file, 'utf8');
  const { frontmatter, body } = splitFrontmatter(content);
  const sanitized = sanitizeForMdx(body);
  if (sanitized === body) return false;
  if (!dryRun) fs.writeFileSync(file, frontmatter === null ? sanitized : `---\n${frontmatter}\n---${sanitized}`, 'utf8');
  return true;
}

function markdownFiles(root) {
  const found = [];
  function walk(dir) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, item.name);
      if (item.isDirectory()) walk(file);
      else if (item.isFile() && item.name.endsWith('.md')) found.push(file);
    }
  }
  walk(root);
  return found.sort();
}

function main(argv = process.argv.slice(2)) {
  let docsDir = OUTPUT_DIR, dryRun = false;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--docs-dir') {
      if (!argv[i + 1]) { process.stderr.write('--docs-dir requires a path\n'); return 2; }
      docsDir = path.resolve(argv[++i]);
    } else if (argv[i] === '--dry-run') dryRun = true;
    else if (argv[i] === '--help' || argv[i] === '-h') {
      process.stdout.write('Usage: node compiler/fix_mdx_body.js [--dry-run] [--docs-dir PATH]\n');
      return 0;
    } else { process.stderr.write(`Unknown option: ${argv[i]}\n`); return 2; }
  }
  if (!fs.existsSync(docsDir) || !fs.statSync(docsDir).isDirectory()) {
    process.stderr.write(`Not a directory: ${docsDir}\n`);
    return 1;
  }
  let touched = 0;
  for (const file of markdownFiles(docsDir)) if (fixDoc(file, { dryRun })) {
    touched += 1;
    process.stdout.write(`${path.relative(docsDir, file)}\n`);
  }
  process.stdout.write(`\n${dryRun ? 'would update' : 'updated'} ${touched} file(s)\n`);
  return 0;
}

if (require.main === module) process.exitCode = main();
module.exports = { splitFrontmatter, fixDoc, markdownFiles, main };
