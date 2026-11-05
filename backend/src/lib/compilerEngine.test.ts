import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { compile, markdownSafe } from './compilerEngine';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach((root) => fs.rmSync(root, { recursive: true, force: true })));
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-compiler-js-')); roots.push(root);
  const rawDir = path.join(root, 'raw'), docsDir = path.join(root, 'docs'), tempDir = path.join(root, 'temp');
  fs.mkdirSync(rawDir); fs.mkdirSync(docsDir); fs.mkdirSync(tempDir);
  const calls: string[] = [];
  const model = { generate: vi.fn(async ({ system, prompt }: { system: string; prompt: string }) => {
    if (system.includes('extractor')) { calls.push('extract'); return JSON.stringify({ topics: prompt.includes('mesh') ? ['Mesh', 'Battery'] : ['Battery'], entities: [{ name: 'Nova' }], concepts: [] }); }
    calls.push('synthesize'); const topic = prompt.match(/^Topic: (.+)/)?.[1]; return `# ${topic}\n\nRelated: Mesh and Battery.`;
  }), describeImage: vi.fn(async () => 'A sensor photograph.'), transcribeAudio: vi.fn(async () => 'The battery lasts two days.') };
  const options = { rawDir, docsDir, tempDir, stateFile: path.join(root, 'state.json'), indexFile: path.join(tempDir, 'index.json'), trustFile: path.join(root, 'trust.json'), overridesFile: path.join(root, 'overrides.json'),
    staticDir: path.join(root, 'media'), discoverRawSourceFiles: (dir: string) => fs.readdirSync(dir).map((name) => path.join(dir, name)), model, force: false, redactPii: true,
  };
  return { root, rawDir, docsDir, tempDir, calls, options };
}

