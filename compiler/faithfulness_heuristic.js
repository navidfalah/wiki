#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { checkCorpusGroundedness, formatCorpusReport } = require('../backend/src/lib/faithfulnessHeuristic.js');

function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--docs' || arg === '--raw') {
      const value = argv[++i];
      if (!value) throw new Error(`${arg} requires a path`);
      options[arg === '--docs' ? 'docsDir' : 'rawDir'] = path.resolve(value);
    } else if (arg === '--threshold') {
      const value = Number(argv[++i]);
      if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error('--threshold must be between 0 and 1');
      options.supportThreshold = value;
    } else if (arg === '--help' || arg === '-h') return { help: true };
    else throw new Error(`Unknown option: ${arg}`);
  }
  return options;
}

function main(argv = process.argv.slice(2)) {
  try {
    const options = parseArgs(argv);
    if (options.help) {
      process.stdout.write('Usage: node compiler/faithfulness_heuristic.js [--docs PATH] [--raw PATH] [--threshold 0..1]\n');
      return 0;
    }
    process.stdout.write(`${formatCorpusReport(checkCorpusGroundedness(options))}\n`);
    return 0;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    return 2;
  }
}

if (require.main === module) process.exitCode = main();
module.exports = { main, parseArgs };
