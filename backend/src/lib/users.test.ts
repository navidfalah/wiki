import fs from 'node:fs';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { tmpRoot, USERS_FILE, SESSIONS_FILE } = vi.hoisted(() => {
  const fs: typeof import('node:fs') = require('node:fs');
  const os: typeof import('node:os') = require('node:os');
  const path: typeof import('node:path') = require('node:path');
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'users-test-'));
  return {
    tmpRoot,
    USERS_FILE: path.join(tmpRoot, 'data', 'users.json'),
    SESSIONS_FILE: path.join(tmpRoot, 'data', 'sessions.json'),
  };
});

// setPassword/deleteUser now also revoke the affected user's sessions
// (sessions.ts reads SESSIONS_FILE from this same module), so the mock
// must supply it too -- a plain factory that only returns USERS_FILE
// would leave SESSIONS_FILE undefined and crash fs.existsSync(undefined)
// inside sessions.ts.
vi.mock('../paths', () => ({ USERS_FILE, SESSIONS_FILE }));

import {
  createUser,
  deleteUser,
  ensureBootstrapAdmin,
  findUserByUsername,
  findUserById,
  listUsers,
  resetPasswordById,
  setPassword,
  setRole,
  UserError,
  verifyPassword,
} from './users';
import { createSession, getSessionUser } from './sessions';

afterEach(() => {
  if (fs.existsSync(USERS_FILE)) fs.rmSync(USERS_FILE);
  if (fs.existsSync(SESSIONS_FILE)) fs.rmSync(SESSIONS_FILE);
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

describe('setPassword', () => {
  beforeEach(() => {
    createUser('alice', 'password123', 'user');
  });

  it('replaces the password, invalidating the old one', () => {
    setPassword('alice', 'new-password123');
    expect(verifyPassword('alice', 'new-password123')).not.toBeNull();
    expect(verifyPassword('alice', 'password123')).toBeNull();
  });

  it('is case-insensitive on username, matching findUserByUsername', () => {
    setPassword('ALICE', 'new-password123');
    expect(verifyPassword('alice', 'new-password123')).not.toBeNull();
  });

  it('rejects a password shorter than 8 characters', () => {
    expect(() => setPassword('alice', 'short')).toThrow(UserError);
  });

  it('rejects an unknown username', () => {
    expect(() => setPassword('bob', 'password123')).toThrow(UserError);
  });

  it('revokes existing sessions, so a token from before the reset stops working', () => {
    const alice = findUserByUsername('alice')!;
    const token = createSession({ id: alice.id, username: alice.username, role: alice.role, created_at: alice.created_at });
    expect(getSessionUser(token)).not.toBeNull();

    setPassword('alice', 'new-password123');

    expect(getSessionUser(token)).toBeNull();
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

  it('revokes the deleted user\'s sessions, so their token stops authenticating', () => {
    const admin = createUser('alice', 'password123', 'admin');
    const target = createUser('bob', 'password123', 'user');
    const token = createSession({ id: target.id, username: target.username, role: target.role, created_at: target.created_at });
    expect(getSessionUser(token)).not.toBeNull();

    deleteUser(target.id, admin.id);

    expect(getSessionUser(token)).toBeNull();
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

describe('setRole', () => {
  it('promotes and demotes when another admin remains', () => {
    const a = createUser('alice', 'password123', 'admin');
    const b = createUser('bob', 'password123', 'user');
    expect(setRole(b.id, 'admin').role).toBe('admin');
    expect(setRole(a.id, 'user').role).toBe('user');
    expect(findUserById(a.id)?.role).toBe('user');
  });

  it('refuses to demote the last admin', () => {
    const a = createUser('alice', 'password123', 'admin');
    createUser('bob', 'password123', 'user');
    expect(() => setRole(a.id, 'user')).toThrow(UserError);
    expect(findUserById(a.id)?.role).toBe('admin');
  });

  it('rejects an unknown user', () => {
    expect(() => setRole('nope', 'admin')).toThrow(UserError);
  });
});

describe('resetPasswordById', () => {
  it('replaces the password so only the new one verifies', () => {
    const u = createUser('alice', 'password123', 'admin');
    resetPasswordById(u.id, 'brand-new-pass');
    expect(verifyPassword('alice', 'password123')).toBeNull();
    expect(verifyPassword('alice', 'brand-new-pass')).not.toBeNull();
  });

  it('enforces the minimum length and unknown ids', () => {
    const u = createUser('alice', 'password123');
    expect(() => resetPasswordById(u.id, 'short')).toThrow(UserError);
    expect(() => resetPasswordById('nope', 'long-enough-1')).toThrow(UserError);
  });
});
