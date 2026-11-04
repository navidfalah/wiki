import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { createCredentialStore } from './connectorCredentials';
import { createExternalConnectors } from './externalConnectors';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach((root) => fs.rmSync(root, { recursive: true, force: true })));
it('lists and imports an actual SQLite table with quoted names, without altering the database', async () => {
  const initSql = require('sql.js/dist/sql-asm.js');
  const SQL = await initSql(), db = new SQL.Database();
  db.run('CREATE TABLE "odd""name" (name TEXT, value TEXT)');
  db.run('INSERT INTO "odd""name" VALUES (?, ?)', ['alpha', 'one|two']);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-sqlite-')); roots.push(root);
  const dbFile = path.join(root, 'database.sqlite'), rawDir = path.join(root, 'raw'), directory = path.join(root, 'connectors');
  fs.writeFileSync(dbFile, Buffer.from(db.export())); db.close(); fs.mkdirSync(rawDir);
  const before = fs.readFileSync(dbFile), key = Buffer.alloc(32, 4).toString('base64');
  createCredentialStore(directory, key).save({ connector_id: 'sqlite', account_label: 'account', extra: { db_path: dbFile } });
  const service = createExternalConnectors({ directory, rawDir, env: { CONNECTOR_SECRET_KEY: key }, google: {} });
  expect(await service.list('sqlite', 'account', 'odd')).toMatchObject([{ id: 'odd"name', metadata: { columns: ['name', 'value'], row_count: 1 } }]);
  const result = await service.importItem('sqlite', 'account', 'odd"name');
  expect(fs.readFileSync(path.join(rawDir, result.raw_path), 'utf8')).toContain('one\\|two');
  expect(fs.readFileSync(dbFile)).toEqual(before);
  await expect(service.importItem('sqlite', 'account', 'missing')).rejects.toThrow('Table not found');
});
it('uses IMAP read-only and releases the mailbox lock', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-imap-')); roots.push(root);
  const directory = path.join(root, 'connectors'), key = Buffer.alloc(32, 5).toString('base64');
  createCredentialStore(directory, key).save({ connector_id: 'imap', account_label: 'person', password: 'secret', extra: { host: 'mail.test', mailbox: 'INBOX' } });
  const release = vi.fn(), getMailboxLock = vi.fn(async () => ({ release })), logout = vi.fn(async () => {});
  const client = { connect: vi.fn(async () => {}), getMailboxLock, logout, search: vi.fn(async () => [1]), fetchOne: vi.fn(async () => ({ envelope: { subject: 'Test', from: [{ address: 'a@example.test' }] } })) };
  const service = createExternalConnectors({ directory, rawDir: root, env: { CONNECTOR_SECRET_KEY: key }, google: {}, imapFactory: () => client as any });
  expect(await service.list('imap', 'person')).toMatchObject([{ id: '1', title: 'Test' }]);
  expect(getMailboxLock).toHaveBeenCalledWith('INBOX', { readOnly: true }); expect(release).toHaveBeenCalled(); expect(logout).toHaveBeenCalled();
});
