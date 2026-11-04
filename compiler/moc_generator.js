#!/usr/bin/env node
'use strict';

// Shared MOC implementation used by the compiler build and standalone CLI.
const moc = require('../backend/src/lib/mocGenerator.js');

if (require.main === module) process.exitCode = moc.main();
module.exports = moc;
