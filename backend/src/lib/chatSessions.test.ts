import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { tmpRoot, CHAT_HISTORY_FILE, CHAT_SESSIONS_DIR, CHAT_SESSIONS_INDEX } = vi.hoisted(() => {
  const fs: typeof import('node:fs') = require('node:fs');
  const os: typeof import('node:os') = require('node:os');
  const path: typeof import('node:path') = require('node:path');
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'chat-sessions-test-'));
  const CHAT_SESSIONS_DIR = path.join(tmpRoot, 'data', 'chat_sessions');
  return {
    tmpRoot,
    CHAT_HISTORY_FILE: path.join(tmpRoot, 'data', 'chat_history.json'),
    CHAT_SESSIONS_DIR,
    CHAT_SESSIONS_INDEX: path.join(CHAT_SESSIONS_DIR, 'index.json'),
  };
});

vi.mock('../paths', () => ({ CHAT_HISTORY_FILE, CHAT_SESSIONS_DIR, CHAT_SESSIONS_INDEX }));

import {
  appendChatSessionTurn,
  createChatSession,
  deleteChatSession,
  listChatSessions,
  loadChatSession,
  renameChatSession,
  setChatSessionResourceScope,
} from './chatSessions';

function resetSessionsDir(): void {
  if (fs.existsSync(CHAT_SESSIONS_DIR)) fs.rmSync(CHAT_SESSIONS_DIR, { recursive: true, force: true });
  if (fs.existsSync(CHAT_HISTORY_FILE)) fs.rmSync(CHAT_HISTORY_FILE);
}

beforeEach(() => {
  resetSessionsDir();
});

afterEach(() => {
  resetSessionsDir();
});

