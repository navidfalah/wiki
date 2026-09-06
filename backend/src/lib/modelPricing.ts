/**
 * Static list-price table (USD per 1M tokens) used to estimate spend from
 * the token counts compiler/llm_client.py already records on every pipeline
 * run (see pipelineRuns.ts's `token_usage`). These are published list prices,
 * not the user's actual invoice -- a custom/negotiated rate, a local model,
 * or a provider not in this table won't be priced (see `lookupModelPricing`
 * returning null), and the Usage page surfaces that instead of guessing.
 */
export interface ModelPrice {
  /** USD per 1,000,000 prompt/input tokens. */
  input: number;
  /** USD per 1,000,000 completion/output tokens. */
  output: number;
}

// Longest/most specific keys should be checked first -- see lookupModelPricing.
const MODEL_PRICES: Record<string, ModelPrice> = {
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4.1-nano': { input: 0.1, output: 0.4 },
  'gpt-4.1-mini': { input: 0.4, output: 1.6 },
  'gpt-4.1': { input: 2, output: 8 },
  'gpt-4-turbo': { input: 10, output: 30 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  'o1-mini': { input: 1.1, output: 4.4 },
  'o1': { input: 15, output: 60 },
  'o3-mini': { input: 1.1, output: 4.4 },
  'text-embedding-3-small': { input: 0.02, output: 0 },
  'text-embedding-3-large': { input: 0.13, output: 0 },
};

// Checked longest-key-first so "gpt-4.1-mini" matches before the shorter
// "gpt-4.1", even though model names on disk often carry a date suffix
// (e.g. "gpt-4o-mini-2024-07-18").
const SORTED_KEYS = Object.keys(MODEL_PRICES).sort((a, b) => b.length - a.length);

/** Looks up USD/1M-token pricing for a model name, or null if unpriced
 * (local models, unknown providers, or anything not in MODEL_PRICES). */
export function lookupModelPricing(model: string): ModelPrice | null {
  const needle = model.toLowerCase();
  for (const key of SORTED_KEYS) {
    if (needle.includes(key)) return MODEL_PRICES[key];
  }
  return null;
}

/** Estimated USD cost for a token count, or null when the model is unpriced. */
export function estimateCost(model: string, promptTokens: number, completionTokens: number): number | null {
  const price = lookupModelPricing(model);
  if (!price) return null;
  return (promptTokens / 1_000_000) * price.input + (completionTokens / 1_000_000) * price.output;
}
