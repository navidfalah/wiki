#!/usr/bin/env node
// Stands in for `python3 cli.py <command>` (and `cli.py --serve`) in the
// route tests, so they need no Python install and never touch real data.
// Every call is appended to $FAKE_PYTHON_LOG for assertions.
(function main() {
const fs = require('node:fs');
const readline = require('node:readline');

const EMAIL = {
  path: 'emails/relay.eml',
  subject: 'Relay battery drain',
  from: 'Mira Chen <mira@example.test>',
  date: '2026-06-02',
  body_preview: 'Batch 4 units drain faster with relay mode.',
};
const EMAIL_BODY = 'Batch 4 units drain faster with relay mode. The relay radio sleep timer resets on every received packet.';

function handle(command, input) {
  if (process.env.FAKE_PYTHON_LOG) fs.appendFileSync(process.env.FAKE_PYTHON_LOG, `${JSON.stringify({ command, input })}\n`);
  switch (command) {
    case 'emails-list':
      return { code: 0, payload: { total: 1, emails: [{ ...EMAIL, ...(input && input.include_body ? { body: EMAIL_BODY } : {}) }] } };
    case 'email-detail':
      if (input && input.path === EMAIL.path) return { code: 0, payload: { ...EMAIL, body: EMAIL_BODY, to: [], cc: [] } };
      if (input && typeof input.path === 'string' && !input.path.endsWith('.eml')) return { code: 1, payload: { error: 'Not an email source', error_type: 'not_an_email' } };
      return { code: 1, payload: { error: 'Raw file not found', error_type: 'not_found' } };
    case 'source-text':
      if (input && input.path === 'project/grant.pdf') return { code: 0, payload: { path: input.path, text: 'Grant application: 198 kWp.', chars: 27, truncated: false } };
      return { code: 1, payload: { error: `Raw file not found: ${input && input.path}`, error_type: 'not_found' } };
    case 'review-queue':
      return { code: 0, payload: { candidates: [], verdicts: ['correct', 'incorrect', 'unsure'] } };
    case 'entity-graph':
      return { code: 0, payload: { nodes: [{ id: 'aurora-labs', label: 'Aurora Labs' }], edges: [] } };
    case 'temporal-facts':
      return { code: 0, payload: { groups: [] } };
    case 'chat-status':
      return { code: 0, payload: { corpus_pages: 2, corpus_passages: 4, raw_source_files: 3, llm_available: false } };
    case 'connectors-catalog':
      return { code: 0, payload: { connectors: [] } };
    case 'connectors-ensure-defaults':
      return { code: 0, payload: { connected: [], already_connected: [] } };
    case 'crash':
      return { code: 1, payload: null };
    default:
      return { code: 1, payload: { error: `fake python: unsupported command ${command}` } };
  }
}

function log(entry) {
  if (process.env.FAKE_PYTHON_LOG) fs.appendFileSync(process.env.FAKE_PYTHON_LOG, `${JSON.stringify(entry)}\n`);
}

// `python3 -u main.py [flags]`: a compile. Prints a run id marker and some
// ANSI-coloured progress, then exits with $FAKE_BUILD_EXIT (default 0),
// after $FAKE_BUILD_SLEEP_MS so a test can stop it mid-run.
if (process.argv[2] === '-u' && process.argv[3] === 'main.py') {
  log({ command: 'main.py', args: process.argv.slice(4) });
  process.stdout.write('@@RUN_ID@@20260927-120000-abcdef\n');
  process.stdout.write('\u001b[32mStep 1/5: discovering raw files\u001b[0m\n');
  process.stderr.write('warning on stderr\n');
  setTimeout(() => {
    process.stdout.write('Step 5/5: done (no trailing newline)');
    process.exit(Number(process.env.FAKE_BUILD_EXIT || 0));
  }, Number(process.env.FAKE_BUILD_SLEEP_MS || 10));
  return;
}

// `python3 cli.py chat-stream`: NDJSON events, like rag_engine.answer_question_stream.
if (process.argv[3] === 'chat-stream') {
  let raw = '';
  process.stdin.on('data', (c) => (raw += c));
  process.stdin.on('end', () => {
    const input = JSON.parse(raw || '{}');
    log({ command: 'chat-stream', input });
    const emit = (e) => process.stdout.write(`${JSON.stringify(e)}\n`);
    if (input.message === 'fail please') {
      emit({ type: 'error', message: 'model unavailable' });
      return;
    }
    if (input.message === 'silent please') {
      process.stderr.write('Traceback: crashed before any event');
      process.exit(1);
    }
    process.stdout.write('stray non-JSON line\n');
    emit({ type: 'sources', sources: [{ doc_path: 'aurora-labs.md', title: 'Aurora Labs', score: 1.2 }] });
    emit({ type: 'token', text: 'Aurora uses ' });
    emit({ type: 'token', text: 'a CR2032.' });
    emit({ type: 'done', answer: 'Aurora uses a CR2032.', mode: 'extractive', faithfulness: { mode: 'extractive' } });
  });
  return;
}

const command = process.argv[3];
if (command === '--serve') {
  readline.createInterface({ input: process.stdin }).on('line', (line) => {
    const request = JSON.parse(line);
    const { code, payload } = handle(request.command, request.input);
    process.stdout.write(`${JSON.stringify({ id: request.id, code, payload })}\n`);
  });
} else {
  let raw = '';
  process.stdin.on('data', (c) => (raw += c));
  process.stdin.on('end', () => {
    const { code, payload } = handle(command, raw.trim() ? JSON.parse(raw) : null);
    if (payload !== null) process.stdout.write(JSON.stringify(payload));
    process.exit(code);
  });
}
})();
