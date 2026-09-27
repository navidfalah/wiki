import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  BackupError,
  collectFiles,
  createBackup,
  isBackupName,
  listBackups,
  pruneScheduled,
  restoreBackup,
  validateArchive,
  type BackupRoots,
} from './backups';

let tmp: string;
let roots: BackupRoots;
let external: string;

function write(rel: string, content: string) {
  const full = path.join(roots.projectRoot, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}
const read = (rel: string) => fs.readFileSync(path.join(roots.projectRoot, rel), 'utf-8');
const exists = (rel: string) => fs.existsSync(path.join(roots.projectRoot, rel));

/** Build an archive from `entries` (name -> content) with GNU tar, keeping names verbatim. */
function craftArchive(entries: Record<string, string>, extraArgs: string[] = []): string {
  const staging = fs.mkdtempSync(path.join(tmp, 'craft-'));
  const names: string[] = [];
  Object.values(entries).forEach((content, i) => {
    fs.writeFileSync(path.join(staging, `f${i}`), content);
    names.push(`f${i}`);
  });
  const out = path.join(tmp, `crafted-${Date.now()}-${Math.random()}.tar.gz`);
  const transforms = Object.keys(entries).flatMap((name, i) => ['--transform', `s,^f${i}$,${name},`]);
  execFileSync('tar', ['-czPf', out, '-C', staging, ...transforms, ...extraArgs, ...names]);
  return out;
}

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'backups-'));
  roots = { projectRoot: path.join(tmp, 'project'), backupsDir: path.join(tmp, 'project', 'data', 'backups') };
  external = path.join(tmp, 'external-source');
  fs.mkdirSync(external);
  fs.writeFileSync(path.join(external, 'outside.txt'), 'external');
  write('data/raw/notes/a.txt', 'note A');
  write('data/users.json', '{"users":[]}');
  write('data/backups/old-junk.txt', 'not backed up');
  write('wiki-app/docs/page.md', '# Page v1');
  write('wiki-app/static/media/diagram.png', 'png-bytes');
  write('compiler/temp_output/index.json', '{"topics":{}}');
  write('compiler/temp_output/draft.md', 'not backed up');
  fs.symlinkSync(external, path.join(roots.projectRoot, 'data/raw/mirror'));
});
afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }));

describe('collectFiles / createBackup', () => {
  it('includes data, docs and the topic index; skips backups, symlinks and drafts', () => {
    expect(collectFiles(roots)).toEqual([
      'data/raw/notes/a.txt',
      'data/users.json',
      'wiki-app/docs/page.md',
      'wiki-app/static/media/diagram.png',
      'compiler/temp_output/index.json',
    ]);
  });

  it('writes a valid archive and lists it', async () => {
    const info = await createBackup(roots, 'manual', new Date('2026-09-27T12:00:00Z'));
    expect(info.name).toBe('wissensbau-20260927T120000Z-manual.tar.gz');
    expect(await validateArchive(path.join(roots.backupsDir, info.name))).toHaveLength(5);
    expect(listBackups(roots).map((b) => b.name)).toEqual([info.name]);
  });

  it('never overwrites a backup taken in the same second', async () => {
    const now = new Date('2026-09-27T12:00:00Z');
    const a = await createBackup(roots, 'scheduled', now);
    const b = await createBackup(roots, 'scheduled', now);
    expect(a.name).not.toBe(b.name);
    expect(isBackupName(b.name)).toBe(true);
  });
});

describe('restoreBackup', () => {
  it('round-trips: restores changed and deleted files, drops pages added since', async () => {
    const backup = await createBackup(roots, 'manual');
    write('wiki-app/docs/page.md', '# Page v2');
    write('wiki-app/docs/new-since.md', '# New');
    fs.unlinkSync(path.join(roots.projectRoot, 'data/raw/notes/a.txt'));

    const result = await restoreBackup(roots, path.join(roots.backupsDir, backup.name));

    expect(result.restoredFiles).toBe(5);
    expect(read('wiki-app/docs/page.md')).toBe('# Page v1');
    expect(exists('wiki-app/docs/new-since.md')).toBe(false);
    expect(read('data/raw/notes/a.txt')).toBe('note A');
    expect(fs.lstatSync(path.join(roots.projectRoot, 'data/raw/mirror')).isSymbolicLink()).toBe(true);
    // The state just before the restore is kept as its own backup.
    expect(result.safetyBackup).toMatch(/-pre-restore\.tar\.gz$/);
    expect(listBackups(roots).map((b) => b.name)).toContain(result.safetyBackup);
  });

  it('refuses to write through a symlinked folder on disk', async () => {
    const evil = craftArchive({ 'data/raw/mirror/pwned.txt': 'x' });
    await expect(restoreBackup(roots, evil)).rejects.toThrow(/through a symlink/);
    expect(fs.existsSync(path.join(external, 'pwned.txt'))).toBe(false);
  });
});

