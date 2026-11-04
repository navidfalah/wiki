#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { OUTPUT_DIR } = require('./doc_utils.js');
const { yamlQuote } = require('./yaml_frontmatter.js');

const SCALAR_FIELDS = ['title', 'sidebar_label', 'id', 'slug', 'last_updated', 'page_type'];

function splitFrontmatter(content) {
  if (!content.startsWith('---')) return { frontmatter: null, body: content };
  const first = content.indexOf('---'), second = content.indexOf('---', first + 3);
  if (second < 0) return { frontmatter: null, body: content };
  return { frontmatter: content.slice(first + 3, second).trim(), body: content.slice(second + 3) };
}

function parseScalar(raw) {
  const value = raw.trim();
  return value.length >= 2 && value[0] === value.at(-1) && ['"', "'"].includes(value[0]) ? value.slice(1, -1) : value;
}

function fixFrontmatterBlock(frontmatter) {
  let fixes = 0;
  const lines = frontmatter.split(/\r?\n/).map((line) => {
    const field = SCALAR_FIELDS.find((name) => line.startsWith(`${name}:`));
    if (!field) return line;
    const rawValue = line.slice(field.length + 1).trim();
    const quoted = yamlQuote(parseScalar(rawValue));
    if (quoted !== rawValue) fixes += 1;
    return `${field}: ${quoted}`;
  });
  return { frontmatter: lines.join('\n'), fixes };
}

function fixDoc(file, { dryRun = false } = {}) {
  const content = fs.readFileSync(file, 'utf8');
  const { frontmatter, body } = splitFrontmatter(content);
  if (frontmatter === null) return 0;
  const fixed = fixFrontmatterBlock(frontmatter);
  if (fixed.fixes && !dryRun) fs.writeFileSync(file, `---\n${fixed.frontmatter}\n---${body}`, 'utf8');
  return fixed.fixes;
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
      process.stdout.write('Usage: node compiler/fix_frontmatter.js [--dry-run] [--docs-dir PATH]\n');
      return 0;
    } else { process.stderr.write(`Unknown option: ${argv[i]}\n`); return 2; }
  }
  if (!fs.existsSync(docsDir) || !fs.statSync(docsDir).isDirectory()) {
    process.stderr.write(`Not a directory: ${docsDir}\n`);
    return 1;
  }
  let total = 0, filesTouched = 0;
  for (const file of markdownFiles(docsDir)) {
    const fixed = fixDoc(file, { dryRun });
    if (fixed) {
      filesTouched += 1; total += fixed;
      process.stdout.write(`${path.relative(docsDir, file)}: ${fixed} field(s)\n`);
    }
  }
  process.stdout.write(`\n${dryRun ? 'would fix' : 'fixed'} ${total} field(s) in ${filesTouched} file(s)\n`);
  return 0;
}

if (require.main === module) process.exitCode = main();
module.exports = { splitFrontmatter, parseScalar, fixFrontmatterBlock, fixDoc, markdownFiles, main };
