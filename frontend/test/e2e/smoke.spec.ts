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
  const docUrl = '/api/docs/aurora-labs.md';
  const original: string = (await (await page.request.get(docUrl)).json()).body;
  const marker = 'E2E history marker line';
  try {
    const edit = await page.request.put(docUrl, { data: { body: `${original}\n\n${marker}\n` } });
    expect(edit.ok()).toBe(true);

    await page.goto('/wiki/aurora-labs/history');
    await expect(page.locator('table tbody tr').first()).toContainText(/Before edit/);
    await expect(page.locator('.bg-green-50', { hasText: marker })).toHaveCount(1);

    page.once('dialog', (dialog) => dialog.accept());
    await page.click('#history-restore-btn');
    await expect(page).toHaveURL(/\/wiki\/aurora-labs$/);
    const restored: string = (await (await page.request.get(docUrl)).json()).body;
    expect(restored).not.toContain(marker);
  } finally {
    const now: string = (await (await page.request.get(docUrl)).json()).body;
    if (now.includes(marker)) await page.request.put(docUrl, { data: { body: original } });
  }
});

test('search answers a typed question and deep-links resource and email hits', async ({ page }) => {
  await logIn(page);
  await page.goto('/search?q=' + encodeURIComponent('What battery cell does the Nova Widget use?'));
  await expect(page.locator('#search-count')).toHaveText(/\d+ results?/);

  await page.click('.search-filter[data-filter="resource"]');
  const resourceHit = page.locator('#search-results a[href^="/resources?tab=files&open="]').first();
  await expect(resourceHit).toBeVisible();
  const resourcePath = decodeURIComponent((await resourceHit.getAttribute('href'))!.split('open=')[1]);
  await resourceHit.click();
  // The modal wrapper has no box of its own (its child is position: fixed), so check its heading.
  await expect(page.locator('#preview-modal h2')).toHaveText(resourcePath);

  await page.goto('/search?q=' + encodeURIComponent('MESH-118 relay radio sleep timer'));
  await page.click('.search-filter[data-filter="email"]');
  const emailHit = page.locator('#search-results a[href^="/resources?tab=emails&open="]').first();
  await expect(emailHit).toBeVisible();
  await emailHit.click();
  await expect(page.locator('#email-modal h2')).toBeVisible();
  await expect(page.locator('#email-body')).toContainText(/sleep timer/i);
});
