const apiBase = document.querySelector('meta[name="api-base"]')?.getAttribute('content') ?? '';
const LAST_SESSION_KEY = 'wiki-chat-last-session';

function el(id: string): HTMLElement {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing #${id}`);
  return found;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

async function apiFetch(path: string, opts?: RequestInit): Promise<any> {
  const res = await fetch(`${apiBase}${path}`, opts);
  if (!res.ok) {
    let message = await res.text();
    try {
      message = JSON.parse(message).detail ?? message;
    } catch {
      /* plain text */
    }
    throw new Error(message || `Request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

// Minimal, dependency-free renderer for the light markdown LLM answers come
// back in: fenced ```code``` blocks, **bold**, `code`, and "* "/"- " bullet
// lists. Escapes first so nothing in the model's output can inject markup.
function renderInline(s: string): string {
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="rounded bg-gray-200 px-1 py-0.5 text-[0.85em]">$1</code>');
}

function renderProse(text: string): string {
  const blocks = text.split(/\n{2,}/).filter((b) => b.trim().length > 0);
  return blocks
    .map((block) => {
      const lines = block.split('\n').filter((l) => l.trim().length > 0);
      const isList = lines.length > 0 && lines.every((l) => /^\s*[*-]\s+/.test(l));
      if (isList) {
        const items = lines.map((l) => `<li>${renderInline(l.replace(/^\s*[*-]\s+/, ''))}</li>`).join('');
        return `<ul class="list-disc space-y-0.5 pl-4">${items}</ul>`;
      }
      return `<p>${block.split('\n').map(renderInline).join('<br>')}</p>`;
    })
    .join('<div class="h-2"></div>');
}

function renderMarkdownLite(text: string): string {
  const codeFenceRe = /```(\w*)\n?([\s\S]*?)```/g;
  const parts: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = codeFenceRe.exec(text))) {
    if (match.index > lastIndex) parts.push(renderProse(text.slice(lastIndex, match.index)));
    const code = (match[2] ?? '').replace(/\n$/, '');
    parts.push(
      `<pre class="my-1 overflow-x-auto rounded-lg bg-gray-900 px-3 py-2 text-xs leading-relaxed text-gray-100"><code>${escapeHtml(code)}</code></pre>`,
    );
    lastIndex = codeFenceRe.lastIndex;
  }
  if (lastIndex < text.length) parts.push(renderProse(text.slice(lastIndex)));
  return parts.join('');
}

function formatClockTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface ChatSource {
  doc_path: string;
  title: string;
  heading?: string;
  slug: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  at: string;
}

interface ChatSessionSummary {
  id: string;
  title: string;
  updated_at: string;
  resource_scope: string[] | null;
  message_count: number;
}

interface ChatSession extends ChatSessionSummary {
  messages: ChatMessage[];
}

interface ResourceEntry {
  source: string;
  source_type: string;
  citation_count: number;
}

type RetrievalMode = 'bm25' | 'hybrid' | 'hybrid_rerank';
type AnswerMode = 'auto' | 'extractive';

interface RagSettings {
  retrieval_mode: RetrievalMode;
  top_k: number;
  bm25_k1: number;
  bm25_b: number;
  use_vector_store: boolean;
  answer_mode: AnswerMode;
}

const RETRIEVAL_MODE_LABELS: Record<RetrievalMode, string> = {
  bm25: 'BM25 only',
  hybrid: 'Hybrid',
  hybrid_rerank: 'Hybrid + rerank',
};

let sessions: ChatSessionSummary[] = [];
let activeSession: ChatSession | null = null;
let resourcesCache: ResourceEntry[] = [];
let ragSettings: RagSettings | null = null;
let streamingSource: EventSource | null = null;
let sessionSearch = '';
let finalizeStreamingBubble: (() => void) | null = null;

const SUGGESTIONS = ['What topics does the wiki cover?', 'Summarize a page for me', 'Where do I find setup instructions?'];

const USER_AVATAR = `<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-white">You</div>`;
const ASSISTANT_AVATAR = `<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-generated-bg text-generated">
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a5 5 0 0 0-5 5v2a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z"></path><path d="M8 14v1a4 4 0 0 0 8 0v-1"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
</div>`;
const COPY_ICON = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
const CHECK_ICON = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

function sourcesChipHtml(sources: ChatSource[] | undefined): string {
  if (!sources?.length) return '';
  const chips = sources
    .map(
      (s) =>
        `<a href="/wiki/${encodeURIComponent(s.slug)}" class="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-600 no-underline hover:bg-gray-100 hover:text-accent">
          <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          ${escapeHtml(s.title)}
        </a>`,
    )
    .join('');
  return `<div class="mt-2 flex flex-wrap items-center gap-1"><span class="mr-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-400">Sources</span>${chips}</div>`;
}

function typingDotsHtml(): string {
  return `<div class="flex items-center gap-1 py-0.5">
    <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style="animation-delay:0ms"></span>
    <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style="animation-delay:150ms"></span>
    <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style="animation-delay:300ms"></span>
  </div>`;
}

function bubbleInnerHtml(
  role: 'user' | 'assistant',
  bodyHtml: string,
  opts: { sourcesHtml?: string; at?: string; streaming?: boolean } = {},
): string {
  const isUser = role === 'user';
  const avatar = isUser ? USER_AVATAR : ASSISTANT_AVATAR;
  const timeHtml = opts.at ? `<span class="mt-1 block text-[10px] text-gray-400 ${isUser ? 'text-right' : ''}">${formatClockTime(opts.at)}</span>` : '';
  const copyBtn =
    !isUser && !opts.streaming
      ? `<button type="button" class="chat-copy-btn absolute -top-2.5 right-2 hidden items-center gap-1 rounded-full border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] text-gray-500 shadow-sm hover:text-accent group-hover:flex">${COPY_ICON}</button>`
      : '';
  const bubble = `
    <div class="group relative max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
      isUser ? 'rounded-tr-sm bg-accent text-white' : 'rounded-tl-sm border border-gray-200 bg-white text-gray-800'
    }">
      ${copyBtn}
      <div class="chat-bubble-body ${isUser ? 'whitespace-pre-wrap' : ''}">${bodyHtml}</div>
      ${opts.sourcesHtml ?? ''}
      ${timeHtml}
    </div>`;

  return `${avatar}${bubble}`;
}

// Used for the static message list -- each row gets its own fade-in.
function bubbleHtml(role: 'user' | 'assistant', bodyHtml: string, opts: { sourcesHtml?: string; at?: string; streaming?: boolean } = {}): string {
  const isUser = role === 'user';
  return `
    <div class="msg-enter flex items-start gap-2 ${isUser ? 'flex-row-reverse justify-start' : ''}">
      ${bubbleInnerHtml(role, bodyHtml, opts)}
    </div>`;
}

function isNearBottom(container: HTMLElement): boolean {
  return container.scrollHeight - container.scrollTop - container.clientHeight < 80;
}

function emptyStateHtml(): string {
  const chips = SUGGESTIONS.map(
    (s) => `<button type="button" class="chat-suggestion rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 hover:border-accent/40 hover:text-accent">${escapeHtml(s)}</button>`,
  ).join('');
  return `
    <div class="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div class="flex h-11 w-11 items-center justify-center rounded-full bg-generated-bg text-generated">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
      </div>
      <p class="text-sm font-medium text-gray-700">Ask something to get started</p>
      <p class="max-w-xs text-xs text-gray-400">Answers are grounded in, and cited to, the compiled wiki pages they came from.</p>
      <div class="mt-1 flex flex-wrap justify-center gap-1.5">${chips}</div>
    </div>`;
}

function renderMessages() {
  const container = el('chat-messages');
  const messages = activeSession?.messages ?? [];
  container.innerHTML = messages.length
    ? messages
        .map((m) =>
          bubbleHtml(m.role, m.role === 'user' ? escapeHtml(m.content) : renderMarkdownLite(m.content), {
            sourcesHtml: m.role === 'assistant' ? sourcesChipHtml(m.sources) : '',
            at: m.at,
          }),
        )
        .join('')
    : emptyStateHtml();
  container.scrollTop = container.scrollHeight;
  container.querySelectorAll<HTMLButtonElement>('.chat-suggestion').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = el('chat-input') as HTMLTextAreaElement;
      input.value = btn.textContent ?? '';
      input.focus();
      autosizeInput();
    });
  });
  updateScrollButton();
}

