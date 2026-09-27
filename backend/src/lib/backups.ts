/**
 * Backups of everything that can't be regenerated for free:
 *
 * - `data/`: raw sources, compiler state, users, sessions, settings, chat
 *   sessions, the LLM response cache, page history and pipeline runs. The
 *   backups directory itself is excluded.
 * - `wiki-app/docs/`: the compiled pages, and `wiki-app/static/media/`: media
 *   extracted during compiles.
 * - `compiler/temp_output/index.json`: the topic index.
 *
 * Archives are `data/backups/wissensbau-<stamp>[-<label>].tar.gz`, written by
 * the system `tar` from an explicit list of **regular files only**. Source
 * folder mirrors under data/raw are symlinks to folders outside the project;
 * they aren't copied, and `syncSymlinks()` recreates them from
 * data/sources.json after a restore. Because of that, restore can reject any
 * archive containing a link, device or absolute/`..` path. That blocks the
 * classic tar attack where an uploaded archive plants a symlink and then
 * writes through it.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export interface BackupRoots {
  projectRoot: string;
  backupsDir: string;
}

export interface BackupInfo {
  name: string;
  size_bytes: number;
  created_at: string;
}

const NAME_RE = /^wissensbau-\d{8}T\d{6}Z(-[a-z0-9-]{1,40})?\.tar\.gz$/;
const INCLUDED_DIRS = ['data', 'wiki-app/docs', 'wiki-app/static/media'];
const INCLUDED_FILES = ['compiler/temp_output/index.json'];

export class BackupError extends Error {}

export function isBackupName(name: string): boolean {
  return NAME_RE.test(name);
}

function stamp(now: Date): string {
  return now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

/** Relative paths of every regular file to back up. */
export function collectFiles(roots: BackupRoots): string[] {
  const files: string[] = [];
  const backupsRel = path.relative(roots.projectRoot, roots.backupsDir);
  const walk = (rel: string) => {
    const full = path.join(roots.projectRoot, rel);
    let stat: fs.Stats;
    try {
      stat = fs.lstatSync(full);
    } catch {
      return;
    }
    if (stat.isSymbolicLink()) return;
    if (stat.isDirectory()) {
      if (rel === backupsRel) return;
      for (const name of fs.readdirSync(full).sort()) walk(path.posix.join(rel, name));
    } else if (stat.isFile() && !rel.endsWith('.tmp')) {
      files.push(rel);
    }
  };
  for (const dir of INCLUDED_DIRS) walk(dir);
  for (const file of INCLUDED_FILES) walk(file);
  return files;
}

function runTar(args: string[], input?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('tar', args);
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (c) => (stdout += c));
    child.stderr.on('data', (c) => (stderr += c));
    child.on('error', (err) => reject(new BackupError(`tar failed to start: ${err.message}`)));
    child.on('close', (code) => (code === 0 ? resolve(stdout) : reject(new BackupError(`tar exited ${code}: ${stderr.trim()}`))));
    if (input !== undefined) child.stdin.end(input);
    else child.stdin.end();
  });
}

export async function createBackup(roots: BackupRoots, label = '', now: Date = new Date()): Promise<BackupInfo> {
  fs.mkdirSync(roots.backupsDir, { recursive: true });
  const safeLabel = label.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  let name = `wissensbau-${stamp(now)}${safeLabel ? `-${safeLabel}` : ''}.tar.gz`;
  for (let n = 2; fs.existsSync(path.join(roots.backupsDir, name)); n++) {
    name = `wissensbau-${stamp(now)}-${safeLabel ? `${safeLabel}-` : ''}${n}.tar.gz`;
  }
  const target = path.join(roots.backupsDir, name);
  const partial = `${target}.partial`;
  const files = collectFiles(roots);
  try {
    await runTar(['-czf', partial, '-C', roots.projectRoot, '--null', '--no-recursion', '-T', '-'], files.map((f) => `${f}\0`).join(''));
    fs.renameSync(partial, target);
  } finally {
    fs.rmSync(partial, { force: true });
  }
  return describe(roots, name);
}

function describe(roots: BackupRoots, name: string): BackupInfo {
  const stat = fs.statSync(path.join(roots.backupsDir, name));
  return { name, size_bytes: stat.size, created_at: stat.mtime.toISOString() };
}

export function listBackups(roots: BackupRoots): BackupInfo[] {
  if (!fs.existsSync(roots.backupsDir)) return [];
  return fs
    .readdirSync(roots.backupsDir)
    .filter(isBackupName)
    .map((name) => describe(roots, name))
    .sort((a, b) => b.name.localeCompare(a.name));
}

