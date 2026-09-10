import { describe, expect, it } from 'vitest';
import { estimateCost, lookupModelPricing } from './modelPricing';

describe('lookupModelPricing', () => {
  it('prices known Gemini models -- previously missing entirely, so every Gemini run showed as unpriced', () => {
    expect(lookupModelPricing('gemini-2.5-flash-lite')).toEqual({ input: 0.1, output: 0.4 });
    expect(lookupModelPricing('gemini-3.5-flash-lite')).toEqual({ input: 0.3, output: 2.5 });
    expect(lookupModelPricing('gemini-2.5-pro')).toEqual({ input: 1.25, output: 10 });
    expect(lookupModelPricing('gemini-embedding-001')).toEqual({ input: 0.15, output: 0 });
  });

  it('matches the longer, more specific key instead of a shorter prefix', () => {
    // "gemini-2.5-flash-lite" contains "gemini-2.5-flash" as a substring --
    // without length-first ordering this would wrongly price it as the
    // (more expensive) non-lite model.
    expect(lookupModelPricing('gemini-2.5-flash-lite')).not.toEqual(lookupModelPricing('gemini-2.5-flash'));
  });

  it('matches a model name carrying extra suffixes, e.g. a dated snapshot', () => {
    expect(lookupModelPricing('models/gemini-2.5-flash-lite-001')).toEqual({ input: 0.1, output: 0.4 });
  });

  it('returns null for an unknown or local model', () => {
    expect(lookupModelPricing('gemma-2-2b-it')).toBeNull();
    expect(lookupModelPricing('some-unlisted-model')).toBeNull();
  });
});

describe('estimateCost', () => {
  it('computes cost from prompt/completion token counts', () => {
    const cost = estimateCost('gemini-2.5-flash-lite', 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(0.1 + 0.4, 10);
  });

  it('returns null when the model is unpriced', () => {
    expect(estimateCost('gemma-2-2b-it', 1000, 1000)).toBeNull();
  });
});
