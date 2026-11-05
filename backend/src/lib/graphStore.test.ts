import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { GraphStore, claimNodeId, exportClaimGroup, importClaimGroup } from './graphStore';
import { loadTrustEvalDataset } from './trustEvalDataset';
import { propagateGroupTrust, propagateGroupTrustFromStore } from './trustPropagation';

const roots: string[] = [];
async function openStore() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-graph-'));
  roots.push(root);
  return { root, store: await GraphStore.open(path.join(root, 'graph.sqlite')) };
}
afterEach(() => { for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true }); });

function claim(id: string, value = id) { return { id, source_path: `notes/${id}.md`, source_type: 'text', date: '2026-01-01', value, quote: `quote ${id}`, gold_label: 'correct', note: '' }; }
function group(id: string, claims: ReturnType<typeof claim>[], relations: any[] = []) { return { id, domain: 'test', subject: `subject ${id}`, description: 'test group', claims, relations }; }

describe('persistent graph store', () => {
  it('persists nodes and edges and supports filtered incoming/outgoing queries', async () => {
    const { root, store } = await openStore();
    store.addNodes([{ id: 'a', node_type: 'claim', attrs: { quote: 'hello' } }, { id: 'b', node_type: 'entity', attrs: {} }]);
    store.addEdges([{ from_id: 'a', to_id: 'b', edge_type: 'mentions', attrs: { count: 2 } }]);
    expect(store.getNode('a')?.attrs).toEqual({ quote: 'hello' });
    expect(store.getNode('missing')).toBeNull();
    expect(store.allNodes('claim').map((node) => node.id)).toEqual(['a']);
    expect(store.neighbors('a', 'mentions')[0].attrs).toEqual({ count: 2 });
    expect(store.incoming('b')[0].from_id).toBe('a');
    expect(store.nodeCount()).toBe(2);
    expect(store.edgeCount()).toBe(1);
    store.close();
    const reopened = await GraphStore.open(path.join(root, 'graph.sqlite'));
    expect(reopened.getNode('a')?.attrs).toEqual({ quote: 'hello' });
    reopened.close();
  });

  it('round-trips claim groups, drops cross-group edges and namespaces repeated claim ids', async () => {
    const { store } = await openStore();
    const one = group('g1', [claim('c1', 'first'), claim('old')], [{ from_id: 'c1', to_id: 'old', type: 'supersedes' }]);
    const two = group('g2', [claim('c1', 'second')]);
    importClaimGroup(store, one); importClaimGroup(store, two);
    store.addEdge(claimNodeId('g1', 'c1'), claimNodeId('g2', 'c1'), 'contradicts');
    expect(exportClaimGroup(store, 'unknown')).toBeNull();
    const exported = exportClaimGroup(store, 'g1');
    expect(exported).toMatchObject({ domain: 'test', subject: 'subject g1', description: 'test group' });
    expect(exported?.claims.find((item: any) => item.id === 'c1')?.value).toBe('first');
    expect(exported?.relations).toEqual([{ from_id: 'c1', to_id: 'old', type: 'supersedes' }]);
    expect(exportClaimGroup(store, 'g2')?.claims[0].value).toBe('second');
    store.close();
  });

  it('imports and exports the real dataset and preserves trust propagation across persistence', async () => {
    const { root, store } = await openStore(), dataset = loadTrustEvalDataset();
    for (const item of dataset.claim_groups) importClaimGroup(store, item);
    for (const item of dataset.claim_groups) {
      const exported = exportClaimGroup(store, item.id);
      expect(exported).not.toBeNull();
      expect(exported?.claims.map((entry: any) => entry.id).sort()).toEqual(item.claims.map((entry: any) => entry.id).sort());
      expect(exported?.relations).toHaveLength(item.relations.length);
      const direct = propagateGroupTrust(item), viaStore = propagateGroupTrustFromStore(store, item.id);
      expect(viaStore).toEqual(direct);
    }
    store.close();
    const reopened = await GraphStore.open(path.join(root, 'graph.sqlite'));
    expect(propagateGroupTrustFromStore(reopened, dataset.claim_groups[0].id)).toBeTruthy();
    expect(propagateGroupTrustFromStore(reopened, 'missing')).toBeNull();
    reopened.close();
  });
});
