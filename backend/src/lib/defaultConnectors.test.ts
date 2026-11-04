import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';
import { ensureDefaultConnections } from './defaultConnectors';
import { createCredentialStore } from './connectorCredentials';

it('creates the same sample accounts once and preserves existing credentials', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-defaults-'));
  try {
    const env = { CONNECTOR_SECRET_KEY: Buffer.alloc(32, 9).toString('base64') };
    expect((await ensureDefaultConnections({ dataDir: root, env })).connected).toEqual(['sqlite/sample-sqlite', 'postgres/sample']);
    const store = createCredentialStore(path.join(root, 'connectors'), env.CONNECTOR_SECRET_KEY);
    const pg = store.load('postgres', 'sample'); pg.password = 'custom'; store.save(pg);
    const db = fs.readFileSync(path.join(root, 'sample.sqlite'));
    expect((await ensureDefaultConnections({ dataDir: root, env })).already_connected).toEqual(['sqlite/sample-sqlite', 'postgres/sample']);
    expect(store.load('postgres', 'sample').password).toBe('custom'); expect(fs.readFileSync(path.join(root, 'sample.sqlite'))).toEqual(db);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
