const apiBase = document.querySelector('meta[name="api-base"]')?.getAttribute('content') ?? '';

function el(id: string): HTMLElement {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing #${id}`);
  return found;
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
  return res.json();
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

interface PublicUser {
  id: string;
  username: string;
  role: 'admin' | 'user';
  created_at: string;
}

let users: PublicUser[] = [];
let selfId = '';

function roleBadge(role: string): string {
  const tone = role === 'admin' ? 'bg-generated-bg text-generated' : 'bg-gray-100 text-gray-600';
  return `<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tone}">${escapeHtml(role)}</span>`;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function render() {
  const container = el('users-list');
  if (!users.length) {
    container.innerHTML = '<p class="p-5 text-sm text-gray-500">No users yet.</p>';
    return;
  }
  container.innerHTML = users
    .map((u) => {
      const isSelf = u.id === selfId;
      return `
      <div class="flex items-center justify-between gap-3 px-5 py-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="truncate text-sm font-medium text-gray-900">${escapeHtml(u.username)}</span>
            ${roleBadge(u.role)}
            ${isSelf ? '<span class="text-xs text-gray-400">(you)</span>' : ''}
          </div>
          <p class="mt-0.5 text-xs text-gray-500">Created ${escapeHtml(formatTime(u.created_at))}</p>
        </div>
        ${
          isSelf
            ? ''
            : `<button data-delete="${escapeHtml(u.id)}" class="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>`
        }
      </div>`;
    })
    .join('');

  container.querySelectorAll<HTMLButtonElement>('[data-delete]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      const target = users.find((u) => u.id === btn.dataset.delete);
      if (!confirm(`Delete user "${target?.username}"? They will be signed out and can no longer log in.`)) return;
      try {
        await apiFetch(`/api/users/${btn.dataset.delete}`, { method: 'DELETE' });
        (window as any).showToast?.('User deleted.');
        await load();
      } catch (err: any) {
        (window as any).showToast?.(err.message || 'Could not delete user.', 'error');
      }
    }),
  );
}

function initAddUserForm() {
  const toggle = el('add-user-toggle');
  const form = el('add-user-form');
  toggle.addEventListener('click', () => {
    form.classList.toggle('hidden');
    if (!form.classList.contains('hidden')) {
      form.innerHTML = `
        <form id="add-user-real-form" class="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
          <div class="grid gap-3 sm:grid-cols-3">
            <label class="text-xs font-medium text-gray-600">Username
              <input name="username" type="text" autocomplete="off" class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm" />
            </label>
            <label class="text-xs font-medium text-gray-600">Password
              <input name="password" type="password" autocomplete="new-password" placeholder="At least 8 characters" class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm" />
            </label>
            <label class="text-xs font-medium text-gray-600">Role
              <select name="role" class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                <option value="user" selected>User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          </div>
          <p id="add-user-error" class="mt-2 text-xs text-red-600"></p>
          <div class="mt-3 flex gap-2">
            <button type="submit" class="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark">Create user</button>
          </div>
        </form>`;
      const realForm = form.querySelector('form')!;
      realForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const data = new FormData(event.target as HTMLFormElement);
        try {
          await apiFetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: data.get('username'),
              password: data.get('password'),
              role: data.get('role'),
            }),
          });
          form.classList.add('hidden');
          (window as any).showToast?.('User created.');
          await load();
        } catch (err: any) {
          el('add-user-error').textContent = err.message;
        }
      });
    }
  });
}

async function load() {
  try {
    const [usersData, me] = await Promise.all([apiFetch('/api/users'), apiFetch('/api/auth/me')]);
    users = usersData.users;
    selfId = me.user?.id ?? '';
    render();
  } catch (err: any) {
    el('users-list').innerHTML = `<p class="p-5 text-sm text-red-600">${escapeHtml(err.message || `Cannot reach API at ${apiBase}.`)}</p>`;
  }
}

initAddUserForm();
load();
