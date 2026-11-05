import { describe, expect, it } from 'vitest';
import {
  evaluateExtractiveFaithfulness,
  evaluateGeneratedFaithfulness,
  isExtractiveAnswerVerbatim,
  judgeFaithfulness,
} from './faithfulnessEval.js';

function passage(title: string, heading: string, text: string) { return { doc_path: `${title}.md`, title, heading, text }; }

describe('answer faithfulness evaluators', () => {
  it('parses faithful and unfaithful judge responses and rejects malformed JSON', async () => {
    const faithful = await judgeFaithfulness('answer', 'sources', { generate: async () => '{"faithful":true,"unsupported_claims":[]}' });
    expect(faithful.faithful).toBe(true);
    expect(faithful.unsupported_claims).toEqual([]);
    expect(faithful.parse_error).toBeNull();
    const unfaithful = await judgeFaithfulness('answer', 'sources', { generate: async () => '{"faithful":false,"unsupported_claims":["unsupported"]}' });
    expect(unfaithful.faithful).toBe(false);
    expect(unfaithful.unsupported_claims).toEqual(['unsupported']);
    const malformed = await judgeFaithfulness('answer', 'sources', { generate: async () => 'not json' });
    expect(malformed.faithful).toBe(false);
    expect(malformed.parse_error).toBeTruthy();
  });

  it('checks full and ellipsis-truncated extractive snippets against passage prefixes', () => {
    const corpus = [passage('MeshSync', 'Battery', 'Relay radios drain batteries 30% faster than spec.')];
    expect(isExtractiveAnswerVerbatim('**MeshSync — Battery**\nRelay radios drain batteries 30% faster than spec.', corpus)).toBe(true);
    const long = 'x'.repeat(500);
    expect(isExtractiveAnswerVerbatim(`**MeshSync — Battery**\n${long.slice(0, 400)}…`, [passage('MeshSync', 'Battery', long)])).toBe(true);
    expect(isExtractiveAnswerVerbatim('**MeshSync — Battery**\nRelay radios drain batteries 90% faster.', corpus)).toBe(false);
    expect(isExtractiveAnswerVerbatim('no snippet blocks', [])).toBe(false);
  });

  it('measures extractive answers and skips non-extractive results', async () => {
    const corpus = [passage('MeshSync', 'Battery', 'Relay radios drain batteries 30% faster than spec.')];
    const report = await evaluateExtractiveFaithfulness(['q1', 'q2'], {
      corpus,
      answer: async (query: string) => query === 'q1'
        ? { mode: 'extractive', answer: '**MeshSync — Battery**\nRelay radios drain batteries 30% faster than spec.' }
        : { mode: 'empty', answer: 'none' },
    });
    expect(report).toMatchObject({ total: 1, verbatim_count: 1, verbatim_rate: 1 });
    const empty = await evaluateExtractiveFaithfulness(['q'], { corpus, answer: async () => ({ mode: 'no_match', answer: '' }) });
    expect(empty.total).toBe(0);
    expect(Number.isNaN(empty.verbatim_rate)).toBe(true);
  });

  it('judges generated answers against the retrieved passages', async () => {
    const calls: any[] = [];
    const llm = { generate: async (request: any) => { calls.push(request); return '{"faithful":true,"unsupported_claims":[]}'; } };
    const report = await evaluateGeneratedFaithfulness(['question'], {
      corpus: [passage('MeshSync', 'Battery', 'Relay radios drain batteries.')],
      answer: async () => ({ mode: 'generated', answer: 'Relay radio drains the battery.' }),
      retrieve: async () => [{ passage: passage('MeshSync', 'Battery', 'Relay radios drain batteries.') }],
      llm,
    });
    expect(report).toMatchObject({ total: 1, faithful_count: 1, parse_errors: 0, hallucination_rate: 0 });
    expect(calls[0].prompt).toContain('Relay radios drain batteries.');
    expect(calls[0].prompt).toContain('Relay radio drains the battery.');
    expect(calls[0].sampling.temperature).toBe(0);
  });
});
