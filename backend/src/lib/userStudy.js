'use strict';
// Participant-facing study design and descriptive summaries. This module
// records real trials only; fixtures belong in tests and are never persisted.
const fs = require('node:fs');
const path = require('node:path');
const { QUERIES } = require('./retrievalEvalDataset');

const WIKI_CHAT = 'wiki_chat';
const PLAIN_SEARCH = 'plain_search';
const CONDITIONS = Object.freeze([WIKI_CHAT, PLAIN_SEARCH]);
const STUDY_TASKS = Object.freeze(QUERIES.map(({ id, text }) => Object.freeze({ id, query: text })));
const RESULTS_PATH = path.resolve(__dirname, '../../../data/user_study_results.json');

function seededRandom(seed) {
  let state = Number(seed) >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function generateCounterbalancedDesign(participantIds, tasks = STUDY_TASKS, { seed = 0 } = {}) {
  const random = seededRandom(seed), assignments = [];
  participantIds.forEach((participantId, participantIndex) => {
    const conditions = participantIndex % 2 === 0 ? CONDITIONS : [...CONDITIONS].reverse();
    let blockOrder = 0;
    for (const condition of conditions) {
      const shuffled = [...tasks];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      for (const task of shuffled) assignments.push({ participant_id: participantId, task_id: task.id, condition, block_order: blockOrder++ });
    }
  });
  return assignments;
}

function createTrialResult({ participant_id, task_id, condition, duration_seconds, correct, confidence, recorded_at = new Date().toISOString() }) {
  if (!CONDITIONS.includes(condition)) throw new Error(`Unknown condition ${JSON.stringify(condition)}; must be one of ${CONDITIONS.join(', ')}`);
  if (!Number.isFinite(duration_seconds) || duration_seconds < 0) throw new Error('duration_seconds cannot be negative');
  if (!Number.isInteger(confidence) || confidence < 1 || confidence > 5) throw new Error('confidence must be between 1 and 5');
  if (typeof participant_id !== 'string' || typeof task_id !== 'string' || typeof correct !== 'boolean') throw new Error('participant_id, task_id, and correct are required');
  return { participant_id, task_id, condition, duration_seconds, correct, confidence, recorded_at };
}

function loadResults(file = RESULTS_PATH) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(parsed.trials) ? parsed.trials.map(createTrialResult) : [];
  } catch { return []; }
}

function saveResult(result, file = RESULTS_PATH) {
  const target = path.resolve(file), trials = loadResults(target);
  trials.push(createTrialResult(result));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temp = `${target}.${process.pid}.tmp`;
  try { fs.writeFileSync(temp, `${JSON.stringify({ version: 1, trials }, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 }); fs.renameSync(temp, target); }
  finally { try { fs.unlinkSync(temp); } catch { /* renamed or already absent */ } }
  return target;
}

function summarize(results) {
  const by_condition = {};
  for (const condition of CONDITIONS) {
    const rows = results.filter((row) => row.condition === condition);
    if (!rows.length) continue;
    by_condition[condition] = {
      condition, n: rows.length,
      mean_duration_seconds: rows.reduce((sum, row) => sum + row.duration_seconds, 0) / rows.length,
      accuracy: rows.filter((row) => row.correct).length / rows.length,
      mean_confidence: rows.reduce((sum, row) => sum + row.confidence, 0) / rows.length,
    };
  }
  const wins = { [WIKI_CHAT]: 0, [PLAIN_SEARCH]: 0 }, pairs = new Map();
  for (const row of results) {
    const key = JSON.stringify([row.participant_id, row.task_id]);
    if (!pairs.has(key)) pairs.set(key, {});
    pairs.get(key)[row.condition] = row.duration_seconds;
  }
  for (const pair of pairs.values()) {
    if (pair[WIKI_CHAT] !== undefined && pair[PLAIN_SEARCH] !== undefined) {
      wins[pair[WIKI_CHAT] < pair[PLAIN_SEARCH] ? WIKI_CHAT : PLAIN_SEARCH]++;
    }
  }
  return { by_condition, paired_duration_wins: wins };
}

module.exports = { WIKI_CHAT, PLAIN_SEARCH, CONDITIONS, STUDY_TASKS, RESULTS_PATH, generateCounterbalancedDesign, createTrialResult, loadResults, saveResult, summarize };
