// @vitest-environment node
/**
 * The frontend server end to end: the real app from createApp() on an
 * ephemeral port, in front of a stub backend that plays /api/auth/*,
 * /api/docs and /api/doc-history and records what it was sent.
 */
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const USER_TOKEN = 'user-token';
const ADMIN_TOKEN = 'admin-token';

const DOCS: Record<string, { title: string; body: string; tags: string[]; links: { text: string; href: string }[] }> = {
  'aurora-labs.md': { title: 'Aurora Labs', body: '# Aurora Labs\n\n<script>alert("x")</script> makes the Nova Widget.', tags: ['company'], links: [] },
  'nova-widget.md': { title: 'Nova Widget', body: 'A sensor.', tags: [], links: [] },
};

interface Seen {
  method: string;
  url: string;
  headers: http.IncomingHttpHeaders;
  body?: unknown;
}

let seen: Seen[] = [];
let failDocList = false;
let backend: http.Server;
let frontend: http.Server;
let base = '';

function startStubBackend(): Promise<string> {
  const api = express();
  api.use(express.json());
  api.use((req, _res, next) => {
    seen.push({ method: req.method, url: req.originalUrl, headers: req.headers, body: req.body });
    next();
  });
  const who = (req: express.Request) => {
    const auth = req.headers.authorization ?? '';
    if (auth === `Bearer ${USER_TOKEN}`) return { id: 'u1', username: 'ada', role: 'user' };
    if (auth === `Bearer ${ADMIN_TOKEN}`) return { id: 'u0', username: 'root', role: 'admin' };
    return null;
  };
  api.get('/api/auth/me', (req, res) => {
    const user = who(req);
    if (!user) return res.status(401).json({ detail: 'no' });
    res.json({ user });
  });
  api.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body ?? {};
    if (username === 'throttled') return res.status(429).set('Retry-After', '120').json({ detail: 'slow down' });
    if (username === 'ada' && password === 'pw') return res.json({ token: USER_TOKEN });
    res.status(401).json({ detail: 'bad' });
  });
  api.post('/api/auth/logout', (_req, res) => res.json({ ok: true }));
  api.get('/api/docs', (_req, res) => {
    if (failDocList) return res.status(503).send('upstream db at 10.0.0.7 is down');
    res.json({
      pages: [
        { path: 'nova-widget.md', title: 'Nova Widget', category: 'Products' },
        { path: 'aurora-labs.md', title: 'Aurora Labs', category: null },
      ],
    });
  });
  api.get('/api/docs/:name', (req, res) => {
    const doc = DOCS[req.params.name];
    if (!doc) return res.status(404).json({ detail: 'Page not found' });
    res.json(doc);
  });
  api.get('/api/doc-history/:name', (req, res) => {
    if (!DOCS[req.params.name]) return res.status(404).json({ detail: 'not found' });
    if (req.query.version) return res.json({ diff: [{ op: 'add', text: 'new line' }, { op: 'del', text: 'old line' }], current_exists: true });
    res.json({ versions: [{ id: 'v2', at: '2026-09-27T10:00:00Z', reason: 'edit', size_bytes: 10 }] });
  });
  api.get('/api/echo', (req, res) => res.json({ authorization: req.headers.authorization ?? null, client_ip: req.headers['x-client-ip'], lang: req.headers['x-lang'] }));
  api.get('/api/boom', (_req, res) => res.status(500).json({ detail: 'backend exploded' }));
  api.get('/api/stream', (_req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.write('data: one\n\n');
    setTimeout(() => res.end('data: two\n\n'), 20);
  });
  return new Promise((resolve) => {
    backend = api.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${(backend.address() as AddressInfo).port}`));
  });
}

beforeAll(async () => {
  const backendUrl = await startStubBackend();
  vi.stubEnv('BACKEND_API_URL', backendUrl);
  vi.stubEnv('PUBLIC_API_URL', '');
  vi.stubEnv('SHOW_DEFAULT_LOGIN_HINT', 'false');
  vi.resetModules();
  const { createApp } = await import('../../src/app');
  await new Promise<void>((resolve) => {
    frontend = createApp().listen(0, '127.0.0.1', () => resolve());
  });
  base = `http://127.0.0.1:${(frontend.address() as AddressInfo).port}`;
});

afterAll(async () => {
  vi.unstubAllEnvs();
  await new Promise((r) => frontend?.close(r));
  await new Promise((r) => backend?.close(r));
});

beforeEach(() => {
  seen = [];
});

function get(path: string, opts: { token?: string; lang?: string; headers?: Record<string, string> } = {}) {
  const cookies = [opts.token ? `session_token=${opts.token}` : '', opts.lang ? `lang=${opts.lang}` : ''].filter(Boolean).join('; ');
  return fetch(base + path, { redirect: 'manual', headers: { ...(cookies ? { Cookie: cookies } : {}), ...opts.headers } });
}

