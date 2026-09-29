import { expect, test, type Page } from '@playwright/test';

const username = process.env.E2E_USERNAME ?? 'admin';
const password = process.env.E2E_PASSWORD ?? 'e2e-admin-password';

const APP_PAGES = [
  '/dashboard', '/wiki', '/search', '/resources', '/resources?tab=emails', '/graph', '/entities',
  '/pipelines', '/pipeline-architecture', '/chat', '/rag-architecture', '/analytics', '/usage',
  '/review-queue', '/logs', '/company', '/settings', '/users',
];

/** Collects uncaught page errors and CSP violations -- the two things a
 * broken script or a too-strict Content-Security-Policy produce. */
function watchForBreakage(page: Page): string[] {
  const problems: string[] = [];
  page.on('pageerror', (err) => problems.push(`pageerror on ${page.url()}: ${err.message}`));
  page.on('console', (msg) => {
    if (/Content Security Policy|Refused to (execute|load|apply|connect|frame)/i.test(msg.text())) {
      problems.push(`CSP on ${page.url()}: ${msg.text()}`);
    }
  });
  page.on('response', (res) => {
    if (/\/(js|css)\//.test(new URL(res.url()).pathname) && res.status() >= 400) {
      problems.push(`asset ${res.status()}: ${res.url()}`);
    }
  });
  return problems;
}

async function logIn(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/);
}

test('public pages render with a nonce-based CSP and no script errors', async ({ page }) => {
  const problems = watchForBreakage(page);
  for (const path of ['/', '/en', '/contact', '/login']) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(200);
    const csp = res?.headers()['content-security-policy'] ?? '';
    expect(csp, path).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+'/);
  }
  expect(problems).toEqual([]);
});

test('unauthenticated app pages redirect to login', async ({ page }) => {
  await page.goto('/wiki');
  await expect(page).toHaveURL(/\/login\?next=%2Fwiki/);
});

test('every app page loads without script errors or CSP violations', async ({ page }) => {
  const problems = watchForBreakage(page);
  await logIn(page);
  for (const path of APP_PAGES) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(200);
    await page.waitForLoadState('networkidle');
  }
  expect(problems).toEqual([]);
});

test('search finds wiki pages and links to them', async ({ page }) => {
  await logIn(page);
  await page.goto('/search?q=battery');
  await expect(page.locator('#search-count')).toHaveText(/\d+ results?/);
  const firstWiki = page.locator('#search-results a[href^="/wiki/"]').first();
  const href = await firstWiki.getAttribute('href');
  await firstWiki.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.locator('h1').first()).not.toBeEmpty();
});

test('raw file previews are served with nosniff', async ({ page }) => {
  await logIn(page);
  const listing = await page.request.get('/api/raw-files');
  expect(listing.ok()).toBe(true);
  const files: { path: string }[] = (await listing.json()).files ?? [];
  const md = files.find((f) => f.path.endsWith('.md'));
  test.skip(!md, 'no markdown raw file to preview');
  const res = await page.request.get(`/api/raw-files/raw/${md!.path.split('/').map(encodeURIComponent).join('/')}`);
  expect(res.ok()).toBe(true);
  expect(res.headers()['x-content-type-options']).toBe('nosniff');
});

test('page history records an edit, shows the diff, and restores it', async ({ page }) => {
  await logIn(page);
  const docUrl = '/api/docs/buergerenergie-eschenbrueck.md';
  const original: string = (await (await page.request.get(docUrl)).json()).body;
  const marker = 'E2E history marker line';
  try {
    const edit = await page.request.put(docUrl, { data: { body: `${original}\n\n${marker}\n` } });
    expect(edit.ok()).toBe(true);

    await page.goto('/wiki/buergerenergie-eschenbrueck/history');
    await expect(page.locator('table tbody tr').first()).toContainText(/Before edit/);
    await expect(page.locator('.bg-green-50', { hasText: marker })).toHaveCount(1);

    page.once('dialog', (dialog) => dialog.accept());
    await page.click('#history-restore-btn');
    await expect(page).toHaveURL(/\/wiki\/buergerenergie-eschenbrueck$/);
    const restored: string = (await (await page.request.get(docUrl)).json()).body;
    expect(restored).not.toContain(marker);
  } finally {
    const now: string = (await (await page.request.get(docUrl)).json()).body;
    if (now.includes(marker)) await page.request.put(docUrl, { data: { body: original } });
  }
});

