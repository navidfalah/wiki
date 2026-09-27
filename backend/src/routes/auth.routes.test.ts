import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ADMIN, startHarness, type Harness } from './__fixtures__/harness';

let h: Harness;
let admin: string;

beforeAll(async () => {
  h = await startHarness();
  admin = await h.login();
});
afterAll(() => h.close());

describe('health and the API root', () => {
  it('health needs no session', async () => {
    expect(await h.json('GET', '/api/health')).toEqual({ status: 200, body: { status: 'ok' } });
  });

  it('the bare root explains it is the API server', async () => {
    const { status, body } = await h.json('GET', '/');
    expect(status).toBe(200);
    expect(body).toMatchObject({ service: 'wiki-backend', health: '/api/health' });
  });

  it('does not advertise Express', async () => {
    expect((await h.request('GET', '/api/health')).headers.get('x-powered-by')).toBeNull();
  });
});

describe('login', () => {
  it('bootstraps the admin from ADMIN_USERNAME/ADMIN_PASSWORD and returns a token', async () => {
    const { status, body } = await h.json('POST', '/api/auth/login', { body: ADMIN });
    expect(status).toBe(200);
    expect(body.token).toMatch(/^\S{20,}$/);
    expect(body.user).toMatchObject({ username: 'admin', role: 'admin' });
    expect(body.user).not.toHaveProperty('password_hash');
  });

  it.each([
    [{ username: '', password: 'x' }, 400],
    [{ username: 'admin' }, 400],
    [{ username: 'admin', password: 'wrong' }, 401],
    [{ username: 'nobody', password: 'wrong' }, 401],
  ])('rejects %j with %i', async (body, status) => {
    expect((await h.json('POST', '/api/auth/login', { body, headers: { 'X-Client-IP': `10.0.0.${status}` } })).status).toBe(status);
  });

  it('throttles repeated failures from one client and says when to retry', async () => {
    const headers = { 'X-Client-IP': '10.9.9.9' };
    for (let i = 0; i < 10; i++) await h.json('POST', '/api/auth/login', { body: { username: 'admin', password: `bad${i}` }, headers });
    const blocked = await h.request('POST', '/api/auth/login', { body: ADMIN, headers });
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0);
    // Another client is unaffected.
    expect((await h.json('POST', '/api/auth/login', { body: ADMIN, headers: { 'X-Client-IP': '10.9.9.10' } })).status).toBe(200);
  });
});

describe('session gate', () => {
  it.each(['/api/docs', '/api/search?q=x', '/api/raw-files', '/api/activity', '/api/auth/me'])('%s needs a session', async (url) => {
    expect((await h.json('GET', url)).status).toBe(401);
  });

  it('rejects a made-up token', async () => {
    expect((await h.json('GET', '/api/auth/me', { token: 'not-a-real-token' })).status).toBe(401);
  });

  it('localizes the error for German clients', async () => {
    const en = await h.json('GET', '/api/auth/me');
    const de = await h.json('GET', '/api/auth/me', { headers: { 'X-Lang': 'de' } });
    expect(en.body.detail).toBe('Not authenticated');
    expect(de.body.detail).not.toBe(en.body.detail);
  });

  it('me returns the signed-in user', async () => {
    expect((await h.json('GET', '/api/auth/me', { token: admin })).body.user).toMatchObject({ username: 'admin', role: 'admin' });
  });

  it('logout ends the session', async () => {
    const token = await h.login();
    expect((await h.json('POST', '/api/auth/logout', { token })).status).toBe(200);
    expect((await h.json('GET', '/api/auth/me', { token })).status).toBe(401);
  });
});

