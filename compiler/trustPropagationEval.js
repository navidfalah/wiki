#!/usr/bin/env node
'use strict';
const api = require('../backend/src/lib/trustPropagationEval');
if (require.main === module) process.stdout.write(`${api.formatReport()}\n`);
module.exports = api;
