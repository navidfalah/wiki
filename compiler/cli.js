#!/usr/bin/env node
'use strict';

// Compatibility CLI for the JavaScript backend services. Build backend/ first.
const fs = require('node:fs');
const path = require('node:path');

let services;
try {
  const base = path.resolve(__dirname, '../backend/dist/lib');
  services = {
    ...require(path.join(base, 'chatService.js')),
    ...require(path.join(base, 'emailService.js')),
    ...require(path.join(base, 'connectorService.js')),
    ...require(path.join(base, 'activeLearning.js')),
    ...require(path.join(base, 'trustEvalDataset.js')),
    ...require(path.join(base, 'trustPropagation.js')),
    ...require(path.join(base, 'temporalModel.js')),
    ...require(path.join(base, 'entityGraph.js')),
    ...require(path.join(base, 'defaultConnectors.js')),
    paths: require(path.resolve(__dirname, '../backend/dist/paths.js')),
  };
} catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error;
  process.stderr.write('JavaScript backend services are not built. Run npm run build --prefix backend first.\n');
  process.exit(1);
}

const COMMANDS = {
  chat: async (input) => {
    const message = String(input.message || '').trim();
    if (!message) throw new Error("'message' is required");
    return services.chatService.answer({ message, docScope: input.doc_scope, corpusSource: input.corpus_source || 'raw' });
  },
  'chat-status': async () => services.chatService.status(),
  'chat-stream': async (input) => {
    const result = await COMMANDS.chat(input);
    for (const event of [
      { type: 'sources', sources: result.sources },
      { type: 'delta', text: result.answer },
      { type: 'done', ...result },
    ]) process.stdout.write(`${JSON.stringify(event)}\n`);
    return null;
  },
  'emails-list': async (input) => services.emailService.list(Boolean(input.include_body)),
  'email-detail': async (input) => {
    if (!input.path) throw new Error("'path' is required");
    return services.emailService.detail(String(input.path));
  },
  'email-create': async (input) => services.emailService.create(emailInput(input)),
  'email-update': async (input) => {
    if (!input.path) throw new Error("'path' is required");
    return services.emailService.update(String(input.path), emailInput(input));
  },
  'email-delete': async (input) => {
    if (!input.path) throw new Error("'path' is required");
    return services.emailService.remove(String(input.path));
  },
  'review-queue': async () => {
    const dataset = services.loadTrustEvalDataset();
    const claimsById = new Map(dataset.claim_groups.flatMap((group) => group.claims.map((claim) => [claim.id, claim])));
    const candidates = services.selectReviewCandidatesForDataset(dataset.claim_groups);
    const corrections = new Map(services.loadCorrections().map((item) => [item.claim_id, item]));
    return {
      candidates: candidates.map((candidate) => {
        const claim = claimsById.get(candidate.claim_id);
        return { ...candidate, source_type: claim?.source_type ?? null, date: claim?.date ?? null, correction: corrections.get(candidate.claim_id) ?? null };
      }),
      verdicts: [...services.VERDICTS].sort(),
    };
  },
  'review-correct': async (input) => {
    const claimId = String(input.claim_id || '').trim(), groupId = String(input.group_id || '').trim();
    if (!claimId || !groupId) throw new Error("'claim_id' and 'group_id' are required");
    const quote = String(input.quote || '').slice(0, 200);
    const correction = services.correctionFromCandidate({ claim_id: claimId, group_id: groupId, quote }, String(input.verdict || '').trim(), String(input.note || '').trim());
    services.saveCorrection(correction);
    return { saved: correction };
  },
  'entity-graph': async () => {
    let state = { files: {} };
    try { state = JSON.parse(fs.readFileSync(services.paths.STATE_FILE, 'utf8')); } catch { /* absent or invalid compiler state */ }
    return services.entityGraphPayload(state);
  },
  'temporal-facts': async () => {
    const dataset = services.loadTrustEvalDataset();
    return { groups: dataset.claim_groups.map((group) => {
      const timeline = services.buildGroupTimeline(group);
      const claims = new Map(group.claims.map((claim) => [claim.id, claim]));
      const facts = Object.values(timeline).map((fact) => {
        const claim = claims.get(fact.claim_id);
        return { claim_id: fact.claim_id, value: claim.value, source_path: claim.source_path, date: claim.date, valid_from: fact.valid_from, valid_until: fact.valid_until, is_current: fact.is_current };
      }).sort((a, b) => (a.valid_from || '9999').localeCompare(b.valid_from || '9999') || a.claim_id.localeCompare(b.claim_id));
      return { group_id: group.id, domain: group.domain, subject: group.subject, facts };
    }) };
  },
  'connectors-catalog': async () => ({ connectors: services.connectors.catalog() }),
  'connectors-oauth-start': async (input) => services.googleConnector.start(required(input.connector_id, 'connector_id')),
  'connectors-oauth-callback': async (input) => services.googleConnector.complete(
    required(input.connector_id, 'connector_id'), required(input.code, 'code'), required(input.state, 'state'), String(input.account_label || ''),
  ),
  'connectors-imap-connect': async (input) => services.connectors.connect('imap', {
    account_label: required(input.account_label, 'account_label'), host: required(input.host, 'host'), password: required(input.password, 'password'), port: Number(input.port || 993), mailbox: String(input.mailbox || 'INBOX'),
  }),
  'connectors-postgres-connect': async (input) => services.connectors.connect('postgres', {
    account_label: required(input.account_label, 'account_label'), host: required(input.host, 'host'), password: required(input.password, 'password'), port: Number(input.port || 5432), dbname: required(input.dbname, 'dbname'), user: required(input.user, 'user'), schema: String(input.schema || 'public'),
  }),
  'connectors-sqlite-connect': async (input) => services.connectors.connect('sqlite', {
    account_label: required(input.account_label, 'account_label'), db_path: required(input.db_path, 'db_path'),
  }),
  'connectors-ensure-defaults': async () => services.ensureDefaultConnections({ dataDir: path.join(services.paths.DATA_ROOT, 'data') }),
  'connectors-items-list': async (input) => ({ items: await listConnectorItems(input) }),
  'connectors-item-import': async (input) => services.externalConnectors.importItem(
    required(input.connector_id, 'connector_id'), required(input.account_label, 'account_label'), required(input.item_id, 'item_id'), String(input.item_title || ''),
  ),
  'connectors-disconnect': async (input) => services.connectors.disconnect(required(input.connector_id, 'connector_id'), required(input.account_label, 'account_label')),
};