function renderSessionList() {
  const container = el('chat-session-list');
  const query = sessionSearch.trim().toLowerCase();
  const filtered = query ? sessions.filter((s) => s.title.toLowerCase().includes(query)) : sessions;

  container.innerHTML = filtered.length
    ? filtered
        .map(
          (s) => `
      <button data-session-id="${escapeHtml(s.id)}" class="session-row group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm ${
        activeSession?.id === s.id ? 'bg-generated-bg text-generated' : 'text-gray-600 hover:bg-gray-100'
      }">
        <svg class="shrink-0 opacity-60" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
        <span class="min-w-0 flex-1 truncate">
          <span class="block truncate">${escapeHtml(s.title)}</span>
          <span class="block truncate text-[11px] opacity-60">${formatRelativeTime(s.updated_at)}${s.message_count ? ` · ${s.message_count} msg` : ''}</span>
        </span>
        <span data-session-delete="${escapeHtml(s.id)}" title="Delete chat" class="session-delete-btn hidden shrink-0 rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 group-hover:block">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path></svg>
        </span>
      </button>`,
        )
        .join('')
    : `<p class="px-2 py-3 text-center text-xs text-gray-400">${query ? 'No chats match your search.' : 'No chats yet.'}</p>`;

  container.querySelectorAll<HTMLButtonElement>('.session-row').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.sessionId!;
      if (id !== activeSession?.id) selectSession(id).catch((err) => window.showToast?.(err.message, 'error'));
    });
  });
  container.querySelectorAll<HTMLElement>('[data-session-delete]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      deleteSession(btn.dataset.sessionDelete!).catch((err) => window.showToast?.(err.message, 'error'));
    });
  });
}

