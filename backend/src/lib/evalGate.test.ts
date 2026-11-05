import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
const gate = require('./evalGate');

let tempDir: string | undefined;
afterEach(() => { if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true }); tempDir = undefined; vi.restoreAllMocks(); });

describe('JavaScript offline evaluation gate', () => {
  const baseline = { tolerance: 0.02, tolerances: { loose: 0.1 }, metrics: { f1: 0.8, loose: 0.6 }, minimums: { pages: 10 } };

  it('compares scores with global and per-metric tolerances and count floors', () => {
    expect(gate.compare({ f1: 0.79, loose: 0.52, pages: 10 }, baseline)).toEqual([]);
    expect(gate.compare({ f1: 0.7, loose: 0.6, pages: 9 }, baseline)).toHaveLength(2);
    expect(gate.compare({ loose: 0.6, pages: 10 }, baseline)[0]).toContain('missing or NaN');
  });

  it('builds score metrics and half-count minimums separately', () => {
    expect(gate.buildBaseline({ 'x.f1': 0.91234, 'groundedness.pages': 225, 'x.gold_pairs': 3 })).toMatchObject({
      metrics: { 'x.f1': 0.9123 },
      minimums: { 'groundedness.pages': 112, 'x.gold_pairs': 1 },
    });
  });

  it('runs against the selected baseline and rewrites it only on explicit request', async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eval-gate-'));
    const baselinePath = path.join(tempDir, 'eval_baseline.json');
    fs.writeFileSync(baselinePath, JSON.stringify({ tolerance: 0.02, metrics: { 'a.score': 0.8 }, minimums: { 'a.pages': 2 } }));
    const output = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const collect = async () => ({ 'a.score': 0.79, 'a.pages': 5 });
    expect(await gate.main([], { baselinePath, collect })).toBe(0);
    expect(output.mock.calls.map(([line]) => String(line)).join('')).toContain('All offline evals at or above baseline.');
    expect(await gate.main(['--update-baseline'], { baselinePath, collect: async () => ({ 'a.score': 0.91234, 'a.pages': 6 }) })).toBe(0);
    expect(JSON.parse(fs.readFileSync(baselinePath, 'utf8')).metrics).toEqual({ 'a.score': 0.9123 });
  });
});
