import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** Base flat config shared by all packages. */
export const base = tseslint.config(
  { ignores: ['dist/**', '.next/**', 'coverage/**', '**/api/generated/**', 'next-env.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-extraneous-class': 'off',
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  prettier,
);

export default base;