export function backupPath(roots: BackupRoots, name: string): string {
  if (!isBackupName(name)) throw new BackupError(`Invalid backup name: ${name}`);
  const full = path.join(roots.backupsDir, name);
  if (!fs.existsSync(full)) throw new BackupError(`Backup not found: ${name}`);
  return full;
}

export function deleteBackup(roots: BackupRoots, name: string): void {
  fs.unlinkSync(backupPath(roots, name));
}

/** Delete the oldest scheduled backups beyond `keep`. Manually created and
 * pre-restore backups (which carry a label) are never pruned. */
export function pruneScheduled(roots: BackupRoots, keep: number): string[] {
  const scheduled = listBackups(roots).filter((b) => /-scheduled(-\d+)?\.tar\.gz$/.test(b.name));
  const removed = scheduled.slice(Math.max(0, keep)).map((b) => b.name);
  for (const name of removed) fs.unlinkSync(path.join(roots.backupsDir, name));
  return removed;
}

const ALLOWED_ENTRY_RE = /^(data\/(?!backups(\/|$))[^\0]+|wiki-app\/docs\/[^\0]+|wiki-app\/static\/media\/[^\0]+|compiler\/temp_output\/index\.json)$/;

/** Every entry must be a regular file or directory inside the allowed
 * trees, with no absolute or `..` path. Returns the file entries. */
export async function validateArchive(archive: string): Promise<string[]> {
  const listing = await runTar(['-tvzf', archive]);
  const files: string[] = [];
  for (const line of listing.split('\n')) {
    if (!line.trim()) continue;
    const type = line[0];
    // GNU tar -tv: "<perms> <owner>/<group> <size> <date> <time> <name>"
    const nameMatch = /^\S+\s+\S+\s+\d+\s+\S+\s+\S+\s+(.*)$/.exec(line);
    const name = nameMatch?.[1] ?? '';
    if (type !== '-' && type !== 'd') throw new BackupError(`Archive contains a link or special file: ${name || line}`);
    if (!name || name.startsWith('/') || name.split('/').includes('..')) throw new BackupError(`Unsafe path in archive: ${name}`);
    const clean = name.replace(/\/$/, '');
    if (type === 'd') {
      if (!['data', 'wiki-app', 'wiki-app/docs', 'wiki-app/static', 'wiki-app/static/media', 'compiler', 'compiler/temp_output'].includes(clean) && !ALLOWED_ENTRY_RE.test(clean)) {
        throw new BackupError(`Unexpected directory in archive: ${clean}`);
      }
      continue;
    }
    if (!ALLOWED_ENTRY_RE.test(clean)) throw new BackupError(`Unexpected file in archive: ${clean}`);
    files.push(clean);
  }
  if (!files.length) throw new BackupError('Archive is empty');
  return files;
}

/** Restore an archive over the project. Takes a `pre-restore` backup first,
 * replaces wiki-app/docs/*.md wholesale (pages absent from the backup are
 * removed), and overwrites every other file the archive contains; files
 * not in the archive are left alone. Returns the safety backup's name. */
/** Refuse entries whose parent path is a symlink on disk -- tar would
 * write through it, e.g. into a source folder mirrored under data/raw. */
function assertNoSymlinkedParents(projectRoot: string, files: string[]): void {
  for (const file of files) {
    const parts = file.split('/');
    for (let i = 1; i < parts.length; i++) {
      const ancestor = path.join(projectRoot, ...parts.slice(0, i));
      let stat: fs.Stats;
      try {
        stat = fs.lstatSync(ancestor);
      } catch {
        break; // doesn't exist yet: tar will create a real directory
      }
      if (stat.isSymbolicLink()) throw new BackupError(`Archive would write through a symlink: ${file}`);
    }
  }
}

export async function restoreBackup(roots: BackupRoots, archive: string): Promise<{ restoredFiles: number; safetyBackup: string }> {
  const files = await validateArchive(archive);
  assertNoSymlinkedParents(roots.projectRoot, files);
  const safety = await createBackup(roots, 'pre-restore');
  const docsDir = path.join(roots.projectRoot, 'wiki-app', 'docs');
  if (fs.existsSync(docsDir)) {
    for (const name of fs.readdirSync(docsDir)) {
      if (name.endsWith('.md')) fs.unlinkSync(path.join(docsDir, name));
    }
  }
  await runTar(['-xzf', archive, '-C', roots.projectRoot, '--no-same-owner', '--no-same-permissions']);
  return { restoredFiles: files.length, safetyBackup: safety.name };
}