function required(value, name) {
  const result = String(value || '').trim();
  if (!result) throw new Error(`'${name}' is required`);
  return result;
}

function emailInput(input) {
  const subject = required(input.subject, 'subject'), from = required(input.from, 'from');
  return { subject, from, to: Array.isArray(input.to) ? input.to : [], cc: Array.isArray(input.cc) ? input.cc : [], date: String(input.date || ''), body: String(input.body || '') };
}

async function listConnectorItems(input) {
  const id = required(input.connector_id, 'connector_id'), label = required(input.account_label, 'account_label');
  const query = String(input.query || ''), limit = Number(input.limit || 20);
  if (id === 'gmail' || id === 'google_drive') return services.googleConnector.list(id, label, query, limit);
  return services.externalConnectors.list(id, label, query, limit);
}

async function dispatch(command, input = {}) {
  const handler = COMMANDS[command];
  if (!handler) throw new Error(`Unknown command '${command}'. Available commands: ${Object.keys(COMMANDS).join(', ')}`);
  return handler(input || {});
}

function errorPayload(error) {
  const payload = { error: error.message || String(error) };
  if (error.errorType) payload.error_type = error.errorType;
  else if (error.code === 'ENOENT') payload.error_type = 'not_found';
  return payload;
}

async function runOnce(command, input) {
  try {
    const payload = await dispatch(command, input);
    if (command !== 'chat-stream' && payload !== null) process.stdout.write(`${JSON.stringify(payload)}\n`);
    return 0;
  } catch (error) {
    process.stdout.write(`${JSON.stringify(errorPayload(error))}\n`);
    return 1;
  }
}

async function serve() {
  const readline = require('node:readline');
  const lines = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of lines) {
    if (!line.trim()) continue;
    let request;
    try { request = JSON.parse(line); }
    catch (error) { process.stdout.write(`${JSON.stringify({ id: null, code: 1, payload: { error: `Bad worker request: ${error.message}` } })}\n`); continue; }
    const { id = null, command, input = {}, env = {} } = request;
    if (!COMMANDS[command] || command === 'chat-stream') {
      process.stdout.write(`${JSON.stringify({ id, code: 1, payload: { error: `Unsupported worker command: ${command}` } })}\n`);
      continue;
    }
    const saved = new Map(Object.keys(env).map((key) => [key, process.env[key]]));
    for (const [key, value] of Object.entries(env)) process.env[key] = String(value);
    try {
      const payload = await dispatch(command, input);
      process.stdout.write(`${JSON.stringify({ id, code: 0, payload })}\n`);
    } catch (error) {
      process.stdout.write(`${JSON.stringify({ id, code: 1, payload: errorPayload(error) })}\n`);
    } finally {
      for (const [key, value] of saved) if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
}

if (require.main === module) {
  if (process.argv[2] === '--serve') serve().catch((error) => { process.stderr.write(`${error.stack || error}\n`); process.exitCode = 1; });
  else if (process.argv.length !== 3 || !COMMANDS[process.argv[2]]) {
    process.stdout.write(`${JSON.stringify({ error: `Usage: node compiler/cli.js <${Object.keys(COMMANDS).join('|')}> | --serve` })}\n`);
    process.exitCode = 1;
  } else {
    let input = {};
    try { const text = fs.readFileSync(0, 'utf8'); if (text.trim()) input = JSON.parse(text); }
    catch (error) { process.stdout.write(`${JSON.stringify({ error: `Invalid JSON input: ${error.message}` })}\n`); process.exitCode = 1; }
    if (!process.exitCode) runOnce(process.argv[2], input).then((code) => { process.exitCode = code; });
  }
}

module.exports = { COMMANDS, dispatch };
