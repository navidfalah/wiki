/**
 * RAG presets: named snapshots of ragSettings.ts's RagSettings, so the RAG
 * Architecture page can save several tuned configurations (e.g. "Fast BM25"
 * vs. "Accurate hybrid+rerank") and switch the active settings between them
 * with one click, instead of only ever having the single active config.
 *
 * Persisted to data/rag_presets.json as a flat array -- small enough (a
 * handful of presets at most) that there's no need for pipelineRuns.ts's
 * index-file-plus-per-record-file split.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT_ROOT } from '../paths';
import { buildRagSettings, loadRagSettings, RagSettings, RagSettingsError, saveRagSettings } from './ragSettings';

export const RAG_PRESETS_FILE = path.join(PROJECT_ROOT, 'data', 'rag_presets.json');

export interface RagPreset {
  id: string;
  name: string;
  settings: RagSettings;
  created_at: string;
}

function readJsonSafe(filePath: string): any | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function writePresets(presets: RagPreset[]): void {
  fs.mkdirSync(path.dirname(RAG_PRESETS_FILE), { recursive: true });
  fs.writeFileSync(RAG_PRESETS_FILE, JSON.stringify(presets, null, 2));
}

export function listRagPresets(): RagPreset[] {
  const parsed = readJsonSafe(RAG_PRESETS_FILE);
  return Array.isArray(parsed) ? parsed : [];
}

/** Saves `settingsInput` (typically the form currently on screen, not
 * necessarily the active settings) as a preset named `name` -- creating it,
 * or overwriting the existing preset of that name (case-insensitive). Does
 * not touch the active rag_settings.json; use applyRagPreset for that. */
export function saveRagPreset(name: string, settingsInput: any): RagPreset {
  const trimmed = String(name ?? '').trim();
  if (!trimmed) {
    throw new RagSettingsError('Preset needs a name');
  }
  const settings = buildRagSettings(settingsInput, loadRagSettings());
  const presets = listRagPresets();
  const existing = presets.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
  const preset: RagPreset = {
    id: existing?.id ?? crypto.randomUUID(),
    name: trimmed,
    settings,
    created_at: existing?.created_at ?? new Date().toISOString(),
  };
  const next = existing ? presets.map((p) => (p.id === preset.id ? preset : p)) : [...presets, preset];
  writePresets(next);
  return preset;
}

/** Points the active rag_settings.json at a saved preset's settings. */
export function applyRagPreset(id: string): RagSettings {
  const preset = listRagPresets().find((p) => p.id === id);
  if (!preset) {
    throw new RagSettingsError('Unknown preset id');
  }
  return saveRagSettings(preset.settings);
}

export function deleteRagPreset(id: string): { removed: boolean } {
  const presets = listRagPresets();
  const next = presets.filter((p) => p.id !== id);
  if (next.length === presets.length) return { removed: false };
  writePresets(next);
  return { removed: true };
}
