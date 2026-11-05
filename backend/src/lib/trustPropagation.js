'use strict';

const { TRUST_LEVELS, loadTrustConfig, resolveTrust } = require('./trust');
const { exportClaimGroup } = require('./graphStore');

const DEFAULT_CONFIG = Object.freeze({ corroborate_weight: 1, contradict_weight: 1, supersede_weight: 1.5, supersede_decay: 0.4, prior_weight: 0.2, sigmoid_k: 1, iterations: 6 });
const MAX_PRIOR_SCORE = TRUST_LEVELS.length - 1;

function sigmoid(x, k) {
  const value = -k * x;
  if (value > 709) return 0;
  if (value < -709) return 1;
  return 1 / (1 + Math.exp(value));
}
function bucketTrustLevel(score) {
  const index = Math.min(MAX_PRIOR_SCORE, Math.max(0, Math.round(score * MAX_PRIOR_SCORE)));
  return TRUST_LEVELS[index];
}
function propagateGroupTrust(group, config = DEFAULT_CONFIG, trustConfig = loadTrustConfig()) {
  const claims = new Map(group.claims.map((claim) => [claim.id, claim]));
  const priors = new Map([...claims].map(([id, claim]) => [id, resolveTrust(claim.source_path, claim.source_type, trustConfig).score / MAX_PRIOR_SCORE]));
  let scores = new Map(priors);
  const corroborators = new Map(), contradictors = new Map(), supersededBy = new Map();
  for (const id of claims.keys()) { corroborators.set(id, []); contradictors.set(id, []); supersededBy.set(id, []); }
  for (const rel of group.relations) {
    if (!claims.has(rel.from_id) || !claims.has(rel.to_id)) continue;
    if (rel.type === 'corroborates') corroborators.get(rel.to_id).push(rel.from_id);
    else if (rel.type === 'contradicts') { contradictors.get(rel.to_id).push(rel.from_id); contradictors.get(rel.from_id).push(rel.to_id); }
    else if (rel.type === 'supersedes') supersededBy.get(rel.to_id).push(rel.from_id);
  }
  const related = new Set(group.relations.flatMap((rel) => [rel.from_id, rel.to_id]));
  for (let round = 0; round < config.iterations; round++) {
    const next = new Map();
    for (const id of claims.keys()) {
      if (!related.has(id)) { next.set(id, priors.get(id)); continue; }
      const sum = (ids) => ids.reduce((total, neighbor) => total + scores.get(neighbor), 0);
      const support = config.corroborate_weight * sum(corroborators.get(id)) - config.contradict_weight * sum(contradictors.get(id)) - config.supersede_weight * sum(supersededBy.get(id));
      const blended = config.prior_weight * priors.get(id) + (1 - config.prior_weight) * sigmoid(support, config.sigmoid_k);
      const score = blended * config.supersede_decay ** supersededBy.get(id).length;
      next.set(id, Math.max(0, Math.min(1, score)));
    }
    scores = next;
  }
  return Object.fromEntries([...claims.keys()].map((id) => {
    const prior = priors.get(id), score = scores.get(id);
    return [id, { claim_id: id, prior, score, delta: score - prior, trust_level: bucketTrustLevel(score) }];
  }));
}
function propagateDatasetTrust(dataset, config = DEFAULT_CONFIG, trustConfig = loadTrustConfig()) {
  return Object.fromEntries(dataset.claim_groups.map((group) => [group.id, propagateGroupTrust(group, config, trustConfig)]));
}
function propagateGroupTrustFromStore(store, groupId, config = DEFAULT_CONFIG, trustConfig = loadTrustConfig()) {
  const group = exportClaimGroup(store, groupId);
  return group ? propagateGroupTrust(group, config, trustConfig) : null;
}

module.exports = { DEFAULT_CONFIG, sigmoid, bucketTrustLevel, propagateGroupTrust, propagateDatasetTrust, propagateGroupTrustFromStore };
