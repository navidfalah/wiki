#!/usr/bin/env node
'use strict';
const { runEval, printReport } = require('../backend/src/lib/piiRedactionEval.js');
printReport(runEval());
console.log('\n=== Optional NER tier (location category) ===');
console.log('No NER backend is configured for this JavaScript runtime; NER-only fixtures were not scored.');
