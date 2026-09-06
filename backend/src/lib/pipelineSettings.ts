/**
 * Pipeline Architecture: persisted defaults for the compiler pipeline's
 * optional stages/behaviors -- the critic pass (extraction_critic.py),
 * active-learning corrections (active_learning.py), PII redaction
 * (pii_redaction.py), live internet search enrichment (web_search.py), and
 * which top-level data/raw/ folders participate at all. These already
 * exist as compiler/main.py CLI flags (also readable
 * from WIKI_* env vars, see main.py's argparse defaults) that
 * pythonBridge.ts's streamCompilerBuild() has always been able to pass
 * per-run; this file gives the Pipeline Architecture settings page a place
 * to persist a *default* choice so every build behaves that way without
 * re-selecting it each time. Persisted to data/pipeline_settings.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT_ROOT } from '../paths';

export const PIPELINE_SETTINGS_FILE = path.join(PROJECT_ROOT, 'data', 'pipeline_settings.json');

export interface PipelineSettings {
  critic_pass: boolean;
  critic_samples: number;
  critic_regenerate: boolean;
  use_corrections: boolean;
  redact_pii: boolean;
  web_search: boolean;
  excluded_folders: string[];
}

const DEFAULT_SETTINGS: PipelineSettings = {
  critic_pass: false,
  critic_samples: 1,
  critic_regenerate: false,
  use_corrections: false,
  redact_pii: false,
  web_search: false,
  excluded_folders: [],
};

function readJsonSafe(filePath: string): any | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

export function loadPipelineSettings(): PipelineSettings {
  const parsed = readJsonSafe(PIPELINE_SETTINGS_FILE);
  if (!parsed) return { ...DEFAULT_SETTINGS };
  const samples = Number(parsed.critic_samples);
  return {
    critic_pass: Boolean(parsed.critic_pass),
    critic_samples: Number.isFinite(samples) && samples > 0 ? Math.floor(samples) : DEFAULT_SETTINGS.critic_samples,
    critic_regenerate: Boolean(parsed.critic_regenerate),
    use_corrections: Boolean(parsed.use_corrections),
    redact_pii: Boolean(parsed.redact_pii),
    web_search: Boolean(parsed.web_search),
    excluded_folders: Array.isArray(parsed.excluded_folders)
      ? parsed.excluded_folders.filter((f: unknown) => typeof f === 'string' && f.trim()).map((f: string) => f.trim())
      : [],
  };
}

export class PipelineSettingsError extends Error {}

export function savePipelineSettings(input: any): PipelineSettings {
  if (!input || typeof input !== 'object') {
    throw new PipelineSettingsError('Invalid settings payload');
  }
  const criticSamples = Number(input.critic_samples);
  if (input.critic_samples !== undefined && (!Number.isFinite(criticSamples) || criticSamples < 1)) {
    throw new PipelineSettingsError('"critic_samples" must be a positive number');
  }
  if (input.excluded_folders !== undefined && !Array.isArray(input.excluded_folders)) {
    throw new PipelineSettingsError('"excluded_folders" must be an array of strings');
  }

  const settings: PipelineSettings = {
    critic_pass: Boolean(input.critic_pass),
    critic_samples: Number.isFinite(criticSamples) && criticSamples > 0 ? Math.floor(criticSamples) : DEFAULT_SETTINGS.critic_samples,
    critic_regenerate: Boolean(input.critic_regenerate),
    use_corrections: Boolean(input.use_corrections),
    redact_pii: Boolean(input.redact_pii),
    web_search: Boolean(input.web_search),
    excluded_folders: Array.isArray(input.excluded_folders)
      ? input.excluded_folders.filter((f: unknown) => typeof f === 'string' && f.trim()).map((f: string) => f.trim())
      : [],
  };
  fs.mkdirSync(path.dirname(PIPELINE_SETTINGS_FILE), { recursive: true });
  fs.writeFileSync(PIPELINE_SETTINGS_FILE, JSON.stringify(settings, null, 2));
  return settings;
}
