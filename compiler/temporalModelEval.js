#!/usr/bin/env node
'use strict';
const api = require('../backend/src/lib/temporalModelEval');
if (require.main === module) process.stdout.write(`${api.formatReport(api.evaluateDataset(require('../backend/src/lib/trustEvalDataset').loadTrustEvalDataset()))}\n`);
module.exports = api;
