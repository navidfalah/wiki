const { describe, expect, it } = require('vitest');
const path = require('node:path');
const rag = require(path.resolve(__dirname, '../../../compiler/ragArchitectures.js'));

function corpus() {
  return [
    { doc_path: 'meshsync.md', heading: 'Battery', text: 'Relay radios drain batteries 30% faster than spec once relay mode is enabled.' },
    { doc_path: 'meshsync.md', heading: 'Trademark', text: 'The Nova Widget mark was cleared in class 21 for kitchen gadgets.' },
  ];
}
function linkedCorpus() {
  return [
    { doc_path: 'meshsync.md', heading: 'Overview', text: 'MeshSync relays are the core hardware, see [Nova Widget](./nova-widget.md) for the companion device.' },
    { doc_path: 'nova-widget.md', heading: 'Battery', text: 'Relay radios drain batteries 30% faster than spec once relay mode is enabled.' },
    { doc_path: 'unrelated.md', heading: 'Notes', text: 'This page has nothing to do with either product and links to nothing.' },
  ];
}
function fakeLLM(responses = [], embedFn = () => [1, 0]) {
  const result = { available: true, responses: [...responses], systems: [], embedded: [], async generate({ system }) { result.systems.push(system); return result.responses.shift() || ''; }, async embedText(text) { result.embedded.push(text); return embedFn(text); } };
  return result;
}

describe('RAG architectures', () => {
  it('uses naive BM25 without invoking an LLM', async () => {
    const llm = fakeLLM();
    const result = await rag.retrieveNaive('why do batteries drain so fast', { corpus: corpus(), topK: 1, llm });
    expect(result[0].passage.heading).toBe('Battery');
    expect(llm.systems).toEqual([]);
  });

  it('HyDE falls back without a model and embeds its hypothetical passage when available', async () => {
    const docs = corpus();
    const naive = await rag.retrieveNaive('battery drain', { corpus: docs, topK: 1 });
    const fallback = await rag.retrieveHyde('battery drain', { corpus: docs, topK: 1 });
    expect(fallback.map((item) => item.passage.heading)).toEqual(naive.map((item) => item.passage.heading));
    const llm = fakeLLM(['Relay radios famously drain batteries fast.']);
    const result = await rag.retrieveHyde('battery drain', { corpus: docs, topK: 1, llm });
    expect(result[0].passage.heading).toBe('Battery');
    expect(llm.embedded.at(-1)).toBe('Relay radios famously drain batteries fast.');
    expect(llm.embedded).not.toContain('battery drain');
  });

  it('RAG-Fusion searches generated variants and falls back on malformed output', async () => {
    const docs = corpus();
    const llm = fakeLLM(['["relay battery drain", "kitchen gadgets trademark"]']);
    const result = await rag.retrieveFusion('battery drain', { corpus: docs, topK: 2, numVariants: 2, llm });
    expect(new Set(result.map((item) => item.passage.heading))).toEqual(new Set(['Battery', 'Trademark']));
    const naive = await rag.retrieveNaive('battery drain', { corpus: docs, topK: 1 });
    const malformed = await rag.retrieveFusion('battery drain', { corpus: docs, topK: 1, llm: fakeLLM(['not json']) });
    expect(malformed.map((item) => item.passage.heading)).toEqual(naive.map((item) => item.passage.heading));
  });

  it('GraphRAG expands linked passages but respects hop count and empty results', async () => {
    const docs = linkedCorpus();
    const expanded = await rag.retrieveGraph('meshsync', { corpus: docs, topK: 3, hops: 1 });
    const paths = new Set(expanded.map((item) => item.passage.doc_path));
    expect(paths.has('meshsync.md')).toBe(true);
    expect(paths.has('nova-widget.md')).toBe(true);
    expect(paths.has('unrelated.md')).toBe(false);
    const zeroHop = await rag.retrieveGraph('meshsync', { corpus: docs, topK: 3, hops: 0 });
    const naive = await rag.retrieveNaive('meshsync', { corpus: docs, topK: 3 });
    expect(zeroHop.map((item) => item.passage.doc_path)).toEqual(naive.map((item) => item.passage.doc_path));
    expect(await rag.retrieveGraph('zzz nonexistent qqq', { corpus: docs })).toEqual([]);
  });

  it('Corrective RAG keeps good first results, rewrites poor results, and degrades without a model', async () => {
    const docs = corpus();
    const good = fakeLLM(['CORRECT']);
    expect((await rag.retrieveCorrective('battery drain', { corpus: docs, topK: 1, llm: good }))[0].passage.heading).toBe('Battery');
    expect(good.systems).toEqual([rag.CORRECTIVE_GRADE_SYSTEM_PROMPT]);
    const retry = fakeLLM(['INCORRECT', 'battery drain relay']);
    expect(await rag.retrieveCorrective('battery drain', { corpus: docs, topK: 1, llm: retry })).toHaveLength(1);
    expect(retry.systems).toEqual([rag.CORRECTIVE_GRADE_SYSTEM_PROMPT, rag.CORRECTIVE_REWRITE_SYSTEM_PROMPT]);
    expect((await rag.retrieveCorrective('why do batteries drain so fast', { corpus: docs, topK: 1 }))[0].passage.heading).toBe('Battery');
    const broken = { available: true, async generate() { throw new Error('provider unavailable'); } };
    expect((await rag.retrieveCorrective('battery drain', { corpus: docs, topK: 1, llm: broken }))).toHaveLength(1);
  });

  it('dispatches known architectures and rejects unknown names', async () => {
    expect((await rag.retrieve('naive', 'battery drain', { corpus: corpus(), topK: 1 }))[0].passage.heading).toBe('Battery');
    await expect(rag.retrieve('hybrid', 'battery drain', { corpus: corpus() })).rejects.toThrow('Unknown RAG architecture');
  });
});