describe('validateArchive rejects unsafe archives', () => {
  it.each([
    ['a parent-directory path', { 'data/../../escape.txt': 'x' }, /Unsafe path/],
    ['an absolute path', { '/tmp/escape.txt': 'x' }, /Unsafe path/],
    ['a file outside the backed-up trees', { 'backend/src/index.ts': 'x' }, /Unexpected file/],
    ['a file inside data/backups', { 'data/backups/x.tar.gz': 'x' }, /Unexpected file/],
  ])('%s', async (_label, entries, message) => {
    await expect(validateArchive(craftArchive(entries))).rejects.toThrow(message);
  });

  it('a symlink entry', async () => {
    const staging = fs.mkdtempSync(path.join(tmp, 'link-'));
    fs.mkdirSync(path.join(staging, 'data'));
    fs.symlinkSync('/etc', path.join(staging, 'data', 'etc'));
    const out = path.join(tmp, 'link.tar.gz');
    execFileSync('tar', ['-czf', out, '-C', staging, 'data/etc']);
    await expect(validateArchive(out)).rejects.toBeInstanceOf(BackupError);
  });

  it('an empty archive', async () => {
    const staging = fs.mkdtempSync(path.join(tmp, 'empty-'));
    fs.mkdirSync(path.join(staging, 'data'));
    const out = path.join(tmp, 'empty.tar.gz');
    execFileSync('tar', ['-czf', out, '-C', staging, 'data']);
    await expect(validateArchive(out)).rejects.toThrow(/empty/);
  });
});

describe('names and retention', () => {
  it.each(['../x.tar.gz', 'wissensbau-20260927T120000Z.tar.gz/../../x', 'other.tar.gz', 'wissensbau-now.tar.gz'])(
    'rejects %j',
    (name) => expect(isBackupName(name)).toBe(false),
  );

  it('prunes only scheduled backups beyond the limit', async () => {
    for (let i = 0; i < 4; i++) await createBackup(roots, 'scheduled', new Date(Date.UTC(2026, 0, 1, 0, 0, i)));
    await createBackup(roots, 'manual', new Date(Date.UTC(2025, 0, 1)));
    const removed = pruneScheduled(roots, 2);
    expect(removed).toHaveLength(2);
    const left = listBackups(roots).map((b) => b.name);
    expect(left.filter((n) => n.includes('scheduled'))).toHaveLength(2);
    expect(left.some((n) => n.includes('manual'))).toBe(true);
  });
});

describe('scheduled backups', () => {
  it('takes one when none exists or the newest is older than the interval', async () => {
    const { runScheduledBackupIfDue } = await import('./backupScheduler');
    process.env.BACKUP_INTERVAL_HOURS = '24';
    process.env.BACKUP_KEEP = '2';
    try {
      const first = await runScheduledBackupIfDue(roots);
      expect(first).toMatch(/-scheduled\.tar\.gz$/);
      expect(await runScheduledBackupIfDue(roots)).toBeNull(); // not due yet
      const later = new Date(Date.now() + 25 * 3600 * 1000);
      fs.utimesSync(path.join(roots.backupsDir, first!), new Date(Date.now() - 25 * 3600 * 1000), new Date(Date.now() - 25 * 3600 * 1000));
      expect(await runScheduledBackupIfDue(roots, later)).toMatch(/-scheduled/);
    } finally {
      delete process.env.BACKUP_INTERVAL_HOURS;
      delete process.env.BACKUP_KEEP;
    }
  });

  it('does nothing when disabled', async () => {
    const { runScheduledBackupIfDue } = await import('./backupScheduler');
    process.env.BACKUP_INTERVAL_HOURS = '0';
    try {
      expect(await runScheduledBackupIfDue(roots)).toBeNull();
      expect(listBackups(roots)).toEqual([]);
    } finally {
      delete process.env.BACKUP_INTERVAL_HOURS;
    }
  });
});
