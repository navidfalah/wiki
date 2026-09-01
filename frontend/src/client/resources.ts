const apiBase = document.querySelector('meta[name="api-base"]')?.getAttribute('content') ?? '';

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

let items: any[] = [];

function render() {
  const needle = (document.getElementById('resources-search') as HTMLInputElement).value.trim().toLowerCase();
  const filtered = needle ? items.filter((i) => i.source.toLowerCase().includes(needle)) : items;
  const container = document.getElementById('resources-list')!;
  if (!filtered.length) {
    container.innerHTML = '<p class="text-sm text-gray-400">No resources match.</p>';
    return;
  }
  container.innerHTML = filtered
    .map(
      (item) => `
    <div class="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-card">
      <div class="flex items-center justify-between gap-2">
        <code class="truncate text-sm text-gray-800">${escapeHtml(item.source)}</code>
        <span class="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">${escapeHtml(item.source_type)} · ${escapeHtml(item.trust)}</span>
      </div>
      <p class="mt-1 text-xs text-gray-500">Cited by ${item.citation_count} page${item.citation_count === 1 ? '' : 's'}: ${item.citing_pages
        .map((p: any) => escapeHtml(p.title))
        .join(', ')}</p>
    </div>`,
    )
    .join('');
}

async function load() {
  try {
    const res = await fetch(`${apiBase}/api/resources`);
    const data = await res.json();
    items = data.resources;
    render();
  } catch {
    document.getElementById('resources-list')!.innerHTML = `<p class="text-sm text-red-600">Cannot reach API at ${escapeHtml(apiBase)}.</p>`;
  }
}

document.getElementById('resources-search')!.addEventListener('input', render);
load();
