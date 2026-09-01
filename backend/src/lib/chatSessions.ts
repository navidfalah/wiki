/**
 * Multi-session chat storage: one JSON file per session under
 * data/chat_sessions/ (same directory-of-JSON-files shape as
 * data/pipeline_runs/, see pipelineRuns.ts), plus an index.json summary
 * this module keeps in sync on every write -- unlike pipeline runs, there
 * is no Python writer here, so both the index and the per-session files
 * are owned by this module alone.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { CHAT_HISTORY_FILE, CHAT_SESSIONS_DIR, CHAT_SESSIONS_INDEX } from '../paths';

export interface ChatSource {
  doc_path: string;
  title: string;
  heading?: string;
  score?: number;
  slug: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  at: string;
}

export interface ChatSessionSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  resource_scope: string[] | null;
  message_count: number;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  resource_scope: string[] | null;
  messages: ChatMessage[];
}

const DEFAULT_TITLE = 'New chat';
const SESSION_ID_RE = /^[a-f0-9-]{36}$/;

function sessionFile(id: string): string {
  return path.join(CHAT_SESSIONS_DIR, `${id}.json`);
}

function loadIndex(): ChatSessionSummary[] {
  if (!fs.existsSync(CHAT_SESSIONS_INDEX)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(CHAT_SESSIONS_INDEX, 'utf-8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveIndex(index: ChatSessionSummary[]): void {
  fs.mkdirSync(CHAT_SESSIONS_DIR, { recursive: true });
  fs.writeFileSync(CHAT_SESSIONS_INDEX, JSON.stringify(index, null, 2));
}

function summaryOf(session: ChatSession): ChatSessionSummary {
  return {
    id: session.id,
    title: session.title,
    created_at: session.created_at,
    updated_at: session.updated_at,
    resource_scope: session.resource_scope,
    message_count: session.messages.length,
  };
}

function saveSession(session: ChatSession): void {
  fs.mkdirSync(CHAT_SESSIONS_DIR, { recursive: true });
  fs.writeFileSync(sessionFile(session.id), JSON.stringify(session, null, 2));
  const index = loadIndex().filter((s) => s.id !== session.id);
  index.push(summaryOf(session));
  saveIndex(index);
}

/** One-time import of the old single-conversation chat_history.json into a
 * session, so switching to multi-session chat doesn't silently drop
 * existing history. Runs at most once: it no-ops as soon as the sessions
 * directory exists. */
function migrateLegacyHistoryIfNeeded(): void {
  if (fs.existsSync(CHAT_SESSIONS_DIR)) return;
  if (!fs.existsSync(CHAT_HISTORY_FILE)) return;
  try {
    const raw = JSON.parse(fs.readFileSync(CHAT_HISTORY_FILE, 'utf-8'));
    const messages: ChatMessage[] = Array.isArray(raw?.messages) ? raw.messages : [];
    if (!messages.length) return;
    const now = new Date().toISOString();
    const session: ChatSession = {
      id: crypto.randomUUID(),
      title: 'Imported chat',
      created_at: now,
      updated_at: now,
      resource_scope: null,
      messages: messages.map((m) => ({ ...m, sources: m.sources?.map((s: any) => ({ ...s, slug: s.slug ?? s.path ?? '' })) })),
    };
    saveSession(session);
  } catch {
    /* legacy file unreadable -- nothing to migrate */
  }
}

export function listChatSessions(): ChatSessionSummary[] {
  migrateLegacyHistoryIfNeeded();
  return loadIndex().sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export function loadChatSession(id: string): ChatSession | null {
  if (!SESSION_ID_RE.test(id)) return null;
  const filePath = sessionFile(id);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

export function createChatSession(title?: string): ChatSession {
  const now = new Date().toISOString();
  const session: ChatSession = {
    id: crypto.randomUUID(),
    title: (title ?? '').trim() || DEFAULT_TITLE,
    created_at: now,
    updated_at: now,
    resource_scope: null,
    messages: [],
  };
  saveSession(session);
  return session;
}

export function renameChatSession(id: string, title: string): ChatSession | null {
  const session = loadChatSession(id);
  if (!session) return null;
  session.title = title.trim() || DEFAULT_TITLE;
  session.updated_at = new Date().toISOString();
  saveSession(session);
  return session;
}

export function setChatSessionResourceScope(id: string, resourceScope: string[] | null): ChatSession | null {
  const session = loadChatSession(id);
  if (!session) return null;
  session.resource_scope = resourceScope && resourceScope.length ? resourceScope : null;
  session.updated_at = new Date().toISOString();
  saveSession(session);
  return session;
}

export function deleteChatSession(id: string): boolean {
  if (!SESSION_ID_RE.test(id)) return false;
  const filePath = sessionFile(id);
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  saveIndex(loadIndex().filter((s) => s.id !== id));
  return true;
}

export function appendChatSessionTurn(
  id: string,
  userMessage: string,
  assistantMessage: string,
  sources?: ChatSource[],
): ChatSession | null {
  const session = loadChatSession(id);
  if (!session) return null;
  const now = new Date().toISOString();
  session.messages.push({ role: 'user', content: userMessage, at: now });
  session.messages.push({ role: 'assistant', content: assistantMessage, sources, at: now });
  session.updated_at = now;
  if (session.title === DEFAULT_TITLE) {
    session.title = userMessage.length > 60 ? `${userMessage.slice(0, 60)}…` : userMessage;
  }
  saveSession(session);
  return session;
}
