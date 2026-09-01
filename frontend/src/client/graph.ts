const apiBase = document.querySelector('meta[name="api-base"]')?.getAttribute('content') ?? '';

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

let topics: any[] = [];
let outgoingByTopic: Record<string, any[]> = {};

function render() {
  const needle = (document.getElementById('graph-search') as HTMLInputElement).value.trim().toLowerCase();
  const filtered = needle ? topics.filter((t) => t.title.toLowerCase().includes(needle)) : topics;
  const container = document.getElementById('graph-list')!;
  if (!filtered.length) {
    container.innerHTML = '<p class="text-sm text-gray-400">No topics indexed yet. Run the compiler first.</p>';
    return;
  }
  container.innerHTML = filtered
    .map((topic) => {
      const links = outgoingByTopic[topic.title] ?? [];
      return `
      <div class="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-card">
        <a href="/wiki/${escapeHtml(topic.filename.replace(/\.md$/, ''))}" class="text-sm font-medium text-generated no-underline hover:underline">${escapeHtml(topic.title)}</a>
        ${
          links.length
            ? `<p class="mt-1 text-xs text-gray-500">→ ${links
                .map((l: any) => escapeHtml(l.target_topic))
                .join(', ')}</p>`
            : '<p class="mt-1 text-xs text-gray-400">No outgoing links.</p>'
        }
      </div>`;
    })
    .join('');
}

async function load() {
  try {
    const res = await fetch(`${apiBase}/api/knowledge-graph`);
    const data = await res.json();
    topics = data.topics;
    outgoingByTopic = data.outgoing_by_topic;
    render();
  } catch {
    document.getElementById('graph-list')!.innerHTML = `<p class="text-sm text-red-600">Cannot reach API at ${escapeHtml(apiBase)}.</p>`;
  }
}

document.getElementById('graph-search')!.addEventListener('input', render);
load();
