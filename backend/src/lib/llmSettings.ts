/**
 * LLM Settings: lets the wiki UI configure multiple API key "profiles"
 * (OpenAI, Gemini, the local Gemma container, or any OpenAI-compatible
 * endpoint) and assign one to each purpose the compiler pipeline
 * recognizes -- "default" (extraction/indexing/linking), "thinking"
 * (synthesis -- the pipeline's one genuinely reasoning-heavy step, see
 * compiler/main.py's step 3), and "embedding". Persisted to
 * data/llm_settings.json; also mirrored into the repo's .env so the
 * local-llm Docker container (which reads its own env at container
 * start, not this file) picks up model changes on its next restart.
 *
 * compiler/llm_client.py's LLMClient.for_purpose() reads the per-purpose
 * env vars this module derives (see envOverridesForSpawn) -- that's the
 * other half of the wiring, applied when pythonBridge.ts spawns the
 * compiler subprocess.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT_ROOT } from '../paths';

export const LLM_SETTINGS_FILE = path.join(PROJECT_ROOT, 'data', 'llm_settings.json');
const ENV_FILE = path.join(PROJECT_ROOT, '.env');

export type Purpose = 'default' | 'thinking' | 'embedding';
export const PURPOSES: Purpose[] = ['default', 'thinking', 'embedding'];

export interface LlmProfile {
  id: string;
  label: string;
  provider: 'openai' | 'gemini' | 'local' | 'custom';
  base_url: string;
  model: string;
  api_key: string;
}

export interface LocalLlmConfig {
  model_repo: string;
  model_file: string;
  model_alias: string;
  context: number;
  chat_format: string;
}

export interface LlmSettings {
  profiles: LlmProfile[];
  assignments: Record<Purpose, string>;
  local_llm: LocalLlmConfig;
}

const DEFAULT_LOCAL_LLM: LocalLlmConfig = {
  model_repo: 'google/gemma-4-it-GGUF',
  model_file: 'gemma-4-it-Q4_K_M.gguf',
  model_alias: 'gemma-4',
  context: 4096,
  chat_format: 'gemma',
};

function defaultSettings(): LlmSettings {
  const defaultProfile: LlmProfile = {
    id: 'default',
    label: 'Default',
    provider: 'custom',
    base_url: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    api_key: process.env.OPENAI_API_KEY || '',
  };
  return {
    profiles: [defaultProfile],
    assignments: { default: 'default', thinking: 'default', embedding: 'default' },
    local_llm: { ...DEFAULT_LOCAL_LLM },
  };
}

function readJsonSafe(filePath: string): any | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

export function loadLlmSettings(): LlmSettings {
  const parsed = readJsonSafe(LLM_SETTINGS_FILE);
  if (!parsed || !Array.isArray(parsed.profiles) || parsed.profiles.length === 0) {
    return defaultSettings();
  }
  const profiles: LlmProfile[] = parsed.profiles.map((p: any) => ({
    id: String(p.id ?? crypto.randomUUID()),
    label: String(p.label ?? p.id ?? 'Untitled'),
    provider: ['openai', 'gemini', 'local', 'custom'].includes(p.provider) ? p.provider : 'custom',
    base_url: String(p.base_url ?? ''),
    model: String(p.model ?? ''),
    api_key: String(p.api_key ?? ''),
  }));
  const profileIds = new Set(profiles.map((p) => p.id));
  const firstId = profiles[0].id;
  const assignments = { default: firstId, thinking: firstId, embedding: firstId };
  for (const purpose of PURPOSES) {
    const candidate = parsed.assignments?.[purpose];
    if (typeof candidate === 'string' && profileIds.has(candidate)) {
      assignments[purpose] = candidate;
    }
  }
  const local = parsed.local_llm ?? {};
  const local_llm: LocalLlmConfig = {
    model_repo: String(local.model_repo ?? DEFAULT_LOCAL_LLM.model_repo),
    model_file: String(local.model_file ?? DEFAULT_LOCAL_LLM.model_file),
    model_alias: String(local.model_alias ?? DEFAULT_LOCAL_LLM.model_alias),
    context: Number.isFinite(Number(local.context)) ? Number(local.context) : DEFAULT_LOCAL_LLM.context,
    chat_format: String(local.chat_format ?? DEFAULT_LOCAL_LLM.chat_format),
  };
  return { profiles, assignments, local_llm };
}

function maskKey(key: string): string {
  if (!key) return '';
  if (key.length <= 4) return '••••';
  return `••••${key.slice(-4)}`;
}

export const MASKED_UNCHANGED = '__unchanged__';

/** Settings shaped for the API/UI: api_key replaced by a display mask. */
export function toPublicSettings(settings: LlmSettings) {
  return {
    ...settings,
    profiles: settings.profiles.map((p) => ({
      ...p,
      api_key: maskKey(p.api_key),
      has_key: Boolean(p.api_key),
    })),
  };
}

export class LlmSettingsError extends Error {}

