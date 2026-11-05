'use strict';

const path = require('node:path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_ROOT = process.env.WIKI_DATA_ROOT ? path.resolve(process.env.WIKI_DATA_ROOT) : PROJECT_ROOT;
const RAW_DIR = path.join(DATA_ROOT, 'data', 'raw');
const OUTPUT_DIR = path.join(DATA_ROOT, 'wiki-app', 'docs');
const STATE_FILE = path.join(DATA_ROOT, 'data', 'state.json');
const STATIC_DIR = path.join(DATA_ROOT, 'wiki-app', 'static');
const STATIC_MEDIA_DIR = path.join(STATIC_DIR, 'media');
const TRUST_CONFIG_FILE = path.join(DATA_ROOT, 'data', 'source_trust.json');

module.exports = {
  PROJECT_ROOT,
  DATA_ROOT,
  RAW_DIR,
  OUTPUT_DIR,
  STATE_FILE,
  STATIC_DIR,
  STATIC_MEDIA_DIR,
  TRUST_CONFIG_FILE,
};
