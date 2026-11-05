import { describe, expect, it } from 'vitest';
import { loadTrustEvalDataset } from './trustEvalDataset';
import { propagateDatasetTrust, propagateGroupTrust } from './trustPropagation';

describe('trust propagation', () => {
  it('keeps isolated claims at their static prior and responds to graph relations', () => {
    const claim = (id: string, source_path = 'notes/example.md') => ({ id, source_path, source_type: 'text', date: '2026-01-01', value: 'x', quote: 'x', gold_label: 'correct' });
    const isolated = { id: 'g', claims: [claim('a')], relations: [] };
    const baseline = propagateGroupTrust(isolated);
    expect(baseline.a.score).toBe(baseline.a.prior);
    const supported = propagateGroupTrust({ ...isolated, claims: [claim('a'), claim('b')], relations: [{ from_id: 'b', to_id: 'a', type: 'corroborates' }] });
    expect(supported.a.score).toBeGreaterThan(supported.a.prior);
    const contradiction = propagateGroupTrust({ ...isolated, claims: [claim('a'), claim('b')], relations: [{ from_id: 'a', to_id: 'b', type: 'contradicts' }] });
    expect(contradiction.a.score).toBeLessThan(contradiction.a.prior);
    expect(contradiction.a.score).toBe(contradiction.b.score);
    const superseded = propagateGroupTrust({ ...isolated, claims: [claim('new'), claim('old')], relations: [{ from_id: 'new', to_id: 'old', type: 'supersedes' }] });
    expect(superseded.old.score).toBeLessThan(superseded.old.prior);
    expect(superseded.new.score).toBeGreaterThan(superseded.old.score);
  });

  it('covers the labeled dataset without reading its labels into the algorithm', () => {
    const dataset = loadTrustEvalDataset(), baseline = propagateDatasetTrust(dataset);
    for (const group of dataset.claim_groups) for (const claim of group.claims) {
      expect(baseline[group.id][claim.id].score).toBeGreaterThanOrEqual(0);
      expect(baseline[group.id][claim.id].score).toBeLessThanOrEqual(1);
    }
    const mutated = structuredClone(dataset);
    for (const group of mutated.claim_groups) for (const claim of group.claims) claim.gold_label = 'incorrect';
    expect(propagateDatasetTrust(mutated)).toEqual(baseline);
  });
});
