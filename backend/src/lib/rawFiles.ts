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

// Kept in sync with compiler/synthesizer.py's ALL_SOURCE_EXTENSIONS (text +
// email + media_ingest.IMAGE_EXTENSIONS/AUDIO_EXTENSIONS/FILE_EXTENSIONS).
export const ALL_SOURCE_EXTENSIONS = new Set([
  // Plain text
  '.txt',
  '.md',
  // Email
  '.eml',
  // Images
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.bmp',
  // Audio (transcribed by the compiler when an LLM is configured)
  '.mp3',
  '.wav',
  '.m4a',
  '.ogg',
  '.flac',
  '.aac',
  // Files with text extraction
  '.pdf',
  '.csv',
  '.tsv',
  '.json',
  '.xml',
  '.html',
  '.htm',
  '.yaml',
  '.yml',
  '.log',
  // Files registered as an opaque downloadable attachment
  '.docx',
  '.xlsx',
  '.pptx',
  '.zip',
  '.rtf',
  '.odt',
  '.ods',
  '.odp',
  '.rar',
  '.7z',
  '.tar',
  '.gz',
  '.tgz',
  '.epub',
  '.mp4',
  '.mov',
  '.avi',
  '.mkv',
  '.m4v',
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
// everything else (PDF, images, audio, docx/xlsx/pptx/zip/...) needs a
// binary-aware viewer (native <embed>/<img>/<audio>) or a download link
// instead.
export const TEXT_PREVIEW_EXTENSIONS = new Set([
  '.txt',
  '.md',
  '.eml',
  '.csv',
  '.tsv',
  '.json',
  '.xml',
  '.html',
  '.htm',
  '.yaml',
  '.yml',
  '.log',
]);
export const IMAGE_PREVIEW_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp']);
export const AUDIO_PREVIEW_EXTENSIONS = new Set(['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac']);

const MIME_TYPES: Record<string, string> = {
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.eml': 'message/rfc822',
  '.csv': 'text/csv; charset=utf-8',
  '.tsv': 'text/tab-separated-values; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.yaml': 'application/yaml; charset=utf-8',
  '.yml': 'application/yaml; charset=utf-8',
  '.log': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac',
  '.aac': 'audio/aac',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.rtf': 'application/rtf',
  '.odt': 'application/vnd.oasis.opendocument.text',
  '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
  '.odp': 'application/vnd.oasis.opendocument.presentation',
  '.rar': 'application/vnd.rar',
  '.7z': 'application/x-7z-compressed',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  '.tgz': 'application/gzip',
  '.epub': 'application/epub+zip',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska',
  '.m4v': 'video/x-m4v',
  '.zip': 'application/zip',
};

export function mimeTypeFor(filePath: string): string {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}
