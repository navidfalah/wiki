import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { tmpRoot, RAW_DIR, SOURCES_FILE } = vi.hoisted(() => {
  const fs: typeof import('node:fs') = require('node:fs');
  const os: typeof import('node:os') = require('node:os');
  const path: typeof import('node:path') = require('node:path');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sources-registry-test-'));
  return { tmpRoot: root, RAW_DIR: path.join(root, 'raw'), SOURCES_FILE: path.join(root, 'sources.json') };
});

vi.mock('../paths', () => ({ RAW_DIR, SOURCES_FILE }));

import { addSource, listSources, removeSource, setEnabled, SourceError, syncSymlinks } from './sourcesRegistry';
import { discoverRawSourceFiles } from './rawFiles';

function mkExternalDir(name: string): string {
  const dir = path.join(tmpRoot, name);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

beforeEach(() => {
  fs.rmSync(RAW_DIR, { recursive: true, force: true });
  fs.rmSync(SOURCES_FILE, { force: true });
  fs.mkdirSync(RAW_DIR, { recursive: true });
});

afterEach(() => {
  for (const entry of fs.readdirSync(tmpRoot)) {
    if (entry === 'raw' || entry === 'sources.json') continue;
    fs.rmSync(path.join(tmpRoot, entry), { recursive: true, force: true });
  }
});

afterAll(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('listSources', () => {
  it('is empty by default', () => {
    expect(listSources()).toEqual([]);
  });

  it('reports file count and existence for a registered source', () => {
    const external = mkExternalDir('external');
    fs.writeFileSync(path.join(external, 'a.md'), 'x');
    fs.writeFileSync(path.join(external, 'b.md'), 'y');
    const entry = addSource(external, 'Docs');

    const listed = listSources();
    expect(listed).toHaveLength(1);
    expect(listed[0].id).toBe(entry.id);
    expect(listed[0].exists).toBe(true);
    expect(listed[0].file_count).toBe(2);
  });
});

describe('addSource', () => {
  it('creates an entry and mirrors the directory as symlinks', () => {
    const external = mkExternalDir('external');
    fs.writeFileSync(path.join(external, 'note.md'), 'hi\n');

    const entry = addSource(external, 'My Notes');

    expect(entry.label).toBe('My Notes');
    expect(entry.link_name).toBe('my-notes');
    expect(entry.enabled).toBe(true);

    const mirrored = path.join(RAW_DIR, 'my-notes', 'note.md');
    expect(fs.lstatSync(mirrored).isSymbolicLink()).toBe(true);
    expect(fs.realpathSync(mirrored)).toBe(fs.realpathSync(path.join(external, 'note.md')));
    expect(fs.readFileSync(mirrored, 'utf-8')).toBe('hi\n');
  });

  it('rejects a missing directory', () => {
    expect(() => addSource(path.join(tmpRoot, 'nonexistent'))).toThrow(SourceError);
    expect(() => addSource(path.join(tmpRoot, 'nonexistent'))).toThrow('Not a directory');
  });

  it('rejects a duplicate path', () => {
    const external = mkExternalDir('external');
    addSource(external, 'First');
    expect(() => addSource(external, 'Second')).toThrow('already registered');
  });

  it('rejects data/raw/ itself as a source', () => {
    expect(() => addSource(RAW_DIR)).toThrow('Cannot add');
  });

  it('rejects a folder inside data/raw/', () => {
    const nested = path.join(RAW_DIR, 'nested');
    fs.mkdirSync(nested);
    expect(() => addSource(nested)).toThrow('Cannot add');
  });

  it('rejects a folder that contains data/raw/', () => {
    expect(() => addSource(tmpRoot)).toThrow('Cannot add');
  });

  it('dedupes link names by appending a counter', () => {
    const a = mkExternalDir('a');
    const b = mkExternalDir('b');

    const first = addSource(a, 'Notes');
    const second = addSource(b, 'Notes');

    expect(first.link_name).toBe('notes');
    expect(second.link_name).toBe('notes-2');
  });
});

describe('removeSource', () => {
  it('deletes the entry and its mirrored symlinks', () => {
    const external = mkExternalDir('external');
    fs.writeFileSync(path.join(external, 'a.md'), 'hi\n');
    const entry = addSource(external, 'Docs');
    expect(fs.existsSync(path.join(RAW_DIR, 'docs', 'a.md'))).toBe(true);

    const removed = removeSource(entry.id);

    expect(removed).toBe(true);
    expect(fs.existsSync(path.join(RAW_DIR, 'docs'))).toBe(false);
    expect(listSources()).toEqual([]);
  });

  it('returns false for an unknown id', () => {
    expect(removeSource('nonexistent')).toBe(false);
  });
});

describe('setEnabled', () => {
  it('false removes the mirror but keeps the registry entry', () => {
    const external = mkExternalDir('external');
    fs.writeFileSync(path.join(external, 'a.md'), 'hi\n');
    const entry = addSource(external, 'Docs');

    const updated = setEnabled(entry.id, false);

    expect(updated?.enabled).toBe(false);
    expect(fs.existsSync(path.join(RAW_DIR, 'docs'))).toBe(false);
    expect(listSources()).toHaveLength(1);
  });

  it('true restores the mirror', () => {
    const external = mkExternalDir('external');
    fs.writeFileSync(path.join(external, 'a.md'), 'hi\n');
    const entry = addSource(external, 'Docs');
    setEnabled(entry.id, false);

    setEnabled(entry.id, true);

    expect(fs.lstatSync(path.join(RAW_DIR, 'docs', 'a.md')).isSymbolicLink()).toBe(true);
  });

  it('returns null for an unknown id', () => {
    expect(setEnabled('nonexistent', true)).toBeNull();
  });
});

describe('syncSymlinks', () => {
  it('picks up a file added to the source after registration', () => {
    const external = mkExternalDir('external');
    addSource(external, 'Notes');
    expect(fs.existsSync(path.join(RAW_DIR, 'notes', 'late.md'))).toBe(false);

    fs.writeFileSync(path.join(external, 'late.md'), 'late\n');
    syncSymlinks();

    expect(fs.lstatSync(path.join(RAW_DIR, 'notes', 'late.md')).isSymbolicLink()).toBe(true);
  });

  it('drops the symlink for a file removed from the source', () => {
    const external = mkExternalDir('external');
    fs.writeFileSync(path.join(external, 'gone.md'), 'bye\n');
    addSource(external, 'Notes');
    expect(fs.existsSync(path.join(RAW_DIR, 'notes', 'gone.md'))).toBe(true);

    fs.unlinkSync(path.join(external, 'gone.md'));
    syncSymlinks();

    expect(fs.existsSync(path.join(RAW_DIR, 'notes', 'gone.md'))).toBe(false);
  });

  it('replaces a stale top-level symlink with a real mirror directory', () => {
    // Simulates a leftover single-symlink-to-directory layout: fs.readdirSync's
    // Dirent flags (and any code trusting them) can't see through it, so files
    // added since would otherwise stay permanently invisible to the compiler.
    const external = mkExternalDir('external');
    fs.writeFileSync(path.join(external, 'a.md'), 'hi\n');
    fs.writeFileSync(
      SOURCES_FILE,
      JSON.stringify({
        version: 1,
        sources: [
          { id: 'x', label: 'Notes', path: external, link_name: 'notes', enabled: true, added_at: '2020-01-01T00:00:00Z' },
        ],
      }),
    );
    fs.symlinkSync(external, path.join(RAW_DIR, 'notes'));
    expect(fs.lstatSync(path.join(RAW_DIR, 'notes')).isSymbolicLink()).toBe(true);

    syncSymlinks();

    const notesStat = fs.lstatSync(path.join(RAW_DIR, 'notes'));
    expect(notesStat.isSymbolicLink()).toBe(false);
    expect(notesStat.isDirectory()).toBe(true);
    expect(fs.lstatSync(path.join(RAW_DIR, 'notes', 'a.md')).isSymbolicLink()).toBe(true);
    const found = discoverRawSourceFiles(RAW_DIR).map((p) => path.relative(RAW_DIR, p).split(path.sep).join('/'));
    expect(found).toContain('notes/a.md');
  });

  it('never touches a manually-created directory it does not manage', () => {
    const manualDir = path.join(RAW_DIR, 'manual-notes');
    fs.mkdirSync(manualDir);
    fs.writeFileSync(path.join(manualDir, 'keep.md'), 'keep me\n');

    syncSymlinks();

    expect(fs.readFileSync(path.join(manualDir, 'keep.md'), 'utf-8')).toBe('keep me\n');
  });

  it('does not clobber a real directory that already owns the link name', () => {
    fs.mkdirSync(path.join(RAW_DIR, 'docs'));
    fs.writeFileSync(path.join(RAW_DIR, 'docs', 'existing.md'), 'mine\n');

    const external = mkExternalDir('external');
    addSource(external, 'Docs');

    // addSource's uniqueLinkName only checks the registry, not the filesystem,
    // so this is syncSymlinks's own second-order guarantee: it refuses to
    // overwrite something real that already owns the name.
    expect(fs.readFileSync(path.join(RAW_DIR, 'docs', 'existing.md'), 'utf-8')).toBe('mine\n');
  });
});
