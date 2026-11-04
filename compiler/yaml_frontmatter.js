#!/usr/bin/env node
'use strict';

// Keep compiler callers and the Node backend on the same frontmatter rules.
module.exports = require('../backend/src/lib/yamlFrontmatter.js');
