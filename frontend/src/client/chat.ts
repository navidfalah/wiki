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
        <div class="max-w-[80%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
          m.role === 'user' ? 'bg-accent text-white' : 'bg-gray-100 text-gray-800'
        }">${escapeHtml(m.content)}</div>
      </div>`,
        )
        .join('')
    : '<p class="text-sm text-gray-400">Ask something to get started.</p>';
  el('chat-messages').scrollTop = el('chat-messages').scrollHeight;
}

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
