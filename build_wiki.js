#!/usr/bin/env node
'use strict';

// Build the backend before invoking its compiler, then build the frontend.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = __dirname;
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node build_wiki.js [compiler options]\nBuilds the backend, runs the JavaScript compiler, then builds the frontend.\nUse node compiler/main.js --help for compiler options.');
  process.exit(0);
}
function run(command, commandArgs, cwd) {
  const result = spawnSync(command, commandArgs, { cwd, stdio: 'inherit', env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${path.basename(command)} exited with status ${result.status ?? result.signal}`);
}
function prepare(folder) {
  const cwd = path.join(root, folder);
  if (!fs.existsSync(path.join(cwd, 'node_modules'))) {
    console.log(`Installing ${folder} dependencies`);
    run('npm', ['ci'], cwd);
  }
  console.log(`Building ${folder}`);
  run('npm', ['run', 'build'], cwd);
}
try {
  prepare('backend');
  console.log('Running the JavaScript compiler');
  run(process.execPath, [path.join(root, 'compiler', 'main.js'), ...args], root);
  prepare('frontend');
  console.log('Build complete. Start backend and frontend with npm start in each directory.');
} catch (error) {
  console.error(`Build failed: ${error.message}`);
  process.exitCode = 1;
}
