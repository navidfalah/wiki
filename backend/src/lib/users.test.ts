import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { tmpRoot, USERS_FILE } = vi.hoisted(() => {
  const fs: typeof import('node:fs') = require('node:fs');
  const os: typeof import('node:os') = require('node:os');
  const path: typeof import('node:path') = require('node:path');
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'users-test-'));
  return { tmpRoot, USERS_FILE: path.join(tmpRoot, 'data', 'users.json') };
});

vi.mock('../paths', () => ({ USERS_FILE }));

import {
  createUser,
  deleteUser,
  ensureBootstrapAdmin,
  findUserByUsername,
  findUserById,
  listUsers,
  UserError,
  verifyPassword,
} from './users';

afterEach(() => {
  if (fs.existsSync(USERS_FILE)) fs.rmSync(USERS_FILE);
  delete process.env.ADMIN_USERNAME;
  delete process.env.ADMIN_PASSWORD;
  vi.restoreAllMocks();
});

afterAll(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('createUser', () => {
  it('rejects an empty username', () => {
    expect(() => createUser('', 'password123')).toThrow(UserError);
    expect(() => createUser('   ', 'password123')).toThrow(UserError);
  });

  it('rejects a password shorter than 8 characters', () => {
    expect(() => createUser('alice', 'short')).toThrow(UserError);
  });

  it('trims the username before storing it', () => {
    const user = createUser('  alice  ', 'password123');
    expect(user.username).toBe('alice');
  });

  it('defaults to the admin role when none is given', () => {
    const user = createUser('alice', 'password123');
    expect(user.role).toBe('admin');
  });

  it('rejects a duplicate username case-insensitively', () => {
    createUser('alice', 'password123');
    expect(() => createUser('Alice', 'password456')).toThrow(UserError);
  });

  it('never returns the password hash', () => {
    const user = createUser('alice', 'password123') as any;
    expect(user.password_hash).toBeUndefined();
  });

  it('hashes the password rather than storing it in plaintext', () => {
    createUser('alice', 'password123');
    const raw = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    expect(raw.users[0].password_hash).not.toBe('password123');
  });
});

describe('findUserByUsername / verifyPassword', () => {
  beforeEach(() => {
    createUser('alice', 'password123', 'user');
  });

  it('finds a user regardless of username case', () => {
    expect(findUserByUsername('ALICE')).toBeDefined();
    expect(findUserByUsername('alice')).toBeDefined();
  });

  it('returns undefined for an unknown username', () => {
    expect(findUserByUsername('bob')).toBeUndefined();
  });

  it('verifies the correct password', () => {
    expect(verifyPassword('alice', 'password123')).not.toBeNull();
  });

  it('rejects an incorrect password', () => {
    expect(verifyPassword('alice', 'wrong-password')).toBeNull();
  });

  it('rejects a password for an unknown user', () => {
    expect(verifyPassword('bob', 'password123')).toBeNull();
  });
});

describe('deleteUser', () => {
  it('refuses to delete the account making the request', () => {
    const a = createUser('alice', 'password123');
    const b = createUser('bob', 'password123');
    expect(() => deleteUser(a.id, a.id)).toThrow(UserError);
    expect(findUserById(a.id)).toBeDefined();
    expect(() => deleteUser(b.id, a.id)).not.toThrow();
  });

  it('refuses to delete the last remaining admin', () => {
    const admin = createUser('alice', 'password123', 'admin');
    expect(() => deleteUser(admin.id, 'someone-else')).toThrow(UserError);
    expect(findUserById(admin.id)).toBeDefined();
  });

  it('allows deleting an admin when another admin remains', () => {
    const admin1 = createUser('alice', 'password123', 'admin');
    const admin2 = createUser('bob', 'password123', 'admin');
    deleteUser(admin1.id, admin2.id);
    expect(findUserById(admin1.id)).toBeUndefined();
    expect(findUserById(admin2.id)).toBeDefined();
  });

  it('freely deletes a non-admin user', () => {
    const admin = createUser('alice', 'password123', 'admin');
    const user = createUser('bob', 'password123', 'user');
    deleteUser(user.id, admin.id);
    expect(findUserById(user.id)).toBeUndefined();
  });

  it('throws when the target user does not exist', () => {
    expect(() => deleteUser('nonexistent-id', 'someone-else')).toThrow(UserError);
  });
});

describe('listUsers', () => {
  it('never includes password hashes', () => {
    createUser('alice', 'password123');
    const users = listUsers() as any[];
    expect(users).toHaveLength(1);
    expect(users[0].password_hash).toBeUndefined();
  });
});

describe('ensureBootstrapAdmin', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('creates a default "admin" account when no users exist', () => {
    ensureBootstrapAdmin();
    const user = findUserByUsername('admin');
    expect(user).toBeDefined();
    expect(user?.role).toBe('admin');
  });

  it('uses ADMIN_USERNAME and ADMIN_PASSWORD from the environment when set', () => {
    process.env.ADMIN_USERNAME = 'root';
    process.env.ADMIN_PASSWORD = 'super-secret-1';
    ensureBootstrapAdmin();
    expect(findUserByUsername('root')).toBeDefined();
    expect(verifyPassword('root', 'super-secret-1')).not.toBeNull();
  });

  it('is a no-op once at least one user already exists', () => {
    createUser('alice', 'password123');
    ensureBootstrapAdmin();
    expect(listUsers()).toHaveLength(1);
    expect(findUserByUsername('admin')).toBeUndefined();
  });
});
