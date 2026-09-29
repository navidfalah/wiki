import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterEach, describe, expect, it } from 'vitest';
import { WikiClient } from './client';
import { createServer } from './index';
import { clip, MAX_TEXT_CHARS } from './tools';

type Handler = (url: URL, init: RequestInit) => { status?: number; body: unknown };

const calls: { url: URL; init: RequestInit }[] = [];

function stubFetch(routes: Record<string, Handler | unknown>): typeof fetch {
  return (async (input: URL | string, init: RequestInit = {}) => {
    const url = new URL(String(input));
    calls.push({ url, init });
    const route = routes[url.pathname];
    if (route === undefined) return new Response(JSON.stringify({ detail: `Doc not found: ${url.pathname}` }), { status: 404 });
    const result = typeof route === 'function' ? (route as Handler)(url, init) : { body: route };
    return new Response(JSON.stringify(result.body), { status: result.status ?? 200 });
  }) as typeof fetch;
}

let connected: Client | undefined;
async function connect(routes: Record<string, Handler | unknown>, token = 'wsb_test') {
  calls.length = 0;
  const wiki = new WikiClient({ baseUrl: 'https://wiki.example.test/', token, fetchImpl: stubFetch(routes) });
  const server = createServer(wiki);
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await server.connect(serverSide);
  const client = new Client({ name: 'test', version: '0' });
  await client.connect(clientSide);
  connected = client;
  return client;
}
afterEach(async () => {
  await connected?.close();
  connected = undefined;
});

async function call(client: Client, name: string, args: Record<string, unknown>) {
  const result = (await client.callTool({ name, arguments: args })) as { isError?: boolean; content: { type: string; text: string }[] };
  return { isError: result.isError ?? false, text: result.content.map((c) => c.text).join('\n') };
}

const HITS = [
  { type: 'wiki', title: 'Battery storage', path: 'battery-storage.md', snippet: 'The plant has a 100 kWh\n battery.', score: 9 },
  { type: 'email', title: 'Commissioning report', path: 'emails/report.eml', snippet: 'first charge completed', score: 7 },
  { type: 'resource', title: 'Budget', path: 'finance/budget.xlsx', snippet: 'Battery storage 100 kWh', score: 5 },
];

describe('the server', () => {
  it('lists five read-only tools with descriptions and schemas', async () => {
    const client = await connect({});
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(['get_page', 'get_source_text', 'list_pages', 'list_sources', 'search']);
    for (const tool of tools) {
      expect(tool.description?.length).toBeGreaterThan(40);
      expect(tool.annotations?.readOnlyHint).toBe(true);
      expect(tool.inputSchema.type).toBe('object');
    }
    expect(client.getInstructions()).toContain('Contradiction');
  });

  it('only ever sends GET requests with the bearer token', async () => {
    const client = await connect({ '/api/search': { total: 0, results: [] }, '/api/docs': { total: 0, pages: [] } }, 'wsb_secret');
    await call(client, 'search', { query: 'x' });
    await call(client, 'list_pages', {});
    expect(calls.length).toBe(2);
    for (const { init } of calls) {
      expect(init.method).toBe('GET');
      expect((init.headers as Record<string, string>).Authorization).toBe('Bearer wsb_secret');
    }
  });
});

describe('search', () => {
  it('formats ranked hits and points at the tool that reads each kind', async () => {
    const client = await connect({ '/api/search': { total: 3, results: HITS } });
    const { text, isError } = await call(client, 'search', { query: 'battery' });
    expect(isError).toBe(false);
    expect(calls[0].url.searchParams.get('q')).toBe('battery');
    expect(text).toContain('3 results for "battery"');
    expect(text).toContain('1. Battery storage [wiki page battery-storage.md]');
    expect(text).toContain('The plant has a 100 kWh battery.'); // whitespace collapsed
    expect(text).toContain('email emails/report.eml');
    expect(text).toContain('source finance/budget.xlsx');
    expect(text).toContain('get_page');
    expect(text).toContain('get_source_text');
  });

  it('filters by type and honours the limit', async () => {
    const client = await connect({ '/api/search': { total: 3, results: HITS } });
    const onlyEmail = await call(client, 'search', { query: 'battery', type: 'email' });
    expect(onlyEmail.text).toContain('1 result for');
    expect(onlyEmail.text).not.toContain('battery-storage.md');
    const limited = await call(client, 'search', { query: 'battery', limit: 1 });
    expect(limited.text).toContain('Showing 1 of 3 results.');
  });

  it('says so when nothing matches', async () => {
    const client = await connect({ '/api/search': { total: 0, results: [] } });
    expect((await call(client, 'search', { query: 'zzz' })).text).toBe('No results for "zzz".');
  });

  it('rejects an empty query before calling the wiki', async () => {
    const client = await connect({});
    const result = await client.callTool({ name: 'search', arguments: { query: '' } }).then(
      (r) => ({ isError: (r as { isError?: boolean }).isError ?? false }),
      () => ({ isError: true }),
    );
    expect(result.isError).toBe(true);
    expect(calls.length).toBe(0);
  });
});

