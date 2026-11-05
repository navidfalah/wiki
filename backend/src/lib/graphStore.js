'use strict';

const fs = require('node:fs');
const path = require('node:path');
const initSql = require('sql.js/dist/sql-asm.js');

class GraphStore {
  constructor(dbPath, db) { this.dbPath = dbPath; this.db = db; }

  static async open(dbPath) {
    const absolute = path.resolve(dbPath), SQL = await initSql();
    const db = new SQL.Database(fs.existsSync(absolute) ? fs.readFileSync(absolute) : undefined);
    const store = new GraphStore(absolute, db);
    store.db.run('CREATE TABLE IF NOT EXISTS nodes (id TEXT PRIMARY KEY, node_type TEXT NOT NULL, attrs TEXT NOT NULL)');
    store.db.run('CREATE TABLE IF NOT EXISTS edges (from_id TEXT NOT NULL, to_id TEXT NOT NULL, edge_type TEXT NOT NULL, attrs TEXT NOT NULL, PRIMARY KEY (from_id, to_id, edge_type))');
    store.db.run('CREATE INDEX IF NOT EXISTS idx_edges_from ON edges (from_id)');
    store.db.run('CREATE INDEX IF NOT EXISTS idx_edges_to ON edges (to_id)');
    if (!fs.existsSync(absolute)) store.#persist();
    return store;
  }

