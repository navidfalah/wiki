import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const { tmpRoot } = vi.hoisted(() => {
  const fs: typeof import('node:fs') = require('node:fs');
  const os: typeof import('node:os') = require('node:os');
  const path: typeof import('node:path') = require('node:path');
  return { tmpRoot: fs.mkdtempSync(path.join(os.tmpdir(), 'rag-settings-test-')) };
});

vi.mock('../paths', () => ({ PROJECT_ROOT: tmpRoot }));

import { loadRagSettings, RagSettingsError, saveRagSettings } from './ragSettings';

const SETTINGS_FILE = path.join(tmpRoot, 'data', 'rag_settings.json');

const DEFAULTS = {
  architecture: 'hybrid',
  retrieval_mode: 'hybrid_rerank',
  top_k: 5,
  bm25_k1: 1.5,
  bm25_b: 0.75,
  use_vector_store: false,
  answer_mode: 'auto',
};

afterEach(() => {
  if (fs.existsSync(SETTINGS_FILE)) fs.rmSync(SETTINGS_FILE);
});

afterAll(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('loadRagSettings', () => {
  it('returns the defaults when no settings file exists', () => {
    expect(loadRagSettings()).toEqual(DEFAULTS);
  });

  it('returns the defaults when the settings file has invalid JSON', () => {
    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, '{ not json');
    expect(loadRagSettings()).toEqual(DEFAULTS);
  });

  it('falls back to per-field defaults for unrecognized enum values', () => {
    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ architecture: 'bogus', retrieval_mode: 'bogus', answer_mode: 'bogus' }));
    const settings = loadRagSettings();
    expect(settings.architecture).toBe('hybrid');
    expect(settings.retrieval_mode).toBe('hybrid_rerank');
    expect(settings.answer_mode).toBe('auto');
  });

  it('falls back to defaults for non-numeric-string fields', () => {
    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ top_k: 'nope', bm25_k1: 'nope', bm25_b: 'nope' }));
    const settings = loadRagSettings();
    expect(settings.top_k).toBe(DEFAULTS.top_k);
    expect(settings.bm25_k1).toBe(DEFAULTS.bm25_k1);
    expect(settings.bm25_b).toBe(DEFAULTS.bm25_b);
  });

  it('falls back to the default top_k when the field is missing, but coerces null bm25 values to 0', () => {
    // Number(null) is 0, which is finite -- so unlike top_k (also checked for
    // > 0), a null bm25_k1/bm25_b is accepted as 0 rather than falling back.
    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ bm25_k1: null, bm25_b: null }));
    const settings = loadRagSettings();
    expect(settings.top_k).toBe(DEFAULTS.top_k);
    expect(settings.bm25_k1).toBe(0);
    expect(settings.bm25_b).toBe(0);
  });

  it('floors a fractional top_k', () => {
    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ top_k: 7.9 }));
    expect(loadRagSettings().top_k).toBe(7);
  });

  it('treats a non-positive top_k as invalid and falls back to the default', () => {
    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ top_k: 0 }));
    expect(loadRagSettings().top_k).toBe(DEFAULTS.top_k);
  });

  it('coerces use_vector_store to a boolean', () => {
    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ use_vector_store: 'yes' }));
    expect(loadRagSettings().use_vector_store).toBe(true);
  });

  it('round-trips valid values already on disk', () => {
    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({
      architecture: 'graph',
      retrieval_mode: 'bm25',
      top_k: 12,
      bm25_k1: 2.1,
      bm25_b: 0.4,
      use_vector_store: true,
      answer_mode: 'extractive',
    }));
    expect(loadRagSettings()).toEqual({
      architecture: 'graph',
      retrieval_mode: 'bm25',
      top_k: 12,
      bm25_k1: 2.1,
      bm25_b: 0.4,
      use_vector_store: true,
      answer_mode: 'extractive',
    });
  });
});

describe('saveRagSettings', () => {
  it('rejects a non-object payload', () => {
    expect(() => saveRagSettings(null)).toThrow(RagSettingsError);
    expect(() => saveRagSettings('nope')).toThrow(RagSettingsError);
  });

  it('rejects an invalid architecture', () => {
    expect(() => saveRagSettings({ architecture: 'bogus' })).toThrow(/architecture/);
  });

  it('rejects an invalid retrieval_mode', () => {
    expect(() => saveRagSettings({ retrieval_mode: 'bogus' })).toThrow(/retrieval_mode/);
  });

  it('rejects an invalid answer_mode', () => {
    expect(() => saveRagSettings({ answer_mode: 'bogus' })).toThrow(/answer_mode/);
  });

  it('rejects a non-positive top_k', () => {
    expect(() => saveRagSettings({ top_k: 0 })).toThrow(/top_k/);
    expect(() => saveRagSettings({ top_k: -3 })).toThrow(RagSettingsError);
  });

  it('rejects a non-numeric bm25_k1 or bm25_b', () => {
    expect(() => saveRagSettings({ bm25_k1: 'nope' })).toThrow(/bm25_k1/);
    expect(() => saveRagSettings({ bm25_b: 'nope' })).toThrow(/bm25_b/);
  });

  it('persists valid settings and returns them', () => {
    const saved = saveRagSettings({ architecture: 'naive', top_k: 8 });
    expect(saved.architecture).toBe('naive');
    expect(saved.top_k).toBe(8);
    expect(fs.existsSync(SETTINGS_FILE)).toBe(true);
    expect(loadRagSettings()).toEqual(saved);
  });

  it('preserves existing fields that are not part of the update', () => {
    saveRagSettings({ architecture: 'fusion', top_k: 3, bm25_k1: 1.9 });
    const updated = saveRagSettings({ top_k: 9 });
    expect(updated.architecture).toBe('fusion');
    expect(updated.bm25_k1).toBe(1.9);
    expect(updated.top_k).toBe(9);
  });

  it('floors a fractional top_k on save', () => {
    const saved = saveRagSettings({ top_k: 4.6 });
    expect(saved.top_k).toBe(4);
  });
});
