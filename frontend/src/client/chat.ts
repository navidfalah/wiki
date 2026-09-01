const apiBase = document.querySelector('meta[name="api-base"]')?.getAttribute('content') ?? '';

function el(id: string): HTMLElement {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing #${id}`);
  return found;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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

interface HistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

const history: HistoryItem[] = [];

function renderMessages() {
  el('chat-messages').innerHTML = history.length
    ? history
        .map(
          (m) => `
      <div class="flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}">
        <div class="max-w-[80%] rounded-xl px-3 py-2 text-sm ${
          m.role === 'user' ? 'whitespace-pre-wrap bg-accent text-white' : 'bg-gray-100 text-gray-800'
        }">${m.role === 'user' ? escapeHtml(m.content) : renderMarkdownLite(m.content)}</div>
      </div>`,
        )
        .join('')
    : '<p class="text-sm text-gray-400">Ask something to get started.</p>';
  el('chat-messages').scrollTop = el('chat-messages').scrollHeight;
}

async function loadHistory() {
  try {
    const res = await fetch(`${apiBase}/api/chat/history`);
    if (!res.ok) return;
    const data = await res.json();
    const messages: { role: 'user' | 'assistant'; content: string; sources?: { title: string }[] }[] = data.messages ?? [];
    history.length = 0;
    for (const m of messages) {
      let content = m.content;
      if (m.role === 'assistant' && m.sources?.length) {
        content += `\n\nSources: ${m.sources.map((s) => s.title).join(', ')}`;
      }
      history.push({ role: m.role, content });
    }
    renderMessages();
  } catch {
    /* stored history is best-effort */
  }
}

el('chat-clear').addEventListener('click', async () => {
  try {
    await fetch(`${apiBase}/api/chat/history`, { method: 'DELETE' });
  } catch {
    /* ignore */
  }
  history.length = 0;
  renderMessages();
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

el('chat-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = document.getElementById('chat-input') as HTMLInputElement;
  const message = input.value.trim();
  if (!message) return;
  history.push({ role: 'user', content: message });
  renderMessages();
  input.value = '';

  try {
    const res = await fetch(`${apiBase}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history: history.slice(0, -1) }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    let content = data.answer;
    if (data.sources?.length) {
      content += `\n\nSources: ${data.sources.map((s: any) => s.title).join(', ')}`;
    }
    history.push({ role: 'assistant', content });
  } catch (err: any) {
    history.push({ role: 'assistant', content: `Error: ${err.message}` });
  }
  renderMessages();
});

renderMessages();
loadStatus();
loadHistory();
