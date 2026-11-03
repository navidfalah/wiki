import { afterEach, describe, expect, it } from 'vitest';
import { describeLlmBackend } from './llmBackend';

const KEYS = ['OPENAI_BASE_URL', 'OPENAI_MODEL', 'OPENAI_API_KEY'] as const;
const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

function withEnv(env: Partial<Record<(typeof KEYS)[number], string>>) {
  for (const k of KEYS) delete process.env[k];
  Object.assign(process.env, env);
  return describeLlmBackend();
}

describe('describeLlmBackend', () => {
  it('defaults to OpenAI with no key: mode none', () => {
    expect(withEnv({})).toEqual({ mode: 'none', base_url: 'https://api.openai.com/v1', model: 'gpt-4o-mini' });
  });

  it('a key makes it a cloud backend', () => {
    expect(withEnv({ OPENAI_API_KEY: 'sk-x', OPENAI_MODEL: 'gpt-5' })).toMatchObject({ mode: 'cloud', model: 'gpt-5' });
  });

  it.each(['http://local-llm:8080/v1', 'http://localhost:8080/v1', 'http://127.0.0.1:8080/v1'])('%s is local even without a key', (url) => {
    expect(withEnv({ OPENAI_BASE_URL: url }).mode).toBe('local');
  });
});
