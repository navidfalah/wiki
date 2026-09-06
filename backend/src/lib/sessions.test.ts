import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { tmpRoot, SESSIONS_FILE } = vi.hoisted(() => {
  const fs: typeof import('node:fs') = require('node:fs');
  const os: typeof import('node:os') = require('node:os');
  const path: typeof import('node:path') = require('node:path');
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sessions-test-'));
  return { tmpRoot, SESSIONS_FILE: path.join(tmpRoot, 'data', 'sessions.json') };
});

vi.mock('../paths', () => ({ SESSIONS_FILE }));

import { createSession, deleteSession, getSessionUser } from './sessions';

const USER = { id: 'u1', username: 'alice', role: 'admin' as const };

function readFile(): any {
  return JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8'));
}

function writeFile(data: any): void {
  fs.mkdirSync(path.dirname(SESSIONS_FILE), { recursive: true });
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(data));
}

beforeEach(() => {
  vi.useRealTimers();
});

afterEach(() => {
  if (fs.existsSync(SESSIONS_FILE)) fs.rmSync(SESSIONS_FILE);
});

afterAll(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('createSession / getSessionUser', () => {
  it('issues a token that resolves back to the user', () => {
    const token = createSession(USER as any);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
    expect(getSessionUser(token)).toEqual({ id: 'u1', username: 'alice', role: 'admin' });
  });

  it('persists the session to disk so it survives a fresh load', () => {
    const token = createSession(USER as any);
    const onDisk = readFile();
    expect(onDisk.sessions).toHaveLength(1);
    expect(onDisk.sessions[0].token).toBe(token);
  });

  it('issues distinct tokens for successive sessions', () => {
    const a = createSession(USER as any);
    const b = createSession({ ...USER, id: 'u2', username: 'bob' } as any);
    expect(a).not.toBe(b);
    expect(getSessionUser(a)?.username).toBe('alice');
    expect(getSessionUser(b)?.username).toBe('bob');
  });

  it('returns null for an unknown token', () => {
    expect(getSessionUser('not-a-real-token')).toBeNull();
  });

  it('returns null for an undefined token', () => {
    expect(getSessionUser(undefined)).toBeNull();
  });

  it('returns null when no sessions file exists yet', () => {
    expect(getSessionUser('anything')).toBeNull();
  });

  it('treats a corrupt sessions file as empty rather than throwing', () => {
    fs.mkdirSync(path.dirname(SESSIONS_FILE), { recursive: true });
    fs.writeFileSync(SESSIONS_FILE, '{ not valid json');
    expect(() => getSessionUser('anything')).not.toThrow();
    expect(getSessionUser('anything')).toBeNull();
  });

  it('treats a non-array "sessions" field as empty rather than throwing', () => {
    writeFile({ version: 1, sessions: 'oops' });
    expect(getSessionUser('anything')).toBeNull();
  });
});

describe('expired sessions', () => {
  it('is not returned by getSessionUser once past its expiry', () => {
    writeFile({
      version: 1,
      sessions: [
        {
          token: 'expired-token',
          user_id: 'u1',
          username: 'alice',
          role: 'admin',
          created_at: new Date(0).toISOString(),
          expires_at: new Date(Date.now() - 1000).toISOString(),
        },
      ],
    });
    expect(getSessionUser('expired-token')).toBeNull();
  });

  it('is swept from disk the next time a session is created', () => {
    writeFile({
      version: 1,
      sessions: [
        {
          token: 'expired-token',
          user_id: 'u1',
          username: 'alice',
          role: 'admin',
          created_at: new Date(0).toISOString(),
          expires_at: new Date(Date.now() - 1000).toISOString(),
        },
      ],
    });
    createSession({ ...USER, id: 'u2', username: 'bob' } as any);
    const onDisk = readFile();
    expect(onDisk.sessions.find((s: any) => s.token === 'expired-token')).toBeUndefined();
  });

  it('is not yet swept from disk by a mere getSessionUser lookup', () => {
    writeFile({
      version: 1,
      sessions: [
        {
          token: 'expired-token',
          user_id: 'u1',
          username: 'alice',
          role: 'admin',
          created_at: new Date(0).toISOString(),
          expires_at: new Date(Date.now() - 1000).toISOString(),
        },
      ],
    });
    getSessionUser('expired-token');
    const onDisk = readFile();
    expect(onDisk.sessions.find((s: any) => s.token === 'expired-token')).toBeDefined();
  });

  it('is not returned for a session that has not expired yet', () => {
    writeFile({
      version: 1,
      sessions: [
        {
          token: 'fresh-token',
          user_id: 'u1',
          username: 'alice',
          role: 'admin',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 1000).toISOString(),
        },
      ],
    });
    expect(getSessionUser('fresh-token')).toEqual({ id: 'u1', username: 'alice', role: 'admin' });
  });
});

describe('deleteSession', () => {
  it('revokes the token so it no longer resolves to a user', () => {
    const token = createSession(USER as any);
    deleteSession(token);
    expect(getSessionUser(token)).toBeNull();
  });

  it('leaves other sessions untouched', () => {
    const a = createSession(USER as any);
    const b = createSession({ ...USER, id: 'u2', username: 'bob' } as any);
    deleteSession(a);
    expect(getSessionUser(a)).toBeNull();
    expect(getSessionUser(b)?.username).toBe('bob');
  });

  it('is a no-op for an undefined token', () => {
    const token = createSession(USER as any);
    expect(() => deleteSession(undefined)).not.toThrow();
    expect(getSessionUser(token)?.username).toBe('alice');
  });

  it('is a no-op for a token that does not exist', () => {
    const token = createSession(USER as any);
    expect(() => deleteSession('no-such-token')).not.toThrow();
    expect(getSessionUser(token)?.username).toBe('alice');
  });
});