describe('list_pages and list_sources', () => {
  const pages = {
    total: 3,
    pages: [
      { path: 'battery-storage.md', title: 'Battery storage', category: 'Budget', modified_at: '2026-09-29T10:00:00Z' },
      { path: 'plant-size.md', title: 'Plant size', category: 'Commissioning' },
      { path: 'hanna-vogt.md', title: 'Hanna Vogt', category: null },
    ],
  };

  it('lists and filters pages by title or category', async () => {
    const client = await connect({ '/api/docs': pages });
    const all = await call(client, 'list_pages', {});
    expect(all.text).toContain('3 pages');
    expect(all.text).toContain('- Battery storage — battery-storage.md (Budget), updated 2026-09-29');
    const filtered = await call(client, 'list_pages', { filter: 'commissioning' });
    expect(filtered.text).toContain('1 page:');
    expect(filtered.text).toContain('plant-size.md');
    expect((await call(client, 'list_pages', { filter: 'nope' })).text).toBe('No pages match "nope" (the wiki has 3 pages).');
  });

  it('lists and filters raw sources', async () => {
    const client = await connect({
      '/api/raw-files': {
        total: 2,
        files: [
          { path: 'project/survey.pdf', status: 'Processed', size_bytes: 2048 },
          { path: 'emails/a.eml', status: 'Unprocessed', size_bytes: 512 },
        ],
      },
    });
    const pdfs = await call(client, 'list_sources', { filter: '.PDF' });
    expect(pdfs.text).toContain('1 source:');
    expect(pdfs.text).toContain('- project/survey.pdf (processed, 2.0 KB)');
    expect(pdfs.text).not.toContain('emails/a.eml');
  });
});

describe('get_page', () => {
  it('returns the page with its title, path and tags, encoding the path', async () => {
    const client = await connect({
      '/api/docs/folder/%C3%A4%20page.md': { path: 'folder/ä page.md', title: 'Ä page', tags: ['a', 'b'], body: '## Overview\n\nText.', links: [] },
    });
    const { text, isError } = await call(client, 'get_page', { path: 'folder/ä page.md' });
    expect(isError).toBe(false);
    expect(text).toBe('# Ä page\npath: folder/ä page.md\ntags: a, b\n\n## Overview\n\nText.');
    expect(calls[0].url.pathname).toBe('/api/docs/folder/%C3%A4%20page.md');
  });

  it('cuts very long pages with a note', async () => {
    const client = await connect({ '/api/docs/big.md': { path: 'big.md', title: 'Big', tags: [], body: 'x'.repeat(MAX_TEXT_CHARS + 500), links: [] } });
    const { text } = await call(client, 'get_page', { path: 'big.md' });
    expect(text).toContain(`[… cut after ${MAX_TEXT_CHARS} of ${MAX_TEXT_CHARS + 500} characters]`);
    expect(text.length).toBeLessThan(MAX_TEXT_CHARS + 300);
  });

  it('turns a 404 into advice, marked as an error', async () => {
    const client = await connect({});
    const { text, isError } = await call(client, 'get_page', { path: 'missing.md' });
    expect(isError).toBe(true);
    expect(text).toContain('No wiki page "missing.md"');
    expect(text).toContain('list_pages');
  });
});

describe('get_source_text', () => {
  it('returns the extracted text', async () => {
    const client = await connect({ '/api/source-text/project/survey.pdf': { path: 'project/survey.pdf', text: 'Load reserve 0.12 kN/m2.', chars: 24, truncated: false } });
    const { text } = await call(client, 'get_source_text', { path: 'project/survey.pdf' });
    expect(text).toBe('source: project/survey.pdf\n\nLoad reserve 0.12 kN/m2.');
  });

  it('notes when the wiki itself truncated the source', async () => {
    const client = await connect({ '/api/source-text/big.txt': { path: 'big.txt', text: 'abc', chars: 999, truncated: true } });
    expect((await call(client, 'get_source_text', { path: 'big.txt' })).text).toContain('cut this source after 3 of 999 characters');
  });

  it('explains sources without text, and missing ones', async () => {
    const client = await connect({ '/api/source-text/media/plan.png': { path: 'media/plan.png', text: '', chars: 0, truncated: false } });
    expect((await call(client, 'get_source_text', { path: 'media/plan.png' })).text).toContain('no extractable text');
    const missing = await call(client, 'get_source_text', { path: 'nope.txt' });
    expect(missing.isError).toBe(true);
    expect(missing.text).toContain('list_sources');
  });
});

describe('path traversal', () => {
  it.each([
    ['get_page', '../users'],
    ['get_page', '..%2Fusers'.replace('%2F', '/')],
    ['get_source_text', '../../package.json'],
    ['get_source_text', 'notes/../../../etc/passwd'],
  ])('%s refuses %j without sending any request', async (tool, path) => {
    const client = await connect({ '/api/users': { users: [] }, '/package.json': {} });
    const { isError, text } = await call(client, tool, { path });
    expect(isError).toBe(true);
    expect(text).toContain('Invalid path');
    expect(calls.length).toBe(0);
  });
});

describe('errors', () => {
  it('explains a rejected token', async () => {
    const client = await connect({ '/api/search': () => ({ status: 401, body: { detail: 'Not authenticated' } }) });
    const { text, isError } = await call(client, 'search', { query: 'x' });
    expect(isError).toBe(true);
    expect(text).toContain('rejected the API token');
    expect(text).toContain('Settings -> API tokens');
  });

  it('reports an unreachable wiki without leaking the token', async () => {
    const wiki = new WikiClient({
      baseUrl: 'https://wiki.example.test',
      token: 'wsb_supersecret',
      fetchImpl: (async () => {
        throw Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNREFUSED' } });
      }) as typeof fetch,
    });
    await expect(wiki.get('/api/docs')).rejects.toThrow('Could not reach the wiki at https://wiki.example.test: ECONNREFUSED');
    await expect(wiki.get('/api/docs')).rejects.not.toThrow(/supersecret/);
  });

  it('passes through the backend\'s message for other failures', async () => {
    const client = await connect({ '/api/docs': () => ({ status: 500, body: { detail: 'Internal server error' } }) });
    const { text, isError } = await call(client, 'list_pages', {});
    expect(isError).toBe(true);
    expect(text).toBe('Internal server error');
  });
});

describe('clip', () => {
  it('leaves short text alone', () => {
    expect(clip('short', 10)).toBe('short');
  });
});
