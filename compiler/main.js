#!/usr/bin/env node
'use strict';
// Command-line entry point for the same JavaScript compiler used by the API.
const { EventEmitter } = require('node:events');
const path = require('node:path');

const usage = `Wissensbau JavaScript compiler

Usage: node compiler/main.js [options]
  --force                    Reprocess all included sources
  --exclude-folders=a,b      Skip reading these top-level raw folders
  --critic-pass              Check drafts with the configured model
  --critic-samples=N         Use N critic samples (maximum 10)
  --critic-regenerate        Retry drafts heavily changed by the critic
  --use-corrections          Include saved human corrections
  --no-redact-pii            Disable PII redaction
  --web-search               Enable optional web search
  --help                     Show this help

Build the backend first with: npm run build --prefix backend
`;
const options = { force: false, excludeFolders: [], redactPii: true };
for (const arg of process.argv.slice(2)) {
  if (arg === '--help' || arg === '-h') { process.stdout.write(usage); process.exit(0); }
  else if (arg === '--force') options.force = true;
  else if (arg === '--critic-pass') options.criticPass = true;
  else if (arg === '--critic-regenerate') options.criticRegenerate = true;
  else if (arg === '--use-corrections') options.useCorrections = true;
  else if (arg === '--no-redact-pii') options.redactPii = false;
  else if (arg === '--redact-pii') options.redactPii = true;
  else if (arg === '--web-search') options.webSearch = true;
  else if (arg.startsWith('--exclude-folders=')) options.excludeFolders = arg.slice('--exclude-folders='.length).split(',').map((x) => x.trim()).filter(Boolean);
  else if (arg.startsWith('--critic-samples=')) {
    const count = Number(arg.slice('--critic-samples='.length));
    if (!Number.isInteger(count) || count < 1 || count > 10) { process.stderr.write('critic-samples must be between 1 and 10.\n'); process.exit(2); }
    options.criticSamples = count;
  } else { process.stderr.write(`Unknown option: ${arg}\n${usage}`); process.exit(2); }
}

let builds;
try { builds = require(path.join(__dirname, '..', 'backend', 'dist', 'lib', 'buildService.js')); }
catch (error) { if (error.code !== 'MODULE_NOT_FOUND') throw error; process.stderr.write('Could not load the JavaScript compiler. Run npm run build --prefix backend first.\n'); process.exit(1); }

class ConsoleStream extends EventEmitter {
  constructor() { super(); this.destroyed = false; this.writableEnded = false; this.headersSent = false; }
  writeHead() { this.headersSent = true; }
  write(chunk) {
    for (const block of String(chunk).split('\n\n')) {
      if (!block.startsWith('data: ')) continue;
      const event = JSON.parse(block.slice(6));
      if (event.type === 'run_id') process.stdout.write(`Run: ${event.run_id}\n`);
      else if (event.message) (event.type === 'done' && !event.success ? process.stderr : process.stdout).write(`${event.message}\n`);
      if (event.type === 'done' && !event.success) process.exitCode = 1;
    }
    return true;
  }
  end() { this.writableEnded = true; this.emit('finish'); }
}
process.once('SIGINT', () => { if (!builds.stopBuild()) process.exitCode = 130; });
builds.streamCompilerBuild(new ConsoleStream(), options);
