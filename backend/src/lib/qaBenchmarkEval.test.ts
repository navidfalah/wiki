import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
const qa = require('./qaBenchmarkEval');

const questions = qa.loadBenchmark();

describe('gold Q&A benchmark dataset', () => {
  it('has unique IDs and at least 50 questions', () => {
    const ids = questions.map((question: any) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(questions.length).toBeGreaterThanOrEqual(50);
  });

  it('keeps every question well formed', () => {
    for (const question of questions) {
      expect(question.question.endsWith('?'), question.id).toBe(true);
      expect(question.answer && question.keywords, question.id).toBeTruthy();
      expect(question.facts.length && question.facts.every((alternatives: string[]) => alternatives.length), question.id).toBeTruthy();
      expect(['fact', 'contradiction', 'multi_source']).toContain(question.category);
    }
  });

  it('references existing raw source files', () => {
    const missing = questions.flatMap((question: any) => question.sources.filter((source: string) => !fs.existsSync(require('node:path').join(qa.DEFAULT_RAW_DIR, source))).map((source: string) => [question.id, source]));
    expect(missing).toEqual([]);
  });

  it('grounds each gold fact in at least one cited source', async () => {
    for (const question of questions) {
      for (const fact of question.facts) {
        let grounded = false;
        for (const source of question.sources) {
          if (qa.factsFound([fact], await qa.readSourceText(source))) { grounded = true; break; }
        }
        expect(grounded, `${question.id}: ${JSON.stringify(fact)}`).toBe(true);
      }
    }
  });

  it('normalizes case, dashes, micro signs, and Markdown', () => {
    expect(qa.normalize('**6–9 Months**  at 4.2 µA')).toBe('6-9 months at 4.2 ua');
  });

  it('counts each fact once when any acceptable phrasing is present', () => {
    const facts = [['cr2032', '2032 cell'], ['15 min'], ['missing']];
    expect(qa.factsFound(facts, 'Uses a CR2032; reads every 15 minutes.')).toBe(2);
  });
});
