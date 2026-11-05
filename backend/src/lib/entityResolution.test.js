const { describe, expect, it } = require('vitest');
const path = require('node:path');
const { heuristicSimilarity, resolveEntities } = require(path.resolve(__dirname, '../../../compiler/entityResolution.js'));

const mention = (name, source) => ({ name, source, description: '' });

describe('entity resolution', () => {
  it('keeps exact normalized identity separate from partial-name guesses', () => {
    expect(heuristicSimilarity('Mira Chen', 'Mira Chen')).toBe(1);
    expect(heuristicSimilarity('Mira Chen', 'mira chen')).toBe(1);
    expect(heuristicSimilarity('Mira', 'Mira Chen')).toBeLessThan(0.85);
    expect(heuristicSimilarity('mira.chen@auroralabs.example', 'Mira Chen')).toBeLessThan(0.85);
    expect(heuristicSimilarity('Alex Kim', 'Alex Rivera')).toBeLessThan(0.85);
  });

  it('does not merge names with shared first or last names, or ambiguous bare names', async () => {
    const clusters = await resolveEntities([
      mention('Alex', 'chat/thread.txt'), mention('Alex Kim', 'a.md'),
      mention('Alex Rivera', 'b.md'), mention('Sam Rivera', 'c.md'),
    ]);
    expect(clusters).toHaveLength(4);
    expect(new Set(clusters.map((cluster) => cluster.canonical_name))).toEqual(new Set(['Alex', 'Alex Kim', 'Alex Rivera', 'Sam Rivera']));
  });

  it('handles exact-name merges, one mention, and empty input', async () => {
    const clusters = await resolveEntities([mention('Mira Chen', 'a.md'), mention('mira chen', 'b.md')]);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].mentions).toHaveLength(2);
    expect(clusters[0].sources).toEqual(new Set(['a.md', 'b.md']));
    expect((await resolveEntities([mention('Solo Person', 'x.md')]))).toHaveLength(1);
    expect(await resolveEntities([])).toEqual([]);
  });

  it('keeps punctuation-sensitive symbols and Unicode names distinct', async () => {
    const clusters = await resolveEntities(['C', 'C++', 'مینا', 'سارا'].map((name) => mention(name, 'notes.txt')));
    expect(clusters).toHaveLength(4);
  });

  it('uses embeddings only for ambiguous pairs when a caller supplies them', async () => {
    const names = [mention('Mira', 'a.md'), mention('Mirabelle', 'b.md')];
    const embedFn = async (text) => text === 'Mira' ? [1, 0, 0] : [0.9, 0.1, 0];
    expect(await resolveEntities(names)).toHaveLength(2);
    expect(await resolveEntities(names, { embedFn })).toHaveLength(1);
  });

  it('lets the optional adjudicator decide escalated pairs and ignores unavailable or malformed answers', async () => {
    const names = [mention('Mira', 'a.md'), mention('Mirabelle', 'b.md')];
    let calls = 0;
    const llm = { available: true, async generateResponse() { calls++; return '{"same_entity": true}'; } };
    expect(await resolveEntities(names, { llm })).toHaveLength(1);
    expect(calls).toBe(1);
    const unavailable = { available: false, async generateResponse() { throw new Error('must not be called'); } };
    expect(await resolveEntities(names, { llm: unavailable })).toHaveLength(2);
    const malformed = { available: true, async generateResponse() { return 'not json'; } };
    expect(await resolveEntities(names, { llm: malformed })).toHaveLength(2);
  });
});