function postForm(path: string, form: Record<string, string>, token?: string) {
  return fetch(base + path, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...(token ? { Cookie: `session_token=${token}` } : {}) },
    body: new URLSearchParams(form).toString(),
  });
}

describe('public surface', () => {
  it('healthz answers without touching the backend', async () => {
    const res = await get('/healthz');
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('ok');
    expect(seen).toEqual([]);
  });

  it('sets the security headers and a per-request CSP nonce', async () => {
    const a = await get('/login');
    const b = await get('/login');
    for (const h of ['x-content-type-options', 'x-frame-options', 'referrer-policy', 'strict-transport-security']) expect(a.headers.get(h)).toBeTruthy();
    expect(a.headers.get('x-powered-by')).toBeNull();
    const nonce = (res: Response) => /'nonce-([^']+)'/.exec(res.headers.get('content-security-policy') ?? '')?.[1];
    expect(nonce(a)).toBeTruthy();
    expect(nonce(a)).not.toBe(nonce(b));
    const html = await a.text();
    // Every inline script carries the nonce the header allows.
    for (const tag of html.match(/<script(?![^>]*\bsrc=)[^>]*>/g) ?? []) {
      if (/type="application\/json"/.test(tag)) continue;
      expect(tag).toContain(`nonce="${nonce(a)}"`);
    }
  });

  it('landing pages, robots and sitemap are public', async () => {
    for (const path of ['/', '/en', '/robots.txt', '/sitemap.xml', '/favicon.svg']) {
      expect((await get(path)).status, path).toBe(200);
    }
  });

  it('unknown public paths still go through the login gate', async () => {
    const res = await get('/nope');
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/login?next=%2Fnope');
  });
});

describe('login gate', () => {
  it.each(['/dashboard', '/wiki', '/wiki/aurora-labs', '/chat', '/settings'])('%s redirects to login without a session', async (path) => {
    const res = await get(path);
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe(`/login?next=${encodeURIComponent(path)}`);
  });

  it('a session the backend does not recognise is treated as none', async () => {
    const res = await get('/dashboard', { token: 'forged' });
    expect(res.status).toBe(302);
    expect(seen.find((s) => s.url === '/api/auth/me')?.headers.authorization).toBe('Bearer forged');
  });

  it('login sets an HttpOnly cookie and follows a safe ?next', async () => {
    const res = await postForm('/login', { username: 'ada', password: 'pw', next: '/wiki' });
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/wiki');
    const cookie = res.headers.get('set-cookie') ?? '';
    expect(cookie).toMatch(/session_token=user-token/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(seen.find((s) => s.url === '/api/auth/login')?.body).toEqual({ username: 'ada', password: 'pw' });
  });

  it.each(['//evil.example/x', 'https://evil.example', 'javascript:alert(1)'])('refuses an off-site next (%s)', async (next) => {
    const res = await postForm('/login', { username: 'ada', password: 'pw', next });
    expect(res.headers.get('location')).toBe('/dashboard');
  });

  it('wrong password re-renders the form with 401 and no cookie', async () => {
    const res = await postForm('/login', { username: 'ada', password: 'nope' });
    expect(res.status).toBe(401);
    expect(res.headers.get('set-cookie')).toBeNull();
    expect(await res.text()).toContain('<form');
  });

  it('throttling is reported with the wait in minutes', async () => {
    const res = await postForm('/login', { username: 'throttled', password: 'x' });
    expect(res.status).toBe(429);
    expect(await res.text()).toMatch(/\b2 minutes\b/);
  });

  it('logout tells the backend and clears the cookie', async () => {
    const res = await postForm('/logout', {}, USER_TOKEN);
    expect(res.headers.get('location')).toBe('/login');
    expect(res.headers.get('set-cookie')).toMatch(/session_token=;/);
    expect(seen.find((s) => s.url === '/api/auth/logout')?.headers.authorization).toBe(`Bearer ${USER_TOKEN}`);
  });
});

describe('signed-in pages', () => {
  it.each([
    '/dashboard', '/search', '/chat', '/resources', '/graph', '/entities', '/pipelines', '/pipeline-architecture',
    '/rag-architecture', '/analytics', '/usage', '/review-queue', '/settings', '/company', '/logs',
  ])('%s renders', async (path) => {
    const res = await get(path, { token: USER_TOKEN });
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('id="sidebar-search"');
    expect(html).toContain('id="i18n-data"');
  });

  it('the dashboard greets the user and wires search + Ask', async () => {
    const html = await (await get('/dashboard', { token: USER_TOKEN })).text();
    expect(html).toContain('Welcome back, ada');
    expect(html).toMatch(/<form id="dashboard-ask" action="\/search"/);
    expect(html).toContain('formaction="/chat"');
    expect(html).toContain('id="compile"');
    expect(html).not.toContain('id="file-grid"');
  });

  it('the admin panel is admin-only, and only admins see it in the nav', async () => {
    const asUser = await get('/users', { token: USER_TOKEN });
    expect(asUser.status).toBe(403);
    expect(await (await get('/dashboard', { token: USER_TOKEN })).text()).not.toContain('href="/users"');
    expect((await get('/users', { token: ADMIN_TOKEN })).status).toBe(200);
    expect(await (await get('/dashboard', { token: ADMIN_TOKEN })).text()).toContain('href="/users"');
  });

  it('unknown signed-in paths are a 404', async () => {
    expect((await get('/definitely-not-a-page', { token: USER_TOKEN })).status).toBe(404);
  });
});

describe('wiki pages', () => {
  it('lists pages grouped by category', async () => {
    const html = await (await get('/wiki', { token: USER_TOKEN })).text();
    expect(html).toContain('Aurora Labs');
    expect(html).toContain('Products');
    expect(html).toContain('General Reference');
  });

  it('renders a page with its body escaped', async () => {
    const res = await get('/wiki/aurora-labs', { token: USER_TOKEN });
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('&lt;script&gt;alert');
    expect(html).not.toContain('<script>alert("x")</script>');
    expect(seen.find((s) => s.url === '/api/docs/aurora-labs.md')?.headers.authorization).toBe(`Bearer ${USER_TOKEN}`);
  });

  it('missing pages are a 404 in every view', async () => {
    for (const path of ['/wiki/missing', '/wiki/missing/edit', '/wiki/missing/download', '/wiki/missing/history']) {
      expect((await get(path, { token: USER_TOKEN })).status, path).toBe(404);
    }
  });

  it('download sends the body as a text attachment', async () => {
    const res = await get('/wiki/nova-widget/download', { token: USER_TOKEN });
    expect(res.headers.get('content-disposition')).toBe('attachment; filename="nova-widget.txt"');
    expect(await res.text()).toBe('A sensor.');
  });

  it('edit and history render', async () => {
    expect((await get('/wiki/aurora-labs/edit', { token: USER_TOKEN })).status).toBe(200);
    const res = await get('/wiki/aurora-labs/history', { token: USER_TOKEN });
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('new line');
    expect(seen.some((s) => s.url === '/api/doc-history/aurora-labs.md?version=v2')).toBe(true);
  });

  it('a backend failure is a generic 500 that leaks no internals', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    failDocList = true;
    try {
      const res = await get('/wiki', { token: USER_TOKEN });
      expect(res.status).toBe(500);
      const text = await res.text();
      expect(text).not.toContain('10.0.0.7');
      expect(text).not.toContain('127.0.0.1');
      expect(spy).toHaveBeenCalled(); // the details go to the server log instead
    } finally {
      failDocList = false;
      spy.mockRestore();
    }
  });
});