test('search answers a typed question and deep-links resource and email hits', async ({ page }) => {
  await logIn(page);
  await page.goto('/search?q=' + encodeURIComponent('How large is the battery storage in the school basement?'));
  await expect(page.locator('#search-count')).toHaveText(/\d+ results?/);

  await page.click('.search-filter[data-filter="resource"]');
  const resourceHit = page.locator('#search-results a[href^="/resources?tab=files&open="]').first();
  await expect(resourceHit).toBeVisible();
  const resourcePath = decodeURIComponent((await resourceHit.getAttribute('href'))!.split('open=')[1]);
  await resourceHit.click();
  // The modal wrapper has no box of its own (its child is position: fixed), so check its heading.
  await expect(page.locator('#preview-modal h2')).toHaveText(resourcePath);

  await page.goto('/search?q=' + encodeURIComponent('Helion module delivery delay Nordlicht'));
  await page.click('.search-filter[data-filter="email"]');
  const emailHit = page.locator('#search-results a[href^="/resources?tab=emails&open="]').first();
  await expect(emailHit).toBeVisible();
  await emailHit.click();
  await expect(page.locator('#email-modal h2')).toBeVisible();
  await expect(page.locator('#email-body')).toContainText(/14 weeks/i);
});

test('admin can create, download, restore and delete a backup', async ({ page }) => {
  await logIn(page);
  const before: string[] = (await (await page.request.get('/api/admin/backups')).json()).backups.map((b: { name: string }) => b.name);
  const made: string[] = [];
  try {
    await page.goto('/users');
    await page.click('#backup-create');
    const rows = page.locator('#backups-list [data-restore]');
    await expect(rows).toHaveCount(before.length + 1);
    const name = (await rows.evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.restore!))).find((n) => !before.includes(n))!;
    made.push(name);

    const download = await page.request.get(`/api/admin/backups/${encodeURIComponent(name)}`);
    expect(download.ok()).toBe(true);
    expect((await download.body()).subarray(0, 2)).toEqual(Buffer.from([0x1f, 0x8b])); // gzip magic

    page.once('dialog', (dialog) => dialog.accept());
    await page.locator(`#backups-list [data-restore="${name}"]`).click();
    await expect(page.locator('#backups-list')).toContainText('pre-restore');
    const after: string[] = (await (await page.request.get('/api/admin/backups')).json()).backups.map((b: { name: string }) => b.name);
    made.push(...after.filter((n) => n.includes('pre-restore') && !before.includes(n)));

    // Restoring the backup we just took leaves the wiki as it was.
    const res = await page.goto('/wiki/buergerenergie-eschenbrueck');
    expect(res?.status()).toBe(200);
  } finally {
    for (const name of made) await page.request.delete(`/api/admin/backups/${encodeURIComponent(name)}`);
  }
});

test('non-admin API calls to backups are refused', async ({ request }) => {
  const res = await request.get('/api/admin/backups');
  expect(res.status()).toBe(401);
});

test('dashboard: status cards link out, "/" focuses search, Ask opens a new chat', async ({ page }) => {
  const problems = watchForBreakage(page);
  await logIn(page);
  await page.waitForLoadState('networkidle');

  const cards = page.locator('#status-cards a[data-card]');
  await expect(cards).toHaveCount(4);
  await expect(page.locator('[data-card="pages"]')).toHaveAttribute('href', '/wiki');
  await expect(page.locator('[data-card="pages"]')).not.toContainText(/^\s*0\s/);
  await expect(page.locator('#recent-pages a[href^="/wiki/"]').first()).toBeVisible();

  await page.keyboard.press('/');
  await expect(page.locator('#dashboard-q')).toBeFocused();

  const before: string[] = (await (await page.request.get('/api/chat/sessions')).json()).sessions.map((s: { id: string }) => s.id);
  const question = 'E2E dashboard question about the Sonnendach Lindenhof';
  try {
    await page.keyboard.type(question);
    await page.click('button[formaction="/chat"]');
    await expect(page).toHaveURL(/\/chat$/); // the ?q= is consumed so a reload does not re-ask
    await expect(page.getByText(question).first()).toBeVisible();
  } finally {
    const after: { id: string }[] = (await (await page.request.get('/api/chat/sessions')).json()).sessions;
    for (const s of after) if (!before.includes(s.id)) await page.request.delete(`/api/chat/sessions/${s.id}`);
  }

  await page.goto('/wiki');
  await page.keyboard.press('/');
  await expect(page.locator('#sidebar-search')).toBeFocused();
  await page.keyboard.type('battery');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/search\?q=battery/);
  expect(problems).toEqual([]);
});

test('settings: create an API token, use it through the proxy, revoke it', async ({ page, playwright }) => {
  const problems = watchForBreakage(page);
  await logIn(page);
  await page.goto('/settings');
  const name = `E2E token ${Date.now()}`;
  await page.fill('#token-form input[name="name"]', name);
  await page.click('#token-form button[type="submit"]');
  const value = page.locator('#token-created-value');
  await expect(value).toHaveText(/^wsb_/);
  const token = (await value.textContent())!;
  const row = page.locator('#tokens-list li', { hasText: name });
  await expect(row).toContainText(/Read only/);

  // A client without the session cookie, as the MCP server would be.
  const api = await playwright.request.newContext({ baseURL: 'http://localhost:3000' });
  try {
    const me = await api.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
    expect(me.ok()).toBe(true);
    expect((await me.json()).auth).toEqual({ method: 'token', scope: 'read' });
    const write = await api.post('/api/chat/sessions', { headers: { Authorization: `Bearer ${token}` }, data: {} });
    expect(write.status()).toBe(403);

    page.once('dialog', (dialog) => dialog.accept());
    await row.locator('[data-revoke]').click();
    await expect(page.locator('#tokens-list li', { hasText: name })).toHaveCount(0);
    expect((await api.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })).status()).toBe(401);
  } finally {
    await api.dispose();
  }
  expect(problems).toEqual([]);
});

