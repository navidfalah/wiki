#!/usr/bin/env node
'use strict';
const { runBenchmark, formatBenchmark } = require('../backend/src/lib/scalabilityBenchmark');

async function main(argv = process.argv.slice(2)) {
  try {
    const sizes = argv.length ? argv.map(Number) : undefined;
    if (sizes?.some((size) => !Number.isInteger(size) || size < 1)) throw new Error('Corpus sizes must be positive integers.');
    process.stdout.write(`${formatBenchmark(await runBenchmark(sizes))}\n`);
    return 0;
  } catch (error) { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); return 1; }
}
if (require.main === module) main().then((code) => { process.exitCode = code; });
module.exports = { main };