describe('/api proxy', () => {
  it('turns the session cookie into a bearer token and stamps IP and language', async () => {
    const res = await get('/api/echo', { token: USER_TOKEN, lang: 'de' });
    expect(await res.json()).toMatchObject({ authorization: `Bearer ${USER_TOKEN}`, lang: 'de' });
  });

  it('never forwards a client-supplied X-Client-IP', async () => {
    const res = await get('/api/echo', { headers: { 'X-Client-IP': '6.6.6.6' } });
    const body = await res.json();
    expect(body.authorization).toBeNull();
    expect(body.client_ip).not.toBe('6.6.6.6');
  });

  it('passes backend statuses and bodies through untouched', async () => {
    const res = await get('/api/boom');
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ detail: 'backend exploded' });
    expect(res.headers.get('content-security-policy')).toBeNull();
  });

  it('streams server-sent events', async () => {
    const res = await get('/api/stream');
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    expect(await res.text()).toBe('data: one\n\ndata: two\n\n');
  });
});

describe('language', () => {
  it('/lang/de sets the cookie and returns to a safe path only', async () => {
    const ok = await get('/lang/de?next=/wiki');
    expect(ok.headers.get('location')).toBe('/wiki');
    expect(ok.headers.get('set-cookie')).toMatch(/lang=de/);
    expect((await get('/lang/de?next=//evil.example')).headers.get('location')).toBe('/');
    expect((await get('/lang/xx?next=/wiki')).headers.get('set-cookie')).toBeNull();
  });

  it('the cookie switches the rendered language', async () => {
    const html = await (await get('/dashboard', { token: USER_TOKEN, lang: 'de' })).text();
    expect(html).toContain('<html lang="de">');
    expect(html).toContain('Willkommen zurück, ada');
  });
});

describe('script-context escaping', () => {
  it('a hostile connector id cannot break out of the inline script', async () => {
    const payload = '</script><img src=x onerror=alert(1)>';
    const html = await (await get(`/connectors/callback/${encodeURIComponent(payload)}`, { token: USER_TOKEN })).text();
    expect(html).not.toContain('</script><img');
    expect(html).toContain('\\u003c/script>');
  });
});
