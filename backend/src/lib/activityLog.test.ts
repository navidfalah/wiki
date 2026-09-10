import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { tmpRoot, ACTIVITY_LOG_FILE } = vi.hoisted(() => {
  const fs: typeof import('node:fs') = require('node:fs');
  const os: typeof import('node:os') = require('node:os');
  const path: typeof import('node:path') = require('node:path');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'activity-log-test-'));
  return { tmpRoot: root, ACTIVITY_LOG_FILE: path.join(root, 'activity_log.json') };
});

vi.mock('../paths', () => ({ ACTIVITY_LOG_FILE }));

import { inferCategory, listEvents, logEvent, logSystemEvent } from './activityLog';

beforeEach(() => {
  fs.rmSync(ACTIVITY_LOG_FILE, { force: true });
});

afterAll(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('logEvent / listEvents', () => {
  it('defaults to level "info" and an inferred category', () => {
    logEvent('alice', 'Uploaded 2 files', 'a.txt, b.txt');
    const [event] = listEvents();
    expect(event.level).toBe('info');
    expect(event.category).toBe('files');
    expect(event.username).toBe('alice');
  });

  it('honors an explicit level/category override', () => {
    logEvent('bob', 'Something custom', 'detail', { level: 'error', category: 'custom' });
    const [event] = listEvents();
    expect(event.level).toBe('error');
    expect(event.category).toBe('custom');
  });

  it('returns newest first', () => {
    logEvent('alice', 'First');
    logEvent('alice', 'Second');
    const events = listEvents();
    expect(events[0].action).toBe('Second');
    expect(events[1].action).toBe('First');
  });

  it('backfills level/category for rows written before those fields existed', () => {
    fs.writeFileSync(
      ACTIVITY_LOG_FILE,
      JSON.stringify({
        version: 1,
        events: [{ id: 'old-1', at: '2026-01-01T00:00:00.000Z', username: 'alice', action: 'Logged in', detail: '' }],
      }),
    );
    const [event] = listEvents();
    expect(event.level).toBe('info');
    expect(event.category).toBe('auth');
  });
});

describe('logSystemEvent', () => {
  it('always attributes to "system" with category "system"', () => {
    logSystemEvent('Backend started', 'pid 1234');
    const [event] = listEvents();
    expect(event.username).toBe('system');
    expect(event.category).toBe('system');
    expect(event.level).toBe('info');
  });

  it('accepts an explicit level for problems', () => {
    logSystemEvent('Compiler build failed', 'exit code 1', 'error');
    const [event] = listEvents();
    expect(event.level).toBe('error');
  });
});

describe('inferCategory', () => {
  it.each([
    ['Logged in', 'auth'],
    ['Failed login attempt', 'auth'],
    ['Added source folder', 'sources'],
    ['Created user bob (admin)', 'users'],
    ['Uploaded 3 files', 'files'],
    ['Created folder', 'files'],
    ['Created email', 'emails'],
    ['Edited wiki page', 'wiki'],
    ['Started compiler run', 'pipeline'],
    ['Updated graph link overrides', 'review'],
    ['Recorded review correction', 'review'],
    ['Deleted chat session', 'chat'],
    ['Saved RAG preset "x"', 'settings'],
    ['Updated company settings', 'settings'],
    ['Connected external account', 'connectors'],
    ['Something entirely unrelated', 'general'],
  ])('%s -> %s', (action, expected) => {
    expect(inferCategory(action)).toBe(expected);
  });
});
