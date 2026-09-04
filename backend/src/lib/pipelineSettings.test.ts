import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';

const { tmpRoot } = vi.hoisted(() => {
  const fs: typeof import('node:fs') = require('node:fs');
  const os: typeof import('node:os') = require('node:os');
  const path: typeof import('node:path') = require('node:path');
  return { tmpRoot: fs.mkdtempSync(path.join(os.tmpdir(), 'pipeline-settings-test-')) };
});

vi.mock('../paths', () => ({ PROJECT_ROOT: tmpRoot }));

import { loadPipelineSettings, PipelineSettingsError, savePipelineSettings } from './pipelineSettings';

const SETTINGS_FILE = path.join(tmpRoot, 'data', 'pipeline_settings.json');

const DEFAULTS = {
  critic_pass: false,
  critic_samples: 1,
  critic_regenerate: false,
  use_corrections: false,
  redact_pii: false,
  web_search: false,
  excluded_folders: [],
};

afterEach(() => {
  if (fs.existsSync(SETTINGS_FILE)) fs.rmSync(SETTINGS_FILE);
});

afterAll(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('loadPipelineSettings', () => {
  it('returns the defaults when no settings file exists', () => {
    expect(loadPipelineSettings()).toEqual(DEFAULTS);
  });

  it('returns the defaults when the settings file has invalid JSON', () => {
    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, '{ not json');
    expect(loadPipelineSettings()).toEqual(DEFAULTS);
  });

  it('coerces truthy/falsy values on the boolean fields', () => {
    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({
      critic_pass: 1,
      critic_regenerate: 'yes',
      use_corrections: 0,
      redact_pii: null,
      web_search: true,
    }));
    const settings = loadPipelineSettings();
    expect(settings.critic_pass).toBe(true);
    expect(settings.critic_regenerate).toBe(true);
    expect(settings.use_corrections).toBe(false);
    expect(settings.redact_pii).toBe(false);
    expect(settings.web_search).toBe(true);
  });

  it('floors a fractional critic_samples value', () => {
    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ critic_samples: 3.9 }));
    expect(loadPipelineSettings().critic_samples).toBe(3);
  });

  it('falls back to the default critic_samples for non-positive or non-numeric values', () => {
    for (const bad of [0, -5, 'nope', null]) {
      fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ critic_samples: bad }));
      expect(loadPipelineSettings().critic_samples).toBe(DEFAULTS.critic_samples);
    }
  });

  it('falls back to an empty array when excluded_folders is not an array', () => {
    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ excluded_folders: 'not-an-array' }));
    expect(loadPipelineSettings().excluded_folders).toEqual([]);
  });

  it('trims excluded_folders entries and drops non-strings and blanks', () => {
    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ excluded_folders: ['  emails  ', '', '   ', 42, 'invoices'] }));
    expect(loadPipelineSettings().excluded_folders).toEqual(['emails', 'invoices']);
  });
});

describe('savePipelineSettings', () => {
  it('throws when the payload is not an object', () => {
    expect(() => savePipelineSettings(null)).toThrow(PipelineSettingsError);
    expect(() => savePipelineSettings('nope')).toThrow(PipelineSettingsError);
    expect(() => savePipelineSettings(undefined)).toThrow(PipelineSettingsError);
  });

  it('throws when critic_samples is provided but not a positive number', () => {
    expect(() => savePipelineSettings({ critic_samples: 0 })).toThrow(PipelineSettingsError);
    expect(() => savePipelineSettings({ critic_samples: -1 })).toThrow(PipelineSettingsError);
    expect(() => savePipelineSettings({ critic_samples: 'nope' })).toThrow(PipelineSettingsError);
  });

  it('throws when excluded_folders is provided but not an array', () => {
    expect(() => savePipelineSettings({ excluded_folders: 'emails' })).toThrow(PipelineSettingsError);
  });

  it('defaults critic_samples when omitted entirely', () => {
    const settings = savePipelineSettings({});
    expect(settings.critic_samples).toBe(DEFAULTS.critic_samples);
  });

  it('floors a fractional critic_samples value on save', () => {
    const settings = savePipelineSettings({ critic_samples: 2.9 });
    expect(settings.critic_samples).toBe(2);
  });

  it('trims excluded_folders entries and drops non-strings and blanks on save', () => {
    const settings = savePipelineSettings({ excluded_folders: [' emails ', '', 7, 'invoices'] });
    expect(settings.excluded_folders).toEqual(['emails', 'invoices']);
  });

  it('coerces every boolean field independently of the others', () => {
    const settings = savePipelineSettings({ critic_pass: true, redact_pii: 'yes', web_search: 0 });
    expect(settings.critic_pass).toBe(true);
    expect(settings.redact_pii).toBe(true);
    expect(settings.web_search).toBe(false);
    expect(settings.critic_regenerate).toBe(false);
    expect(settings.use_corrections).toBe(false);
  });

  it('persists to disk and round-trips through loadPipelineSettings', () => {
    savePipelineSettings({ critic_pass: true, critic_samples: 4, excluded_folders: ['drafts'] });
    expect(fs.existsSync(SETTINGS_FILE)).toBe(true);
    const reloaded = loadPipelineSettings();
    expect(reloaded).toEqual({
      ...DEFAULTS,
      critic_pass: true,
      critic_samples: 4,
      excluded_folders: ['drafts'],
    });
  });

  it('creates the settings file and its parent directory when neither exists yet', () => {
    fs.rmSync(path.dirname(SETTINGS_FILE), { recursive: true, force: true });
    savePipelineSettings({ web_search: true });
    expect(fs.existsSync(SETTINGS_FILE)).toBe(true);
  });
});
