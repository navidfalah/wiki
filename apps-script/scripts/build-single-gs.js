'use strict';
// Produce an Apps Script web app without separate HTML source files.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'src');
const html = fs.readFileSync(path.join(src, 'Index.html'), 'utf8').replace(/<\?!= include_\('([^']+)'\); \?>/g, (_, name) => fs.readFileSync(path.join(src, name + '.html'), 'utf8'));
const files = ['Core.gs', 'Store.gs', 'Readers.gs', 'Compiler.gs', 'Search.gs'];
const code = files.map(name => fs.readFileSync(path.join(src, name), 'utf8')).join('\n\n') + '\n\nfunction doGet() { return HtmlService.createHtmlOutput(' + JSON.stringify(html) + ').setTitle("Wissensbau").addMetaTag("viewport", "width=device-width, initial-scale=1"); }\n';
new vm.Script(code, { filename: 'Wissensbau.gs' });
const dist = path.join(root, 'dist');
fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(path.join(dist, 'Wissensbau.gs'), code);
console.log('Created dist/Wissensbau.gs with the complete Apps Script interface embedded.');
