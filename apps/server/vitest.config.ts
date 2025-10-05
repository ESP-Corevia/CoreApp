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
    setupFiles: ['./test/setup.ts'],
    coverage: {
      enabled: true,
      provider: 'istanbul',
      reporter: ['text', 'text-summary', 'lcov', 'json', 'json-summary'],
      reportsDirectory: './coverage',
      reportOnFailure: true,
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
      include: ['src/**/*.ts', 'test/**/*.ts'],
      exclude: [
        'src/utils/auth.ts',
        'src/env.ts',
        '**/index.ts',
        'test/test.ts',
        'src/db/migrations/**',
        'src/db/schema/**',
        'src/utils/functions.ts',
        'src/lib/auth.ts',
        'src/lib/banner.ts',
      ],
    },
  },
});

export default defineConfig(merged);
