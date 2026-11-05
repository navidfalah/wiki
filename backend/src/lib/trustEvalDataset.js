'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const backendRequire = createRequire(path.resolve(__dirname, '../../package.json'));
const { simpleParser } = backendRequire('mailparser');

const DATASET_PATH = path.resolve(__dirname, '../../../data/trust_eval_dataset.json');
const RAW_DIR = path.resolve(__dirname, '../../../data/raw');
const GOLD_LABELS = new Set(['correct', 'incorrect', 'superseded', 'scope_dependent', 'disputed']);
const RELATION_TYPES = new Set(['corroborates', 'contradicts', 'supersedes']);

function parseClaim(raw) {
  return { id: raw.id, source_path: raw.source_path, source_type: raw.source_type, date: raw.date || '', value: raw.value, quote: raw.quote, gold_label: raw.gold_label, note: raw.note || '' };
}
function parseRelation(raw) { return { from_id: raw.from, to_id: raw.to, type: raw.type }; }
function parseGroup(raw) {
  return { id: raw.id, domain: raw.domain || '', subject: raw.subject, description: raw.description || '', claims: (raw.claims || []).map(parseClaim), relations: (raw.relations || []).map(parseRelation) };
}
function loadTrustEvalDataset(file = DATASET_PATH) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  return { version: data.version || 1, description: data.description || '', claim_groups: (data.claim_groups || []).map(parseGroup) };
}
function allClaims(dataset) { return dataset.claim_groups.flatMap((group) => group.claims); }
function normalizeForGrounding(text) { return String(text).replace(/\*\*/g, '').split(/\s+/).filter(Boolean).join(' '); }
function quoteIsGrounded(quote, fileText) {
  const normalizedFile = normalizeForGrounding(fileText), fragments = String(quote).split('[...]').map((part) => part.trim()).filter(Boolean);
  return fragments.length > 0 && fragments.every((fragment) => normalizedFile.includes(normalizeForGrounding(fragment)));
}
async function readClaimSource(sourceFile) {
  const bytes = fs.readFileSync(sourceFile);
  if (path.extname(sourceFile).toLowerCase() === '.eml') {
    const mail = await simpleParser(bytes);
    return `${mail.subject || ''}\n${mail.text || ''}`;
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}
async function validateDataset(dataset, rawDir = RAW_DIR) {
  const problems = [], groupIds = new Set();
  for (const group of dataset.claim_groups) {
    if (groupIds.has(group.id)) problems.push(`duplicate claim_group id: ${group.id}`);
    groupIds.add(group.id);
    const claimIds = new Set(group.claims.map((claim) => claim.id));
    if (claimIds.size !== group.claims.length) problems.push(`[${group.id}] duplicate claim ids`);
    for (const claim of group.claims) {
      if (!GOLD_LABELS.has(claim.gold_label)) problems.push(`[${group.id}/${claim.id}] unknown gold_label: ${JSON.stringify(claim.gold_label)}`);
      const sourceFile = path.resolve(rawDir, claim.source_path);
      if (!sourceFile.startsWith(`${path.resolve(rawDir)}${path.sep}`) || !fs.existsSync(sourceFile) || !fs.statSync(sourceFile).isFile()) {
        problems.push(`[${group.id}/${claim.id}] source_path not found: ${claim.source_path}`);
        continue;
      }
      let fileText;
      try { fileText = await readClaimSource(sourceFile); }
      catch (error) {
        problems.push(`[${group.id}/${claim.id}] source file could not be read: ${claim.source_path} (${error.message})`);
        continue;
      }
      if (!quoteIsGrounded(claim.quote, fileText)) problems.push(`[${group.id}/${claim.id}] quote not found verbatim in ${claim.source_path}`);
    }
    for (const relation of group.relations) {
      if (!RELATION_TYPES.has(relation.type)) problems.push(`[${group.id}] unknown relation type: ${JSON.stringify(relation.type)}`);
      if (!claimIds.has(relation.from_id)) problems.push(`[${group.id}] relation 'from' id not in group: ${relation.from_id}`);
      if (!claimIds.has(relation.to_id)) problems.push(`[${group.id}] relation 'to' id not in group: ${relation.to_id}`);
    }
  }
  return problems;
}
function summaryStats(dataset) {
  const labels = {}, relations = {}, domains = {}, groupSizes = {};
  for (const group of dataset.claim_groups) {
    groupSizes[group.id] = group.claims.length;
    domains[group.domain] = (domains[group.domain] || 0) + group.claims.length;
    for (const claim of group.claims) labels[claim.gold_label] = (labels[claim.gold_label] || 0) + 1;
    for (const relation of group.relations) relations[relation.type] = (relations[relation.type] || 0) + 1;
  }
  return { claim_groups: dataset.claim_groups.length, total_claims: Object.values(groupSizes).reduce((a, b) => a + b, 0), total_relations: Object.values(relations).reduce((a, b) => a + b, 0), claims_by_gold_label: labels, relations_by_type: relations, claims_by_domain: domains, claims_per_group: groupSizes };
}

module.exports = { DATASET_PATH, RAW_DIR, GOLD_LABELS, RELATION_TYPES, loadTrustEvalDataset, allClaims, normalizeForGrounding, quoteIsGrounded, validateDataset, summaryStats };
