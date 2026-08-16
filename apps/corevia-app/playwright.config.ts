import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const APP_URL = process.env.E2E_APP_URL ?? 'http://localhost:5174';
const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000';
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// The API binds 0.0.0.0 (IPv4 only). `localhost` resolves to ::1 first on Node, so the readiness
// probe must target the IPv4 loopback explicitly or it never sees the server come up.
const API_PROBE_URL = API_URL.replace('localhost', '127.0.0.1');

export default defineConfig({
  testDir: './e2e',
  // The suite shares one database with the API, so specs run sequentially to stay deterministic.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // The first navigation compiles the whole app on demand (cold Vite), which easily exceeds the
  // 30s default on a CI runner.
  timeout: 90_000,
  expect: { timeout: 15_000 },
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
    baseURL: APP_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    reducedMotion: 'reduce',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Pixel 7'] },
    },
    {
      // Screens reachable without a session, plus the role guards.
      name: 'guest',
      testMatch: /.*\.guest\.spec\.ts/,
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'patient',
      testMatch: /.*\.patient\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Pixel 7'], storageState: 'e2e/.auth/patient.json' },
    },
    {
      name: 'doctor',
      testMatch: /.*\.doctor\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Pixel 7'], storageState: 'e2e/.auth/doctor.json' },
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
      command: 'pnpm --filter corevia-app dev',
      cwd: REPO_ROOT,
      url: APP_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      stdout: 'pipe',
      stderr: 'pipe',
      // Empty on purpose: the app then calls `/trpc` and `/api/auth` relatively and Vite proxies
      // them to the API, which keeps everything same-origin (no CORS, no cross-site cookies).
      env: { VITE_SERVER_URL: '' },
    },
  ],
});
