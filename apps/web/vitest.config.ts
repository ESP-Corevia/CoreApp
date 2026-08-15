import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, mergeConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';

export default mergeConfig(
  defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }),
  defineVitestConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      exclude: ['node_modules', 'dist', 'build', 'e2e/**', 'playwright/**', 'coverage/**'],
      reporters: process.env.CI
        ? [
            'default',
            'github-actions',
            ['junit', { outputFile: './reports/junit.xml', addFileAttribute: true }],
          ]
        : ['default'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'text-summary', 'json', 'json-summary', 'html'],
        exclude: [
          'node_modules/',
          'src/test/',
          '**/*.config.ts',
          '**/*.d.ts',
          '**/*.mjs',
          'build/**',
          'dist/**',
          '.react-router/**',
          'src/components/ui/**.tsx',
          'src/components/ai-elements/**.tsx',
          'src/components/data-table/**.tsx',
          '**/index.{ts,tsx}',
          'src/routes/**',
          // Playwright suite: test code, driven by `pnpm e2e`, not by vitest.
          'e2e/**',
          'playwright-report/**',
          'reports/**',
        ],
        thresholds: {
          branches: 85,
          functions: 75,
          lines: 80,
          statements: 80,
        },
        reportOnFailure: true,
      },
    },
  }),
);
