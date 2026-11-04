#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DEFAULT_DOCS_DIR, LINK_RE, iterMarkdownFiles, resolveHref } = require('./dead_link_checker.js');

function splitFrontmatter(content) {
  if (!content.startsWith('---')) return { frontmatter: null, body: content };
  const parts = content.split('---', 3);
  return parts.length < 3 ? { frontmatter: null, body: content } : { frontmatter: parts[1], body: parts[2] };
}

function fixDoc(file, docsDir, { dryRun = false } = {}) {
  const content = fs.readFileSync(file, 'utf8');
  const { frontmatter, body } = splitFrontmatter(content);
  if (frontmatter === null) return 0;
  let fixed = 0;
  const newBody = body.replace(LINK_RE, (whole, text, rawHref) => {
    const resolved = resolveHref(rawHref.trim(), file, docsDir);
    if (!resolved || fs.existsSync(resolved)) return whole;
    fixed += 1;
    return text;
  });
  if (fixed && !dryRun) fs.writeFileSync(file, `---${frontmatter}---${newBody}`, 'utf8');
  return fixed;
}

function main(argv = process.argv.slice(2)) {
  let docsDir = DEFAULT_DOCS_DIR;
  let dryRun = false;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--docs-dir') {
      if (!argv[i + 1]) { process.stderr.write('--docs-dir requires a path\n'); return 2; }
      docsDir = path.resolve(argv[++i]);
    } else if (argv[i] === '--dry-run') dryRun = true;
    else if (argv[i] === '--help' || argv[i] === '-h') {
      process.stdout.write('Usage: node compiler/fix_dead_links.js [--dry-run] [--docs-dir PATH]\n');
      return 0;
    } else { process.stderr.write(`Unknown option: ${argv[i]}\n`); return 2; }
  }
  if (!fs.existsSync(docsDir) || !fs.statSync(docsDir).isDirectory()) {
    process.stderr.write(`Not a directory: ${docsDir}\n`);
    return 1;
  }
  let total = 0, filesTouched = 0;
  for (const file of iterMarkdownFiles(docsDir)) {
    const fixed = fixDoc(file, docsDir, { dryRun });
    if (fixed) {
      filesTouched += 1;
      total += fixed;
      process.stdout.write(`${path.relative(docsDir, file)}: ${dryRun ? 'would unlink' : 'unlinked'} ${fixed} broken link(s)\n`);
    }
  }
  process.stdout.write(`\n${dryRun ? 'would unlink' : 'unlinked'} ${total} broken link(s) in ${filesTouched} file(s)\n`);
  return 0;
}

if (require.main === module) process.exitCode = main();
module.exports = { splitFrontmatter, fixDoc, main };
