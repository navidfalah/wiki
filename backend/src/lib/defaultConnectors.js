'use strict';
const fs = require('node:fs');
const path = require('node:path');
const initSql = require('sql.js/dist/sql-asm.js');
const { createCredentialStore } = require('./connectorCredentials');
const { FIELD_DEVICES, SUPPORT_TICKETS } = require('./sampleConnectorData');

async function ensureDefaultConnections({ dataDir, env = process.env }) {
  const store = createCredentialStore(path.join(dataDir, 'connectors'), env.CONNECTOR_SECRET_KEY);
  const dbPath = path.join(dataDir, 'sample.sqlite'), SQL = await initSql();
  if (fs.existsSync(`${dbPath}-wal`) && fs.statSync(`${dbPath}-wal`).size) throw new Error('Sample SQLite database has an active write-ahead log.');
  const database = new SQL.Database(fs.existsSync(dbPath) ? fs.readFileSync(dbPath) : undefined);
  try {
    const existing = new Set((database.exec("SELECT name FROM sqlite_master WHERE type = 'table'")[0]?.values || []).map((row) => row[0]));
    database.run('CREATE TABLE IF NOT EXISTS field_devices (id INTEGER PRIMARY KEY, serial TEXT NOT NULL, model TEXT NOT NULL, site TEXT NOT NULL, status TEXT NOT NULL, last_seen TEXT NOT NULL)');
    database.run('CREATE TABLE IF NOT EXISTS support_tickets (id INTEGER PRIMARY KEY, device_serial TEXT NOT NULL, status TEXT NOT NULL, priority TEXT NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL, opened_at TEXT NOT NULL)');
    let changed = !existing.has('field_devices') || !existing.has('support_tickets');
    if (!database.exec('SELECT COUNT(*) FROM field_devices')[0].values[0][0]) {
      FIELD_DEVICES.forEach((row) => database.run('INSERT INTO field_devices VALUES (?, ?, ?, ?, ?, ?)', row));
      SUPPORT_TICKETS.forEach((row) => database.run('INSERT INTO support_tickets VALUES (?, ?, ?, ?, ?, ?, ?)', row));
      changed = true;
    }
    if (changed) { fs.mkdirSync(dataDir, { recursive: true }); fs.writeFileSync(dbPath, Buffer.from(database.export())); }
  } finally { database.close(); }
  const defaults = [
    { connector_id: 'sqlite', account_label: 'sample-sqlite', extra: { db_path: dbPath } },
    { connector_id: 'postgres', account_label: 'sample', password: 'aurora_sample_pw', extra: { host: 'postgres', port: 5432, dbname: 'aurora_kb', user: 'wiki_reader', schema: 'public' } },
  ];
  const connected = [], already_connected = [];
  for (const entry of defaults) {
    const name = `${entry.connector_id}/${entry.account_label}`;
    if (store.load(entry.connector_id, entry.account_label)) already_connected.push(name);
    else { store.save(entry); connected.push(name); }
  }
  return { connected, already_connected };
}
module.exports = { ensureDefaultConnections };
