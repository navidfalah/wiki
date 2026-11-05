import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CONDITIONS, PLAIN_SEARCH, STUDY_TASKS, WIKI_CHAT, createTrialResult, generateCounterbalancedDesign, loadResults, saveResult, summarize } from './userStudy';

describe('JavaScript user study utilities', () => {
  it('reuses retrieval tasks and counterbalances condition order with reproducible task shuffling', () => {
    expect(STUDY_TASKS.length).toBeGreaterThan(0);
    const a = generateCounterbalancedDesign(['p1', 'p2', 'p3', 'p4'], undefined, { seed: 7 });
    expect(a).toEqual(generateCounterbalancedDesign(['p1', 'p2', 'p3', 'p4'], undefined, { seed: 7 }));
    expect(a.filter((row) => row.participant_id === 'p1')[0].condition).toBe(WIKI_CHAT);
    expect(a.filter((row) => row.participant_id === 'p2')[0].condition).toBe(PLAIN_SEARCH);
    for (const participant of ['p1', 'p2', 'p3', 'p4']) {
      const rows = a.filter((row) => row.participant_id === participant);
      expect(rows).toHaveLength(STUDY_TASKS.length * 2);
      for (const condition of CONDITIONS) expect(rows.filter((row) => row.condition === condition)).toHaveLength(STUDY_TASKS.length);
    }
    expect(generateCounterbalancedDesign(['p1'], undefined, { seed: 1 }).map((row) => row.task_id)).not.toEqual(generateCounterbalancedDesign(['p1'], undefined, { seed: 2 }).map((row) => row.task_id));
  });

  it('validates and persists real trial records, then reports descriptive and paired summaries', () => {
    expect(() => createTrialResult({ participant_id: 'p', task_id: 't', condition: 'bad', duration_seconds: 1, correct: true, confidence: 3 })).toThrow('Unknown condition');
    expect(() => createTrialResult({ participant_id: 'p', task_id: 't', condition: WIKI_CHAT, duration_seconds: -1, correct: true, confidence: 3 })).toThrow('negative');
    expect(() => createTrialResult({ participant_id: 'p', task_id: 't', condition: WIKI_CHAT, duration_seconds: 1, correct: true, confidence: 6 })).toThrow('confidence');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-study-'));
    try {
      const file = path.join(dir, 'results.json');
      saveResult({ participant_id: 'p1', task_id: 't1', condition: WIKI_CHAT, duration_seconds: 10, correct: true, confidence: 5 }, file);
      saveResult({ participant_id: 'p1', task_id: 't1', condition: PLAIN_SEARCH, duration_seconds: 20, correct: false, confidence: 2 }, file);
      expect(loadResults(file)).toHaveLength(2);
      expect(summarize(loadResults(file))).toMatchObject({ paired_duration_wins: { [WIKI_CHAT]: 1, [PLAIN_SEARCH]: 0 }, by_condition: { [WIKI_CHAT]: { n: 1, accuracy: 1 }, [PLAIN_SEARCH]: { n: 1, accuracy: 0 } } });
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });

  it('returns no records for missing or malformed files', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-study-'));
    try { expect(loadResults(path.join(dir, 'missing.json'))).toEqual([]); const bad = path.join(dir, 'bad.json'); fs.writeFileSync(bad, '{'); expect(loadResults(bad)).toEqual([]); }
    finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
});
