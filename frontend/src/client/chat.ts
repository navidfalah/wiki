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

// Minimal, dependency-free renderer for the light markdown LLM answers
// come back in: **bold**, `code`, and "* "/"- " bullet lists. Escapes
// first so nothing in the model's output can inject markup.
function renderMarkdownLite(text: string): string {
  const inline = (s: string) =>
    escapeHtml(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="rounded bg-gray-200 px-1 py-0.5 text-[0.85em]">$1</code>');

  const blocks = text.split(/\n{2,}/);
  return blocks
    .map((block) => {
      const lines = block.split('\n').filter((l) => l.trim().length > 0);
      const isList = lines.length > 0 && lines.every((l) => /^\s*[*-]\s+/.test(l));
      if (isList) {
        const items = lines.map((l) => `<li>${inline(l.replace(/^\s*[*-]\s+/, ''))}</li>`).join('');
        return `<ul class="list-disc space-y-0.5 pl-4">${items}</ul>`;
      }
      return `<p>${block.split('\n').map(inline).join('<br>')}</p>`;
    })
    .join('<div class="h-2"></div>');
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

let sessions: ChatSessionSummary[] = [];
let activeSession: ChatSession | null = null;
let resourcesCache: ResourceEntry[] = [];
let streamingSource: EventSource | null = null;

function sourcesChipHtml(sources: ChatSource[] | undefined): string {
  if (!sources?.length) return '';
  const chips = sources
    .map((s) => `<a href="/wiki/${encodeURIComponent(s.slug)}" class="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-600 no-underline hover:bg-gray-100 hover:text-accent">${escapeHtml(s.title)}</a>`)
    .join('');
  return `<div class="mt-2 flex flex-wrap gap-1">${chips}</div>`;
}

function bubbleHtml(role: 'user' | 'assistant', bodyHtml: string, sourcesHtml = ''): string {
  return `
    <div class="flex ${role === 'user' ? 'justify-end' : 'justify-start'}">
      <div class="max-w-[80%] rounded-xl px-3 py-2 text-sm ${role === 'user' ? 'whitespace-pre-wrap bg-accent text-white' : 'bg-gray-100 text-gray-800'}">
        ${bodyHtml}${sourcesHtml}
      </div>
    </div>`;
}

function renderMessages() {
  const container = el('chat-messages');
  const messages = activeSession?.messages ?? [];
  container.innerHTML = messages.length
    ? messages
        .map((m) =>
          bubbleHtml(
            m.role,
            m.role === 'user' ? escapeHtml(m.content) : renderMarkdownLite(m.content),
            m.role === 'assistant' ? sourcesChipHtml(m.sources) : '',
          ),
        )
        .join('')
    : '<p class="text-sm text-gray-400">Ask something to get started.</p>';
  container.scrollTop = container.scrollHeight;
}

function renderSessionList() {
  const container = el('chat-session-list');
  container.innerHTML = sessions.length
    ? sessions
        .map(
          (s) => `
      <button data-session-id="${escapeHtml(s.id)}" class="session-row flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm ${
        activeSession?.id === s.id ? 'bg-generated-bg text-generated' : 'text-gray-600 hover:bg-gray-100'
      }">
        <span class="min-w-0 flex-1 truncate">${escapeHtml(s.title)}</span>
      </button>`,
        )
        .join('')
    : '<p class="px-2 py-2 text-xs text-gray-400">No chats yet.</p>';

  container.querySelectorAll<HTMLButtonElement>('.session-row').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.sessionId!;
      if (id !== activeSession?.id) selectSession(id);
    });
  });
}

