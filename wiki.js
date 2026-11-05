#!/usr/bin/env node
'use strict';

// JavaScript repository workflow CLI.
const { spawnSync, spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const root = __dirname;
const [command, ...args] = process.argv.slice(2);
const help = 'Usage: ./wiki <doctor|setup|list|dev|lint|typecheck|test|coverage|eval|bench|build|e2e|docker|audit|check|ci> [--only backend|frontend] [--dry-run] [--fail-fast]';
if (!command || command === '--help' || command === '-h') { console.log(help); process.exit(command ? 0 : 2); }
const packageOperations = { lint: ['lint'], typecheck: ['typecheck'], test: ['test'], build: ['build'], audit: ['audit'], check: ['lint', 'typecheck', 'test'], ci: ['lint', 'typecheck', 'coverage', 'build'] };
const standalone = ['doctor', 'setup', 'list', 'dev', 'coverage', 'eval', 'bench', 'e2e', 'docker'];
if (!packageOperations[command] && !standalone.includes(command)) { console.error(`Unknown command: ${command}\n${help}`); process.exit(2); }
let packages = [], dry = false, failFast = false, browsers = false, e2e = false, docker = false, changed = false, base = 'origin/main', testFilter = null, extra = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--dry-run') dry = true;
  else if (args[i] === '--fail-fast') failFast = true;
  else if (args[i] === '--only' && args[i + 1]) packages.push(...args[++i].split(','));
  else if (args[i] === '--browsers') browsers = true;
  else if (args[i] === '--e2e') e2e = true;
  else if (args[i] === '--docker') docker = true;
  else if (args[i] === '--changed') changed = true;
  else if (args[i] === '--base' && args[i + 1]) base = args[++i];
  else if ((args[i] === '-k' || args[i] === '--filter') && args[i + 1]) testFilter = args[++i];
  else if (args[i] === '--') extra = args.slice(i + 1);
  else if (args[i] === '--update-baseline') extra.push(args[i]);
  else { console.error(`Unknown option: ${args[i]}`); process.exit(2); }
}
if (!packages.length) packages = ['backend', 'frontend'];
packages = [...new Set(packages.map((p) => p.trim()))];
if (packages.some((p) => !['backend', 'frontend'].includes(p))) { console.error('Choose backend and/or frontend.'); process.exit(2); }
const floors = { backend: 82, frontend: 15 };
function step(name, cwd, executable, argv, requires = 'node_modules') { return { name, cwd, executable, argv, requires }; }
function packageSteps(pkg, op) {
  const cwd = path.join(root, pkg);
  if (op === 'coverage') return [step('coverage', cwd, 'npx', ['--no-install', 'vitest', 'run', '--coverage', `--coverage.thresholds.statements=${floors[pkg]}`, ...(testFilter ? [testFilter] : [])])];
  return [step(op, cwd, 'npm', ['run', op, ...(op === 'test' && testFilter ? ['--', testFilter] : [])])];
}
function listSteps() {
  const groups = { lint: ['lint'], typecheck: ['typecheck'], test: ['test'], coverage: ['coverage'], build: ['build'], audit: ['audit'], e2e: ['build', 'e2e'], docker: ['compose config', 'compose config --profile caddy', 'caddy validate', 'compose build'] };
  for (const [name, operations] of Object.entries(groups)) {
    console.log(name);
    for (const pkg of packages) for (const operation of operations) console.log(`  ${pkg.padEnd(9)} ${operation === 'e2e' ? 'npx --no-install playwright test' : operation === 'compose config' ? 'docker compose -f docker-compose.prod.yml config -q' : operation === 'compose config --profile caddy' ? 'docker compose -f docker-compose.prod.yml --profile caddy config -q' : operation === 'caddy validate' ? 'docker run --rm caddy:2-alpine caddy validate' : operation === 'compose build' ? 'docker compose -f docker-compose.prod.yml build' : operation === 'coverage' ? `npx --no-install vitest run --coverage (floor ${floors[pkg]}%)` : `npm run ${operation}`}`);
  }
  console.log(`\nNode ${process.versions.node}; coverage floors: backend ${floors.backend}%, frontend ${floors.frontend}%.`);
}
function doctor() {
  const checks = [
    ['Node 22+', Number(process.versions.node.split('.')[0]) >= 22, process.version],
    ['npm', Boolean(spawnSync('npm', ['--version'], { encoding: 'utf8' }).stdout)],
    ['git', Boolean(spawnSync('git', ['--version'], { encoding: 'utf8' }).stdout)],
    ...['backend', 'frontend'].map((pkg) => [`${pkg}/node_modules`, fs.existsSync(path.join(root, pkg, 'node_modules'))]),
    ['Playwright Chromium (optional)', fs.existsSync(path.join(os.homedir(), '.cache/ms-playwright'))],
    ['Docker (optional)', Boolean(spawnSync('docker', ['--version'], { encoding: 'utf8' }).stdout)],
  ];
  for (const [label, ok, detail = ''] of checks) console.log(`${ok ? '✓' : label.includes('optional') ? '○' : '✗'} ${label}${detail ? ` ${detail}` : ''}`);
  process.exitCode = checks.some(([label, ok]) => !ok && !String(label).includes('optional')) ? 1 : 0;
}
function changedPackages() {
  const result = spawnSync('git', ['diff', '--name-only', base], { cwd: root, encoding: 'utf8' });
  const untracked = spawnSync('git', ['ls-files', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0 || untracked.status !== 0) return ['backend', 'frontend'];
  const files = `${result.stdout}\n${untracked.stdout}`.split(/\r?\n/).filter(Boolean);
  if (files.some((file) => file.startsWith('data/') || file === 'wiki' || file === 'wiki.js' || file.startsWith('.github/'))) return ['backend', 'frontend'];
  return ['backend', 'frontend'].filter((pkg) => files.some((file) => file.startsWith(`${pkg}/`)));
}
async function runStep(item) {
  if (item.requires === 'node_modules' && !fs.existsSync(path.join(item.cwd, 'node_modules'))) return { ...item, status: 'skip', note: 'node_modules missing; run ./wiki setup', seconds: 0 };
  const started = Date.now();
  if (dry) { console.log(`${path.relative(root, item.cwd) || '.'}: ${item.executable} ${item.argv.join(' ')}`); return { ...item, status: 'pass', seconds: 0 }; }
  console.log(`\n▶ ${item.name}: ${item.executable} ${item.argv.join(' ')}`);
  const result = spawnSync(item.executable, item.argv, { cwd: item.cwd, stdio: 'inherit', env: process.env });
  return { ...item, status: !result.error && result.status === 0 ? 'pass' : 'fail', note: result.error?.message || (result.status ? `exit ${result.status}` : ''), seconds: (Date.now() - started) / 1000 };
}
async function run() {
  if (command === 'doctor') return doctor();
  if (command === 'list') return listSteps();
  if (command === 'setup') {
    const steps = ['backend', 'frontend'].map((pkg) => step('npm ci', path.join(root, pkg), 'npm', ['ci'], null));
    if (browsers) steps.push(step('Playwright Chromium', path.join(root, 'frontend'), 'npx', ['--no-install', 'playwright', 'install', 'chromium'], null));
    for (const item of steps) { const r = await runStep(item); if (r.status !== 'pass') process.exitCode = 1; }
    return;
  }
  if (command === 'dev') {
    const env = { ...process.env, ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin', ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'dev-admin-password' };
    const procs = [spawn('npm', ['run', 'dev'], { cwd: path.join(root, 'backend'), env, stdio: 'inherit' }), spawn('npm', ['run', 'dev:server'], { cwd: path.join(root, 'frontend'), env: { ...env, BACKEND_API_URL: 'http://localhost:8000' }, stdio: 'inherit' })];
    console.log('Backend :8000; frontend http://localhost:3000. Ctrl-C stops both.');
    const stop = () => procs.forEach((proc) => proc.kill('SIGTERM'));
    process.once('SIGINT', stop); await Promise.race(procs.map((proc) => new Promise((resolve) => proc.once('exit', resolve)))); stop(); return;
  }
  let selected = changed ? changedPackages() : packages;
  let steps = [];
  if (packageSteps) {
    if (packageOperations[command]) for (const pkg of selected) for (const op of packageOperations[command]) steps.push(...packageSteps(pkg, op));
    else if (command === 'coverage') for (const pkg of selected) steps.push(...packageSteps(pkg, 'coverage'));
  }
  if (command === 'eval') steps = [step('eval gate', path.join(root, 'compiler'), 'node', ['evalGate.js', ...(extra.includes('--update-baseline') ? ['--update-baseline'] : [])], null)];
  if (command === 'bench') steps = [step('Q&A benchmark', path.join(root, 'compiler'), 'node', ['qaBenchmarkEval.js'], null), step('scalability benchmark', path.join(root, 'compiler'), 'node', ['scalabilityBenchmark.js'], null), step('search benchmark', path.join(root, 'backend'), 'npx', ['--no-install', 'vitest', 'run', 'src/lib/searchBenchmark.test.ts'])];
  if (command === 'e2e') steps = [step('build frontend', path.join(root, 'frontend'), 'npm', ['run', 'build']), step('Playwright E2E', path.join(root, 'frontend'), 'npx', ['--no-install', 'playwright', 'test', ...extra])];
  if (command === 'audit') steps = selected.filter((pkg) => pkg !== 'compiler').map((pkg) => step('audit', path.join(root, pkg), 'npm', ['audit', '--omit=dev']));
  if (command === 'docker') steps = [step('compose config', root, 'docker', ['compose', '-f', 'docker-compose.prod.yml', 'config', '-q'], null), step('compose config Caddy', root, 'docker', ['compose', '-f', 'docker-compose.prod.yml', '--profile', 'caddy', 'config', '-q'], null), step('Caddyfile validation', root, 'docker', ['run', '--rm', '-v', `${root}/deploy/Caddyfile:/etc/caddy/Caddyfile:ro`, 'caddy:2-alpine', 'caddy', 'validate', '--config', '/etc/caddy/Caddyfile'], null), step('Docker image build', root, 'docker', ['compose', '-f', 'docker-compose.prod.yml', 'build'], null)];
  if (command === 'ci') {
    steps = [];
    for (const pkg of selected) {
      steps.push(...packageSteps(pkg, 'lint'));
      steps.push(...packageSteps(pkg, 'typecheck'));
      steps.push(...packageSteps(pkg, 'coverage'));
      if (pkg === 'backend') steps.push(step('compiler evaluation gate', path.join(root, 'compiler'), 'node', ['evalGate.js'], null));
      steps.push(...packageSteps(pkg, 'build'));
    }
    if (e2e) steps.push(step('build frontend', path.join(root, 'frontend'), 'npm', ['run', 'build']), step('Playwright E2E', path.join(root, 'frontend'), 'npx', ['--no-install', 'playwright', 'test']));
    if (docker) steps.push(step('Docker checks', root, 'docker', ['compose', '-f', 'docker-compose.prod.yml', 'build'], null));
  }
  if (dry) { for (const item of steps) await runStep(item); return; }
  const results = [];
  for (const item of steps) { const result = await runStep(item); results.push(result); if (result.status === 'fail' && failFast) break; }
  for (const item of results) console.log(`${item.status === 'pass' ? '✓' : item.status === 'skip' ? '○' : '✗'} ${item.name} ${item.seconds.toFixed(1)}s ${item.note || ''}`);
  if (results.some((item) => item.status === 'fail')) process.exitCode = 1;
  if (!steps.length) console.log('Nothing to run for the selected packages.');
}
run().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
