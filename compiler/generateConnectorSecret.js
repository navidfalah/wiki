#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');

// Fernet-compatible URL-safe base64 of 32 random bytes, including padding.
process.stdout.write(`${crypto.randomBytes(32).toString('base64url')}=\n`);
