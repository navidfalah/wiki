'use strict';

const crypto = require('node:crypto');
function tokenize(text) { return (String(text).toLowerCase().match(/[a-z0-9]+/g) || []); }
function passageId(passage) {
  return crypto.createHash('sha256')
    .update(`${passage.doc_path}\x1f${passage.heading}\x1f${passage.text}`)
    .digest('hex').slice(0, 16);
}
function indexCorpus(corpus) {
  const byId = new Map();
  const docs = corpus.map((passage) => {
    const id = passageId(passage);
    byId.set(id, passage);
    return { id, text: passage.text, tokens: Array.isArray(passage.tokens) ? passage.tokens : tokenize(passage.text) };
  });
  return { docs, byId };
}
function scorePassages(ranked, byId) {
  return ranked.flatMap((item) => {
    const passage = byId.get(item.doc_id);
    return passage ? [{ passage, score: item.score }] : [];
  });
}

module.exports = { tokenize, passageId, indexCorpus, scorePassages };
