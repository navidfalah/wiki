import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { createGoogleConnector } from './googleConnector';
import { createCredentialStore } from './connectorCredentials';
import { zipSync, strToU8 } from 'fflate';

const roots: string[] = [];
afterEach(() => { vi.unstubAllGlobals(); roots.splice(0).forEach((root) => fs.rmSync(root, { recursive: true, force: true })); });
it('completes PKCE securely and lists Drive files with the stored token', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-google-')); roots.push(root);
  const google = createGoogleConnector(root, { CONNECTOR_SECRET_KEY: Buffer.alloc(32, 3).toString('base64'), GDRIVE_CLIENT_ID: 'client', GDRIVE_CLIENT_SECRET: 'secret', GDRIVE_REDIRECT_URI: 'https://example.test/callback' });
  const fetch = vi.fn(async (url: string | URL) => String(url).startsWith('https://oauth2.')
    ? { ok: true, json: async () => ({ access_token: 'access', refresh_token: 'refresh', expires_in: 3600 }) }
    : { ok: true, json: async () => ({ files: [{ id: 'abc', name: 'Research', mimeType: 'text/plain' }] }) });
  vi.stubGlobal('fetch', fetch);
  const started = google.start('google_drive'), url = new URL(started.authorization_url);
  expect(url.searchParams.get('code_challenge_method')).toBe('S256');
  expect(url.searchParams.get('state')).toBe(started.state);
  expect(await google.complete('google_drive', 'code', started.state, 'person')).toMatchObject({ connected: true });
  await expect(google.complete('google_drive', 'code', started.state, 'person')).rejects.toThrow('state');
  expect(await google.list('google_drive', 'person', 'Research', 10)).toMatchObject([{ id: 'abc', title: 'Research' }]);
  expect(fs.readFileSync(path.join(root, 'google_drive__person.enc'), 'utf8')).not.toContain('refresh');
});
it('rejects expired OAuth state without sending a token request', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-google-')); roots.push(root);
  const google = createGoogleConnector(root, { GMAIL_CLIENT_ID: 'client', GMAIL_CLIENT_SECRET: 'secret', GMAIL_REDIRECT_URI: 'https://example.test/callback' });
  const started = google.start('gmail'), file = path.join(root, '_pending', `gmail__${started.state}.json`);
  const pending = JSON.parse(fs.readFileSync(file, 'utf8')); pending.created_at = Date.now() / 1000 - 601; fs.writeFileSync(file, JSON.stringify(pending));
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  await expect(google.complete('gmail', 'code', started.state, 'person')).rejects.toThrow('expired');
  expect(fetch).not.toHaveBeenCalled();
});
it('imports all sheets of a native Google spreadsheet via its Excel export', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-google-')); roots.push(root);
  const key = Buffer.alloc(32, 8).toString('base64');
  const google = createGoogleConnector(root, { CONNECTOR_SECRET_KEY: key, GDRIVE_CLIENT_ID: 'client', GDRIVE_CLIENT_SECRET: 'secret', GDRIVE_REDIRECT_URI: 'https://example.test/callback' });
  createCredentialStore(root, key).save({ connector_id: 'google_drive', account_label: 'person', access_token: 'token', extra: {} });
  const entries = { 'xl/workbook.xml': '<workbook xmlns:r="r"><sheets><sheet name="Sheet" r:id="r1"/></sheets></workbook>', 'xl/_rels/workbook.xml.rels': '<Relationships><Relationship Id="r1" Target="worksheets/sheet1.xml"/></Relationships>', 'xl/worksheets/sheet1.xml': '<worksheet><row><c r="A1"><v>220</v></c></row></worksheet>' };
  const bytes = zipSync(Object.fromEntries(Object.entries(entries).map(([name, text]) => [name, strToU8(text)])));
  vi.stubGlobal('fetch', vi.fn(async (url: string | URL) => String(url).includes('/export?')
    ? new Response(bytes)
    : new Response(JSON.stringify({ name: 'Budget', mimeType: 'application/vnd.google-apps.spreadsheet' }), { headers: { 'Content-Type': 'application/json' } })));
  expect(await google.fetchItem('google_drive', 'person', 'file-id')).toContain('220');
});
