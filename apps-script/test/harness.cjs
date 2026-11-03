'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
class Blob {
  constructor(data, mime = 'application/octet-stream', name = '') { this.data = Buffer.isBuffer(data) ? Buffer.from(data) : Array.isArray(data) ? Buffer.from(data.map(n => (n + 256) % 256)) : Buffer.from(String(data ?? '')); this.mime = mime; this.name = name; }
  getBytes() { return Array.from(this.data, n => n > 127 ? n - 256 : n); }
  getDataAsString(charset = 'UTF-8') { return this.data.toString(/iso|latin/i.test(charset) ? 'latin1' : 'utf8'); }
  getName() { return this.name; }
  setName(name) { this.name = name; return this; }
  setContentType(mime) { this.mime = mime; return this; }
  copyBlob() { return new Blob(this.data, this.mime, this.name); }
}
function crc32(bytes) { let crc = -1; for (const b of bytes) { crc ^= b; for (let n = 0; n < 8; n++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); } return (crc ^ -1) >>> 0; }
function zip(entries) {
  const local = [], central = []; let offset = 0;
  for (const [name, content] of Object.entries(entries)) {
    const filename = Buffer.from(name), bytes = Buffer.from(content), packed = zlib.deflateRawSync(bytes), crc = crc32(bytes);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(8, 8); h.writeUInt32LE(crc, 14); h.writeUInt32LE(packed.length, 18); h.writeUInt32LE(bytes.length, 22); h.writeUInt16LE(filename.length, 26);
    local.push(h, filename, packed);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(8, 10); c.writeUInt32LE(crc, 16); c.writeUInt32LE(packed.length, 20); c.writeUInt32LE(bytes.length, 24); c.writeUInt16LE(filename.length, 28); c.writeUInt32LE(offset, 42);
    central.push(c, filename); offset += h.length + filename.length + packed.length;
  }
  const directory = Buffer.concat(central), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(central.length / 2, 8); end.writeUInt16LE(central.length / 2, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}
function unzip(blob) {
  const b = blob.data, out = []; let pos = 0;
  while (pos + 30 <= b.length && b.readUInt32LE(pos) === 0x04034b50) {
    const method = b.readUInt16LE(pos + 8), size = b.readUInt32LE(pos + 18), nameSize = b.readUInt16LE(pos + 26), extra = b.readUInt16LE(pos + 28), start = pos + 30 + nameSize + extra;
    const name = b.subarray(pos + 30, pos + 30 + nameSize).toString(), data = b.subarray(start, start + size);
    out.push(new Blob(method === 8 ? zlib.inflateRawSync(data) : data, 'application/octet-stream', name)); pos = start + size;
  }
  return out;
}
function harness() {
  const files = new Map(), folders = new Map(), properties = new Map(); let nextId = 0, sequence = 0, triggers = [], locked = false;
  const id = () => `id${String(++nextId).padStart(14, '0')}`;
  const iterator = values => { let i = 0; return { hasNext: () => i < values.length, next: () => values[i++] }; };
  class File {
    constructor(name, blob, parent) { this.id = id(); this.name = name; this.blob = blob; this.parent = parent; this.trash = false; this.modified = new Date(Date.now() + ++sequence); files.set(this.id, this); }
    getId() { return this.id; } getName() { return this.name; } getMimeType() { return this.blob.mime; } getSize() { return this.blob.data.length; } getBlob() { return this.blob.copyBlob().setName(this.name); }
    getUrl() { return `https://drive.google.com/file/d/${this.id}/view`; } getLastUpdated() { return this.modified; } isTrashed() { return this.trash; } getParents() { return iterator(this.parent ? [this.parent] : []); }
    setContent(content) { this.blob.data = Buffer.from(content); this.modified = new Date(Date.now() + ++sequence); return this; }
    setTrashed(value) { this.trash = value; return this; }
    makeCopy(name, folder) { const copy = new File(name, this.blob.copyBlob(), folder); copy.native = this.native; return copy; }
  }
  class Folder {
    constructor(name, parent) { this.id = id(); this.name = name; this.parent = parent; folders.set(this.id, this); }
    getId() { return this.id; } getName() { return this.name; } getUrl() { return `https://drive.google.com/drive/folders/${this.id}`; }
    createFolder(name) { return new Folder(name, this); }
    createFile(name, content, mime) { return name instanceof Blob ? new File(name.name, name.copyBlob(), this) : new File(name, new Blob(content, mime, name), this); }
    getFiles() { return iterator([...files.values()].filter(f => f.parent === this && !f.trash)); }
    getFilesByName(name) { return iterator([...files.values()].filter(f => f.parent === this && f.name === name && !f.trash)); }
    getFolders() { return iterator([...folders.values()].filter(f => f.parent === this)); }
    getFoldersByName(name) { return iterator([...folders.values()].filter(f => f.parent === this && f.name === name)); }
  }
  const h = { files, folders, properties, calls: [], conversionCount: 0, model: () => { throw new Error('Unexpected model request'); } };
  const context = {
    console, Set, Date, JSON, Object, Array, Number, String, Boolean, Math, RegExp, Error,
    PropertiesService: { getUserProperties: () => ({ getProperty: k => properties.get(k) || null, setProperty: (k, v) => properties.set(k, v), deleteProperty: k => properties.delete(k) }) },
    LockService: { getUserLock: () => ({ tryLock: () => { if (locked) return false; locked = true; return true; }, releaseLock: () => { locked = false; } }) },
    DriveApp: { createFolder: name => new Folder(name), getFolderById: key => { if (!folders.has(key)) throw new Error('Missing folder'); return folders.get(key); }, getFileById: key => { if (!files.has(key)) throw new Error('Missing file'); return files.get(key); } },
    Drive: { Files: { update: (_meta, key, blob) => { files.get(key).setContent(blob.getDataAsString()); return {id:key}; }, create: (meta, blob) => { h.conversionCount++; const file = new File(meta.name, new Blob(blob.data, meta.mimeType), folders.get(meta.parents[0])); file.native = blob.getDataAsString(); return { id: file.id }; } } },
    DocumentApp: { openById: key => ({ getBody: () => ({ getText: () => files.get(key).native || '' }) }) },
    SpreadsheetApp: { openById: key => ({ getSheets: () => files.get(key).native.map(sheet => ({ getName: () => sheet.name, getLastRow: () => sheet.rows.length, getLastColumn: () => sheet.rows[0]?.length || 0, getRange: () => ({ getDisplayValues: () => sheet.rows }) })) }) },
    SlidesApp: { openById: key => ({ getSlides: () => files.get(key).native.map(slide => ({ getPageElements: () => [{ getPageElementType: () => 'SHAPE', asShape: () => ({ getText: () => ({ asString: () => slide.text }) }) }], getNotesPage: () => ({ getSpeakerNotesShape: () => ({ getText: () => ({ asString: () => slide.notes || '' }) }) }) })) }) },
    Utilities: { DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' }, computeDigest: (_, value) => Array.from(crypto.createHash('sha256').update(value).digest(), n => n > 127 ? n - 256 : n), getUuid: () => crypto.randomUUID(), newBlob: (data, mime, name) => new Blob(data, mime, name), base64Decode: value => Array.from(Buffer.from(value, 'base64')), sleep: () => {}, unzip, zip: (blobs, name) => new Blob(zip(Object.fromEntries(blobs.map(b => [b.name, b.data]))), 'application/zip', name) },
    UrlFetchApp: { fetch: (url, options) => { h.calls.push({ url, options }); const result = h.model(url, options); return { getResponseCode: () => result.status || 200, getContentText: () => typeof result.body === 'string' ? result.body : JSON.stringify(result.body) }; } },
    ScriptApp: { getProjectTriggers: () => triggers, deleteTrigger: t => { triggers = triggers.filter(x => x !== t); }, newTrigger: name => ({ timeBased() { return this; }, after() { return this; }, create() { const t = { getHandlerFunction: () => name }; triggers.push(t); return t; } }) }
  };
  vm.createContext(context);
  for (const name of ['Core.gs', 'Store.gs', 'Readers.gs', 'Compiler.gs', 'Search.gs']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../src', name), 'utf8'), context, { filename: name });
  h.ctx = context;
  h.api = (name, ...args) => { const reply = context[name](...args); if (!reply.ok) throw new Error(reply.error); return JSON.parse(JSON.stringify(reply.data)); };
  h.setup = () => { h.api('apiSetup', ''); return context.wbWorkspace_(); };
  h.add = (ws, name, data, mime) => ws.inbox.createFile(new Blob(data, mime || 'text/plain', name));
  h.native = (ws, name, kind, data) => { const f = h.add(ws, name, '', `application/vnd.google-apps.${kind}`); f.native = data; return f; };
  h.finish = () => { let job; for (let n = 0; n < 100; n++) { job = h.api('apiContinueBuild'); if (!job || job.status !== 'running') return job; } throw new Error('Build did not finish'); };
  return h;
}
module.exports = { harness, zip, Blob };
