import { describe, expect, it } from 'vitest';
import { benchmarkAtSizeAsync, formatBenchmark, generateSyntheticCorpus, runBenchmark } from './scalabilityBenchmark';

describe('scalability benchmark', () => {
  it('generates an exact, unique, seeded synthetic corpus from grounded passages', () => {
    const a = generateSyntheticCorpus(37, { seed: 42 }), b = generateSyntheticCorpus(37, { seed: 42 });
    expect(a).toHaveLength(37);
    expect(new Set(a.map((doc) => doc.id)).size).toBe(37);
    expect(a.map((doc) => doc.text)).toEqual(b.map((doc) => doc.text));
    expect(generateSyntheticCorpus(37, { seed: 9 }).map((doc) => doc.text)).not.toEqual(a.map((doc) => doc.text));
    expect(() => generateSyntheticCorpus(-1)).toThrow();
  });

  it('benchmarks each requested size and formats the timing report', async () => {
    const one = await benchmarkAtSizeAsync(10);
    expect(one.corpus_size).toBe(10);
    expect(one.bm25_index_seconds).toBeGreaterThanOrEqual(0);
    expect(one.bm25_query_seconds).toBeGreaterThanOrEqual(0);
    expect(one.vector_insert_seconds).toBeGreaterThanOrEqual(0);
    expect(one.vector_query_seconds).toBeGreaterThanOrEqual(0);
    const rows = await runBenchmark([5, 25]);
    expect(rows.map((row) => row.corpus_size)).toEqual([5, 25]);
    expect(formatBenchmark(rows)).toContain('bm25_index_ms');
  });
});
