import { FlatCompat } from '@eslint/eslintrc';
import tsPlugin from '@typescript-eslint/eslint-plugin'; // ✅ plugin import
import parser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import nodePlugin from 'eslint-plugin-n';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import securityPlugin from 'eslint-plugin-security';
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });
/** @type {import("eslint").Linter.FlatConfig[]} */
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
        project: './tsconfig.eslint.json',
      },
    },
    plugins: {
      import: importPlugin,
      prettier: eslintPluginPrettier,
      ts: tsPlugin, // ✅ register plugin with a key
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
          // Pour respecter les `type` séparés si tu veux :
          importOrderTypeScriptVersion: '5.0.0',
        },
      ],

      // ✅ General TS hygiene
      'ts/ban-ts-comment': 'error',
      'ts/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'no-unused-vars': 'off',
      'ts/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // 'ts/explicit-function-return-type': ['warn', { allowExpressions: true }],
      'ts/no-floating-promises': 'error',
      'ts/no-misused-promises': 'error',

      // ✅ Node.js environment rules
      'node/no-unsupported-features/es-syntax': 'off',
      'node/no-missing-import': 'off',

      // ✅ Other good backend defaults
      'no-console': 'error', // could be info-only for logs
      'require-await': 'error',
      'no-useless-catch': 'error',
      'no-throw-literal': 'error', // Enforce throwing Error objects

      // ✅ Security rules
      'security/detect-object-injection': 'off', // false positive prone — disable or audit manually
      'security/detect-unsafe-regex': 'warn',
      'security/detect-non-literal-require': 'warn',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-eval-with-expression': 'error',
      'security/detect-new-buffer': 'error',
    },
  },
];
