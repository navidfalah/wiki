#!/usr/bin/env node
'use strict';
const api = require('../backend/src/lib/retrievalEval');
if (require.main === module) api.formatNoApiReport().then((report) => process.stdout.write(`${report}\n`)).catch((error) => { process.stderr.write(`${error.stack || error}\n`); process.exitCode = 1; });
module.exports = api;