  #persist() {
    fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
    const temp = `${this.dbPath}.${process.pid}.tmp`;
    try { fs.writeFileSync(temp, Buffer.from(this.db.export())); fs.renameSync(temp, this.dbPath); }
    finally { try { fs.unlinkSync(temp); } catch { /* renamed or already cleaned */ } }
  }

  #batch(operation) {
    this.db.run('BEGIN');
    try { operation(); this.db.run('COMMIT'); this.#persist(); }
    catch (error) { try { this.db.run('ROLLBACK'); } catch { /* transaction may already have ended */ } throw error; }
  }

  addNode(id, nodeType, attrs = {}) {
    this.db.run('INSERT OR REPLACE INTO nodes (id, node_type, attrs) VALUES (?, ?, ?)', [id, nodeType, JSON.stringify(attrs || {})]);
    this.#persist();
  }
  addNodes(nodes) { this.#batch(() => nodes.forEach((node) => this.db.run('INSERT OR REPLACE INTO nodes (id, node_type, attrs) VALUES (?, ?, ?)', [node.id, node.node_type, JSON.stringify(node.attrs || {})]))); }
  addEdge(fromId, toId, edgeType, attrs = {}) {
    this.db.run('INSERT OR REPLACE INTO edges (from_id, to_id, edge_type, attrs) VALUES (?, ?, ?, ?)', [fromId, toId, edgeType, JSON.stringify(attrs || {})]);
    this.#persist();
  }
  addEdges(edges) { this.#batch(() => edges.forEach((edge) => this.db.run('INSERT OR REPLACE INTO edges (from_id, to_id, edge_type, attrs) VALUES (?, ?, ?, ?)', [edge.from_id, edge.to_id, edge.edge_type, JSON.stringify(edge.attrs || {})]))); }

  #rows(sql, params = []) {
    const statement = this.db.prepare(sql, params), rows = [];
    try { while (statement.step()) rows.push(statement.getAsObject()); }
    finally { statement.free(); }
    return rows;
  }
  getNode(id) {
    const row = this.#rows('SELECT id, node_type, attrs FROM nodes WHERE id = ?', [id])[0];
    return row ? { id: row.id, node_type: row.node_type, attrs: JSON.parse(row.attrs) } : null;
  }
  /** @param {string | null} [nodeType] */
  allNodes(nodeType = null) {
    const rows = nodeType === null ? this.#rows('SELECT id, node_type, attrs FROM nodes') : this.#rows('SELECT id, node_type, attrs FROM nodes WHERE node_type = ?', [nodeType]);
    return rows.map((row) => ({ id: row.id, node_type: row.node_type, attrs: JSON.parse(row.attrs) }));
  }
  /** @param {string} id @param {string | null} [edgeType] */
  neighbors(id, edgeType = null) {
    const rows = edgeType === null ? this.#rows('SELECT from_id, to_id, edge_type, attrs FROM edges WHERE from_id = ?', [id]) : this.#rows('SELECT from_id, to_id, edge_type, attrs FROM edges WHERE from_id = ? AND edge_type = ?', [id, edgeType]);
    return rows.map((row) => ({ from_id: row.from_id, to_id: row.to_id, edge_type: row.edge_type, attrs: JSON.parse(row.attrs) }));
  }
  /** @param {string} id @param {string | null} [edgeType] */
  incoming(id, edgeType = null) {
    const rows = edgeType === null ? this.#rows('SELECT from_id, to_id, edge_type, attrs FROM edges WHERE to_id = ?', [id]) : this.#rows('SELECT from_id, to_id, edge_type, attrs FROM edges WHERE to_id = ? AND edge_type = ?', [id, edgeType]);
    return rows.map((row) => ({ from_id: row.from_id, to_id: row.to_id, edge_type: row.edge_type, attrs: JSON.parse(row.attrs) }));
  }
  nodeCount() { return this.#rows('SELECT COUNT(*) AS count FROM nodes')[0].count; }
  edgeCount() { return this.#rows('SELECT COUNT(*) AS count FROM edges')[0].count; }
  close() { this.db.close(); }
}

const CLAIM_GROUP_NODE_TYPE = 'claim_group';
function claimNodeId(groupId, claimId) { return `${groupId}::${claimId}`; }

function importClaimGroup(store, group) {
  const nodes = [{ id: group.id, node_type: CLAIM_GROUP_NODE_TYPE, attrs: { domain: group.domain, subject: group.subject, description: group.description } }, ...group.claims.map((claim) => ({
    id: claimNodeId(group.id, claim.id), node_type: 'claim', attrs: { claim_id: claim.id, group_id: group.id, source_path: claim.source_path, source_type: claim.source_type, date: claim.date, value: claim.value, quote: claim.quote, gold_label: claim.gold_label, note: claim.note },
  }))];
  const edges = group.relations.map((rel) => ({ from_id: claimNodeId(group.id, rel.from_id), to_id: claimNodeId(group.id, rel.to_id), edge_type: rel.type, attrs: {} }));
  store.addNodes(nodes); store.addEdges(edges);
}

function exportClaimGroup(store, groupId) {
  const groupNode = store.getNode(groupId);
  if (!groupNode || groupNode.node_type !== CLAIM_GROUP_NODE_TYPE) return null;
  const claims = store.allNodes('claim').filter((node) => node.attrs.group_id === groupId).map((node) => ({
    id: node.attrs.claim_id || node.id, source_path: node.attrs.source_path || '', source_type: node.attrs.source_type || 'text', date: node.attrs.date || '', value: node.attrs.value || '', quote: node.attrs.quote || '', gold_label: node.attrs.gold_label || 'correct', note: node.attrs.note || '',
  }));
  const bareIdByNodeId = new Map(claims.map((claim) => [claimNodeId(groupId, claim.id), claim.id])), seen = new Set(), relations = [];
  for (const claim of claims) for (const edge of store.neighbors(claimNodeId(groupId, claim.id))) {
    if (!bareIdByNodeId.has(edge.to_id)) continue;
    const relation = { from_id: claim.id, to_id: bareIdByNodeId.get(edge.to_id), type: edge.edge_type }, key = JSON.stringify([relation.from_id, relation.to_id, relation.type]);
    if (!seen.has(key)) { seen.add(key); relations.push(relation); }
  }
  return { id: groupId, domain: groupNode.attrs.domain || '', subject: groupNode.attrs.subject || '', description: groupNode.attrs.description || '', claims, relations };
}

module.exports = { GraphStore, CLAIM_GROUP_NODE_TYPE, claimNodeId, importClaimGroup, exportClaimGroup };
