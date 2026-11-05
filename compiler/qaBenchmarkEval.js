#!/usr/bin/env node
'use strict';
const api = require('../backend/src/lib/qaBenchmarkEval.js');
if (require.main === module) api.main().then((code) => { process.exitCode = code; }).catch((error) => { process.stderr.write(`${error.stack || error}\n`); process.exitCode = 1; });
module.exports = api;
