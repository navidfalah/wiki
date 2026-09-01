/**
 * Describes which LLM backend the compiler subprocess would use, purely
 * from the env vars docker-compose.yml passes to this container (mirrors
 * llm_client.py's own OPENAI_BASE_URL / OPENAI_API_KEY / OPENAI_MODEL
 * reads) -- lets the UI explain an empty token-usage table instead of
 * just showing "no data".
 */
export interface LlmBackendInfo {
  mode: 'local' | 'cloud' | 'none';
  base_url: string;
  model: string;
}

export function describeLlmBackend(): LlmBackendInfo {
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const hasKey = Boolean(process.env.OPENAI_API_KEY);
  const isLocal = /local-llm|localhost:8080|127\.0\.0\.1:8080/.test(baseUrl);

  if (isLocal) return { mode: 'local', base_url: baseUrl, model };
  if (hasKey) return { mode: 'cloud', base_url: baseUrl, model };
  return { mode: 'none', base_url: baseUrl, model };
}
