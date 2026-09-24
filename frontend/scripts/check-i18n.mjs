#!/usr/bin/env node
/**
 * CI guard for translations:
 *  1. every t()/th()/tn()/tnh() key used in views, routes and client scripts exists in BOTH languages;
 *  2. English and German define the same keys and the same {placeholders}.
 * Run via `npm run check:i18n` (also part of `npm run typecheck`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Load the compiled-on-the-fly dictionaries through tsx (already a devDependency).
const loader = `import { dictionaries } from ${JSON.stringify(pathToFileURL(path.join(root, 'src/i18n/index.ts')).href)}; console.log(JSON.stringify(dictionaries));`;
const dicts = JSON.parse(execSync(`npx tsx -e '${loader.replace(/'/g, "'\\''")}'`, { cwd: root, encoding: 'utf8' }));

let failures = 0;
const fail = (msg) => {
  failures++;
  console.error('  ✗ ' + msg);
};

// 2. parity
const enKeys = new Set(Object.keys(dicts.en));
const deKeys = new Set(Object.keys(dicts.de));
for (const k of enKeys) if (!deKeys.has(k)) fail(`missing in de: ${k}`);
for (const k of deKeys) if (!enKeys.has(k)) fail(`missing in en: ${k}`);
const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
for (const k of enKeys) {
  if (deKeys.has(k) && placeholders(dicts.en[k]) !== placeholders(dicts.de[k])) {
    fail(`placeholder mismatch in ${k}: en {${placeholders(dicts.en[k])}} vs de {${placeholders(dicts.de[k])}}`);
  }
}

// 1. usage
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['i18n', 'node_modules'].includes(entry.name)) continue;
      walk(full, out);
    } else if (/\.(ejs|ts)$/.test(entry.name)) out.push(full);
  }
  return out;
}
const used = new Map();
const callRe = /\b(?:t|th|tn|tnh)\(\s*['"`]([A-Za-z0-9_.-]+)['"`]/g;
const clientNsRe = /^([a-z0-9-]+)\./;
for (const file of walk(path.join(root, 'src'))) {
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(callRe)) {
    const key = m[1];
    if (!used.has(key)) used.set(key, path.relative(root, file));
  }
}
for (const [key, file] of used) {
  const candidates = /_(one|other)$/.test(key) ? [key] : [key, `${key}_one`, `${key}_other`];
  for (const lang of ['en', 'de']) {
    if (!candidates.some((c) => c in dicts[lang])) fail(`${file}: key "${key}" not defined in ${lang}`);
  }
}

console.log(`i18n: ${enKeys.size} keys, ${used.size} used in source`);
if (failures) {
  console.error(`i18n check failed with ${failures} problem(s).`);
  process.exit(1);
}
console.log('i18n check passed.');
