#!/usr/bin/env node
/**
 * CI guard for translations:
 *  1. every t()/th()/tn()/tnh() key used in views, routes and client scripts exists in BOTH languages;
 *  2. English and German define the same keys and the same {placeholders}.
 * Run via `npm run check:i18n` (also part of `npm run typecheck`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Read the static TypeScript dictionaries from their AST. This avoids a tsx
// subprocess/IPC server and still compares the actual exported keys and text.
function readDictionary(directory) {
  const result = {};
  for (const name of fs.readdirSync(directory).filter((file) => file.endsWith('.ts')).sort()) {
    const file = path.join(directory, name);
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    let object;
    for (const statement of source.statements) {
      if (!ts.isVariableStatement(statement)) continue;
      for (const declaration of statement.declarationList.declarations) {
        let initializer = declaration.initializer;
        while (initializer && (ts.isAsExpression(initializer) || ts.isSatisfiesExpression(initializer) || ts.isTypeAssertionExpression(initializer))) initializer = initializer.expression;
        if (ts.isIdentifier(declaration.name) && declaration.name.text !== 'en' && declaration.name.text !== 'de' && initializer && ts.isObjectLiteralExpression(initializer)) {
          object = initializer;
        }
      }
    }
    if (!object) throw new Error(`No exported dictionary object found in ${file}`);
    for (const property of object.properties) {
      if (!ts.isPropertyAssignment(property)) continue;
      const key = ts.isStringLiteral(property.name) || ts.isNoSubstitutionTemplateLiteral(property.name) ? property.name.text : null;
      const value = ts.isStringLiteral(property.initializer) || ts.isNoSubstitutionTemplateLiteral(property.initializer) ? property.initializer.text : null;
      if (key === null || value === null) throw new Error(`Expected static string key/value in ${file}`);
      if (Object.hasOwn(result, key)) throw new Error(`Duplicate i18n key ${key} in ${directory}`);
      result[key] = value;
    }
  }
  return result;
}
const dicts = {
  en: readDictionary(path.join(root, 'src/i18n/en')),
  de: readDictionary(path.join(root, 'src/i18n/de')),
};
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
