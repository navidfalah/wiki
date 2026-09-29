import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startHarness, type Harness } from './__fixtures__/harness';

let h: Harness;
let admin: string;

beforeAll(async () => {
  h = await startHarness();
  admin = await h.login();
});
afterAll(() => h.close());

async function createToken(session: string, body: Record<string, unknown>) {
  return h.json('POST', '/api/tokens', { token: session, body });
}

describe('personal API tokens', () => {
  it('creates a read token, shows it once, and lists it without the secret', async () => {
    const created = await createToken(admin, { name: 'mcp laptop' });
    expect(created.status).toBe(201);
    expect(created.body.token).toMatch(/^wsb_[A-Za-z0-9_-]{40,}$/);
    expect(created.body.record).toMatchObject({ name: 'mcp laptop', scope: 'read', expires_at: null, expired: false });
    expect(created.body.token.startsWith(created.body.record.prefix)).toBe(true);

    const listed = await h.json('GET', '/api/tokens', { token: admin });
    expect(listed.status).toBe(200);
    const row = listed.body.tokens.find((t: { id: string }) => t.id === created.body.record.id);
    expect(row).toBeDefined();
    expect(JSON.stringify(listed.body)).not.toContain(created.body.token);
    expect(row).not.toHaveProperty('token_hash');

    const stored = fs.readFileSync(path.join(h.root, 'data', 'api_tokens.json'), 'utf-8');
    expect(stored).not.toContain(created.body.token); // only the hash is on disk
  });

  it('a read token can read and reports how it authenticated', async () => {
    const { body } = await createToken(admin, { name: 'reader' });
    const me = await h.json('GET', '/api/auth/me', { token: body.token });
    expect(me.status).toBe(200);
    expect(me.body).toMatchObject({ user: { username: 'admin', role: 'admin' }, auth: { method: 'token', scope: 'read' } });
    expect((await h.json('GET', '/api/docs', { token: body.token })).status).toBe(200);
  });

  it('a read token cannot write', async () => {
    const { body } = await createToken(admin, { name: 'reader 2' });
    const res = await h.json('POST', '/api/chat/sessions', { token: body.token, body: {} });
    expect(res.status).toBe(403);
    expect(res.body.detail).toBe('This API token is read-only');
  });

  describe('a read token cannot reach GET routes that are not reads', () => {
    let reader: string;
    let writer: string;
    beforeAll(async () => {
      reader = (await createToken(admin, { name: 'restricted reader' })).body.token;
      writer = (await createToken(admin, { name: 'unrestricted writer', scope: 'write' })).body.token;
    });

    const denied = [
      '/api/admin/backups',
      '/api/admin/backups/anything.tar.gz',
      '/api/admin/sync',
      '/api/admin/auth-events',
      '/api/build/stream',
      '/api/chat/sessions/abc/stream?message=hi',
      // the same routes spelled the way Express still routes them
      '/API/admin/backups',
      '/api/Admin/backups',
      '/api/%61dmin/backups',
      '/api//admin/backups',
      '/api/admin/backups/',
      '/api/build/stream/',
      '/api/BUILD/stream',
    ];

    it.each(denied)('refuses %s with 403 and does nothing', async (route) => {
      const res = await h.json('GET', route, { token: reader });
      expect(res.status).toBe(403);
      expect(res.body.detail).toBe('This API token is read-only');
    });

    it('does not start a compile', async () => {
      await h.json('GET', '/api/build/stream', { token: reader });
      expect((await h.json('GET', '/api/build/status', { token: reader })).body.running).toBe(false);
    });

    it('still reads everything else', async () => {
      for (const route of ['/api/docs', '/api/search?q=battery', '/api/attention', '/api/contradictions', '/api/build/status']) {
        expect((await h.json('GET', route, { token: reader })).status, route).toBe(200);
      }
    });

    it('does not restrict a write token, which can do what its owner can', async () => {
      expect((await h.json('GET', '/api/admin/backups', { token: writer })).status).toBe(200);
    });

    it('does not restrict a login session', async () => {
      expect((await h.json('GET', '/api/admin/backups', { token: admin })).status).toBe(200);
    });
  });

  it('a write token can write', async () => {
    const { body } = await createToken(admin, { name: 'writer', scope: 'write' });
    const res = await h.json('POST', '/api/chat/sessions', { token: body.token, body: {} });
    expect(res.status).toBe(200);
    await h.json('DELETE', `/api/chat/sessions/${res.body.id}`, { token: admin });
  });

  it('tokens cannot manage tokens, even with write scope', async () => {
    const { body } = await createToken(admin, { name: 'writer 2', scope: 'write' });
    expect((await h.json('GET', '/api/tokens', { token: body.token })).status).toBe(403);
    const minted = await h.json('POST', '/api/tokens', { token: body.token, body: { name: 'escalate' } });
    expect(minted.status).toBe(403);
    expect(minted.body.detail).toBe('Sign in to manage API tokens');
  });

  it('revoking a token stops it working, and only its owner can revoke it', async () => {
    const { body } = await createToken(admin, { name: 'to revoke' });
    expect((await h.json('GET', '/api/auth/me', { token: body.token })).status).toBe(200);

    expect((await h.json('DELETE', '/api/tokens/not-a-token-id', { token: admin })).status).toBe(404);
    expect((await h.json('DELETE', `/api/tokens/${body.record.id}`, { token: admin })).status).toBe(200);
    expect((await h.json('GET', '/api/auth/me', { token: body.token })).status).toBe(401);
  });

  it('an unknown token is rejected', async () => {
    expect((await h.json('GET', '/api/auth/me', { token: 'wsb_not-a-real-token-0000000000000000000000' })).status).toBe(401);
  });

  it('an expired token is rejected and listed as expired', async () => {
    const { body } = await createToken(admin, { name: 'short-lived', expires_in_days: 1 });
    const file = path.join(h.root, 'data', 'api_tokens.json');
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    data.tokens.find((t: { id: string }) => t.id === body.record.id).expires_at = '2020-01-01T00:00:00.000Z';
    fs.writeFileSync(file, JSON.stringify(data));

    expect((await h.json('GET', '/api/auth/me', { token: body.token })).status).toBe(401);
    const listed = await h.json('GET', '/api/tokens', { token: admin });
    expect(listed.body.tokens.find((t: { id: string }) => t.id === body.record.id).expired).toBe(true);
  });

  it.each([
    [{}, 'A token needs a name'],
    [{ name: 'x', scope: 'admin' }, "Scope must be 'read' or 'write'"],
    [{ name: 'x', expires_in_days: 0 }, 'Expiry must be between 1 and 3650 days'],
    [{ name: 'x'.repeat(81) }, 'Token names are limited to 80 characters'],
  ])('rejects %j', async (body, detail) => {
    const res = await createToken(admin, body);
    expect(res.status).toBe(400);
    expect(res.body.detail).toBe(detail);
  });

  it("a token acts with its owner's current role and dies with the owner", async () => {
    await h.json('POST', '/api/users', { token: admin, body: { username: 'tok-user', password: 'tok-user-pw', role: 'admin' } });
    const session = await h.login('tok-user', 'tok-user-pw');
    const { body } = await createToken(session, { name: 'owned' });
    const users = (await h.json('GET', '/api/users', { token: admin })).body.users as { id: string; username: string }[];
    const id = users.find((u) => u.username === 'tok-user')!.id;

    expect((await h.json('GET', '/api/users', { token: body.token })).status).toBe(200); // admin today
    await h.json('PUT', `/api/users/${id}`, { token: admin, body: { role: 'user' } });
    expect((await h.json('GET', '/api/users', { token: body.token })).status).toBe(403); // demoted: no snapshot

    await h.json('DELETE', `/api/users/${id}`, { token: admin });
    expect((await h.json('GET', '/api/auth/me', { token: body.token })).status).toBe(401);
    const stored = JSON.parse(fs.readFileSync(path.join(h.root, 'data', 'api_tokens.json'), 'utf-8'));
    expect(stored.tokens.some((t: { name: string }) => t.name === 'owned')).toBe(false);
  });
});
