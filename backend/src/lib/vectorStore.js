'use strict';
// SQLite-persisted vectors with precomputed norms and a linear cosine scan.
const fs = require('node:fs');
const path = require('node:path');
const initSql = require('sql.js/dist/sql-asm.js');

function vectorNorm(vector) { return Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)); }
function packEmbedding(vector) {
  const buffer = Buffer.allocUnsafe(vector.length * 8);
  vector.forEach((value, index) => buffer.writeDoubleLE(value, index * 8));
  return buffer;
}
function unpackEmbedding(bytes) {
  const buffer = Buffer.from(bytes);
  if (buffer.length % 8) throw new Error('Stored embedding has invalid packed length.');
  return Array.from({ length: buffer.length / 8 }, (_, index) => buffer.readDoubleLE(index * 8));
}
function cosineSimilarity(a, b, normA = vectorNorm(a), normB = vectorNorm(b)) {
  if (!a.length || !b.length || a.length !== b.length || !normA || !normB) return 0;
  return a.reduce((sum, value, index) => sum + value * b[index], 0) / (normA * normB);
}

class VectorStore {
  constructor(dbPath, db) { this.dbPath = path.resolve(dbPath); this.db = db; }
  static async open(dbPath) {
    const absolute = path.resolve(dbPath), SQL = await initSql();
    const db = new SQL.Database(fs.existsSync(absolute) ? fs.readFileSync(absolute) : undefined);
    const store = new VectorStore(absolute, db);
    store.db.run('CREATE TABLE IF NOT EXISTS vectors (id TEXT PRIMARY KEY, text TEXT NOT NULL, embedding BLOB NOT NULL, norm REAL NOT NULL)');
    if (!fs.existsSync(absolute)) store.#persist();
    return store;
  }
  #persist() {
    fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
    const temp = `${this.dbPath}.${process.pid}.tmp`;
    try { fs.writeFileSync(temp, Buffer.from(this.db.export())); fs.renameSync(temp, this.dbPath); }
    finally { try { fs.unlinkSync(temp); } catch { /* renamed or already removed */ } }
  }
  upsert(record) { this.upsertMany([record]); }
  upsertMany(records) {
    this.db.run('BEGIN');
    try {
      for (const record of records) {
        if (!record || typeof record.id !== 'string' || typeof record.text !== 'string' || !Array.isArray(record.embedding) || !record.embedding.every(Number.isFinite)) throw new Error('Vector records require an id, text, and finite numeric embedding.');
        this.db.run('INSERT OR REPLACE INTO vectors (id, text, embedding, norm) VALUES (?, ?, ?, ?)', [record.id, record.text, packEmbedding(record.embedding), vectorNorm(record.embedding)]);
      }
      this.db.run('COMMIT'); this.#persist();
    } catch (error) { try { this.db.run('ROLLBACK'); } catch { /* transaction already ended */ } throw error; }
  }
  #rows(sql, params = []) {
    const statement = this.db.prepare(sql, params), rows = [];
    try { while (statement.step()) rows.push(statement.getAsObject()); }
    finally { statement.free(); }
    return rows;
  }
  get(id) {
    const row = this.#rows('SELECT id, text, embedding FROM vectors WHERE id = ?', [id])[0];
    return row ? { id: row.id, text: row.text, embedding: unpackEmbedding(row.embedding) } : null;
  }
  count() { return this.#rows('SELECT COUNT(*) AS count FROM vectors')[0].count; }
  allRecords() { return this.#rows('SELECT id, text, embedding FROM vectors').map((row) => ({ id: row.id, text: row.text, embedding: unpackEmbedding(row.embedding) })); }
  search(queryEmbedding, { topK = 5 } = {}) {
    if (!Array.isArray(queryEmbedding) || !queryEmbedding.every(Number.isFinite)) throw new Error('Query embedding must contain finite numbers.');
    const queryNorm = vectorNorm(queryEmbedding);
    return this.#rows('SELECT id, embedding, norm FROM vectors').map((row) => ({ id: row.id, score: cosineSimilarity(queryEmbedding, unpackEmbedding(row.embedding), queryNorm, row.norm) }))
      .sort((a, b) => b.score - a.score).slice(0, Math.max(0, topK)).map(({ id, score }) => [id, score]);
  }
  delete(id) { this.db.run('DELETE FROM vectors WHERE id = ?', [id]); this.#persist(); }
  close() { this.db.close(); }
}

module.exports = { VectorStore, vectorNorm, packEmbedding, unpackEmbedding, cosineSimilarity };
