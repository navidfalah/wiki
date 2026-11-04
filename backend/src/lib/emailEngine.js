'use strict';

// JavaScript MIME handling. Paths and metadata helpers are injected so this
// module can run against isolated data roots without touching raw inputs.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { simpleParser } = require('mailparser');

class EmailEngineError extends Error {
  constructor(message, errorType) { super(message); this.errorType = errorType; }
}

function createEmailEngine(options) {
  const { rawDir, docsDir, stateFile, trustFile, collectSourceMetadata, synthesizedPagesForTopics, rawFileStatus, discoverRawSourceFiles } = options;
  function state() { try { return JSON.parse(fs.readFileSync(stateFile, 'utf8')); } catch { return { files: {} }; } }
  function inside(candidate, root) { const rel = path.relative(root, candidate); return rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel); }
  function resolveEmail(relPath) {
    const root = fs.realpathSync(rawDir);
    const candidate = path.resolve(root, String(relPath));
    if (!inside(candidate, root)) throw new EmailEngineError(`Invalid raw file path: ${relPath}`, 'not_an_email');
    let real;
    try { real = fs.realpathSync(candidate); } catch (error) {
      if (error.code === 'ENOENT') throw new EmailEngineError(`Raw file not found: ${relPath}`, 'not_found');
      throw error;
    }
    if (!inside(real, root)) throw new EmailEngineError(`Invalid raw file path: ${relPath}`, 'not_an_email');
    if (!fs.statSync(real).isFile()) throw new EmailEngineError(`Raw file not found: ${relPath}`, 'not_found');
    if (path.extname(real).toLowerCase() !== '.eml') throw new EmailEngineError(`Not an email source: ${relPath}`, 'not_an_email');
    return { file: real, relative: path.relative(root, real).split(path.sep).join('/') };
  }
  function normalizeLevel(value) { const level = String(value || '').trim().toLowerCase(); return ['unverified', 'low', 'medium', 'high', 'verified'].includes(level) ? level : 'medium'; }
  function trust(relative) {
    let config = {}; try { config = JSON.parse(fs.readFileSync(trustFile, 'utf8')); } catch { /* default */ }
    for (const rule of config.rules ?? []) {
      if (!rule.pattern || typeof rule.pattern !== 'string') continue;
      const re = new RegExp('^' + rule.pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
      if (re.test(relative)) return { level: normalizeLevel(rule.level), reason: rule.reason || `Matched rule pattern: ${rule.pattern}` };
    }
    return { level: normalizeLevel(config.default_by_source_type?.email), reason: "Default trust for source_type='email'" };
  }
  async function parse(file) {
    const parsed = await simpleParser(fs.readFileSync(file), { skipImageLinks: true });
    const addresses = (value) => value ? (Array.isArray(value) ? value : [value]).flatMap((item) => item.value ?? []).map((item) => item.name ? `${item.name} <${item.address || ''}>` : item.address || '').filter(Boolean) : [];
    return { subject: parsed.subject || '(no subject)', from: addresses(parsed.from).join(', '), to: addresses(parsed.to), cc: addresses(parsed.cc), date: (parsed.headerLines.find((line) => line.key === 'date')?.line || '').replace(/^date:\s*/i, '').trim(), body: (parsed.text || '').trim(), attachments: parsed.attachments.map((item) => item.filename || 'attachment') };
  }
  async function detail(relPath, currentState = state()) {
    const { file, relative } = resolveEmail(relPath);
    const parsed = await parse(file), entry = currentState.files?.[relative] || {};
    const metadata = collectSourceMetadata(entry);
    const md5 = crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex');
    return { path: relative, subject: parsed.subject, from: parsed.from, to: parsed.to, cc: parsed.cc, date: parsed.date,
      attachment_count: parsed.attachments.length, trust: trust(relative), status: rawFileStatus(relative, md5, currentState),
      processed_at: entry.processed_at ?? null, body: parsed.body, attachments: parsed.attachments,
      topics: metadata.topics, entities: metadata.entities, concepts: metadata.concepts,
      synthesized_pages: synthesizedPagesForTopics(metadata.topics, metadata.entities, metadata.concepts, docsDir) };
  }
  async function list(includeBody = false) {
    const currentState = state(), emails = [];
    for (const file of discoverRawSourceFiles(rawDir)) {
      if (path.extname(file).toLowerCase() !== '.eml') continue;
      const rel = path.relative(rawDir, file).split(path.sep).join('/');
      try {
        const resolved = resolveEmail(rel), parsed = await parse(resolved.file), entry = currentState.files?.[resolved.relative] || {};
        const metadata = collectSourceMetadata(entry);
        const md5 = crypto.createHash('md5').update(fs.readFileSync(resolved.file)).digest('hex');
        emails.push({ path: resolved.relative, subject: parsed.subject, from: parsed.from, to: parsed.to, cc: parsed.cc, date: parsed.date,
          attachment_count: parsed.attachments.length, trust: trust(resolved.relative), status: rawFileStatus(resolved.relative, md5, currentState),
          processed_at: entry.processed_at ?? null, topic_count: metadata.topics.length, body_preview: parsed.body.slice(0, 220),
          ...(includeBody ? { body: parsed.body } : {}) });
      } catch { /* match existing behavior: unreadable files do not block the list */ }
    }
    emails.sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0));
    return { total: emails.length, emails };
  }
  function buildEmail(input) {
    function header(value) {
      const text = String(value ?? '').trim();
      if (/[\r\n]/.test(text)) throw new EmailEngineError('Email header contains a newline', 'invalid');
      return text;
    }
    function encoded(value) {
      return /[^\x20-\x7e]/.test(value) ? `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=` : value;
    }
    function address(value) {
      const text = header(value), match = text.match(/^(.*?)\s*<([^<>]+)>$/);
      return match ? `${encoded(match[1])} <${match[2]}>` : text;
    }
    const subject = header(input.subject), from = address(input.from);
    if (!subject || !from) throw new EmailEngineError('Subject and sender are required', 'invalid');
    const to = Array.isArray(input.to) ? input.to.map(address) : [];
    const cc = Array.isArray(input.cc) ? input.cc.map(address) : [];
    const date = header(input.date) || new Date().toUTCString();
    const lines = [`Subject: ${encoded(subject)}`, `From: ${from}`, `To: ${to.join(', ') || '(unknown recipient)'}`];
    if (cc.length) lines.push(`Cc: ${cc.join(', ')}`);
    lines.push(`Date: ${date}`, 'MIME-Version: 1.0', 'Content-Type: text/plain; charset=utf-8', 'Content-Transfer-Encoding: base64', '');
    const payload = Buffer.from(String(input.body || ''), 'utf8').toString('base64').match(/.{1,76}/g) || [];
    return `${lines.join('\r\n')}\r\n${payload.join('\r\n')}\r\n`;
  }
  async function create(input) {
    const content = buildEmail(input);
    const root = fs.realpathSync(rawDir), directory = path.join(root, 'emails');
    fs.mkdirSync(directory, { recursive: true });
    if (!inside(fs.realpathSync(directory), root)) throw new EmailEngineError('Invalid emails directory', 'invalid');
    const day = new Date().toISOString().slice(0, 10), slug = String(input.subject).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'email';
    for (let n = 1; n <= 10000; n++) {
      const filename = `${day}-${slug}${n > 1 ? `-${n}` : ''}.eml`, target = path.join(directory, filename);
      try { fs.writeFileSync(target, content, { flag: 'wx' }); return await detail(`emails/${filename}`); }
      catch (error) { if (error.code !== 'EEXIST') throw error; }
    }
    throw new EmailEngineError('Unable to select an email filename', 'invalid');
  }
  async function update(relPath, input) {
    const content = buildEmail(input), { file, relative } = resolveEmail(relPath);
    const tmp = `${file}.${crypto.randomBytes(8).toString('hex')}.tmp`;
    try { fs.writeFileSync(tmp, content, { flag: 'wx' }); fs.renameSync(tmp, file); }
    finally { try { fs.unlinkSync(tmp); } catch { /* temporary file already removed or could not be cleaned up */ } }
    return detail(relative);
  }
  function remove(relPath) { const { file, relative } = resolveEmail(relPath); fs.unlinkSync(file); return { deleted: true, path: relative }; }
  return { list, detail, create, update, remove };
}
module.exports = { createEmailEngine, EmailEngineError };
