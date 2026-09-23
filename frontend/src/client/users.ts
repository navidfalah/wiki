import { formatDateTime, t, th, tnh } from './lib/i18n';

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
    throw new Error(message || t('common.requestFailed', { status: res.status }));
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
  active_sessions: number;
}

interface AuthEvent {
  id: string;
  at: string;
  username: string;
  action: string;
  detail: string;
  level: 'info' | 'warn' | 'error';
}

let users: PublicUser[] = [];
let selfId = '';

function toast(message: string, type?: string) {
  (window as any).showToast?.(message, type);
}

function roleLabel(role: string): string {
  return role === 'admin' ? t('users.role.admin') : t('users.role.user');
}

function roleBadge(role: string): string {
  const tone = role === 'admin' ? 'bg-generated-bg text-generated' : 'bg-gray-100 text-gray-600';
  return `<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tone}">${escapeHtml(roleLabel(role))}</span>`;
}

function renderStats() {
  const set = (key: string, value: number) => {
    const node = document.querySelector(`[data-stat="${key}"]`);
    if (node) node.textContent = String(value);
  };
  const admins = users.filter((u) => u.role === 'admin').length;
  set('total', users.length);
  set('admins', admins);
  set('users', users.length - admins);
  set('sessions', users.reduce((sum, u) => sum + u.active_sessions, 0));
}

async function act(action: () => Promise<unknown>, success: string) {
  try {
    await action();
    toast(success);
    await load();
  } catch (err: any) {
    toast(err.message || t('common.error'), 'error');
  }
}