function renderResourcesPanel() {
  const scope = activeSession?.resource_scope ?? null;
  const toggle = el('chat-resources-toggle').querySelector('span')!;
  toggle.textContent = scope ? `Resources: ${scope.length} selected` : 'Resources: All';

  const panel = el('chat-resources-panel');
  const allChecked = !scope;
  const rows = resourcesCache
    .map((r) => {
      const checked = scope ? scope.includes(r.source) : true;
      return `
      <label class="flex items-center gap-2 rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-50">
        <input type="checkbox" data-resource-source="${escapeHtml(r.source)}" ${checked ? 'checked' : ''} class="resource-checkbox rounded border-gray-300 text-accent focus:ring-accent/30" />
        <span class="min-w-0 flex-1 truncate">${escapeHtml(r.source)}</span>
      </label>`;
    })
    .join('');

  panel.innerHTML = `
    <label class="flex items-center gap-2 rounded px-2 py-1 text-sm font-medium text-gray-900 hover:bg-gray-50">
      <input type="checkbox" id="chat-resources-all" ${allChecked ? 'checked' : ''} class="rounded border-gray-300 text-accent focus:ring-accent/30" />
      <span>All resources</span>
    </label>
    <div class="my-1 border-t border-gray-100"></div>
    ${rows || '<p class="px-2 py-1 text-xs text-gray-400">No cited resources yet.</p>'}
  `;

  el('chat-resources-all').addEventListener('change', async (event) => {
    if ((event.target as HTMLInputElement).checked) await updateResourceScope(null);
    renderResourcesPanel();
  });
  panel.querySelectorAll<HTMLInputElement>('.resource-checkbox').forEach((cb) => {
    cb.addEventListener('change', async () => {
      const current = new Set(activeSession?.resource_scope ?? resourcesCache.map((r) => r.source));
      if (cb.checked) current.add(cb.dataset.resourceSource!);
      else current.delete(cb.dataset.resourceSource!);
      await updateResourceScope([...current]);
      renderResourcesPanel();
    });
  });
}

