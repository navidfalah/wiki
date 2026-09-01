/**
 * Port of synthesizer.py's discover_raw_source_files() -- every recognized
 * raw source file under data/raw/, excluding _archive/ and dotfiles.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { STATE_FILE } from '../paths';
import { walkEntries } from './fsWalk';

export function loadState(): { files: Record<string, any> } {
  if (!fs.existsSync(STATE_FILE)) return { files: {} };
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  } catch {
    return { files: {} };
  }
}

export const ALL_SOURCE_EXTENSIONS = new Set([
  '.txt',
  '.md',
  '.eml',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.pdf',
  '.csv',
  '.json',
  '.docx',
  '.xlsx',
  '.pptx',
  '.zip',
]);

export function discoverRawSourceFiles(rawDir: string): string[] {
  const files: string[] = [];
  const walk = (dir: string) => {
    walkEntries(dir, (full, name, stat) => {
      if (name.startsWith('.') || name === '_archive') return;
      if (stat.isDirectory()) walk(full);
      else if (stat.isFile() && ALL_SOURCE_EXTENSIONS.has(path.extname(name).toLowerCase())) {
        files.push(full);
      }
    });
  };
  walk(rawDir);
  return [...new Set(files)].sort();
}

export function computeMd5(filePath: string): string {
  return crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex');
}
