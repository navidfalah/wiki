'use strict';
// Reads source content without model calls and without writing to raw files.
const fs = require('node:fs');
const path = require('node:path');
const { unzipSync, strFromU8 } = require('fflate');
const { simpleParser } = require('mailparser');
const core = require('./wikiCore');
const MAX_ARCHIVE_BYTES = 40 * 1024 * 1024;

function archiveEntries(buffer) {
  let end = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50 && i + 22 + buffer.readUInt16LE(i + 20) === buffer.length) { end = i; break; }
  }
  if (end < 0 || buffer.readUInt16LE(end + 4) || buffer.readUInt16LE(end + 6)) throw new Error('Invalid ZIP archive');
  const count = buffer.readUInt16LE(end + 10); let cursor = buffer.readUInt32LE(end + 16), total = 0;
  if (!count || count > 4000 || count === 65535) throw new Error('ZIP archive exceeds entry limit');
  for (let n = 0; n < count; n++) {
    if (cursor + 46 > end || buffer.readUInt32LE(cursor) !== 0x02014b50) throw new Error('Invalid ZIP archive');
    if (buffer.readUInt16LE(cursor + 8) & 1) throw new Error('Encrypted ZIP archive');
    total += buffer.readUInt32LE(cursor + 24);
    if (total > MAX_ARCHIVE_BYTES) throw new Error('ZIP archive exceeds size limit');
    cursor += 46 + buffer.readUInt16LE(cursor + 28) + buffer.readUInt16LE(cursor + 30) + buffer.readUInt16LE(cursor + 32);
  }
  const files = unzipSync(buffer, { filter: (entry) => /\.(xml|rels)$/i.test(entry.name) });
  return Object.fromEntries(Object.entries(files).map(([name, bytes]) => [name.replace(/^\//, ''), strFromU8(bytes)]));
}
function archiveManifest(buffer) {
  let end = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--) if (buffer.readUInt32LE(i) === 0x06054b50 && i + 22 + buffer.readUInt16LE(i + 20) === buffer.length) { end = i; break; }
  if (end < 0) throw new Error('Invalid ZIP archive');
  const count = buffer.readUInt16LE(end + 10); let cursor = buffer.readUInt32LE(end + 16); const names = [];
  if (count > 4000 || count === 65535) throw new Error('ZIP archive exceeds entry limit');
  for (let n = 0; n < count; n++) {
    if (cursor + 46 > end || buffer.readUInt32LE(cursor) !== 0x02014b50) throw new Error('Invalid ZIP archive');
    const length = buffer.readUInt16LE(cursor + 28), extra = buffer.readUInt16LE(cursor + 30), comment = buffer.readUInt16LE(cursor + 32);
    if (cursor + 46 + length + extra + comment > end) throw new Error('Invalid ZIP archive');
    names.push(buffer.subarray(cursor + 46, cursor + 46 + length).toString('utf8'));
    cursor += 46 + length + extra + comment;
  }
  return names.join('\n');
}
async function pdfText(bytes) {
  // PDF.js 4 expects this ES2024 helper; production Node 22 supplies it.
  if (!Promise.withResolvers) Object.defineProperty(Promise, 'withResolvers', { value() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }, configurable: true });
  const load = new Function('specifier', 'return import(specifier)');
  const pdfjs = await load('pdfjs-dist/legacy/build/pdf.mjs');
  const document = await pdfjs.getDocument({ data: new Uint8Array(bytes), useSystemFonts: false, isEvalSupported: false }).promise;
  try {
    const pages = [];
    for (let i = 1; i <= document.numPages; i++) {
      const page = await document.getPage(i), content = await page.getTextContent();
      pages.push(`## Page ${i}\n\n${content.items.map((item) => item.str || '').join(' ')}`);
    }
    return pages.join('\n\n');
  } finally { await document.destroy(); }
}
async function readSource(file) {
  return readSourceBytes(fs.readFileSync(file), path.basename(file));
}
async function readSourceBytes(bytes, name) {
  const ext = path.extname(name).toLowerCase().slice(1);
  if (bytes.length > 40 * 1024 * 1024) return `[${name} — file exceeds the reader size limit]`;
  try {
    if (ext === 'eml') {
      const mail = await simpleParser(bytes);
      const header = (label, value, fallback) => `${label}: ${value || fallback}`;
      return [
        header('Subject', mail.subject, '(no subject)'),
        header('From', mail.from?.text, '(unknown sender)'),
        header('To', mail.to?.text, '(unknown recipient)'),
        ...(mail.cc?.text ? [`Cc: ${mail.cc.text}`] : []),
        header('Date', mail.date?.toISOString?.() || mail.headers.get('date'), '(unknown date)'),
        '', mail.text?.trim() || '(empty body)',
      ].join('\n');
    }
    if (ext === 'pdf') return await pdfText(bytes);
    if (['docx','docm','xlsx','xlsm','pptx','pptm','odt','ods','odp'].includes(ext)) return core.office(archiveEntries(bytes), ext);
    if (ext === 'zip') return archiveManifest(bytes);
    if (['txt','md','csv','tsv','json','xml','html','htm','yaml','yml','log'].includes(ext)) {
      let text = bytes.toString('utf8');
      if (ext === 'html' || ext === 'htm') text = text.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<[^>]+>/g, ' ');
      return text;
    }
    return `[Attached file: ${name} — content not parsed]`;
  } catch { return `[Attached file: ${name} — content unavailable]`; }
}
module.exports = { readSource, readSourceBytes, archiveEntries, archiveManifest };