test('admin panel: scheduled sync settings save, persist across a reload, and refuse a run with nothing to sync', async ({ page }) => {
  const problems = watchForBreakage(page);
  await logIn(page);
  await page.goto('/users');
  await expect(page.locator('#sync-status')).toContainText(/Automatic sync is off/);
  await expect(page.locator('#sync-run')).toBeEnabled();

  try {
    await page.fill('#sync-form input[name="interval_hours"]', '12');
    await page.check('#sync-form input[name="enabled"]');
    await page.uncheck('#sync-form input[name="compile_after_sync"]');
    await page.click('#sync-form button[type="submit"]');
    await expect.poll(async () => (await (await page.request.get('/api/admin/sync')).json()).settings.interval_hours).toBe(12);

    await page.reload();
    await expect(page.locator('#sync-form input[name="interval_hours"]')).toHaveValue('12');
    await expect(page.locator('#sync-form input[name="enabled"]')).toBeChecked();
    await expect(page.locator('#sync-form input[name="compile_after_sync"]')).not.toBeChecked();
    // Enabled, but no account selected: still off, and nothing to run.
    await expect(page.locator('#sync-status')).toContainText(/Automatic sync is off/);
    const run = await page.request.post('/api/admin/sync/run');
    expect(run.status()).toBe(400);
  } finally {
    await page.request.put('/api/admin/sync/settings', { data: { enabled: false, interval_hours: 24, compile_after_sync: true, connections: [] } });
  }

  // Nonsense is stopped by the browser's own validation before any request is sent
  // (the server rejects it too; see sync.routes.test.ts).
  let saves = 0;
  page.on('request', (req) => req.method() === 'PUT' && req.url().includes('/api/admin/sync/settings') && saves++);
  await page.fill('#sync-form input[name="interval_hours"]', '0');
  await page.click('#sync-form button[type="submit"]');
  expect(await page.locator('#sync-form input[name="interval_hours"]').evaluate((el: HTMLInputElement) => el.validity.rangeUnderflow)).toBe(true);
  expect(saves).toBe(0);
  expect(problems).toEqual([]);
});

test('review: settle a contradiction, see it under Resolved, reopen it', async ({ page }) => {
  const problems = watchForBreakage(page);
  await logIn(page);
  await page.goto('/review-queue');
  await page.click('#tab-btn-contradictions');
  const openRows = page.locator('#contra-list [data-status="open"]');
  await expect(openRows.first()).toBeVisible(); // the sample corpus has contradiction callouts
  const openBefore = await openRows.count();
  const id = (await openRows.first().getAttribute('data-contradiction-id'))!;
  try {
    const row = page.locator(`#contra-list [data-contradiction-id="${id}"]`);
    await row.locator('[data-contra-note]').fill('E2E: checked against the sources');
    await row.locator('[data-contra-action="resolved"]').click();
    await expect(openRows).toHaveCount(openBefore - 1);

    await page.click('.contra-filter[data-filter="resolved"]');
    const settled = page.locator(`#contra-list [data-contradiction-id="${id}"]`);
    await expect(settled).toContainText('E2E: checked against the sources');
    await settled.locator('[data-contra-action="open"]').click();
    await expect(settled).toHaveCount(0);
  } finally {
    await page.request.put(`/api/contradictions/${id}`, { data: { status: 'open' } });
  }
  expect(problems).toEqual([]);
});

test('dashboard: the open-contradictions row opens the Contradictions tab', async ({ page }) => {
  const problems = watchForBreakage(page);
  await logIn(page);
  await page.goto('/dashboard');
  const row = page.locator('#attention-summary a[href="/review-queue#contradictions"]');
  await expect(row).toBeVisible(); // the sample corpus has unsettled contradictions
  await row.click();
  await expect(page).toHaveURL(/\/review-queue#contradictions$/);
  await expect(page.locator('#tab-panel-contradictions')).toBeVisible();
  await expect(page.locator('#contra-list [data-status="open"]').first()).toBeVisible();
  expect(problems).toEqual([]);
});

test('analytics: fact coverage runs the real check and lists sources with missing figures', async ({ page }) => {
  const problems = watchForBreakage(page);
  await logIn(page);
  await page.goto('/analytics');
  await expect(page.locator('#fact-coverage [data-recall]')).toHaveText(/^\d+(\.\d)? %$/, { timeout: 30_000 });
  const first = page.locator('#fact-coverage [data-coverage-source]').first();
  await expect(first).toBeVisible();
  await expect(first.locator('a').first()).toHaveAttribute('href', /^\/resources\?tab=files&open=/);
  expect(problems).toEqual([]);
});