function jsonInit(method: string, body: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

function render() {
  renderStats();
  const container = el('users-list');
  if (!users.length) {
    container.innerHTML = `<p class="p-5 text-sm text-gray-500">${th('users.noUsers')}</p>`;
    return;
  }
  container.innerHTML = users
    .map((u) => {
      const isSelf = u.id === selfId;
      const id = escapeHtml(u.id);
      const btn = 'shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium';
      return `
      <div class="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span class="truncate text-sm font-medium text-gray-900">${escapeHtml(u.username)}</span>
            ${roleBadge(u.role)}
            ${isSelf ? `<span class="text-xs text-gray-400">${th('users.you')}</span>` : ''}
          </div>
          <p class="mt-0.5 text-xs text-gray-500">${th('users.created', { date: formatDateTime(u.created_at) })} · ${tnh('users.sessions', u.active_sessions)}</p>
        </div>
        <div class="flex flex-wrap items-center gap-1">
          <select data-role="${id}" aria-label="${th('users.roleFor', { name: u.username })}" class="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs">
            <option value="user"${u.role === 'user' ? ' selected' : ''}>${th('users.role.user')}</option>
            <option value="admin"${u.role === 'admin' ? ' selected' : ''}>${th('users.role.admin')}</option>
          </select>
          <button data-reset="${id}" class="${btn} text-gray-700 hover:bg-gray-100">${th('users.resetPassword')}</button>
          ${u.active_sessions ? `<button data-signout="${id}" class="${btn} text-gray-700 hover:bg-gray-100">${th('users.signOut')}</button>` : ''}
          ${isSelf ? '' : `<button data-delete="${id}" class="${btn} text-red-600 hover:bg-red-50">${th('users.delete')}</button>`}
        </div>
      </div>`;
    })
    .join('');

  const find = (id: string | undefined) => users.find((u) => u.id === id);

  container.querySelectorAll<HTMLSelectElement>('[data-role]').forEach((select) =>
    select.addEventListener('change', () => {
      const target = find(select.dataset.role);
      if (!target) return;
      const role = select.value;
      const warning = target.id === selfId && role !== 'admin' ? t('users.confirm.selfDemote') : '';
      const roleText = role === 'admin' ? t('users.confirm.roleAdmin') : t('users.confirm.roleUser');
      if (!confirm(t('users.confirm.role', { name: target.username, role: roleText }) + warning)) {
        select.value = target.role;
        return;
      }
      void act(() => apiFetch(`/api/users/${target.id}`, jsonInit('PUT', { role })), t('users.toast.roleUpdated')).then(() => {
        if (target.id === selfId && role !== 'admin') window.location.href = '/login';
      });
    }),
  );

  container.querySelectorAll<HTMLButtonElement>('[data-reset]').forEach((button) =>
    button.addEventListener('click', () => {
      const target = find(button.dataset.reset);
      if (!target) return;
      const password = prompt(t('users.prompt.password', { name: target.username }));
      if (password === null) return;
      void act(() => apiFetch(`/api/users/${target.id}`, jsonInit('PUT', { password })), t('users.toast.passwordReset'));
    }),
  );

  container.querySelectorAll<HTMLButtonElement>('[data-signout]').forEach((button) =>
    button.addEventListener('click', () => {
      const target = find(button.dataset.signout);
      if (!target || !confirm(t('users.confirm.signOut', { name: target.username }))) return;
      void act(() => apiFetch(`/api/users/${target.id}/sessions`, { method: 'DELETE' }), t('users.toast.signedOut'));
    }),
  );

  container.querySelectorAll<HTMLButtonElement>('[data-delete]').forEach((button) =>
    button.addEventListener('click', () => {
      const target = find(button.dataset.delete);
      if (!target || !confirm(t('users.confirm.delete', { name: target.username }))) return;
      void act(() => apiFetch(`/api/users/${button.dataset.delete}`, { method: 'DELETE' }), t('users.toast.deleted'));
    }),
  );
}

function renderEvents(events: AuthEvent[]) {
  const container = el('auth-events');
  if (!events.length) {
    container.innerHTML = `<p class="p-5 text-sm text-gray-500">${th('users.noActivity')}</p>`;
    return;
  }
  container.innerHTML = events
    .map((e) => {
      const tone = e.level === 'warn' ? 'text-amber-700' : e.level === 'error' ? 'text-red-700' : 'text-gray-900';
      return `
      <div class="flex items-baseline justify-between gap-3 px-5 py-2.5">
        <p class="min-w-0 truncate text-sm ${tone}"><span class="font-medium">${escapeHtml(e.username)}</span> · ${escapeHtml(e.action)}${e.detail ? ` <span class="text-gray-400">— ${escapeHtml(e.detail)}</span>` : ''}</p>
        <span class="shrink-0 text-xs text-gray-400">${escapeHtml(formatDateTime(e.at))}</span>
      </div>`;
    })
    .join('');
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
            <label class="text-xs font-medium text-gray-600">${th('users.form.username')}
              <input name="username" type="text" autocomplete="off" class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm" />
            </label>
            <label class="text-xs font-medium text-gray-600">${th('users.form.password')}
              <input name="password" type="password" autocomplete="new-password" placeholder="${th('users.form.passwordHint')}" class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm" />
            </label>
            <label class="text-xs font-medium text-gray-600">${th('users.form.role')}
              <select name="role" class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                <option value="user" selected>${th('users.role.user')}</option>
                <option value="admin">${th('users.role.admin')}</option>
              </select>
            </label>
          </div>
          <p id="add-user-error" class="mt-2 text-xs text-red-600"></p>
          <div class="mt-3 flex gap-2">
            <button type="submit" class="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark">${th('users.form.create')}</button>
          </div>
        </form>`;
      const realForm = form.querySelector('form')!;
      realForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const data = new FormData(event.target as HTMLFormElement);
        try {
          await apiFetch(
            '/api/users',
            jsonInit('POST', { username: data.get('username'), password: data.get('password'), role: data.get('role') }),
          );
          form.classList.add('hidden');
          toast(t('users.toast.created'));
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
    const [usersData, me, events] = await Promise.all([
      apiFetch('/api/users'),
      apiFetch('/api/auth/me'),
      apiFetch('/api/admin/auth-events'),
    ]);
    users = usersData.users;
    selfId = me.user?.id ?? '';
    render();
    renderEvents(events.events);
  } catch (err: any) {
    el('users-list').innerHTML = `<p class="p-5 text-sm text-red-600">${escapeHtml(err.message || t('common.cannotReachApi'))}</p>`;
  }
}

initAddUserForm();
load();
