import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';

const { tmpRoot } = vi.hoisted(() => {
  const fs: typeof import('node:fs') = require('node:fs');
  const os: typeof import('node:os') = require('node:os');
  const path: typeof import('node:path') = require('node:path');
  return { tmpRoot: fs.mkdtempSync(path.join(os.tmpdir(), 'rag-presets-test-')) };
});

vi.mock('../paths', () => ({ PROJECT_ROOT: tmpRoot }));

import { applyRagPreset, deleteRagPreset, listRagPresets, saveRagPreset } from './ragPresets';
import { loadRagSettings, RagSettingsError } from './ragSettings';

const PRESETS_FILE = path.join(tmpRoot, 'data', 'rag_presets.json');
const SETTINGS_FILE = path.join(tmpRoot, 'data', 'rag_settings.json');

afterEach(() => {
  if (fs.existsSync(PRESETS_FILE)) fs.rmSync(PRESETS_FILE);
  if (fs.existsSync(SETTINGS_FILE)) fs.rmSync(SETTINGS_FILE);
});

afterAll(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('listRagPresets', () => {
  it('returns an empty array when no presets file exists', () => {
    expect(listRagPresets()).toEqual([]);
  });
});

describe('saveRagPreset', () => {
  it('rejects a blank name', () => {
    expect(() => saveRagPreset('', { architecture: 'naive' })).toThrow(RagSettingsError);
    expect(() => saveRagPreset('   ', { architecture: 'naive' })).toThrow(/name/);
  });

  it('rejects an invalid settings payload the same way saveRagSettings would', () => {
    expect(() => saveRagPreset('Fast', { architecture: 'bogus' })).toThrow(/architecture/);
  });

  it('saves a new preset without touching the active settings file', () => {
    const preset = saveRagPreset('Fast BM25', { architecture: 'naive', top_k: 3 });
    expect(preset.name).toBe('Fast BM25');
    expect(preset.settings.architecture).toBe('naive');
    expect(preset.settings.top_k).toBe(3);
    expect(fs.existsSync(SETTINGS_FILE)).toBe(false);
    expect(listRagPresets()).toHaveLength(1);
  });

  it('fills in fields the input omits from the current active settings', () => {
    const preset = saveRagPreset('Partial', { top_k: 11 });
    expect(preset.settings.top_k).toBe(11);
    expect(preset.settings.architecture).toBe(loadRagSettings().architecture);
  });

  it('overwrites the existing preset of the same name (case-insensitive) instead of duplicating', () => {
    const first = saveRagPreset('Accurate', { architecture: 'hybrid', top_k: 5 });
    const second = saveRagPreset('accurate', { architecture: 'hybrid', top_k: 9 });
    expect(second.id).toBe(first.id);
    expect(listRagPresets()).toHaveLength(1);
    expect(listRagPresets()[0].settings.top_k).toBe(9);
  });
});

describe('applyRagPreset', () => {
  it('throws for an unknown preset id', () => {
    expect(() => applyRagPreset('nope')).toThrow(RagSettingsError);
  });

  it('writes the preset settings into the active rag_settings.json', () => {
    const preset = saveRagPreset('Graph', { architecture: 'graph', top_k: 7 });
    const applied = applyRagPreset(preset.id);
    expect(applied.architecture).toBe('graph');
    expect(applied.top_k).toBe(7);
    expect(loadRagSettings()).toEqual(applied);
  });
});

describe('deleteRagPreset', () => {
  it('reports removed: false for an unknown id', () => {
    expect(deleteRagPreset('nope')).toEqual({ removed: false });
  });

  it('removes a saved preset', () => {
    const preset = saveRagPreset('Temp', { architecture: 'naive' });
    expect(deleteRagPreset(preset.id)).toEqual({ removed: true });
    expect(listRagPresets()).toEqual([]);
  });
});
