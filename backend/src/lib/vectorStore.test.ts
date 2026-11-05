import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { VectorStore, cosineSimilarity, packEmbedding, unpackEmbedding, vectorNorm } from './vectorStore';

const roots: string[] = [];
async function openStore() { const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-vector-')); roots.push(root); return { root, store: await VectorStore.open(path.join(root, 'vectors.sqlite')) }; }
afterEach(() => { for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true }); });

describe('persistent vector store', () => {
  it('packs little-endian doubles and computes cosine similarity', () => {
    expect(unpackEmbedding(packEmbedding([1.25, -2, 0]))).toEqual([1.25, -2, 0]);
    expect(vectorNorm([3, 4])).toBe(5);
    expect(cosineSimilarity([1, 0], [1, 0])).toBe(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
    expect(cosineSimilarity([], [1])).toBe(0);
  });

  it('upserts, reads, ranks, deletes and survives reopening', async () => {
    const { root, store } = await openStore();
    store.upsertMany([{ id: 'a', text: 'first', embedding: [1, 0] }, { id: 'b', text: 'second', embedding: [0, 1] }]);
    store.upsert({ id: 'a', text: 'updated', embedding: [0.9, 0.1] });
    expect(store.count()).toBe(2);
    expect(store.get('a')).toEqual({ id: 'a', text: 'updated', embedding: [0.9, 0.1] });
    expect(store.get('missing')).toBeNull();
    expect(store.allRecords()).toHaveLength(2);
    expect(store.search([1, 0], { topK: 1 })[0][0]).toBe('a');
    store.close();
    const reopened = await VectorStore.open(path.join(root, 'vectors.sqlite'));
    expect(reopened.search([0, 1])[0][0]).toBe('b');
    reopened.delete('a');
    expect(reopened.count()).toBe(1);
    reopened.close();
  });

  it('rolls back an invalid batch instead of persisting partial inserts', async () => {
    const { store } = await openStore();
    expect(() => store.upsertMany([{ id: 'a', text: 'ok', embedding: [1] }, { id: 'b', text: 'bad', embedding: [NaN] }])).toThrow();
    expect(store.count()).toBe(0);
    store.close();
  });
});
