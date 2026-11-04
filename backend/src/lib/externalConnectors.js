'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { createCredentialStore } = require('./connectorCredentials');
const initSql = require('sql.js/dist/sql-asm.js');
const { Client } = require('pg');
const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');

const quote = (value) => `"${String(value).replace(/"/g, '""')}"`;
const safeName = (value) => { const name = String(value || '').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, ''); return !name || /^\.+$/.test(name) ? 'item' : name; };
const limitOf = (value) => Math.max(0, Math.min(100, Number.isFinite(Number(value)) ? Math.floor(Number(value)) : 20));
function renderTable(title, columns, rows) {
  const cell = (value) => value == null ? '' : String(value).replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ');
  return [`# ${title}`, '', `${rows.length} row(s) shown (of up to 200), ${columns.length} column(s): ${columns.join(', ')}`, '', `| ${columns.map(cell).join(' | ')} |`, `| ${columns.map(() => '---').join(' | ')} |`, ...rows.map((row) => `| ${row.map(cell).join(' | ')} |`)].join('\n');
}
function createExternalConnectors({ directory, rawDir, env = process.env, google, pgFactory = (options) => new Client(options), imapFactory = (options) => new ImapFlow(options) }) {
  function account(id, label) {
    const result = createCredentialStore(directory, env.CONNECTOR_SECRET_KEY).load(id, label);
    if (!result) { const error = new Error(`${id}/${label} is not connected`); error.errorType = 'not_connected'; throw error; }
    return result;
  }
  async function sqlite(creds, action, query, limit) {
    if (fs.existsSync(`${creds.extra.db_path}-wal`) && fs.statSync(`${creds.extra.db_path}-wal`).size) throw new Error('SQLite database has an active write-ahead log; close the other application or checkpoint the database before importing.');
    const SQL = await initSql(); const db = new SQL.Database(fs.readFileSync(creds.extra.db_path));
    try {
      const rows = (sql, params = []) => { const stmt = db.prepare(sql); try { stmt.bind(params); const values = []; while (stmt.step()) values.push(stmt.get()); return values; } finally { stmt.free(); } };
      if (action === 'list') {
        const tables = rows("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND (? = '' OR lower(name) LIKE ?) ORDER BY name LIMIT ?", [query, `%${query.toLowerCase()}%`, limit]);
        return tables.map(([table]) => { const columns = rows(`PRAGMA table_info(${quote(table)})`).map((row) => row[1]); const count = rows(`SELECT COUNT(*) FROM ${quote(table)}`)[0][0]; return { id: table, title: table, snippet: `${columns.length} columns · ${count} rows`, source_url: '', metadata: { columns, row_count: count } }; });
      }
      const columns = rows(`PRAGMA table_info(${quote(query)})`).map((row) => row[1]);
      if (!columns.length) throw new Error(`Table not found: ${query}`);
      return renderTable(query, columns, rows(`SELECT * FROM ${quote(query)} LIMIT 200`));
    } finally { db.close(); }
  }
  async function postgres(creds, action, query, limit) {
    const x = creds.extra, client = pgFactory({ host: x.host, port: x.port || 5432, database: x.dbname, user: x.user, password: creds.password, connectionTimeoutMillis: 10000 });
    await client.connect();
    try {
      await client.query('BEGIN READ ONLY');
      const schema = x.schema || 'public';
      const columnsFor = async (s, t) => (await client.query('SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 ORDER BY ordinal_position', [s, t])).rows.map((row) => row.column_name);
      if (action === 'list') {
        const tables = (await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_type = 'BASE TABLE' AND ($2 = '' OR table_name ILIKE $3) ORDER BY table_name LIMIT $4", [schema, query, `%${query}%`, limit])).rows;
        const items = [];
        for (const row of tables) { const table = row.table_name, columns = await columnsFor(schema, table), count = Number((await client.query(`SELECT COUNT(*) AS count FROM ${quote(schema)}.${quote(table)}`)).rows[0].count); items.push({ id: `${schema}.${table}`, title: table, snippet: `${columns.length} columns · ${count} rows`, source_url: '', metadata: { schema, columns, row_count: count } }); }
        return items;
      }
      const dot = query.indexOf('.'), tableSchema = dot < 0 ? schema : query.slice(0, dot), table = dot < 0 ? query : query.slice(dot + 1), columns = await columnsFor(tableSchema, table);
      if (!columns.length) throw new Error(`Table not found: ${tableSchema}.${table}`);
      const result = await client.query({ text: `SELECT * FROM ${quote(tableSchema)}.${quote(table)} LIMIT 200`, rowMode: 'array' });
      return renderTable(`${tableSchema}.${table}`, columns, result.rows);
    } finally { try { await client.query('ROLLBACK'); } finally { await client.end(); } }
  }
  async function imap(creds, action, query, limit) {
    const x = creds.extra, client = imapFactory({ host: x.host, port: x.port || 993, secure: true, auth: { user: creds.account_label, pass: creds.password }, logger: false });
    await client.connect(); let lock;
    try {
      lock = await client.getMailboxLock(x.mailbox || 'INBOX', { readOnly: true });
      if (action === 'list') {
        if (!limit) return [];
        const ids = await client.search(query ? { text: query } : { all: true }, { uid: false }); const items = [];
        for (const id of (ids || []).slice(-limit).reverse()) { const item = await client.fetchOne(String(id), { envelope: true }, { uid: false }); if (item) items.push({ id: String(id), title: item.envelope?.subject || '', snippet: (item.envelope?.from || []).map((v) => v.address || v.name || '').join(', '), source_url: '', metadata: { mailbox: x.mailbox || 'INBOX' } }); }
        return items;
      }
      if (!/^[1-9][0-9]*$/.test(query)) throw new Error('Invalid email identifier');
      const item = await client.fetchOne(query, { source: true }, { uid: false }); if (!item?.source) throw new Error('Email not found');
      return (await simpleParser(item.source)).text || '';
    } finally { lock?.release(); try { await client.logout(); } catch { client.close(); } }
  }
  async function execute(id, label, action, value, limit = 20) {
    if (id === 'gmail' || id === 'google_drive') return action === 'list' ? google.list(id, label, value, limit) : google.fetchItem(id, label, value);
    const creds = account(id, label);
    if (id === 'sqlite') return sqlite(creds, action, value, limit);
    if (id === 'postgres') return postgres(creds, action, value, limit);
    if (id === 'imap') return imap(creds, action, value, limit);
    throw new Error('Unknown connector');
  }
  async function list(id, label, query = '', limit = 20) { return execute(id, label, 'list', String(query || ''), limitOf(limit)); }
  async function importItem(id, label, itemId, itemTitle = '') {
    if (!itemId || typeof itemId !== 'string') throw new Error("'item_id' is required");
    const content = await execute(id, label, 'fetch', itemId);
    const rawReal = fs.realpathSync(rawDir);
    let dir = rawReal;
    for (const segment of ['connectors', safeName(id), safeName(label)]) {
      dir = path.join(dir, segment);
      try { fs.mkdirSync(dir); } catch (error) { if (error.code !== 'EEXIST') throw error; }
      const stat = fs.lstatSync(dir); if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('Invalid connector destination');
    }
    const destReal = fs.realpathSync(dir);
    if (!destReal.startsWith(rawReal + path.sep)) throw new Error('Invalid connector destination');
    const file = path.join(destReal, `${safeName(itemTitle || itemId)}__${safeName(itemId)}.txt`);
    if (fs.existsSync(file) && fs.lstatSync(file).isSymbolicLink()) throw new Error('Invalid connector destination');
    const names = { gmail: 'Gmail', google_drive: 'Google Drive', imap: 'Email (IMAP)', postgres: 'PostgreSQL Database', sqlite: 'SQLite Database' };
    const header = `[Imported via ${names[id] || id} connector]\nAccount: ${label}\nItem id: ${itemId}\nTitle: ${itemTitle || '(untitled)'}\nImported at: ${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}\n---\n\n`;
    fs.writeFileSync(file, header + content, 'utf8');
    return { imported: true, raw_path: path.relative(rawReal, file).split(path.sep).join('/') };
  }
  return { list, importItem };
}
module.exports = { createExternalConnectors, renderTable };
