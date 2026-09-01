/**
 * Company profile: free-text context about the organization the wiki
 * belongs to (name, industry, description, etc). Persisted to
 * data/company_settings.json. Purely descriptive today -- it has no
 * wiring into the compiler pipeline yet -- but gives editors one place
 * to keep this context for future use (e.g. as prompt context) instead
 * of scattering it across pages.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT_ROOT } from '../paths';

export const COMPANY_SETTINGS_FILE = path.join(PROJECT_ROOT, 'data', 'company_settings.json');

export interface CompanySettings {
  company_name: string;
  industry: string;
  website: string;
  size: string;
  location: string;
  description: string;
  tone_of_voice: string;
  target_audience: string;
  additional_notes: string;
}

const DEFAULT_SETTINGS: CompanySettings = {
  company_name: '',
  industry: '',
  website: '',
  size: '',
  location: '',
  description: '',
  tone_of_voice: '',
  target_audience: '',
  additional_notes: '',
};

function readJsonSafe(filePath: string): any | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

export function loadCompanySettings(): CompanySettings {
  const parsed = readJsonSafe(COMPANY_SETTINGS_FILE);
  if (!parsed) return { ...DEFAULT_SETTINGS };
  const settings = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof CompanySettings)[]) {
    if (typeof parsed[key] === 'string') settings[key] = parsed[key];
  }
  return settings;
}

export class CompanySettingsError extends Error {}

export function saveCompanySettings(input: any): CompanySettings {
  if (!input || typeof input !== 'object') {
    throw new CompanySettingsError('Invalid settings payload');
  }
  const settings = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof CompanySettings)[]) {
    const value = input[key];
    if (value !== undefined && typeof value !== 'string') {
      throw new CompanySettingsError(`"${key}" must be a string`);
    }
    settings[key] = String(value ?? '').trim();
  }
  fs.mkdirSync(path.dirname(COMPANY_SETTINGS_FILE), { recursive: true });
  fs.writeFileSync(COMPANY_SETTINGS_FILE, JSON.stringify(settings, null, 2));
  return settings;
}
