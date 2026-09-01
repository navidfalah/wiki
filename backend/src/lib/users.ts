/**
 * User accounts for the "one team, with roles" auth model -- everyone
 * signs into the same wiki/dashboard; role is just 'admin' (can also
 * manage other users) or 'user' (everything else: dashboard, compiler,
 * uploads, chat, sources). Stored as a flat JSON file, same convention
 * as sources.json/link_overrides.json.
 *
 * Passwords are hashed with bcryptjs (pure JS -- no native build step,
 * so it doesn't fight the slim Docker image) and never stored or logged
 * in plaintext except for the one-time bootstrap admin password printed
 * to the backend's own console on first boot (see ensureBootstrapAdmin).
 */
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { USERS_FILE } from '../paths';

export type Role = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  password_hash: string;
  role: Role;
  created_at: string;
}

export interface PublicUser {
  id: string;
  username: string;
  role: Role;
  created_at: string;
}

interface UsersFile {
  version: number;
  users: User[];
}

function toPublic(user: User): PublicUser {
  return { id: user.id, username: user.username, role: user.role, created_at: user.created_at };
}

function loadUsersFile(): UsersFile {
  if (!fs.existsSync(USERS_FILE)) return { version: 1, users: [] };
  try {
    const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    return { version: data.version ?? 1, users: Array.isArray(data.users) ? data.users : [] };
  } catch {
    return { version: 1, users: [] };
  }
}

function saveUsersFile(data: UsersFile): void {
  fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

export function listUsers(): PublicUser[] {
  return loadUsersFile().users.map(toPublic);
}

export function findUserByUsername(username: string): User | undefined {
  return loadUsersFile().users.find((u) => u.username.toLowerCase() === username.toLowerCase());
}

export function verifyPassword(username: string, password: string): User | null {
  const user = findUserByUsername(username);
  if (!user) return null;
  return bcrypt.compareSync(password, user.password_hash) ? user : null;
}

export class UserError extends Error {}

export function createUser(username: string, password: string, role: Role = 'admin'): PublicUser {
  username = (username || '').trim();
  if (!username) throw new UserError('Username is required');
  if (!password || password.length < 8) throw new UserError('Password must be at least 8 characters');

  const data = loadUsersFile();
  if (data.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    throw new UserError(`Username already taken: ${username}`);
  }
  const user: User = {
    id: crypto.randomUUID(),
    username,
    password_hash: bcrypt.hashSync(password, 10),
    role,
    created_at: new Date().toISOString(),
  };
  data.users.push(user);
  saveUsersFile(data);
  return toPublic(user);
}

export function findUserById(id: string): User | undefined {
  return loadUsersFile().users.find((u) => u.id === id);
}

/**
 * Deletes a user, refusing to remove the account making the request or the
 * last remaining admin -- either would leave the app with no way back in
 * short of editing data/users.json by hand.
 */
export function deleteUser(id: string, requestingUserId: string): void {
  const data = loadUsersFile();
  const target = data.users.find((u) => u.id === id);
  if (!target) throw new UserError('User not found');
  if (target.id === requestingUserId) throw new UserError('You cannot delete your own account');
  const remainingAdmins = data.users.filter((u) => u.role === 'admin' && u.id !== id);
  if (target.role === 'admin' && remainingAdmins.length === 0) {
    throw new UserError('Cannot delete the last admin account');
  }
  data.users = data.users.filter((u) => u.id !== id);
  saveUsersFile(data);
}

/**
 * Creates the very first admin account (username/password from
 * ADMIN_USERNAME/ADMIN_PASSWORD, or a generated password printed to the
 * console once) so there's a way to log in before any invite exists.
 * No-op once at least one user already exists.
 */
export function ensureBootstrapAdmin(): void {
  const data = loadUsersFile();
  if (data.users.length > 0) return;

  const username = process.env.ADMIN_USERNAME?.trim() || 'admin';
  const generated = !process.env.ADMIN_PASSWORD;
  const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');

  createUser(username, password, 'admin');

  // eslint-disable-next-line no-console
  console.log('='.repeat(60));
  // eslint-disable-next-line no-console
  console.log('Created bootstrap admin account:');
  // eslint-disable-next-line no-console
  console.log(`  username: ${username}`);
  if (generated) {
    // eslint-disable-next-line no-console
    console.log(`  password: ${password}  (generated -- set ADMIN_PASSWORD to pick your own)`);
  } else {
    // eslint-disable-next-line no-console
    console.log('  password: (from ADMIN_PASSWORD env var)');
  }
  // eslint-disable-next-line no-console
  console.log('='.repeat(60));
}
