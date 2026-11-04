import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createModelClient } from './modelClient';

const roots: string[] = [];
afterEach(() => { vi.unstubAllGlobals(); roots.splice(0).forEach((root) => fs.rmSync(root, { recursive: true, force: true })); });
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-model-js-')); roots.push(root);
  return createModelClient({ cacheFile: path.join(root, 'cache.json'), default: { apiKey: 'secret', base: 'https://example.test/v1', model: 'model' } });
}

describe('JavaScript model client', () => {
  it('uses a persistent cache and never stores the API key', async () => {
    const fetch = vi.fn(async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: 'Grounded page' } }], usage: { prompt_tokens: 8, completion_tokens: 3, total_tokens: 11 } }) }));
    vi.stubGlobal('fetch', fetch); const client = fixture(), request = { system: 'system', prompt: 'source' };
    expect(await client.generate(request)).toBe('Grounded page'); expect(await client.generate(request)).toBe('Grounded page');
    expect(fetch).toHaveBeenCalledTimes(1); expect(client.usage[1].cache_hits).toBe(1);
    expect(fs.readFileSync(path.join(roots[0], 'cache.json'), 'utf8')).not.toContain('secret');
  });
  it('sends an image through the existing vision-compatible API', async () => {
    const fetch = vi.fn(async (_url: string, _options: RequestInit) => ({ ok: true, json: async () => ({ choices: [{ message: { content: 'A sensor' } }] }) }));
    vi.stubGlobal('fetch', fetch); const client = fixture();
    expect(await client.describeImage({ bytes: Buffer.from('image'), mime: 'image/png' })).toBe('A sensor');
    const payload = JSON.parse(String(fetch.mock.calls[0][1].body));
    expect(payload.messages[1].content[1].image_url.url).toMatch(/^data:image\/png;base64,/);
  });
  it('honors profile sampling options and identifies the compiler step', async () => {
    const fetch = vi.fn(async (_url: string, _options: RequestInit) => ({ ok: true, json: async () => ({ choices: [{ message: { content: 'Result' } }] }) }));
    vi.stubGlobal('fetch', fetch);
    const client = createModelClient({ default: { apiKey: 'key', base: 'https://example.test/v1', model: 'model', sampling: { temperature: 0, top_p: 0.8, max_tokens: 200, reasoning_effort: 'low' } } });
    await client.generate({ system: 's', prompt: 'p', step: '2. Extraction' });
    expect(JSON.parse(String(fetch.mock.calls[0][1].body))).toMatchObject({ temperature: 0, top_p: 0.8, max_tokens: 200, reasoning_effort: 'low' });
    expect(client.usage[0].step).toBe('2. Extraction');
  });
  it('does not expose provider response bodies on authentication errors', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 401, text: async () => 'secret' })));
    await expect(fixture().generate({ system: 's', prompt: 'p' })).rejects.toThrow('HTTP 401');
  });
});
