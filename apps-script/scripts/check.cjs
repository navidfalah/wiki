'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../src');
let failures = [];
const allowedProjectFiles = /\.(?:gs|html)$|^appsscript\.json$/;
for (const name of fs.readdirSync(root)) {
  if (!allowedProjectFiles.test(name)) failures.push(`${name}: Apps Script source must be .gs, .html, or appsscript.json`);
  const source = fs.readFileSync(path.join(root, name), 'utf8');
  try {
    if (name.endsWith('.gs')) new vm.Script(source, { filename: name });
    if (name.endsWith('.html')) for (const match of source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) new vm.Script(match[1], { filename: name });
  } catch (error) { failures.push(`${name}: ${error.message}`); }
}
const translations = fs.readFileSync(path.join(root, 'Translations.html'), 'utf8').replace(/^<script>\s*/, '').replace(/<\/script>\s*$/, '');
const ctx = {}; vm.runInNewContext(translations, ctx);
const en = Object.keys(ctx.WB_TRANSLATIONS.en).sort(), de = Object.keys(ctx.WB_TRANSLATIONS.de).sort();
if (JSON.stringify(en) !== JSON.stringify(de)) failures.push('English/German translation keys differ');
for (const name of ['Client.html', 'Index.html']) {
  const content = fs.readFileSync(path.join(root, name), 'utf8');
  for (const match of content.matchAll(/\bt\('([^']+)'\)/g)) if (!match[1].endsWith('.') && !en.includes(match[1])) failures.push(`${name}: missing translation ${match[1]}`);
}
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'appsscript.json'), 'utf8'));
if (manifest.runtimeVersion !== 'V8' || manifest.webapp.executeAs !== 'USER_ACCESSING' || manifest.webapp.access === 'ANYONE_ANONYMOUS') failures.push('Unsafe web app deployment manifest');
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log(`Apps Script syntax, manifest and ${en.length} bilingual keys checked.`);
