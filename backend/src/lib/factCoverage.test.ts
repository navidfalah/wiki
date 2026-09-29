import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFactCoverageCache, getFactCoverage, inputsSignature, type FactCoverageReport } from './factCoverage';

const REPORT = { pages: 1, recall_cited: 0.5 } as FactCoverageReport;
const at = (iso: string) => () => new Date(iso);

let root: string;
beforeEach(() => {
  clearFactCoverageCache();
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'fact-coverage-'));
  fs.mkdirSync(path.join(root, 'docs'));
  fs.mkdirSync(path.join(root, 'raw', 'notes'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs', 'a.md'), 'page');
  fs.writeFileSync(path.join(root, 'raw', 'notes', 'a.txt'), 'source');
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

const sig = () => inputsSignature(path.join(root, 'docs'), path.join(root, 'raw'));

describe('inputsSignature', () => {
  it('is stable, and changes when a page or a source is added, rewritten or removed', () => {
    const first = sig();
    expect(sig()).toBe(first);
    fs.writeFileSync(path.join(root, 'docs', 'b.md'), 'another');
    const withPage = sig();
    expect(withPage).not.toBe(first);
    fs.writeFileSync(path.join(root, 'raw', 'notes', 'a.txt'), 'source, edited');
    const edited = sig();
    expect(edited).not.toBe(withPage);
    fs.rmSync(path.join(root, 'raw', 'notes', 'a.txt'));
    expect(sig()).not.toBe(edited);
  });

  it('ignores files that are neither pages nor sources, and missing directories', () => {
    const first = sig();
    fs.writeFileSync(path.join(root, 'docs', 'notes.json'), '{}');
    fs.writeFileSync(path.join(root, 'raw', '.DS_Store'), 'x');
    expect(sig()).toBe(first);
    expect(inputsSignature(path.join(root, 'nope'), path.join(root, 'nope2'))).toMatch(/^[0-9a-f]{40}$/);
  });
});

describe('getFactCoverage', () => {
  it('computes once per signature and serves the cache until the inputs change', async () => {
    const runner = vi.fn().mockResolvedValue(REPORT);
    const first = await getFactCoverage(runner, 's1', at('2026-09-29T10:00:00Z'));
    expect(first).toEqual({ report: REPORT, computed_at: '2026-09-29T10:00:00.000Z', cached: false });
    expect(await getFactCoverage(runner, 's1', at('2026-09-29T11:00:00Z'))).toEqual({ report: REPORT, computed_at: '2026-09-29T10:00:00.000Z', cached: true });
    expect(runner).toHaveBeenCalledTimes(1);
    await getFactCoverage(runner, 's2');
    expect(runner).toHaveBeenCalledTimes(2);
  });

  it('shares one computation between concurrent requests', async () => {
    let release!: (r: FactCoverageReport) => void;
    const runner = vi.fn(() => new Promise<FactCoverageReport>((resolve) => (release = resolve)));
    const a = getFactCoverage(runner, 's1');
    const b = getFactCoverage(runner, 's1');
    release(REPORT);
    expect((await a).report).toBe(REPORT);
    expect((await b).report).toBe(REPORT);
    expect(runner).toHaveBeenCalledTimes(1);
  });

  it('never caches a failure: the next request tries again', async () => {
    const runner = vi.fn().mockRejectedValueOnce(new Error('python died')).mockResolvedValueOnce(REPORT);
    await expect(getFactCoverage(runner, 's1')).rejects.toThrow('python died');
    expect((await getFactCoverage(runner, 's1')).report).toBe(REPORT);
    expect(runner).toHaveBeenCalledTimes(2);
  });

  it('a result for old inputs that finishes late does not overwrite the newer cache', async () => {
    let releaseOld!: (r: FactCoverageReport) => void;
    const old = getFactCoverage(() => new Promise((resolve) => (releaseOld = resolve)), 'old');
    const NEW = { pages: 9 } as FactCoverageReport;
    await getFactCoverage(async () => NEW, 'new');
    releaseOld(REPORT);
    await old;
    const again = await getFactCoverage(vi.fn(), 'new');
    expect(again).toMatchObject({ report: NEW, cached: true });
  });
});
