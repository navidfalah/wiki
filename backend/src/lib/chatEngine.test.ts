import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createChatEngine, fusion } from './chatEngine';

const roots: string[] = [];
afterEach(() => { vi.unstubAllGlobals(); roots.splice(0).forEach((root) => fs.rmSync(root, { recursive: true, force: true })); });
function fixture(mode = 'bm25') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-chat-js-')); roots.push(root);
  const rawDir = path.join(root, 'raw'), docsDir = path.join(root, 'docs'); fs.mkdirSync(rawDir); fs.mkdirSync(docsDir);
  fs.writeFileSync(path.join(rawDir, 'battery.txt'), 'Frequent transmissions drain the battery.');
  fs.writeFileSync(path.join(docsDir, 'sensor.md'), '# Sensor\n\n## Power\n\nThe battery powers the sensor.');
  const engine = createChatEngine({ rawDir, docsDir, embeddingCacheFile: path.join(root, 'vectors.json'),
    discoverRawSourceFiles: (dir: string) => fs.readdirSync(dir).map((name) => path.join(dir, name)),
    loadSettings: () => ({ retrieval_mode: mode, top_k: 5, bm25_k1: 1.5, bm25_b: 0.75, use_vector_store: true }),
    parseFrontmatter: () => ({}), stripFrontmatter: (text: string) => text,
    isChatAvailable: () => false, embeddingConfig: () => ({ apiKey: 'test', base: 'https://example.test/v1', model: 'embed' }),
  });
  return { root, engine };
}

describe('JavaScript chat retrieval', () => {
  it('returns source excerpts without any model calls by default', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    const { engine } = fixture(); const result = await engine.answer({ message: 'battery', corpusSource: 'raw' });
    expect(result.mode).toBe('extractive'); expect(result.answer).toContain('Frequent transmissions drain the battery.');
    expect(result.sources[0].doc_path).toBe('battery.txt'); expect(fetch).not.toHaveBeenCalled();
  });
  it('filters wiki passages by selected documents and reports no match', async () => {
    const { engine } = fixture();
    expect((await engine.answer({ message: 'battery', corpusSource: 'wiki', docScope: ['other.md'] })).mode).toBe('empty');
    expect((await engine.answer({ message: 'unicorn', corpusSource: 'wiki' })).mode).toBe('no_match');
  });
  it('uses optional embeddings, persists the vector cache, and falls back on API failure', async () => {
    const fetch = vi.fn(async (_url: string, options: RequestInit) => {
      const input = JSON.parse(String(options.body)).input as string[];
      return { ok: true, json: async () => ({ data: input.map((_, index) => ({ index, embedding: [1, 0] })) }) };
    });
    vi.stubGlobal('fetch', fetch); const { engine } = fixture('hybrid');
    expect((await engine.answer({ message: 'charge', corpusSource: 'raw' })).mode).toBe('extractive');
    expect(fetch).toHaveBeenCalledTimes(1);
    await engine.answer({ message: 'charge', corpusSource: 'raw' }); expect(fetch).toHaveBeenCalledTimes(1);
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('unavailable'); }));
    expect((await engine.answer({ message: 'battery', corpusSource: 'raw' })).mode).toBe('extractive');
  });
  it('combines ranking positions rather than unrelated raw scores', () => {
    const a = { id: 1, passage: { text: 'a' }, score: 200 }, b = { id: 2, passage: { text: 'b' }, score: 0.2 };
    expect(fusion([[a, b], [b]], 2)[0].id).toBe(2);
  });
});
