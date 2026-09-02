/**
 * Read-only access to the pipeline run history written by
 * compiler/pipeline_tracker.py -- one JSON file per run under
 * data/pipeline_runs/, plus a newest-first index.json summary.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PIPELINE_RUNS_DIR, PIPELINE_RUNS_INDEX } from '../paths';

// Matches PipelineRun.start()'s id format: YYYYMMDD-HHMMSS-<6 hex chars>.
const RUN_ID_RE = /^\d{8}-\d{6}-[0-9a-f]{6}$/;

export interface PipelineRunSummary {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: 'running' | 'success' | 'error';
  force: boolean;
}

export interface PipelineRunStep {
  name: string;
  status: 'running' | 'success' | 'error';
  started_at: string;
  finished_at: string | null;
  detail: string | null;
  error: string | null;
  /** The step's actual input/output (file lists, topic names, etc.) -- see
   * compiler/pipeline_tracker.py's finish_step(). Shape varies per step. */
  data?: Record<string, unknown> | null;
}

export interface PipelineRunDetail extends PipelineRunSummary {
  error: string | null;
  steps: PipelineRunStep[];
  token_usage: Array<{
    step: string;
    model: string;
    calls: number;
    cache_hits: number;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  }>;
}

export function listPipelineRuns(): PipelineRunSummary[] {
  if (!fs.existsSync(PIPELINE_RUNS_INDEX)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(PIPELINE_RUNS_INDEX, 'utf-8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getPipelineRun(id: string): PipelineRunDetail | null {
  if (!RUN_ID_RE.test(id)) return null;
  const filePath = path.join(PIPELINE_RUNS_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

/** Deletes a run's history entry: its JSON file plus its row in index.json.
 * If the run is still actually in progress, the caller (see the
 * /api/pipelines/:id route) stops the build first -- a run's "running"
 * status can otherwise be stale leftover state from a process that
 * crashed without calling finish(). */
export function deletePipelineRun(id: string): { removed: boolean; reason?: 'not_found' } {
  if (!RUN_ID_RE.test(id)) return { removed: false, reason: 'not_found' };
  const filePath = path.join(PIPELINE_RUNS_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) return { removed: false, reason: 'not_found' };

  fs.unlinkSync(filePath);

  if (fs.existsSync(PIPELINE_RUNS_INDEX)) {
    try {
      const entries = JSON.parse(fs.readFileSync(PIPELINE_RUNS_INDEX, 'utf-8'));
      if (Array.isArray(entries)) {
        const filtered = entries.filter((e) => e?.id !== id);
        fs.writeFileSync(PIPELINE_RUNS_INDEX, JSON.stringify(filtered, null, 2));
      }
    } catch {
      // Index is a cache of the per-run files; leave it be if unreadable.
    }
  }

  return { removed: true };
}
