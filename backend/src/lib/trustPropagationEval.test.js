const { describe, expect, it } = require('vitest');
const { loadTrustEvalDataset } = require('./trustEvalDataset');
const { DEFAULT_CONFIG, propagateDatasetTrust } = require('./trustPropagation');
const { GOOD_LABELS, BAD_LABELS, STATIC_BASELINE_CONFIG, NAMED_ABLATIONS, evaluateConfig, runAblation, sweepPriorWeight, simulateIsolatedClaim } = require('./trustPropagationEval');
const { evaluateDataset: evaluateTemporalDataset } = require('./temporalModelEval');

describe('trust propagation evaluation', () => {
  const dataset = loadTrustEvalDataset();

  it('static baseline leaves every propagated score at its prior', () => {
    const propagated = propagateDatasetTrust(dataset, STATIC_BASELINE_CONFIG);
    for (const group of Object.values(propagated)) for (const value of Object.values(group)) expect(value.score).toBe(value.prior);
  });

  it('default configuration improves pilot ranking metrics over the baseline', () => {
    const baseline = evaluateConfig(dataset, STATIC_BASELINE_CONFIG, 'baseline');
    const full = evaluateConfig(dataset, DEFAULT_CONFIG, 'full_default');
    expect(full.mean_precision_at_1).toBeGreaterThan(baseline.mean_precision_at_1);
    expect(full.pooled_pairwise_accuracy).toBeGreaterThan(baseline.pooled_pairwise_accuracy);
  });

  it('ablation and prior-weight sweeps cover their full configuration sets', () => {
    const reports = runAblation(dataset);
    expect(Object.keys(reports).sort()).toEqual(Object.keys(NAMED_ABLATIONS).sort());
    for (const report of Object.values(reports)) expect(report.pooled_pairwise_accuracy).toBeGreaterThanOrEqual(0);
    const values = sweepPriorWeight(dataset, [0, 0.2, 0.4, 0.6, 0.8, 1]).map(([, report]) => report.pooled_pairwise_accuracy);
    expect(values).toEqual([...values].sort((a, b) => b - a));
  });

  it('reports undefined metrics for a group without bad claims and simulates loss of evidence', () => {
    const report = evaluateConfig(dataset, DEFAULT_CONFIG, 'full_default');
    const disputeFree = report.group_results.find((item) => item.group_id === 'meshsync_relay_battery_drain_root_cause');
    expect(disputeFree.n_bad).toBe(0);
    expect(disputeFree.precision_at_1).toBeNull();
    expect(disputeFree.pairwise_accuracy).toBeNull();
    expect(report.informative_groups).not.toContain(disputeFree);
    const isolated = simulateIsolatedClaim(dataset, 'nova_read_interval', 'nri-1');
    expect(isolated.gold_label).toBe('superseded');
    expect(isolated.score_when_wrongly_isolated).toBeGreaterThan(isolated.score_when_correctly_grouped);
    expect(isolated.score_delta).toBeGreaterThan(0.1);
  });

  it('temporal evaluation covers each claim group and preserves known annotation behavior', () => {
    const reports = evaluateTemporalDataset(dataset);
    expect(new Set(reports.map((item) => item.group_id))).toEqual(new Set(dataset.claim_groups.map((item) => item.id)));
    const byId = Object.fromEntries(reports.map((item) => [item.group_id, item]));
    expect(byId.nova_read_interval.precision).toBe(1);
    expect(byId.teabuddy_herbal_preset_timing.precision).toBe(1);
    expect(byId.nova_battery_cell_type.current_ids).toContain('nbc-3');
    expect(byId.nova_battery_cell_type.precision).toBeLessThan(1);
  });

  it('uses the documented binary label mapping', () => {
    expect([...GOOD_LABELS].sort()).toEqual(['correct', 'scope_dependent']);
    expect([...BAD_LABELS].sort()).toEqual(['disputed', 'incorrect', 'superseded']);
  });
});
