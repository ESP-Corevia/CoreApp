import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { FlatCompat } from '@eslint/eslintrc';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import nodePlugin from 'eslint-plugin-n';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import securityPlugin from 'eslint-plugin-security';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/types/**',
      '**/migrations/**',
      'test/test.ts',
      'coverage/**',
    ],
  },
  ...compat.extends('plugin:drizzle/recommended'),
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: path.resolve(__dirname, './tsconfig.eslint.json'), // ✅ Absolute path
      },
    },
    plugins: {
      import: importPlugin,
      prettier: eslintPluginPrettier,
      ts: tsPlugin,
      node: nodePlugin,
      security: securityPlugin,
    },
    rules: {
      // ✅ Tri des imports
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          pathGroups: [
            {
              pattern: '{react,vue,next,@*}',
              group: 'external',
              position: 'before',
            },
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
          distinctGroup: true,
        },
      ],
      'import/no-duplicates': 'error',
      'no-duplicate-imports': 'off',

      // ✅ Prettier formatting
      'prettier/prettier': [
        'error',
        {
          importOrder: ['^react', '<THIRD_PARTY_MODULES>', '^@/.*', '^[./]'],
          importOrderSeparation: true,
          importOrderSortSpecifiers: true,
          importOrderTypeScriptVersion: '5.0.0',
        },
      ],

      // ✅ General TS hygiene
      'ts/ban-ts-comment': 'error',
      'ts/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'no-unused-vars': 'off',
      'ts/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'ts/no-floating-promises': 'error',
      'ts/no-misused-promises': 'error',

      // ✅ Node.js environment rules
      'node/no-unsupported-features/es-syntax': 'off',
      'node/no-missing-import': 'off',

      // ✅ Other good backend defaults
      'no-console': 'error',
      'require-await': 'error',
      'no-useless-catch': 'error',
      'no-throw-literal': 'error',

      // ✅ Security rules
      'security/detect-object-injection': 'off',
      'security/detect-unsafe-regex': 'warn',
      'security/detect-non-literal-require': 'warn',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-eval-with-expression': 'error',
      'security/detect-new-buffer': 'error',
    },
  },
];
