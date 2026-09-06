/**
 * Aggregates the per-run token_usage rows pipelineRuns.ts already exposes
 * (written by compiler/pipeline_tracker.py / llm_client.py) into the totals
 * the Usage page needs: cost and tokens broken down by pipeline step
 * ("process"), by model, and by calendar day -- plus a grand total. Reads
 * every run file, so it's a snapshot of history, not a live counter.
 */
import { estimateCost, lookupModelPricing } from './modelPricing';
import { getPipelineRun, listPipelineRuns } from './pipelineRuns';

export interface UsageBucket {
  key: string;
  calls: number;
  cache_hits: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  /** USD, summed only across rows whose model has a known price. */
  cost: number;
  /** True if at least one row in this bucket used a model with no price
   *  in modelPricing.ts, so `cost` understates this bucket's real spend. */
  has_unpriced: boolean;
}

export interface UsageSummary {
  by_process: UsageBucket[];
  by_model: UsageBucket[];
  by_day: UsageBucket[];
  totals: UsageBucket;
  unpriced_models: string[];
  runs_counted: number;
}

function emptyBucket(key: string): UsageBucket {
  return { key, calls: 0, cache_hits: 0, prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, cost: 0, has_unpriced: false };
}

function addRow(
  bucket: UsageBucket,
  row: { calls: number; cache_hits: number; prompt_tokens: number; completion_tokens: number; total_tokens: number },
  cost: number | null,
): void {
  bucket.calls += row.calls;
  bucket.cache_hits += row.cache_hits;
  bucket.prompt_tokens += row.prompt_tokens;
  bucket.completion_tokens += row.completion_tokens;
  bucket.total_tokens += row.total_tokens;
  if (cost === null) {
    bucket.has_unpriced = true;
  } else {
    bucket.cost += cost;
  }
}

function sortByCostThenTokens(buckets: Map<string, UsageBucket>): UsageBucket[] {
  return [...buckets.values()].sort((a, b) => b.cost - a.cost || b.total_tokens - a.total_tokens);
}

export function computeUsageSummary(): UsageSummary {
  const byProcess = new Map<string, UsageBucket>();
  const byModel = new Map<string, UsageBucket>();
  const byDay = new Map<string, UsageBucket>();
  const totals = emptyBucket('total');
  const unpricedModels = new Set<string>();
  let runsCounted = 0;

  for (const summary of listPipelineRuns()) {
    const run = getPipelineRun(summary.id);
    if (!run || !run.token_usage?.length) continue;
    runsCounted += 1;
    const day = (run.started_at || '').slice(0, 10) || 'unknown';

    for (const row of run.token_usage) {
      const cost = estimateCost(row.model, row.prompt_tokens, row.completion_tokens);
      if (cost === null && !lookupModelPricing(row.model)) unpricedModels.add(row.model);

      const processBucket = byProcess.get(row.step) ?? emptyBucket(row.step);
      addRow(processBucket, row, cost);
      byProcess.set(row.step, processBucket);

      const modelBucket = byModel.get(row.model) ?? emptyBucket(row.model);
      addRow(modelBucket, row, cost);
      byModel.set(row.model, modelBucket);

      const dayBucket = byDay.get(day) ?? emptyBucket(day);
      addRow(dayBucket, row, cost);
      byDay.set(day, dayBucket);

      addRow(totals, row, cost);
    }
  }

  return {
    by_process: sortByCostThenTokens(byProcess),
    by_model: sortByCostThenTokens(byModel),
    by_day: [...byDay.values()].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0)),
    totals,
    unpriced_models: [...unpricedModels].sort(),
    runs_counted: runsCounted,
  };
}
