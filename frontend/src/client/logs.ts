const apiBase = document.querySelector('meta[name="api-base"]')?.getAttribute('content') ?? '';

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

interface ActivityEvent {
  id: string;
  at: string;
  username: string;
  action: string;
  detail: string;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

async function load() {
  const status = document.getElementById('logs-status')!;
  const body = document.getElementById('logs-body')!;
  try {
    const res = await fetch(`${apiBase}/api/activity`);
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    const data = await res.json();
    const events: ActivityEvent[] = data.events ?? [];

    status.textContent = `${events.length} event${events.length === 1 ? '' : 's'}`;
    body.innerHTML = events.length
      ? events
          .map(
            (e) => `
        <tr>
          <td class="whitespace-nowrap px-4 py-2 text-xs text-gray-500">${escapeHtml(formatTime(e.at))}</td>
          <td class="whitespace-nowrap px-4 py-2 text-sm font-medium text-gray-900">${escapeHtml(e.username)}</td>
          <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-800">${escapeHtml(e.action)}</td>
          <td class="px-4 py-2 text-sm text-gray-500">${escapeHtml(e.detail)}</td>
        </tr>`,
          )
          .join('')
      : '<tr><td colspan="4" class="px-4 py-8 text-center text-sm text-gray-400">No activity recorded yet.</td></tr>';
  } catch (err: any) {
    status.textContent = `Cannot reach API at ${apiBase}.`;
    body.innerHTML = `<tr><td colspan="4" class="px-4 py-8 text-center text-sm text-red-600">${escapeHtml(err.message)}</td></tr>`;
  }
}

document.getElementById('logs-refresh')!.addEventListener('click', load);
load();
