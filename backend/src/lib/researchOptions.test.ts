import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { correctionsBlock, critic, webSearch } from './researchOptions';

afterEach(() => vi.unstubAllGlobals());
it('removes only verbatim sentences supported by a majority of critic samples', async () => {
  const outputs = [JSON.stringify({ flagged: [{ sentence: 'Wrong.', reason: 'No source' }] }), JSON.stringify({ flagged: [{ sentence: 'Wrong.', reason: 'No source' }, { sentence: 'A paraphrase.' }] }), JSON.stringify({ flagged: [] })];
  const model = { generate: vi.fn(async (_options: any) => outputs.shift()) };
  const result = await critic({ model, sources: 'Evidence', draft: 'Correct. Wrong.', samples: 3 });
  expect(result.body).toBe('Correct.'); expect(result.flagged).toMatchObject([{ sentence: 'Wrong.', removed: true }]);
  expect(model.generate).toHaveBeenCalledTimes(3);
  expect(model.generate.mock.calls[0][0]).toMatchObject({ sampling: { temperature: 0.3 }, skipCache: true });
});
it('leaves a draft unchanged if the critic returns invalid JSON', async () => {
  const result = await critic({ model: { generate: async () => 'bad' }, sources: 'Evidence', draft: 'A draft.' });
  expect(result.body).toBe('A draft.'); expect(result.parseError).toBe(true);
});
it('loads human corrections and retrieves search results through the selected provider', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-corrections-'));
  try {
    const file = path.join(root, 'corrections.json'); fs.writeFileSync(file, JSON.stringify({ corrections: [{ quote_excerpt: 'old claim', verdict: 'confirm_incorrect', note: 'wrong date' }] }));
    expect(correctionsBlock(file)).toContain('wrong date');
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ AbstractText: 'Example', AbstractURL: 'https://example.test', Heading: 'Example' }) })));
    expect(await webSearch('Example')).toMatchObject([{ title: 'Example', url: 'https://example.test' }]);
    await expect(webSearch('Example', { provider: 'bing' })).rejects.toThrow('API key');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
