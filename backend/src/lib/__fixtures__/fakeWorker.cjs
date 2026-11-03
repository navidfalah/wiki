// Speaks cli.py --serve's line protocol, for pythonWorker.test.ts.
const readline = require('node:readline');

const reply = (id, code, payload) => process.stdout.write(`${JSON.stringify({ id, code, payload })}\n`);

readline.createInterface({ input: process.stdin }).on('line', (line) => {
  const { id, command, input, env } = JSON.parse(line);
  switch (command) {
    case 'echo':
      return reply(id, 0, { input, var: env.WORKER_TEST_VAR ?? null, pid: process.pid });
    case 'fail':
      return reply(id, 1, { error: 'no such email', error_type: 'not_found' });
    case 'crash':
      process.stderr.write('Traceback: boom\n');
      return process.exit(3);
    case 'hang':
      return undefined;
    case 'noise':
      process.stdout.write('not json at all\n');
      process.stdout.write(`${JSON.stringify({ id: 999999, code: 0, payload: {} })}\n`);
      return reply(id, 0, { ok: true });
    case 'slow':
      return setTimeout(() => reply(id, 0, { pid: process.pid }), 200);
    default:
      return reply(id, 1, { error: `unknown ${command}` });
  }
});
