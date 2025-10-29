import { defineConfig, mergeConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
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
      exclude: [
        'node_modules',
        'dist',
        'build',
        'e2e/**',
        'playwright/**',
        'src/components/**.tsx',
      ],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'json-summary', 'html'],
        exclude: [
          'node_modules/',
          'src/test/',
          '**/*.config.ts',
          '**/*.d.ts',
          'build/**',
          'dist/**',
          '.react-router/**',
        ],
      },
    },
  })
);
