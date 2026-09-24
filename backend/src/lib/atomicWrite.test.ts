import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { atomicWriteJson } from './atomicWrite';

describe('atomicWriteJson', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'atomic-write-test-'));

  afterEach(() => {
    for (const entry of fs.readdirSync(tmpRoot)) {
      fs.rmSync(path.join(tmpRoot, entry), { force: true, recursive: true });
    }
  });

  it('writes valid JSON readable back as the same data', () => {
    const target = path.join(tmpRoot, 'data.json');
    atomicWriteJson(target, { a: 1, b: ['x', 'y'] });
    expect(JSON.parse(fs.readFileSync(target, 'utf-8'))).toEqual({ a: 1, b: ['x', 'y'] });
  });

  it('creates parent directories that do not exist yet', () => {
    const target = path.join(tmpRoot, 'nested', 'dir', 'data.json');
    atomicWriteJson(target, { ok: true });
    expect(JSON.parse(fs.readFileSync(target, 'utf-8'))).toEqual({ ok: true });
  });

  it('overwrites an existing file completely rather than merging', () => {
    const target = path.join(tmpRoot, 'data.json');
    atomicWriteJson(target, { a: 1 });
    atomicWriteJson(target, { b: 2 });
    expect(JSON.parse(fs.readFileSync(target, 'utf-8'))).toEqual({ b: 2 });
  });

  it('leaves no leftover temp file after a successful write', () => {
    const target = path.join(tmpRoot, 'data.json');
    atomicWriteJson(target, { a: 1 });
    const entries = fs.readdirSync(tmpRoot);
    expect(entries).toEqual(['data.json']);
  });
});
