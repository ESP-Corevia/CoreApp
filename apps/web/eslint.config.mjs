import json from '@eslint/json';
import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';
import a11y from 'eslint-plugin-jsx-a11y';
import imp from 'eslint-plugin-import';
import unused from 'eslint-plugin-unused-imports';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig([
  {
    ignores: [
      'dist/**',
      'build/**',
      'node_modules/**',
      '.vite/**',
      'coverage/**',
      '.react-router/**',
      'playwright-report/**',
      'src/components/**',
    ],
  },

  // JSON files
  {
    files: ['**/*.json'],
    plugins: { json },
    language: 'json/json',
    extends: ['json/recommended'],
  },
  {
    files: ['**/*.json5'],
    plugins: { json },
    language: 'json/json5',
    extends: ['json/recommended'],
  },

  // TypeScript & React files
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: path.resolve(__dirname, './tsconfig.json'),
        tsconfigRootDir: __dirname,
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
      },
    },
    plugins: {
      react,
      'react-hooks': hooks,
      'jsx-a11y': a11y,
      import: imp,
      'unused-imports': unused,
      '@typescript-eslint': tseslint.plugin,
      prettier: prettier,
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: path.resolve(__dirname, './tsconfig.eslint.json'),
        },
      },
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
    },
    rules: {
      // ============ Base JS/TS ============
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommendedTypeChecked[1].rules,
      ...prettierConfig.rules,

      // ============ General ============
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-template': 'warn',
      'object-shorthand': 'warn',

      // ============ Prettier ============
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
        },
      ],
      'arrow-body-style': 'off',
      'prefer-arrow-callback': 'off',

      // ============ TypeScript ============
      '@typescript-eslint/no-unused-vars': 'off', // handled by unused-imports
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } }, // ✅ prevents tRPC/async handler errors
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',

      // ============ Imports ============
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
          pathGroups: [
            { pattern: 'react', group: 'external', position: 'before' },
            { pattern: '@tanstack/**', group: 'external', position: 'before' },
            { pattern: '@trpc/**', group: 'external', position: 'before' },
            { pattern: '@/**', group: 'internal', position: 'before' },
          ],
          pathGroupsExcludedImportTypes: ['react'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
          distinctGroup: true,
        },
      ],
      'import/no-duplicates': 'error',
      // 'import/no-cycle': 'warn',
      'import/first': 'error',
      'import/newline-after-import': 'warn',

      // ============ Unused imports ============
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': 'off',

      // ============ React ============
      'react/jsx-uses-react': 'off', // not needed in React 17+
      'react/react-in-jsx-scope': 'off',
      'react/self-closing-comp': 'error',
      'react/no-array-index-key': 'warn',
      'react/jsx-curly-brace-presence': ['warn', { props: 'never', children: 'never' }],
      'react/jsx-boolean-value': ['warn', 'never'],
      'react/jsx-no-useless-fragment': 'warn',
      'react/function-component-definition': ['error', { namedComponents: 'function-declaration' }],
      'react/prop-types': 'off', // using TypeScript

      // ============ React Hooks ============
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      // ============ Accessibility ============
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/no-autofocus': ['warn', { ignoreNonDOM: true }],
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
    },
  },

  // ============ Test files ============
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/__tests__/**'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      // 'import/no-cycle': 'off',
    },
  },

  // ============ Config files ============
  {
    files: ['*.config.{ts,js}', 'vite.config.ts', 'react-router.config.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: path.resolve(__dirname, './tsconfig.eslint.json'),
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      import: imp,
    },
    rules: {
      'no-console': 'off',
      'import/no-default-export': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
]);
