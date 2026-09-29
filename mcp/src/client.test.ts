import { describe, expect, it } from 'vitest';
import { encodePath, WikiApiError, WikiClient } from './client';

describe('encodePath', () => {
  it('encodes each segment and keeps the slashes', () => {
    expect(encodePath('a b/c#d/é.md')).toBe('a%20b/c%23d/%C3%A9.md');
  });

  it('drops empty segments, so a leading slash cannot escape the /api/docs prefix', () => {
    expect(encodePath('/x//y.md')).toBe('x/y.md');
  });

  it.each(['..', '../users', 'a/../../users', './x', 'a/./b', '', '/', '//'])('refuses %j', (path) => {
    expect(() => encodePath(path)).toThrow(WikiApiError);
  });
});

describe('WikiClient', () => {
  it('joins the base URL without doubling slashes and adds the query', async () => {
    let seen: URL | undefined;
    const client = new WikiClient({
      baseUrl: 'https://wiki.example.test///',
      token: 't',
      fetchImpl: (async (url: URL) => {
        seen = url;
        return new Response('{"ok":true}');
      }) as unknown as typeof fetch,
    });
    expect(await client.get('/api/search', { q: 'a b', skipped: undefined })).toEqual({ ok: true });
    expect(String(seen)).toBe('https://wiki.example.test/api/search?q=a+b');
  });

  it('times out with a readable message', async () => {
    const client = new WikiClient({
      baseUrl: 'https://wiki.example.test',
      token: 't',
      timeoutMs: 20,
      fetchImpl: ((_url: unknown, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(init.signal!.reason));
        })) as typeof fetch,
    });
    await expect(client.get('/api/docs')).rejects.toThrow(/timed out after/);
  });

  it('keeps non-JSON error bodies short', async () => {
    const client = new WikiClient({
      baseUrl: 'https://wiki.example.test',
      token: 't',
      fetchImpl: (async () => new Response('x'.repeat(5000), { status: 502 })) as unknown as typeof fetch,
    });
    const err = await client.get('/api/docs').catch((e) => e);
    expect(err).toBeInstanceOf(WikiApiError);
    expect(err.status).toBe(502);
    expect(err.message.length).toBe(200);
  });
});