function upsertEnvVars(updates: Record<string, string>): void {
  let lines: string[] = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf-8').split('\n') : [];
  const remaining = new Map(Object.entries(updates));
  lines = lines.map((line) => {
    const match = /^([A-Z0-9_]+)=/.exec(line);
    if (match && remaining.has(match[1])) {
      const key = match[1];
      const value = remaining.get(key)!;
      remaining.delete(key);
      return `${key}=${value}`;
    }
    return line;
  });
  if (remaining.size > 0) {
    if (lines.length && lines[lines.length - 1].trim() !== '') lines.push('');
    lines.push('# --- Written by the Settings page (LLM providers) ---');
    for (const [key, value] of remaining) lines.push(`${key}=${value}`);
  }
  fs.writeFileSync(ENV_FILE, lines.join('\n'));
}

/** Validates and persists new settings, then mirrors the relevant vars into .env. */
export function saveLlmSettings(input: any): LlmSettings {
  if (!input || !Array.isArray(input.profiles) || input.profiles.length === 0) {
    throw new LlmSettingsError('At least one profile is required');
  }
  const existing = loadLlmSettings();
  const existingById = new Map(existing.profiles.map((p) => [p.id, p]));

  const seenIds = new Set<string>();
  const profiles: LlmProfile[] = input.profiles.map((p: any) => {
    const label = String(p.label ?? '').trim();
    if (!label) throw new LlmSettingsError('Every profile needs a label');
    const provider = ['openai', 'gemini', 'local', 'custom'].includes(p.provider) ? p.provider : 'custom';
    const base_url = String(p.base_url ?? '').trim();
    const model = String(p.model ?? '').trim();
    if (!base_url || !model) throw new LlmSettingsError(`Profile "${label}" needs a base URL and model`);
    const id = String(p.id ?? '').trim() || crypto.randomUUID();
    if (seenIds.has(id)) throw new LlmSettingsError(`Duplicate profile id: ${id}`);
    seenIds.add(id);
    const incomingKey = typeof p.api_key === 'string' ? p.api_key : '';
    const api_key = incomingKey === MASKED_UNCHANGED || incomingKey === ''
      ? existingById.get(id)?.api_key ?? ''
      : incomingKey;
    return { id, label, provider, base_url, model, api_key };
  });
  const profileIds = new Set(profiles.map((p) => p.id));

  const firstId = profiles[0].id;
  const assignments = { default: firstId, thinking: firstId, embedding: firstId } as Record<Purpose, string>;
  for (const purpose of PURPOSES) {
    const candidate = input.assignments?.[purpose];
    if (typeof candidate === 'string' && profileIds.has(candidate)) assignments[purpose] = candidate;
  }

  const local = input.local_llm ?? {};
  const local_llm: LocalLlmConfig = {
    model_repo: String(local.model_repo ?? existing.local_llm.model_repo).trim() || existing.local_llm.model_repo,
    model_file: String(local.model_file ?? existing.local_llm.model_file).trim() || existing.local_llm.model_file,
    model_alias: String(local.model_alias ?? existing.local_llm.model_alias).trim() || existing.local_llm.model_alias,
    context: Number.isFinite(Number(local.context)) && Number(local.context) > 0
      ? Number(local.context)
      : existing.local_llm.context,
    chat_format: String(local.chat_format ?? existing.local_llm.chat_format).trim() || existing.local_llm.chat_format,
  };

  const settings: LlmSettings = { profiles, assignments, local_llm };
  fs.mkdirSync(path.dirname(LLM_SETTINGS_FILE), { recursive: true });
  fs.writeFileSync(LLM_SETTINGS_FILE, JSON.stringify(settings, null, 2));

  // Mirror local-llm model config into .env -- this is what docker-compose
  // and docker/local-llm/entrypoint.sh actually read; the JSON file above
  // only drives this Node process and the compiler subprocess it spawns.
  upsertEnvVars({
    LOCAL_LLM_MODEL_REPO: local_llm.model_repo,
    LOCAL_LLM_MODEL_FILE: local_llm.model_file,
    LOCAL_LLM_MODEL_ALIAS: local_llm.model_alias,
    LOCAL_LLM_CONTEXT: String(local_llm.context),
    LOCAL_LLM_CHAT_FORMAT: local_llm.chat_format,
  });

  return settings;
}

/** Env vars to overlay onto the compiler subprocess's environment for this run. */
export function envOverridesForSpawn(): Record<string, string> {
  const settings = loadLlmSettings();
  const byId = new Map(settings.profiles.map((p) => [p.id, p]));
  const overrides: Record<string, string> = {};

  const defaultProfile = byId.get(settings.assignments.default);
  if (defaultProfile) {
    overrides.OPENAI_API_KEY = defaultProfile.api_key;
    overrides.OPENAI_BASE_URL = defaultProfile.base_url;
    overrides.OPENAI_MODEL = defaultProfile.model;
  }

  const thinkingProfile = byId.get(settings.assignments.thinking);
  if (thinkingProfile) {
    overrides.THINKING_OPENAI_API_KEY = thinkingProfile.api_key;
    overrides.THINKING_OPENAI_BASE_URL = thinkingProfile.base_url;
    overrides.THINKING_OPENAI_MODEL = thinkingProfile.model;
  }

  const embeddingProfile = byId.get(settings.assignments.embedding);
  if (embeddingProfile) {
    overrides.OPENAI_EMBEDDING_MODEL = embeddingProfile.model;
    overrides.EMBEDDING_OPENAI_API_KEY = embeddingProfile.api_key;
    overrides.EMBEDDING_OPENAI_BASE_URL = embeddingProfile.base_url;
  }

  return overrides;
}
