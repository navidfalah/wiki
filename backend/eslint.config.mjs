// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Runtime modules are deliberately plain CommonJS JavaScript for Node.
    files: ['src/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { require: 'readonly', module: 'readonly', __dirname: 'readonly', process: 'readonly', Buffer: 'readonly', console: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly', TextDecoder: 'readonly', fetch: 'readonly', AbortController: 'readonly', AbortSignal: 'readonly', DOMException: 'readonly', URL: 'readonly', URLSearchParams: 'readonly', FormData: 'readonly', Blob: 'readonly' },
    },
    rules: { '@typescript-eslint/no-require-imports': 'off', 'no-useless-escape': 'off' },
  },
  {
    rules: {
      'no-console': 'warn',
      // The Express error middleware and route wrappers deal in untyped
      // request JSON -- `any` there is the
      // honest type, not a shortcut.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // vitest's vi.mock()/vi.hoisted() run before ES imports are bound, so
    // tests that need a path/fixture value inside vi.mock's factory pull it
    // in with require() rather than an import statement -- intentional, not
    // a leftover CommonJS habit.
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);
