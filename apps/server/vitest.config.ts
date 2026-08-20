import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig, mergeConfig } from 'vitest/config';

import baseConfig from '../../vitest.config';

const merged = mergeConfig(baseConfig, {
  plugins: [tsconfigPaths()],
  ssr: {
    noExternal: ['better-auth-harmony', 'validator'],
  },
  server: {
    deps: {
      inline: ['better-auth-harmony', 'validator'],
    },
  },
  test: {
    environment: 'node',
    hookTimeout: 30_000,
    setupFiles: ['./test/setup.ts'],
    env: {
      NODE_ENV: 'test',
      SESSION_SECRET: 'test_session_secret',
      BETTER_AUTH_SECRET: 'test_better_auth_secret',
      BETTER_AUTH_URL: 'http://localhost:3000',
      BASE_URL: 'http://localhost:3000',
      CORS_ORIGIN: 'http://localhost:5173',
      NVIDIA_API_KEY: 'test_nvidia_key',
      LOG_LEVEL: 'error',
    },
    reporters: process.env.CI
      ? [
          'default',
          'github-actions',
          ['junit', { outputFile: './reports/junit.xml', addFileAttribute: true }],
        ]
      : ['default'],
    coverage: {
      enabled: true,
      provider: 'istanbul',
      reporter: ['text', 'text-summary', 'lcov', 'json', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      reportOnFailure: true,
      thresholds: {
        branches: 90,
        functions: 95,
        lines: 95,
        statements: 95,
      },
      include: ['src/**/*.ts'],
      exclude: [
        'src/env.ts',
        '**/index.ts',
        'src/db/migrations/**',
        'src/db/schema/**',
        'src/utils/functions.ts',
        'src/lib/banner.ts',
      ],
    },
  },
});

export default defineConfig(merged);
