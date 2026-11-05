'use strict';

const fs = require('node:fs');
const path = require('node:path');

const TRUST_LEVELS = ['unverified', 'low', 'medium', 'high', 'verified'];
const TRUST_SCORES = Object.fromEntries(TRUST_LEVELS.map((level, index) => [level, index]));
const TRUST_LABELS = { unverified: 'Unverified', low: 'Low', medium: 'Medium', high: 'High', verified: 'Verified' };
const DEFAULT_TRUST_BY_SOURCE_TYPE = { text: 'medium', email: 'medium', image: 'low', audio: 'low', file: 'medium', web: 'low' };
const DEFAULT_CONFIG = { version: 1, default_by_source_type: { ...DEFAULT_TRUST_BY_SOURCE_TYPE }, rules: [] };
const TRUST_CONFIG_FILE = path.resolve(__dirname, '../../../data/source_trust.json');

function normalizeLevel(level) {
  const value = String(level || '').trim().toLowerCase();
  return Object.hasOwn(TRUST_SCORES, value) ? value : 'medium';
}

function globRegex(pattern) {
  let result = '^';
  for (const char of String(pattern)) result += char === '*' ? '.*' : char === '?' ? '.' : char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`${result}$`);
}

function loadTrustConfig(file = TRUST_CONFIG_FILE) {
  let data;
  try { data = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return { version: 1, default_by_source_type: { ...DEFAULT_TRUST_BY_SOURCE_TYPE }, rules: [] }; }
  return { version: data.version || 1, default_by_source_type: data.default_by_source_type || {}, rules: Array.isArray(data.rules) ? data.rules : [] };
}

function saveTrustConfig(config, file = TRUST_CONFIG_FILE) {
  const payload = { version: config.version || 1, default_by_source_type: config.default_by_source_type || {}, rules: config.rules || [] };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return file;
}

function resolveTrust(sourcePath, sourceType, config = DEFAULT_CONFIG) {
  const normalized = String(sourcePath).replace(/\\/g, '/');
  for (const rule of config.rules || []) {
    if (rule.pattern && globRegex(rule.pattern).test(normalized)) {
      const level = normalizeLevel(rule.level);
      return { level, score: TRUST_SCORES[level], reason: rule.reason || `Matched rule pattern: ${rule.pattern}` };
    }
  }
  const defaults = { ...DEFAULT_TRUST_BY_SOURCE_TYPE, ...(config.default_by_source_type || {}) };
  const level = normalizeLevel(defaults[sourceType] || 'medium');
  return { level, score: TRUST_SCORES[level], reason: `Default trust for source_type='${sourceType}'` };
}

function buildReferences(entries, config = loadTrustConfig()) {
  const seen = new Map();
  for (const entry of entries) {
    const source = entry.source || '';
    if (!source || seen.has(source)) continue;
    const sourceType = entry.source_type || 'text';
    seen.set(source, { index: seen.size + 1, source_path: source, source_type: sourceType, chunk_index: entry.chunk_index || 0, trust: resolveTrust(source, sourceType, config) });
  }
  return [...seen.values()];
}

function renderReferencesMarkdown(references) {
  if (!references.length) return '';
  const lines = ['## References & Trust', '', '| # | Source | Type | Trust |', '|---|--------|------|-------|'];
  for (const ref of references) lines.push(`| ${ref.index} | \`${ref.source_path}\` | ${ref.source_type} | ${TRUST_LABELS[ref.trust.level] || ref.trust.level} |`);
  return `${lines.join('\n')}\n`;
}

module.exports = { TRUST_LEVELS, TRUST_SCORES, TRUST_LABELS, DEFAULT_TRUST_BY_SOURCE_TYPE, DEFAULT_CONFIG, TRUST_CONFIG_FILE, loadTrustConfig, saveTrustConfig, resolveTrust, buildReferences, renderReferencesMarkdown };
