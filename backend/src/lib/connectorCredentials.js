'use strict';
// Fernet-compatible storage, shared with existing connector installations.
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

function safeId(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_.@-]+$/.test(value) || value.includes('__')) throw new Error('Unsafe connector or account identifier');
  return value;
}
function createCredentialStore(directory, secret) {
  if (!secret) throw new Error('CONNECTOR_SECRET_KEY is not set.');
  const key = Buffer.from(secret, 'base64url');
  if (key.length !== 32 || !/^[A-Za-z0-9_-]{43}=$/.test(secret)) throw new Error('CONNECTOR_SECRET_KEY must be a valid Fernet key.');
  const signing = key.subarray(0, 16), encryption = key.subarray(16);
  function filename(id, label) { return path.join(directory, `${safeId(id)}__${safeId(label)}.enc`); }
  function save(credentials) {
    const dest = filename(credentials.connector_id, credentials.account_label);
    const iv = crypto.randomBytes(16), timestamp = Buffer.alloc(8);
    timestamp.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 1000)));
    const cipher = crypto.createCipheriv('aes-128-cbc', encryption, iv);
    const payload = Buffer.concat([Buffer.from([0x80]), timestamp, iv, cipher.update(JSON.stringify(credentials), 'utf8'), cipher.final()]);
    const signature = crypto.createHmac('sha256', signing).update(payload).digest();
    const token = Buffer.concat([payload, signature]).toString('base64url');
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
    const temp = `${dest}.${crypto.randomBytes(8).toString('hex')}.tmp`;
    try { fs.writeFileSync(temp, token + '='.repeat((4 - token.length % 4) % 4), { mode: 0o600 }); fs.renameSync(temp, dest); }
    finally { try { fs.unlinkSync(temp); } catch { /* temporary file already removed or could not be cleaned up */ } }
  }
  function load(id, label) {
    const file = filename(id, label); let token;
    try { token = fs.readFileSync(file, 'utf8'); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
    try {
      const raw = Buffer.from(token, 'base64url');
      if (raw.length < 73 || raw[0] !== 0x80) throw new Error();
      const payload = raw.subarray(0, -32), signature = raw.subarray(-32);
      const expected = crypto.createHmac('sha256', signing).update(payload).digest();
      if (!crypto.timingSafeEqual(signature, expected)) throw new Error();
      const decipher = crypto.createDecipheriv('aes-128-cbc', encryption, raw.subarray(9, 25));
      const result = JSON.parse(Buffer.concat([decipher.update(raw.subarray(25, -32)), decipher.final()]).toString('utf8'));
      if (result.connector_id !== id || result.account_label !== label) throw new Error();
      return result;
    } catch { throw new Error('Could not decrypt connector credentials; check CONNECTOR_SECRET_KEY.'); }
  }
  function list(id) {
    const prefix = `${safeId(id)}__`; let entries;
    try { entries = fs.readdirSync(directory); } catch (error) { if (error.code === 'ENOENT') return []; throw error; }
    return entries.filter((item) => item.startsWith(prefix) && item.endsWith('.enc')).map((item) => item.slice(prefix.length, -4)).sort();
  }
  function remove(id, label) { try { fs.unlinkSync(filename(id, label)); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } }
  return { save, load, list, remove };
}
module.exports = { createCredentialStore };