function renderResourcesPanel() {
  const scope = activeSession?.resource_scope ?? null;
  const toggle = el('chat-resources-toggle');
  toggle.textContent = scope ? `Resources: ${scope.length} selected` : 'Resources: All';

  const panel = el('chat-resources-panel');
  const allChecked = !scope;
  const rows = resourcesCache
    .map((r) => {
      const checked = scope ? scope.includes(r.source) : true;
      return `
      <label class="flex items-center gap-2 rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-50">
        <input type="checkbox" data-resource-source="${escapeHtml(r.source)}" ${checked ? 'checked' : ''} class="resource-checkbox" />
        <span class="min-w-0 flex-1 truncate">${escapeHtml(r.source)}</span>
      </label>`;
    })
    .join('');

  panel.innerHTML = `
    <label class="flex items-center gap-2 rounded px-2 py-1 text-sm font-medium text-gray-900 hover:bg-gray-50">
      <input type="checkbox" id="chat-resources-all" ${allChecked ? 'checked' : ''} />
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

async function selectSession(id: string) {
  if (streamingSource) {
    streamingSource.close();
    streamingSource = null;
  }
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

el('chat-new-session').addEventListener('click', () => {
  createSession().catch((err) => window.showToast?.(err.message, 'error'));
});

el('chat-delete-session').addEventListener('click', async () => {
  if (!activeSession) return;
  if (!confirm(`Delete "${activeSession.title}"? This can't be undone.`)) return;
  const deletedId = activeSession.id;
  try {
    await apiFetch(`/api/chat/sessions/${deletedId}`, { method: 'DELETE' });
    await loadSessions();
    if (sessions.length) await selectSession(sessions[0].id);
    else await createSession();
  } catch (err: any) {
    window.showToast?.(err.message, 'error');
  }
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
  el('chat-resources-panel').classList.toggle('hidden');
});
document.addEventListener('click', (event) => {
  const panel = el('chat-resources-panel');
  const toggle = el('chat-resources-toggle');
  if (!panel.contains(event.target as Node) && !toggle.contains(event.target as Node)) {
    panel.classList.add('hidden');
  }
});

async function loadStatus() {
  try {
    const res = await fetch(`${apiBase}/api/chat/status`);
    const data = await res.json();
    el('chat-status').textContent = `${data.corpus_pages} pages indexed · ${
      data.llm_available ? 'LLM-generated answers' : 'No LLM configured — showing closest matches'
    }`;
  } catch {
    el('chat-status').textContent = `Cannot reach API at ${apiBase}.`;
  }
}

el('chat-form').addEventListener('submit', (event) => {
  event.preventDefault();
  if (!activeSession) return;
  const input = document.getElementById('chat-input') as HTMLInputElement;
  const message = input.value.trim();
  if (!message || streamingSource) return;
  input.value = '';

  activeSession.messages.push({ role: 'user', content: message, at: new Date().toISOString() });
  renderMessages();

  let assistantText = '';
  let pendingSources: ChatSource[] = [];
  const container = el('chat-messages');
  const placeholder = document.createElement('div');
  container.appendChild(placeholder);
  container.scrollTop = container.scrollHeight;

  const source = new EventSource(
    `${apiBase}/api/chat/sessions/${activeSession.id}/stream?message=${encodeURIComponent(message)}`,
  );
  streamingSource = source;

  const renderStreaming = () => {
    placeholder.outerHTML = bubbleHtml('assistant', renderMarkdownLite(assistantText) || '<span class="text-gray-400">…</span>', sourcesChipHtml(pendingSources));
    container.scrollTop = container.scrollHeight;
  };
  renderStreaming();

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
      selectSession(activeSession!.id).catch(() => {
        /* keep the streamed content on screen even if the reload fails */
      });
    } else if (payload.type === 'error') {
      assistantText = `Error: ${payload.message ?? 'Chat stream failed.'}`;
      renderStreaming();
      source.close();
      streamingSource = null;
    }
  };
  source.onerror = () => {
    if (source.readyState === EventSource.CLOSED) return;
    if (!assistantText) {
      assistantText = 'Error: lost connection to the chat stream.';
      renderStreaming();
    }
    source.close();
    streamingSource = null;
  };
});

async function init() {
  renderMessages();
  loadStatus();
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
