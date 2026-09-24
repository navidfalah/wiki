/**
 * Read-only access to the pipeline run history written by
 * compiler/pipeline_tracker.py -- one JSON file per run under
 * data/pipeline_runs/, plus a newest-first index.json summary.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PIPELINE_RUNS_DIR, PIPELINE_RUNS_INDEX } from '../paths';
import { atomicWriteJson } from './atomicWrite';

// Matches PipelineRun.start()'s id format: YYYYMMDD-HHMMSS-<6 hex chars>.
const RUN_ID_RE = /^\d{8}-\d{6}-[0-9a-f]{6}$/;

/** Which LLM profile (model/base_url) was active for each purpose when this
 * run started -- see compiler/main.py's _pipeline_settings_snapshot(). Frozen
 * at start time, so it still reflects reality even if the Settings page is
 * changed while the run is in progress or afterward. */
export interface PipelineRunSettings {
  default?: { model: string; base_url: string; available: boolean };
  thinking?: { model: string; base_url: string; available: boolean };
  embedding?: { model: string };
}

export interface PipelineRunSummary {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: 'running' | 'success' | 'error' | 'stopped';
  force: boolean;
  settings?: PipelineRunSettings;
}

export interface PipelineRunStep {
  name: string;
  status: 'running' | 'success' | 'error' | 'stopped';
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

// finishedAt is passed in rather than computed here with its own
// `new Date()` call -- this index row is a cached summary of the detail
// file's own finished_at (set independently, a few lines away in
// markRunAbandoned), and two separate `new Date().toISOString()` calls a
// handful of statements apart can legitimately return different
// millisecond values, leaving the index and detail file disagreeing about
// exactly when the same run finished.
function patchIndexStatus(ids: string[], status: string, finishedAt: string): void {
  if (!ids.length) return;
  try {
    const entries = JSON.parse(fs.readFileSync(PIPELINE_RUNS_INDEX, 'utf-8'));
    if (Array.isArray(entries)) {
      const idSet = new Set(ids);
      const updated = entries.map((e) => (idSet.has(e?.id) ? { ...e, status, finished_at: finishedAt } : e));
      atomicWriteJson(PIPELINE_RUNS_INDEX, updated);
    }
  } catch {
    // Index is a cache of the per-run files; leave it be if unreadable.
  }
}

/**
 * Marks one run (and any of its steps still "running") as finished with
 * `reason` under `status`, but only if it's still recorded as "running" on
 * disk -- a no-op if PipelineRun.finish() already ran (the normal success/
 * error path), so this is safe to call speculatively any time a build's
 * subprocess exits without knowing whether Python's own cleanup ran.
 * `status` defaults to "error" (an actual crash/kill this process didn't
 * request) -- pass "stopped" for a deliberate user-requested stop, so it
 * reads as "you did this on purpose" rather than a red traceback-style
 * failure. Returns whether it actually changed anything.
 *
 * Not actually racing PipelineRun.finish() for the SAME run, despite both
 * being unlocked read-modify-write on the same file from separate
 * processes: compiler/pipeline_tracker.py's _save()/finish() are fully
 * synchronous and themselves write atomically (temp file + rename, same
 * pattern as atomicWriteJson below), so Python's last write for a run is
 * always complete before that process can exit -- and this is only ever
 * called from pythonBridge.ts's child.on('close', ...), which Node only
 * fires after the subprocess has actually exited. What both sides DO
 * share unprotected is index.json, which isn't scoped to one run's
 * lifecycle -- this function's patchIndexStatus() call and a concurrent
 * compile's own PipelineRun.start()/finish() (a genuinely different,
 * unrelated run) can race for real. atomicWriteJson at least turns that
 * into "whichever write lands last wins outright" instead of a
 * truncated/corrupt file if the loser's write is caught mid-write.
 */
export function markRunAbandoned(id: string, reason: string, status: 'error' | 'stopped' = 'error'): boolean {
  if (!RUN_ID_RE.test(id)) return false;
  const filePath = path.join(PIPELINE_RUNS_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) return false;
  try {
    const detail = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as PipelineRunDetail;
    if (detail.status !== 'running') return false;
    const finishedAt = new Date().toISOString();
    detail.status = status;
    detail.finished_at = finishedAt;
    detail.error = reason;
    for (const step of detail.steps) {
      if (step.status === 'running') {
        step.status = status;
        step.finished_at = finishedAt;
        step.error = reason;
      }
    }
    atomicWriteJson(filePath, detail);
    patchIndexStatus([id], status, finishedAt);
    return true;
  } catch {
    return false;
  }
}

/**
 * Marks every run still recorded as "running" as failed. Called once at
 * backend startup: this process's in-memory `buildRunning` flag (see
 * pythonBridge.ts) always starts false, so any run still marked "running"
 * on disk is necessarily orphaned -- its subprocess died with the previous
 * server process (crash, `docker compose down`, host reboot) before
 * PipelineRun ever got to call finish(). Without this, such a run sits in
 * "running" forever, which is what /api/pipelines/:id's `wasRunning` check
 * and the dashboard's "build in progress" banner both trust blindly.
 *
 * A build stopped or crashed *during* this same backend process's uptime
 * is instead caught immediately by pythonBridge.ts calling
 * markRunAbandoned() as soon as the subprocess exits -- this only ever
 * catches what a previous server process left behind.
 */
export function reconcileOrphanedPipelineRuns(): string[] {
  const orphaned = listPipelineRuns().filter((s) => s.status === 'running');
  const reconciled = orphaned
    .filter((summary) => markRunAbandoned(summary.id, 'Interrupted: the server process exited (crash or restart) while this run was in progress.'))
    .map((summary) => summary.id);
  return reconciled;
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
        atomicWriteJson(PIPELINE_RUNS_INDEX, filtered);
      }
    } catch {
      // Index is a cache of the per-run files; leave it be if unreadable.
    }
  }

  return { removed: true };
}
