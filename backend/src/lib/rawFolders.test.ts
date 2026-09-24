import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createFolder, deleteFile, deleteFolder, FolderError, moveFile, uploadFiles } from './rawFolders';

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'raw-folders-test-'));
let rawDir: string;

beforeEach(() => {
  rawDir = fs.mkdtempSync(path.join(tmpRoot, 'raw-'));
});

afterEach(() => {
  fs.rmSync(rawDir, { recursive: true, force: true });
});

afterAll(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

const NO_MANAGED = new Set<string>();

describe('createFolder', () => {
  it('creates a folder at the root', () => {
    const rel = createFolder(rawDir, '', 'notes', NO_MANAGED);
    expect(rel).toBe('notes');
    expect(fs.statSync(path.join(rawDir, 'notes')).isDirectory()).toBe(true);
  });

  it('throws with a clear message when the folder already exists, without touching it', () => {
    createFolder(rawDir, '', 'notes', NO_MANAGED);
    fs.writeFileSync(path.join(rawDir, 'notes', 'marker.txt'), 'keep me');

    expect(() => createFolder(rawDir, '', 'notes', NO_MANAGED)).toThrow(FolderError);
    expect(() => createFolder(rawDir, '', 'notes', NO_MANAGED)).toThrow(/already exists/i);
    // The pre-existing folder (and its contents) must be untouched -- the
    // fix here was replacing an existsSync-then-mkdirSync check with an
    // atomic mkdirSync so a second concurrent create can never silently
    // land on/wipe the first one's directory.
    expect(fs.readFileSync(path.join(rawDir, 'notes', 'marker.txt'), 'utf-8')).toBe('keep me');
  });
});

describe('uploadFiles', () => {
  it('writes an uploaded file into the destination folder', () => {
    const saved = uploadFiles(rawDir, '', [{ originalName: 'a.txt', buffer: Buffer.from('hello') }], NO_MANAGED);
    expect(saved).toEqual(['a.txt']);
    expect(fs.readFileSync(path.join(rawDir, 'a.txt'), 'utf-8')).toBe('hello');
  });

  it('refuses to overwrite an existing file, leaving its content untouched', () => {
    fs.writeFileSync(path.join(rawDir, 'a.txt'), 'original content');

    expect(() =>
      uploadFiles(rawDir, '', [{ originalName: 'a.txt', buffer: Buffer.from('new content') }], NO_MANAGED),
    ).toThrow(/already exists/i);
    // Fixed bug: this used to be existsSync-then-writeFileSync (which
    // truncates unconditionally), so a race could silently clobber the
    // original. writeFileSync with {flag: 'wx'} now fails atomically
    // instead of ever truncating an existing file.
    expect(fs.readFileSync(path.join(rawDir, 'a.txt'), 'utf-8')).toBe('original content');
  });
});

describe('moveFile', () => {
  it('moves a file to another folder', () => {
    fs.writeFileSync(path.join(rawDir, 'a.txt'), 'content');
    createFolder(rawDir, '', 'archive', NO_MANAGED);

    const newRel = moveFile(rawDir, 'a.txt', 'archive', NO_MANAGED);

    expect(newRel).toBe('archive/a.txt');
    expect(fs.existsSync(path.join(rawDir, 'a.txt'))).toBe(false);
    expect(fs.readFileSync(path.join(rawDir, 'archive', 'a.txt'), 'utf-8')).toBe('content');
  });

  it('refuses to overwrite a same-named file at the destination, leaving both files untouched', () => {
    fs.writeFileSync(path.join(rawDir, 'a.txt'), 'source content');
    createFolder(rawDir, '', 'archive', NO_MANAGED);
    fs.writeFileSync(path.join(rawDir, 'archive', 'a.txt'), 'destination content');

    expect(() => moveFile(rawDir, 'a.txt', 'archive', NO_MANAGED)).toThrow(/already exists/i);
    // Fixed bug: plain renameSync would have silently overwritten the
    // destination (POSIX rename() replaces an existing target rather than
    // failing) -- moveFile now uses linkSync (which fails atomically with
    // EEXIST) followed by unlinking the source, so a colliding move fails
    // cleanly instead of destroying data, and the source is only removed
    // once the link succeeded.
    expect(fs.readFileSync(path.join(rawDir, 'a.txt'), 'utf-8')).toBe('source content');
    expect(fs.readFileSync(path.join(rawDir, 'archive', 'a.txt'), 'utf-8')).toBe('destination content');
  });
});

describe('deleteFolder / deleteFile', () => {
  it('deletes an empty folder', () => {
    createFolder(rawDir, '', 'notes', NO_MANAGED);
    deleteFolder(rawDir, 'notes', NO_MANAGED);
    expect(fs.existsSync(path.join(rawDir, 'notes'))).toBe(false);
  });

  it('refuses to delete a non-empty folder', () => {
    createFolder(rawDir, '', 'notes', NO_MANAGED);
    fs.writeFileSync(path.join(rawDir, 'notes', 'a.txt'), 'x');
    expect(() => deleteFolder(rawDir, 'notes', NO_MANAGED)).toThrow(/not empty/i);
  });

  it('deletes a file', () => {
    fs.writeFileSync(path.join(rawDir, 'a.txt'), 'x');
    deleteFile(rawDir, 'a.txt', NO_MANAGED);
    expect(fs.existsSync(path.join(rawDir, 'a.txt'))).toBe(false);
  });
});
