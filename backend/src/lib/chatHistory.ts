/**
 * Persists the /chat page's transcript to disk (data/chat_history.json),
 * same JSON-file-in-data/ pattern as sources.json and link_overrides.json.
 * Chat is a read-only Q&A surface over the compiled wiki (rag_engine.py) --
 * this module only stores/replays the conversation text, it doesn't touch
 * resources, sources, or the pipeline in any way.
 */
import fs from 'node:fs';
import path from 'node:path';
import { CHAT_HISTORY_FILE } from '../paths';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: { title: string; path?: string }[];
  at: string;
}

export interface ChatHistory {
  version: number;
  messages: ChatMessage[];
}

export function loadChatHistory(): ChatHistory {
  if (!fs.existsSync(CHAT_HISTORY_FILE)) return { version: 1, messages: [] };
  try {
    const data = JSON.parse(fs.readFileSync(CHAT_HISTORY_FILE, 'utf-8'));
    return { version: data.version ?? 1, messages: Array.isArray(data.messages) ? data.messages : [] };
  } catch {
    return { version: 1, messages: [] };
  }
}

function saveChatHistory(history: ChatHistory): void {
  fs.mkdirSync(path.dirname(CHAT_HISTORY_FILE), { recursive: true });
  fs.writeFileSync(CHAT_HISTORY_FILE, JSON.stringify(history, null, 2));
}

export function appendChatTurn(userMessage: string, assistantMessage: string, sources?: { title: string; path?: string }[]): ChatHistory {
  const history = loadChatHistory();
  const now = new Date().toISOString();
  history.messages.push({ role: 'user', content: userMessage, at: now });
  history.messages.push({ role: 'assistant', content: assistantMessage, sources, at: now });
  saveChatHistory(history);
  return history;
}

export function clearChatHistory(): void {
  saveChatHistory({ version: 1, messages: [] });
}