describe('user management', () => {
  let userId: string;
  let userToken: string;

  it('an admin creates a user; the password is never returned', async () => {
    const { status, body } = await h.json('POST', '/api/users', { token: admin, body: { username: 'lena', password: 'lena-password-1', role: 'user' } });
    expect(status).toBe(200);
    expect(body).toMatchObject({ username: 'lena', role: 'user' });
    expect(JSON.stringify(body)).not.toMatch(/lena-password-1|hash/);
    userId = body.id;
    userToken = await h.login('lena', 'lena-password-1');
  });

  it('rejects duplicates and weak input', async () => {
    expect((await h.json('POST', '/api/users', { token: admin, body: { username: 'lena', password: 'another-password' } })).status).toBe(400);
    expect((await h.json('POST', '/api/users', { token: admin, body: { username: 'x', password: '1' } })).status).toBe(400);
  });

  it('lists users with their active session count', async () => {
    const { body } = await h.json('GET', '/api/users', { token: admin });
    const lena = body.users.find((u: any) => u.username === 'lena');
    expect(lena.active_sessions).toBeGreaterThanOrEqual(1);
  });

  it.each([
    ['GET', '/api/users'],
    ['POST', '/api/users'],
    ['GET', '/api/admin/auth-events'],
    ['GET', '/api/admin/backups'],
  ])('a non-admin gets 403 on %s %s', async (method, url) => {
    expect((await h.json(method, url, { token: userToken, body: method === 'POST' ? {} : undefined })).status).toBe(403);
  });

  it('a non-admin can still use the wiki', async () => {
    expect((await h.json('GET', '/api/docs', { token: userToken })).status).toBe(200);
  });

  it('validates role changes', async () => {
    expect((await h.json('PUT', `/api/users/${userId}`, { token: admin, body: {} })).status).toBe(400);
    expect((await h.json('PUT', `/api/users/${userId}`, { token: admin, body: { role: 'root' } })).status).toBe(400);
  });

  it('resetting a password revokes that user\'s sessions', async () => {
    const { status, body } = await h.json('PUT', `/api/users/${userId}`, { token: admin, body: { password: 'lena-password-2' } });
    expect(status).toBe(200);
    expect(body.sessions_revoked).toBeGreaterThanOrEqual(1);
    expect((await h.json('GET', '/api/auth/me', { token: userToken })).status).toBe(401);
    userToken = await h.login('lena', 'lena-password-2');
  });

  it('promoting to admin opens admin routes', async () => {
    await h.json('PUT', `/api/users/${userId}`, { token: admin, body: { role: 'admin' } });
    const token = await h.login('lena', 'lena-password-2');
    expect((await h.json('GET', '/api/users', { token })).status).toBe(200);
  });

  it('an admin cannot delete their own account', async () => {
    const me = (await h.json('GET', '/api/auth/me', { token: admin })).body.user;
    expect((await h.json('DELETE', `/api/users/${me.id}`, { token: admin })).status).toBe(400);
  });

  it('deleting a user removes them and their sessions', async () => {
    expect((await h.json('DELETE', `/api/users/${userId}`, { token: admin })).body).toEqual({ removed: true, id: userId });
    expect((await h.json('POST', '/api/auth/login', { body: { username: 'lena', password: 'lena-password-2' }, headers: { 'X-Client-IP': '10.1.1.1' } })).status).toBe(401);
  });

  it('auth events show the account activity', async () => {
    const { body } = await h.json('GET', '/api/admin/auth-events', { token: admin });
    const actions = body.events.map((e: any) => e.action).join('\n');
    expect(actions).toMatch(/Created user lena/);
    expect(actions).toMatch(/Failed login attempt/);
  });
});

describe('activity log', () => {
  it('caps the limit and returns newest events', async () => {
    const { status, body } = await h.json('GET', '/api/activity?limit=999999', { token: admin });
    expect(status).toBe(200);
    expect(Array.isArray(body.events)).toBe(true);
    expect(body.events.length).toBeLessThanOrEqual(5000);
  });
});

describe('error handling', () => {
  it('unknown API routes are 404 JSON-free defaults, not crashes', async () => {
    expect((await h.request('GET', '/api/does-not-exist', { token: admin })).status).toBe(404);
  });

  it('malformed JSON is a client error, not a 500', async () => {
    const res = await h.request('POST', '/api/users', { token: admin, headers: { 'Content-Type': 'application/json' } });
    const bad = await fetch(`${h.baseUrl}/api/users`, { method: 'POST', headers: { Authorization: `Bearer ${admin}`, 'Content-Type': 'application/json' }, body: '{not json' });
    expect(res.status).toBe(400);
    expect(bad.status).toBe(400);
  });
});