function renderModePanel() {
  const label = el('chat-mode-label');
  label.textContent = `Mode: ${ragSettings ? RETRIEVAL_MODE_LABELS[ragSettings.retrieval_mode] : '…'}`;

  el('chat-mode-retrieval-options')
    .querySelectorAll<HTMLInputElement>('input[name="chat-retrieval-mode"]')
    .forEach((input) => {
      input.checked = ragSettings ? input.value === ragSettings.retrieval_mode : false;
    });
  el('chat-mode-answer-options')
    .querySelectorAll<HTMLInputElement>('input[name="chat-answer-mode"]')
    .forEach((input) => {
      input.checked = ragSettings ? input.value === ragSettings.answer_mode : false;
    });
}

async function loadRagSettings() {
  try {
    ragSettings = await apiFetch('/api/settings/rag');
  } catch {
    ragSettings = null;
  }
  renderModePanel();
}

async function saveRagMode(patch: Partial<Pick<RagSettings, 'retrieval_mode' | 'answer_mode'>>) {
  if (!ragSettings) return;
  const previous = ragSettings;
  ragSettings = { ...ragSettings, ...patch };
  renderModePanel();
  try {
    ragSettings = await apiFetch('/api/settings/rag', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ragSettings),
    });
  } catch (err: any) {
    ragSettings = previous;
    window.showToast?.(err.message || 'Could not update chat mode.', 'error');
  }
  renderModePanel();
}