describe('JavaScript compiler', () => {
  it('extracts, links and cites sources, then reuses unchanged data', async () => {
    const { rawDir, docsDir, calls, options } = fixture();
    fs.writeFileSync(path.join(rawDir, 'sensor.txt'), 'Nova battery and mesh.');
    const first = await compile(options); expect(first.pages).toBe(2);
    expect(fs.readFileSync(path.join(docsDir, 'battery.md'), 'utf8')).toContain('[Mesh](./mesh.md)');
    expect(fs.readFileSync(path.join(docsDir, 'battery.md'), 'utf8')).toContain('`sensor.txt`');
    expect(calls).toEqual(['extract', 'synthesize', 'synthesize']);
    calls.length = 0; const second = await compile(options);
    expect(second.changes.unchanged).toEqual(['sensor.txt']); expect(calls).toEqual([]);
  });
  it('rebuilds affected pages and removes only previously generated pages', async () => {
    const { rawDir, docsDir, calls, options } = fixture();
    fs.writeFileSync(path.join(rawDir, 'a.txt'), 'mesh'); fs.writeFileSync(path.join(rawDir, 'b.txt'), 'battery');
    await compile(options); calls.length = 0;
    fs.unlinkSync(path.join(rawDir, 'a.txt')); await compile(options);
    expect(fs.existsSync(path.join(docsDir, 'mesh.md'))).toBe(false);
    expect(fs.existsSync(path.join(docsDir, 'battery.md'))).toBe(true);
    expect(calls).toEqual(['synthesize']);
  });
  it('refuses to overwrite a manual page before modifying outputs', async () => {
    const { rawDir, docsDir, options } = fixture();
    fs.writeFileSync(path.join(rawDir, 'sensor.txt'), 'battery');
    fs.writeFileSync(path.join(docsDir, 'battery.md'), '# Manual page');
    await expect(compile(options)).rejects.toThrow('manually maintained');
    expect(fs.readFileSync(path.join(docsDir, 'battery.md'), 'utf8')).toBe('# Manual page');
    expect(fs.existsSync(options.stateFile)).toBe(false);
  });
  it('leaves the previous state untouched when model extraction fails', async () => {
    const { rawDir, options } = fixture(); fs.writeFileSync(path.join(rawDir, 'sensor.txt'), 'battery');
    await compile(options); const before = fs.readFileSync(options.stateFile, 'utf8');
    fs.writeFileSync(path.join(rawDir, 'sensor.txt'), 'changed battery');
    options.model.generate.mockRejectedValue(new Error('Model request failed (HTTP 500).'));
    await expect(compile(options)).rejects.toThrow('HTTP 500'); expect(fs.readFileSync(options.stateFile, 'utf8')).toBe(before);
  });
  it('retains cached topics when a source folder is excluded for a run', async () => {
    const { rawDir, docsDir, options } = fixture();
    fs.mkdirSync(path.join(rawDir, 'excluded')); fs.writeFileSync(path.join(rawDir, 'excluded', 'mesh.txt'), 'mesh');
    fs.mkdirSync(path.join(rawDir, 'included')); fs.writeFileSync(path.join(rawDir, 'included', 'battery.txt'), 'battery');
    options.discoverRawSourceFiles = (dir: string) => ['excluded/mesh.txt', 'included/battery.txt'].map((name) => path.join(dir, name));
    await compile(options);
    await compile({ ...options, excludeFolders: ['excluded'] });
    expect(fs.existsSync(path.join(docsDir, 'mesh.md'))).toBe(true);
    expect(JSON.parse(fs.readFileSync(options.stateFile, 'utf8')).files).toHaveProperty('excluded/mesh.txt');
  });
  it('redacts sensitive source data before both extraction and synthesis', async () => {
    const { rawDir, options } = fixture(); fs.writeFileSync(path.join(rawDir, 'a.txt'), 'battery 123-45-6789');
    await compile(options);
    for (const call of options.model.generate.mock.calls) expect(call[0].prompt).not.toContain('123-45-6789');
  });
  it('uses human corrections and the optional critic without a legacy compiler', async () => {
    const { root, rawDir, docsDir, options } = fixture(); fs.writeFileSync(path.join(rawDir, 'a.txt'), 'battery measured once');
    const correctionsFile = path.join(root, 'corrections.json');
    fs.writeFileSync(correctionsFile, JSON.stringify({ corrections: [{ quote_excerpt: 'old', verdict: 'confirm_incorrect', note: 'wrong measurement' }] }));
    options.model.generate.mockImplementation(async ({ system }: { system: string; prompt: string }) => {
      if (system.includes('extractor')) { expect(system).toContain('wrong measurement'); return JSON.stringify({ topics: ['Battery'], entities: [], concepts: [] }); }
      if (system.includes('fact-checking critic')) return JSON.stringify({ flagged: [{ sentence: 'Invented claim.', reason: 'not in source' }] });
      return '# Battery\n\nMeasured once. Invented claim.';
    });
    await compile({ ...options, criticPass: true, useCorrections: true, correctionsFile });
    const page = fs.readFileSync(path.join(docsDir, 'battery.md'), 'utf8');
    expect(page).toContain('Measured once.'); expect(page).not.toContain('Invented claim.');
  });
  it('preserves image captions, audio transcripts and copied attachments', async () => {
    const { rawDir, options } = fixture();
    fs.writeFileSync(path.join(rawDir, 'sensor.png'), 'fake image');
    fs.writeFileSync(path.join(rawDir, 'memo.wav'), 'fake audio');
    await compile(options);
    expect(options.model.describeImage).toHaveBeenCalledOnce();
    expect(options.model.transcribeAudio).toHaveBeenCalledOnce();
    expect(fs.readdirSync(options.staticDir).length).toBe(2);
    const state = JSON.parse(fs.readFileSync(options.stateFile, 'utf8'));
    expect(state.files['sensor.png'].chunks[0].text).toContain('A sensor photograph.');
    expect(state.files['memo.wav'].chunks[0].text).toContain('The battery lasts two days.');
  });
  it('keeps an audio download link when transcription is unavailable', async () => {
    const { rawDir, options } = fixture();
    options.model.transcribeAudio.mockRejectedValueOnce(new Error('transcription unavailable'));
    fs.writeFileSync(path.join(rawDir, 'memo.wav'), 'fake audio');
    await compile(options);
    const state = JSON.parse(fs.readFileSync(options.stateFile, 'utf8'));
    expect(state.files['memo.wav'].chunks[0].text).toContain('Transcription unavailable');
    expect(state.files['memo.wav'].chunks[0].text).toContain('[Listen to memo.wav]');
  });
  it('escapes MDX markup outside links and code', () => {
    expect(markdownSafe('<b>{x}</b> `a{b}` [x](./a.md)')).toBe('&lt;b&gt;&#123;x&#125;&lt;/b&gt; `a{b}` [x](./a.md)');
  });
});
