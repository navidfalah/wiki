const { describe, expect, it } = require('vitest');
const { loadTrustEvalDataset } = require('./trustEvalDataset');
const { parseValidTime, validAsOf, buildGroupTimeline, asOf, currentClaims, buildDatasetTimelines } = require('./temporalModel');

function claim(id, date) { return { id, date, value: id, source_path: `notes/${id}.md`, source_type: 'text', quote: id, gold_label: 'correct' }; }
function group(claims, relations = []) { return { id: 'g', domain: 'test', subject: 'test', description: '', claims, relations }; }

describe('bi-temporal claim model', () => {
  it('parses valid leading ISO dates and rejects malformed dates', () => {
    expect(parseValidTime('2026-05-01')).toBe('2026-05-01');
    expect(parseValidTime('2026-05-01T12:00:00Z')).toBe('2026-05-01');
    for (const value of ['', 'undated', '2026-06-XX', '2026-02-30', '0000-01-01']) expect(parseValidTime(value)).toBeNull();
  });

  it('closes the earlier claim interval at the earliest superseding date', () => {
    const input = group([claim('old', '2026-01-01'), claim('mid', '2026-03-01'), claim('new', '2026-06-01')], [
      { from_id: 'mid', to_id: 'old', type: 'supersedes' },
      { from_id: 'new', to_id: 'old', type: 'supersedes' },
    ]);
    const timeline = buildGroupTimeline(input);
    expect(timeline.old.valid_until).toBe('2026-03-01');
    expect(timeline.old.is_current).toBe(false);
    expect(timeline.new.is_current).toBe(true);
    expect(validAsOf(timeline.old, '2026-03-01')).toBe(false);
    expect(asOf(input, timeline, '2026-02-01').map((item) => item.id)).toEqual(['old']);
  });

  it('keeps undated superseders from inventing a cutoff and leaves disconnected claims current', () => {
    const input = group([claim('old', '2026-01-01'), claim('undated', 'undated'), claim('other', '2026-02-01')], [
      { from_id: 'undated', to_id: 'old', type: 'supersedes' },
    ]);
    const timeline = buildGroupTimeline(input);
    expect(timeline.old.valid_until).toBeNull();
    expect(currentClaims(input, timeline).map((item) => item.id)).toEqual(['old', 'undated', 'other']);
    expect(asOf(input, timeline, '2026-01-01').map((item) => item.id)).toEqual(['old']);
    expect(asOf(input, timeline, 'not-a-date')).toEqual([]);
  });

  it('builds timelines for the real dataset and answers a past read-interval query', () => {
    const dataset = loadTrustEvalDataset();
    const timelines = buildDatasetTimelines(dataset);
    expect(Object.keys(timelines).sort()).toEqual(dataset.claim_groups.map((item) => item.id).sort());
    const input = dataset.claim_groups.find((item) => item.id === 'nova_read_interval');
    expect(asOf(input, timelines[input.id], '2026-05-10').map((item) => item.id)).toEqual(['nri-1']);
    expect(asOf(input, timelines[input.id], '2026-06-01').some((item) => item.value === '15 minutes')).toBe(true);
  });
});
