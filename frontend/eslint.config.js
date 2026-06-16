import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // No unused variables or imports
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      // No hardcoded magic numbers (exceptions: -1, 0, 1, 2 are common)
      'no-magic-numbers': 'off',
      '@typescript-eslint/no-magic-numbers': ['warn', {
        ignore: [-1, 0, 1, 2, 100],
        ignoreEnums: true,
        ignoreNumericLiteralTypes: true,
        ignoreReadonlyClassProperties: true,
      }],

      // No explicit `any`
      '@typescript-eslint/no-explicit-any': 'error',

      // Consistent type imports
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

      // No console.log in production code
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Enforce const where possible
      'prefer-const': 'error',

      // No inline style with raw color values (remind dev to use CSS vars)
      'react/forbid-component-props': 'off',
    },
  },
])
