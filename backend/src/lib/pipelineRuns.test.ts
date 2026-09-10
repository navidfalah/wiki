import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { tmpRoot, PIPELINE_RUNS_DIR, PIPELINE_RUNS_INDEX } = vi.hoisted(() => {
  const fs: typeof import('node:fs') = require('node:fs');
  const os: typeof import('node:os') = require('node:os');
  const path: typeof import('node:path') = require('node:path');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pipeline-runs-test-'));
  return {
    tmpRoot: root,
    PIPELINE_RUNS_DIR: path.join(root, 'pipeline_runs'),
    PIPELINE_RUNS_INDEX: path.join(root, 'pipeline_runs', 'index.json'),
  };
});

vi.mock('../paths', () => ({ PIPELINE_RUNS_DIR, PIPELINE_RUNS_INDEX }));

import { getPipelineRun, reconcileOrphanedPipelineRuns } from './pipelineRuns';

function writeRun(id: string, overrides: Record<string, unknown> = {}) {
  const detail = {
    id,
    started_at: '2026-09-06T18:03:28.632705+00:00',
    finished_at: null,
    status: 'running',
    force: false,
    error: null,
    steps: [
      { name: '1. Data Reading', status: 'success', started_at: 't', finished_at: 't', detail: null, error: null },
      { name: '2. Extraction', status: 'success', started_at: 't', finished_at: 't', detail: null, error: null },
      { name: '3. Synthesis', status: 'running', started_at: 't', finished_at: null, detail: null, error: null },
    ],
    token_usage: [],
    ...overrides,
  };
  fs.writeFileSync(path.join(PIPELINE_RUNS_DIR, `${id}.json`), JSON.stringify(detail, null, 2));
  return detail;
}

function writeIndex(entries: Array<Record<string, unknown>>) {
  fs.writeFileSync(PIPELINE_RUNS_INDEX, JSON.stringify(entries, null, 2));
}

beforeEach(() => {
  fs.rmSync(PIPELINE_RUNS_DIR, { recursive: true, force: true });
  fs.mkdirSync(PIPELINE_RUNS_DIR, { recursive: true });
});

afterEach(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('reconcileOrphanedPipelineRuns', () => {
  it('marks a run stuck in "running" as an error, including its in-flight step', () => {
    writeRun('20260906-180328-8bd532');
    writeIndex([{ id: '20260906-180328-8bd532', started_at: 't', finished_at: null, status: 'running', force: false }]);

    const reconciled = reconcileOrphanedPipelineRuns();

    expect(reconciled).toEqual(['20260906-180328-8bd532']);
    const run = getPipelineRun('20260906-180328-8bd532');
    expect(run?.status).toBe('error');
    expect(run?.finished_at).not.toBeNull();
    expect(run?.error).toMatch(/interrupted/i);
    const synthesis = run?.steps.find((s) => s.name === '3. Synthesis');
    expect(synthesis?.status).toBe('error');
    expect(synthesis?.finished_at).not.toBeNull();

    const index = JSON.parse(fs.readFileSync(PIPELINE_RUNS_INDEX, 'utf-8'));
    expect(index[0].status).toBe('error');
  });

  it('leaves completed runs untouched', () => {
    writeRun('20260906-190000-aaaaaa', { status: 'success', finished_at: 't', error: null });
    writeIndex([{ id: '20260906-190000-aaaaaa', started_at: 't', finished_at: 't', status: 'success', force: false }]);

    const reconciled = reconcileOrphanedPipelineRuns();

    expect(reconciled).toEqual([]);
    expect(getPipelineRun('20260906-190000-aaaaaa')?.status).toBe('success');
  });

  it('returns an empty list when there are no runs at all', () => {
    writeIndex([]);
    expect(reconcileOrphanedPipelineRuns()).toEqual([]);
  });
});
