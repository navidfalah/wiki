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

// Extensions the dashboard can render as plain text in the preview modal --
// everything else (PDF, images, docx/xlsx/pptx/zip) needs a binary-aware
// viewer (native <embed>/<img>) or a download link instead.
export const TEXT_PREVIEW_EXTENSIONS = new Set(['.txt', '.md', '.eml', '.csv', '.json']);
export const IMAGE_PREVIEW_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);

const MIME_TYPES: Record<string, string> = {
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.eml': 'message/rfc822',
  '.csv': 'text/csv; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.zip': 'application/zip',
};

export function mimeTypeFor(filePath: string): string {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}