async function updateResourceScope(scope: string[] | null) {
  if (!activeSession) return;
  activeSession = await apiFetch(`/api/chat/sessions/${activeSession.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resource_scope: scope }),
  });
  await loadSessions();
}

async function loadResources() {
  try {
    const data = await apiFetch('/api/resources');
    resourcesCache = data.resources ?? [];
  } catch {
    resourcesCache = [];
  }
}

async function loadSessions() {
  const data = await apiFetch('/api/chat/sessions');
  sessions = data.sessions ?? [];
  renderSessionList();
}

function stopStreaming() {
  if (!streamingSource) return;
  streamingSource.close();
  streamingSource = null;
  finalizeStreamingBubble?.();
  finalizeStreamingBubble = null;
  setComposerBusy(false);
}

async function selectSession(id: string) {
  stopStreaming();
  activeSession = await apiFetch(`/api/chat/sessions/${id}`);
  try {
    localStorage.setItem(LAST_SESSION_KEY, id);
  } catch {
    /* best-effort */
  }
  (el('chat-title-input') as HTMLInputElement).value = activeSession!.title;
  renderSessionList();
  renderMessages();
  renderResourcesPanel();
}

async function createSession() {
  const session = await apiFetch('/api/chat/sessions', { method: 'POST' });
  await loadSessions();
  await selectSession(session.id);
}

async function deleteSession(id: string) {
  const target = sessions.find((s) => s.id === id);
  if (!confirm(`Delete "${target?.title ?? 'this chat'}"? This can't be undone.`)) return;
  await apiFetch(`/api/chat/sessions/${id}`, { method: 'DELETE' });
  await loadSessions();
  if (id === activeSession?.id) {
    if (sessions.length) await selectSession(sessions[0].id);
    else await createSession();
  }
}

el('chat-new-session').addEventListener('click', () => {
  createSession().catch((err) => window.showToast?.(err.message, 'error'));
});

el('chat-delete-session').addEventListener('click', () => {
  if (!activeSession) return;
  deleteSession(activeSession.id).catch((err) => window.showToast?.(err.message, 'error'));
});

el('chat-session-search').addEventListener('input', (event) => {
  sessionSearch = (event.target as HTMLInputElement).value;
  renderSessionList();
});

let titleSaveTimer: ReturnType<typeof setTimeout> | undefined;
el('chat-title-input').addEventListener('input', () => {
  if (!activeSession) return;
  const title = (el('chat-title-input') as HTMLInputElement).value;
  clearTimeout(titleSaveTimer);
  titleSaveTimer = setTimeout(async () => {
    if (!activeSession) return;
    activeSession = await apiFetch(`/api/chat/sessions/${activeSession.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    await loadSessions();
  }, 500);
});

el('chat-resources-toggle').addEventListener('click', () => {
  el('chat-mode-panel').classList.add('hidden');
  el('chat-resources-panel').classList.toggle('hidden');
});
el('chat-mode-toggle').addEventListener('click', () => {
  el('chat-resources-panel').classList.add('hidden');
  el('chat-mode-panel').classList.toggle('hidden');
});
document.addEventListener('click', (event) => {
  const panel = el('chat-resources-panel');
  const toggle = el('chat-resources-toggle');
  if (!panel.contains(event.target as Node) && !toggle.contains(event.target as Node)) {
    panel.classList.add('hidden');
  }
  const modePanel = el('chat-mode-panel');
  const modeToggle = el('chat-mode-toggle');
  if (!modePanel.contains(event.target as Node) && !modeToggle.contains(event.target as Node)) {
    modePanel.classList.add('hidden');
  }
});
el('chat-mode-retrieval-options')
  .querySelectorAll<HTMLInputElement>('input[name="chat-retrieval-mode"]')
  .forEach((input) => {
    input.addEventListener('change', () => {
      if (input.checked) saveRagMode({ retrieval_mode: input.value as RetrievalMode });
    });
  });
el('chat-mode-answer-options')
  .querySelectorAll<HTMLInputElement>('input[name="chat-answer-mode"]')
  .forEach((input) => {
    input.addEventListener('change', () => {
      if (input.checked) saveRagMode({ answer_mode: input.value as AnswerMode });
    });
  });

document.addEventListener('click', (event) => {
  const btn = (event.target as HTMLElement).closest<HTMLElement>('.chat-copy-btn');
  if (!btn) return;
  const body = btn.parentElement?.querySelector('.chat-bubble-body');
  const text = body?.textContent ?? '';
  navigator.clipboard
    ?.writeText(text)
    .then(() => {
      const original = btn.innerHTML;
      btn.innerHTML = CHECK_ICON;
      setTimeout(() => {
        btn.innerHTML = original;
      }, 1200);
    })
    .catch(() => {
      window.showToast?.('Could not copy to clipboard.', 'error');
    });
});

async function loadStatus() {
  const status = el('chat-status');
  try {
    const res = await fetch(`${apiBase}/api/chat/status`);
    const data = await res.json();
    const dotColor = data.llm_available ? 'bg-accent' : 'bg-amber-400';
    status.innerHTML = `<span class="h-1.5 w-1.5 rounded-full ${dotColor}"></span> ${data.corpus_pages} pages indexed · ${
      data.llm_available ? 'LLM-generated answers' : 'No LLM configured — showing closest matches'
    }`;
  } catch {
    status.innerHTML = `<span class="h-1.5 w-1.5 rounded-full bg-red-400"></span> Cannot reach API at ${apiBase}.`;
  }
}

function updateScrollButton() {
  const container = el('chat-messages');
  const btn = el('chat-scroll-bottom');
  if (container.scrollHeight <= container.clientHeight + 40 || isNearBottom(container)) {
    btn.classList.add('hidden');
    btn.classList.remove('flex');
  } else {
    btn.classList.remove('hidden');
    btn.classList.add('flex');
  }
}

el('chat-messages').addEventListener('scroll', updateScrollButton);
el('chat-scroll-bottom').addEventListener('click', () => {
  const container = el('chat-messages');
  container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
});

function autosizeInput() {
  const input = el('chat-input') as HTMLTextAreaElement;
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
}
el('chat-input').addEventListener('input', autosizeInput);
el('chat-input').addEventListener('keydown', (event) => {
  const ke = event as KeyboardEvent;
  if (ke.key === 'Enter' && !ke.shiftKey) {
    ke.preventDefault();
    el('chat-form').dispatchEvent(new Event('submit', { cancelable: true }));
  }
});

const SEND_ICON = el('chat-send-btn').innerHTML;
const STOP_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"></rect></svg>`;

function setComposerBusy(busy: boolean) {
  const btn = el('chat-send-btn') as HTMLButtonElement;
  const input = el('chat-input') as HTMLTextAreaElement;
  btn.innerHTML = busy ? STOP_ICON : SEND_ICON;
  btn.title = busy ? 'Stop generating' : 'Send';
  btn.classList.toggle('bg-gray-700', busy);
  btn.classList.toggle('hover:bg-gray-800', busy);
  btn.classList.toggle('bg-accent', !busy);
  btn.classList.toggle('hover:bg-accent-dark', !busy);
  input.disabled = busy;
}

el('chat-form').addEventListener('submit', (event) => {
  event.preventDefault();

  if (streamingSource) {
    stopStreaming();
    return;
  }

  if (!activeSession) return;
  const input = el('chat-input') as HTMLTextAreaElement;
  const message = input.value.trim();
  if (!message) return;
  input.value = '';
  autosizeInput();

  activeSession.messages.push({ role: 'user', content: message, at: new Date().toISOString() });
  renderMessages();
  setComposerBusy(true);

  let assistantText = '';
  let pendingSources: ChatSource[] = [];
  const container = el('chat-messages');
  // This row element is created once and stays attached for the whole
  // stream; only its inner content is replaced on each delta. (Repeatedly
  // setting outerHTML instead would detach the node after the first write,
  // so every later delta would silently fail to render.)
  const placeholder = document.createElement('div');
  placeholder.className = 'msg-enter flex items-start gap-2';
  container.appendChild(placeholder);
  container.scrollTop = container.scrollHeight;

  const source = new EventSource(
    `${apiBase}/api/chat/sessions/${activeSession.id}/stream?message=${encodeURIComponent(message)}`,
  );
  streamingSource = source;

  const renderStreaming = (done = false) => {
    const bodyHtml = assistantText ? renderMarkdownLite(assistantText) : typingDotsHtml();
    const cursor = !done && assistantText ? '<span class="stream-cursor"></span>' : '';
    placeholder.innerHTML = bubbleInnerHtml('assistant', bodyHtml + cursor, {
      sourcesHtml: sourcesChipHtml(pendingSources),
      streaming: !done,
    });
    if (isNearBottom(container) || !assistantText) container.scrollTop = container.scrollHeight;
    updateScrollButton();
  };
  renderStreaming();
  finalizeStreamingBubble = () => renderStreaming(true);

  source.onmessage = (event) => {
    let payload: any;
    try {
      payload = JSON.parse(event.data);
    } catch {
      return;
    }
    if (payload.type === 'sources') {
      pendingSources = payload.sources ?? [];
    } else if (payload.type === 'delta') {
      assistantText += payload.text ?? '';
      renderStreaming();
    } else if (payload.type === 'done') {
      source.close();
      streamingSource = null;
      finalizeStreamingBubble = null;
      setComposerBusy(false);
      selectSession(activeSession!.id).catch(() => {
        /* keep the streamed content on screen even if the reload fails */
      });
    } else if (payload.type === 'error') {
      assistantText = `Error: ${payload.message ?? 'Chat stream failed.'}`;
      renderStreaming(true);
      source.close();
      streamingSource = null;
      finalizeStreamingBubble = null;
      setComposerBusy(false);
    }
  };
  source.onerror = () => {
    if (source.readyState === EventSource.CLOSED) return;
    if (!assistantText) {
      assistantText = 'Error: lost connection to the chat stream.';
      renderStreaming(true);
    }
    source.close();
    streamingSource = null;
    finalizeStreamingBubble = null;
    setComposerBusy(false);
  };
});

async function init() {
  renderMessages();
  loadStatus();
  await loadRagSettings();
  await loadResources();
  await loadSessions();
  const lastId = (() => {
    try {
      return localStorage.getItem(LAST_SESSION_KEY);
    } catch {
      return null;
    }
  })();
  const initialId = (lastId && sessions.find((s) => s.id === lastId)?.id) || sessions[0]?.id;
  if (initialId) await selectSession(initialId);
  else await createSession();
}

declare global {
  interface Window {
    showToast?: (message: string, type?: string) => void;
  }
}

init();
