import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const WEB_URL = process.env.E2E_WEB_URL ?? 'http://localhost:5173';
const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000';
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// The API binds 0.0.0.0 (IPv4 only). `localhost` resolves to ::1 first on Node, so the readiness
// probe must target the IPv4 loopback explicitly or it never sees the server come up.
const API_PROBE_URL = API_URL.replace('localhost', '127.0.0.1');

export default defineConfig({
  testDir: './e2e',
  // The whole suite shares one database, so specs run sequentially to stay deterministic.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [
        ['list'],
        ['github'],
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['junit', { outputFile: 'reports/e2e-junit.xml' }],
      ]
    : [
        ['list'],
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['junit', { outputFile: 'reports/e2e-junit.xml' }],
      ],
  use: {
    baseURL: WEB_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Specs that must run without a session (guards, sign-in, accessibility).
      name: 'guest',
      testMatch: /.*\.(guest|a11y)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Specs driving the back-office as the seeded administrator.
      name: 'admin',
      testMatch: /.*\.auth\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/admin.json' },
    },
  ],
  webServer: [
    {
      // `start:e2e` runs the API without the file watcher: one process layer less, and the
      // watcher never survives Playwright's hard shutdown anyway.
      command: 'pnpm --filter server start:e2e',
      cwd: REPO_ROOT,
      url: `${API_PROBE_URL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      stdout: 'pipe',
      stderr: 'pipe',
      // Development mode keeps session cookies non-secure so they survive plain http.
      env: { NODE_ENV: 'development' },
    },
    {
      command: 'pnpm dev',
      url: WEB_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: { VITE_SERVER_URL: API_URL },
    },
  ],
});