afterAll(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('createChatSession', () => {
  it('defaults the title to "New chat" when none is given', () => {
    const session = createChatSession();
    expect(session.title).toBe('New chat');
  });

  it('defaults the title to "New chat" when given only whitespace', () => {
    const session = createChatSession('   ');
    expect(session.title).toBe('New chat');
  });

  it('trims a given title', () => {
    const session = createChatSession('  My Chat  ');
    expect(session.title).toBe('My Chat');
  });

  it('starts with no messages and a null resource scope', () => {
    const session = createChatSession();
    expect(session.messages).toEqual([]);
    expect(session.resource_scope).toBeNull();
  });

  it('persists the session so it can be loaded back by id', () => {
    const session = createChatSession('Persisted');
    const loaded = loadChatSession(session.id);
    expect(loaded).toEqual(session);
  });

  it('adds the session to the index returned by listChatSessions', () => {
    const session = createChatSession('Indexed');
    const index = listChatSessions();
    expect(index.map((s) => s.id)).toContain(session.id);
  });
});

describe('loadChatSession', () => {
  it('returns null for an id that does not exist', () => {
    expect(loadChatSession('11111111-1111-1111-1111-111111111111')).toBeNull();
  });

  it('returns null for a malformed id, without touching the filesystem', () => {
    expect(loadChatSession('../../etc/passwd')).toBeNull();
  });
});

describe('renameChatSession', () => {
  it('updates the title and returns null for an unknown id', () => {
    expect(renameChatSession('11111111-1111-1111-1111-111111111111', 'x')).toBeNull();
  });

  it('renames an existing session and persists the change', () => {
    const session = createChatSession('Old');
    const renamed = renameChatSession(session.id, 'New');
    expect(renamed?.title).toBe('New');
    expect(loadChatSession(session.id)?.title).toBe('New');
  });

  it('falls back to "New chat" when renamed to blank', () => {
    const session = createChatSession('Old');
    const renamed = renameChatSession(session.id, '   ');
    expect(renamed?.title).toBe('New chat');
  });
});

describe('setChatSessionResourceScope', () => {
  it('sets a non-empty scope', () => {
    const session = createChatSession();
    const updated = setChatSessionResourceScope(session.id, ['docs/a.md', 'docs/b.md']);
    expect(updated?.resource_scope).toEqual(['docs/a.md', 'docs/b.md']);
  });

  it('normalizes an empty array to null', () => {
    const session = createChatSession();
    setChatSessionResourceScope(session.id, ['docs/a.md']);
    const cleared = setChatSessionResourceScope(session.id, []);
    expect(cleared?.resource_scope).toBeNull();
  });

  it('normalizes null to null', () => {
    const session = createChatSession();
    const updated = setChatSessionResourceScope(session.id, null);
    expect(updated?.resource_scope).toBeNull();
  });

  it('returns null for an unknown id', () => {
    expect(setChatSessionResourceScope('11111111-1111-1111-1111-111111111111', ['x'])).toBeNull();
  });
});

describe('deleteChatSession', () => {
  it('deletes an existing session and removes it from the index', () => {
    const session = createChatSession();
    expect(deleteChatSession(session.id)).toBe(true);
    expect(loadChatSession(session.id)).toBeNull();
    expect(listChatSessions().map((s) => s.id)).not.toContain(session.id);
  });

  it('returns false for an unknown id', () => {
    expect(deleteChatSession('11111111-1111-1111-1111-111111111111')).toBe(false);
  });

  it('returns false for a malformed id', () => {
    expect(deleteChatSession('not-a-uuid')).toBe(false);
  });
});

describe('appendChatSessionTurn', () => {
  it('appends a user and assistant message', () => {
    const session = createChatSession();
    const updated = appendChatSessionTurn(session.id, 'hello', 'hi there');
    expect(updated?.messages).toHaveLength(2);
    expect(updated?.messages[0]).toMatchObject({ role: 'user', content: 'hello' });
    expect(updated?.messages[1]).toMatchObject({ role: 'assistant', content: 'hi there' });
  });

  it('attaches sources to the assistant message only', () => {
    const session = createChatSession();
    const sources = [{ doc_path: 'a.md', title: 'A', slug: 'a' }];
    const updated = appendChatSessionTurn(session.id, 'q', 'a', sources);
    expect(updated?.messages[0].sources).toBeUndefined();
    expect(updated?.messages[1].sources).toEqual(sources);
  });

  it('derives the session title from the first user message when title is still default', () => {
    const session = createChatSession();
    const updated = appendChatSessionTurn(session.id, 'What is Aurora Labs?', 'It is a startup.');
    expect(updated?.title).toBe('What is Aurora Labs?');
  });

  it('truncates a long first message to 60 chars plus an ellipsis for the title', () => {
    const session = createChatSession();
    const longMessage = 'x'.repeat(80);
    const updated = appendChatSessionTurn(session.id, longMessage, 'reply');
    expect(updated?.title).toBe(`${'x'.repeat(60)}…`);
  });

  it('does not overwrite a custom title on later turns', () => {
    const session = createChatSession('Custom Title');
    const updated = appendChatSessionTurn(session.id, 'hello again', 'hi');
    expect(updated?.title).toBe('Custom Title');
  });

  it('returns null for an unknown session id', () => {
    expect(appendChatSessionTurn('11111111-1111-1111-1111-111111111111', 'q', 'a')).toBeNull();
  });
});

describe('listChatSessions', () => {
  it('returns an empty list when nothing has been created', () => {
    expect(listChatSessions()).toEqual([]);
  });

  it('sorts sessions by most recently updated first', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
      const first = createChatSession('First');
      vi.setSystemTime(new Date('2024-01-01T00:00:01.000Z'));
      const second = createChatSession('Second');
      vi.setSystemTime(new Date('2024-01-01T00:00:02.000Z'));
      appendChatSessionTurn(first.id, 'later turn', 'reply');
      const index = listChatSessions();
      expect(index[0].id).toBe(first.id);
      expect(index[1].id).toBe(second.id);
    } finally {
      vi.useRealTimers();
    }
  });

  it('migrates a legacy chat_history.json into a session exactly once', () => {
    fs.mkdirSync(path.dirname(CHAT_HISTORY_FILE), { recursive: true });
    fs.writeFileSync(
      CHAT_HISTORY_FILE,
      JSON.stringify({
        messages: [
          { role: 'user', content: 'legacy question', at: new Date().toISOString() },
          { role: 'assistant', content: 'legacy answer', at: new Date().toISOString() },
        ],
      }),
    );
    const index = listChatSessions();
    expect(index).toHaveLength(1);
    expect(index[0].title).toBe('Imported chat');
    expect(index[0].message_count).toBe(2);
  });

  it('does not migrate an empty legacy history file', () => {
    fs.mkdirSync(path.dirname(CHAT_HISTORY_FILE), { recursive: true });
    fs.writeFileSync(CHAT_HISTORY_FILE, JSON.stringify({ messages: [] }));
    expect(listChatSessions()).toEqual([]);
  });

  it('does not re-migrate once the sessions directory already exists', () => {
    createChatSession('Fresh');
    fs.mkdirSync(path.dirname(CHAT_HISTORY_FILE), { recursive: true });
    fs.writeFileSync(
      CHAT_HISTORY_FILE,
      JSON.stringify({ messages: [{ role: 'user', content: 'q', at: new Date().toISOString() }] }),
    );
    const index = listChatSessions();
    expect(index).toHaveLength(1);
    expect(index[0].title).toBe('Fresh');
  });
});
