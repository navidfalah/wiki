import { describe, expect, it } from 'vitest';
import { bm25Rank, cosineSimilarity, embeddingRank, embedDocuments, llmRerank, makeDoc, reciprocalRankFusion } from './hybridRetrieval';

const docs = [
  makeDoc('battery', 'Relay radios drain batteries 30% faster than spec once relay mode is enabled.'),
  makeDoc('trademark', 'The Nova Widget mark was cleared in class 21 for kitchen gadgets.'),
  makeDoc('empty', ''),
];
const fakeEmbed = (text: string) => [Number((text.toLowerCase().match(/batter/g) || []).length), Number((text.toLowerCase().match(/trademark/g) || []).length)];

describe('hybrid retrieval primitives', () => {
  it('ranks relevant documents with BM25 and handles empty or unmatched input', () => {
    expect(bm25Rank('why do batteries drain so fast', docs, { topK: 3 })[0].doc_id).toBe('battery');
    expect(bm25Rank('zzz nonexistent qqq', docs)).toEqual([]);
    expect(bm25Rank('', docs)).toEqual([]);
    expect(bm25Rank('battery', [])).toEqual([]);
    expect(bm25Rank('battery', docs).some((row) => row.doc_id === 'empty')).toBe(false);
  });

  it('computes cosine similarity and supports async or precomputed document embeddings', async () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBe(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
    expect(cosineSimilarity([], [1])).toBe(0);
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
    const embeddings = await embedDocuments(docs, fakeEmbed);
    expect((await embeddingRank('battery drain', docs, fakeEmbed, { topK: 3 }))[0].doc_id).toBe('battery');
    expect((await embeddingRank('battery drain', docs, fakeEmbed, { docEmbeddings: embeddings }))[0].doc_id).toBe('battery');
  });

  it('fuses rankings by reciprocal rank and handles missing documents', () => {
    const fused = reciprocalRankFusion([
      [{ doc_id: 'x', score: 10 }, { doc_id: 'y', score: 5 }, { doc_id: 'z', score: 1 }],
      [{ doc_id: 'y', score: 9 }, { doc_id: 'x', score: 4 }, { doc_id: 'z', score: 1 }],
    ], { topK: 3 });
    expect(['x', 'y']).toContain(fused[0].doc_id);
    expect(['x', 'y']).toContain(fused[1].doc_id);
    expect(fused[2].doc_id).toBe('z');
    expect(reciprocalRankFusion([[{ doc_id: 'x', score: 10 }], []]).map((row) => row.doc_id)).toEqual(['x']);
  });

  it('reranks candidates, honors topN, fills missing indices and safely falls back on malformed output', async () => {
    const candidates = [makeDoc('a', 'first'), makeDoc('b', 'second'), makeDoc('c', 'third')];
    const model = (response: string) => ({ generate: async () => response });
    expect((await llmRerank('query', candidates, model('[3,1,2]'))).map((row) => row.doc_id)).toEqual(['c', 'a', 'b']);
    expect((await llmRerank('query', candidates, model('[3,1,2]'), { topN: 2 })).map((row) => row.doc_id)).toEqual(['c', 'a']);
    expect((await llmRerank('query', candidates, model('[2,2]'))).map((row) => row.doc_id)).toEqual(['b', 'a', 'c']);
    expect((await llmRerank('query', candidates.slice(0, 2), model('not json'))).map((row) => row.doc_id)).toEqual(['a', 'b']);
    expect(await llmRerank('query', [], model('[]'))).toEqual([]);
  });
});
