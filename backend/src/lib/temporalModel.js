'use strict';

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})/;

function parseValidTime(rawDate) {
  const match = String(rawDate || '').trim().match(ISO_DATE_RE);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  if (year < 1) return null;
  const parsed = new Date(0);
  parsed.setUTCFullYear(year, month - 1, day);
  parsed.setUTCHours(0, 0, 0, 0);
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function validAsOf(fact, queryDate) {
  const query = parseValidTime(queryDate);
  if (!fact.valid_from || !query || query < fact.valid_from) return false;
  return fact.valid_until === null || query < fact.valid_until;
}

function buildGroupTimeline(group) {
  const validFrom = Object.fromEntries(group.claims.map((claim) => [claim.id, parseValidTime(claim.date)]));
  const validUntil = Object.fromEntries(group.claims.map((claim) => [claim.id, null]));
  for (const relation of group.relations) {
    if (relation.type !== 'supersedes') continue;
    const supersederFrom = validFrom[relation.from_id];
    if (!supersederFrom || !(relation.to_id in validUntil)) continue;
    const existing = validUntil[relation.to_id];
    if (existing === null || supersederFrom < existing) validUntil[relation.to_id] = supersederFrom;
  }
  return Object.fromEntries(group.claims.map((claim) => [claim.id, {
    claim_id: claim.id,
    valid_from: validFrom[claim.id],
    valid_until: validUntil[claim.id],
    recorded_at: validFrom[claim.id],
    is_current: validUntil[claim.id] === null,
  }]));
}

function asOf(group, timeline, queryDate) {
  const claims = new Map(group.claims.map((claim) => [claim.id, claim]));
  return Object.entries(timeline).filter(([, fact]) => validAsOf(fact, queryDate)).map(([id]) => claims.get(id)).filter(Boolean);
}

function currentClaims(group, timeline) {
  const claims = new Map(group.claims.map((claim) => [claim.id, claim]));
  return Object.entries(timeline).filter(([, fact]) => fact.is_current).map(([id]) => claims.get(id)).filter(Boolean);
}

function buildDatasetTimelines(dataset) {
  return Object.fromEntries(dataset.claim_groups.map((group) => [group.id, buildGroupTimeline(group)]));
}

module.exports = { parseValidTime, validAsOf, buildGroupTimeline, asOf, currentClaims, buildDatasetTimelines };
