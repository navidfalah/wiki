import { defineConfig, devices } from '@playwright/test';

// Starts the real backend and frontend and drives them in Chromium. The
// backend bootstraps an admin from ADMIN_USERNAME/ADMIN_PASSWORD on an empty
// data/users.json (the CI case); locally, point E2E_USERNAME/E2E_PASSWORD at
// an existing account instead. Run `npm run build` first -- the frontend
// serves the built CSS/JS bundles from dist-static/.
const username = process.env.E2E_USERNAME ?? 'admin';
const password = process.env.E2E_PASSWORD ?? 'e2e-admin-password';

export default defineConfig({
  testDir: 'test/e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npx tsx src/index.ts',
      cwd: '../backend',
      url: 'http://localhost:8000/api/health',
      env: { PORT: '8000', ADMIN_USERNAME: username, ADMIN_PASSWORD: password },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'npx tsx src/index.ts',
      url: 'http://localhost:3000/healthz',
      env: { PORT: '3000', BACKEND_API_URL: 'http://localhost:8000' },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
