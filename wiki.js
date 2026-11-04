#!/usr/bin/env node
'use strict';

// JavaScript development checks. The older ./wiki still contains legacy
// research/evaluation commands which have not yet been ported.
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const root = __dirname;
const [command, ...args] = process.argv.slice(2);
const help = 'Usage: node wiki.js <lint|typecheck|test|build|check|ci> [--only backend|frontend] [--dry-run] [--fail-fast]';
if (!command || command === '--help' || command === '-h') { console.log(help); process.exit(command ? 0 : 2); }
const operations = { lint: ['lint'], typecheck: ['typecheck'], test: ['test'], build: ['build'], check: ['lint', 'typecheck', 'test'], ci: ['lint', 'typecheck', 'coverage', 'build'] };
if (!operations[command]) { console.error(`Unknown command: ${command}\n${help}`); process.exit(2); }
let packages = [], dry = false, failFast = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--dry-run') dry = true;
  else if (args[i] === '--fail-fast') failFast = true;
  else if (args[i] === '--only' && args[i + 1]) packages.push(...args[++i].split(','));
  else { console.error(`Unknown option: ${args[i]}`); process.exit(2); }
}
if (!packages.length) packages = ['backend', 'frontend'];
packages = [...new Set(packages.map((p) => p.trim()))];
if (packages.some((p) => !['backend', 'frontend'].includes(p))) { console.error('Choose backend and/or frontend.'); process.exit(2); }
let failed = 0;
for (const pkg of packages) {
  for (const operation of operations[command]) {
    const cwd = path.join(root, pkg), executable = operation === 'coverage' ? 'npx' : 'npm';
    const argv = operation === 'coverage' ? ['--no-install', 'vitest', 'run', '--coverage', `--coverage.thresholds.statements=${pkg === 'backend' ? 82 : 15}`] : ['run', operation];
    console.log(`${pkg}: ${executable} ${argv.join(' ')}`);
    if (dry) continue;
    if (!fs.existsSync(path.join(cwd, 'node_modules'))) { console.error(`${pkg} dependencies are missing; run npm ci in ${pkg}.`); failed++; if (failFast) process.exit(1); continue; }
    const result = spawnSync(executable, argv, { cwd, stdio: 'inherit', env: process.env });
    if (result.error || result.status !== 0) { console.error(result.error?.message || `${pkg} ${operation} failed.`); failed++; if (failFast) process.exit(1); }
  }
}
if (failed) { console.error(`${failed} check(s) failed.`); process.exitCode = 1; }
else console.log(dry ? 'Dry run complete.' : 'All checks passed.');
