import { describe, it, expect } from 'vitest';
import { entityGraphPayload } from './entityGraph';

describe('entity graph', () => {
  it('groups exact names across sources without merging ambiguous names', () => {
    const result = entityGraphPayload({ files: {
      'a.txt': { chunks: [{ entities: [{ name: 'Mira Chen' }, { name: 'Mira' }] }] },
      'b.txt': { chunks: [{ entities: [{ name: 'MIRA CHEN' }, { name: 'مینا' }, { name: 'سارا' }] }] },
    } });
    expect(result.counts).toEqual({ total_entities: 4, total_mentions: 5, multi_source_entities: 1, multi_alias_entities: 1 });
    expect(result.entities[0].sources).toEqual(['a.txt', 'b.txt']);
    expect(result.entities.find((entity) => entity.canonical_name === 'Mira')).toBeDefined();
  });
  it('returns empty data for absent or malformed chunks', () => {
    expect(entityGraphPayload({ files: { 'a.txt': { chunks: null } } }).counts.total_entities).toBe(0);
    expect(entityGraphPayload(null).entities).toEqual([]);
  });
});
