import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { createCredentialStore } from './connectorCredentials';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach((root) => fs.rmSync(root, { recursive: true, force: true })));
function fixture() { const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-connectors-')); roots.push(root); return root; }
const key = 'MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA=';
it('reads an existing Python Fernet token and safely writes credentials', () => {
  const root = fixture(), store = createCredentialStore(root, key);
  fs.writeFileSync(path.join(root, 'imap__test.enc'), 'gAAAAABq6j_gyNT84CEHvMrcbH-rQRWGEegBYD5OI0G2gsv8PnBH8UgqFYEJP2gfrgk03ntXDKW5rsc8Hk6NIc-D9UNohiZDGnEMOfXqx9ogR9FxL02iPWpktQL_wWPfQBxmfyw0zffdr0ftyYunh3K7I4H_6TK31Q==');
  expect(store.load('imap', 'test').password).toBe('old');
  store.save({ connector_id: 'imap', account_label: 'other', password: 'private' });
  const token = fs.readFileSync(path.join(root, 'imap__other.enc'), 'utf8');
  const raw = Buffer.from(token, 'base64url'), bytes = Buffer.from(key, 'base64');
  expect(crypto.createHmac('sha256', bytes.subarray(0, 16)).update(raw.subarray(0, -32)).digest().equals(raw.subarray(-32))).toBe(true);
  expect(store.load('imap', 'other').password).toBe('private');
  expect(token).not.toContain('private');
  expect(store.list('imap')).toEqual(['other', 'test']);
  expect(store.remove('imap', 'other')).toBe(true);
});
it('rejects tampering, incorrect keys, and unsafe identifiers', () => {
  const root = fixture(), store = createCredentialStore(root, key);
  store.save({ connector_id: 'imap', account_label: 'test', password: 'secret' });
  expect(() => createCredentialStore(root, Buffer.alloc(32, 1).toString('base64')).load('imap', 'test')).toThrow('decrypt');
  expect(() => store.load('../imap', 'test')).toThrow('Unsafe');
  expect(() => store.save({ connector_id: 'imap', account_label: 'a__b' })).toThrow('Unsafe');
});
