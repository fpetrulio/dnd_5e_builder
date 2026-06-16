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

      // No hardcoded magic numbers — allow common component/D&D values
      'no-magic-numbers': 'off',
      '@typescript-eslint/no-magic-numbers': ['warn', {
        ignore: [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16, 18, 20, 24, 27, 30, 32, 48, 50, 60, 100, 1000],
        ignoreEnums: true,
        ignoreNumericLiteralTypes: true,
        ignoreReadonlyClassProperties: true,
        ignoreArrayIndexes: true,
      }],

      // No explicit `any`
      '@typescript-eslint/no-explicit-any': 'error',

      // Consistent type imports
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

      // No console.log in production code
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Enforce const where possible
      'prefer-const': 'error',

      // Numbers in template literals are safe and idiomatic in JS/TS
      '@typescript-eslint/restrict-template-expressions': ['error', {
        allowNumber: true,
        allowBoolean: false,
        allowAny: false,
        allowNullish: false,
      }],

      // Allow arrow shorthand returning void (common in React event handlers)
      '@typescript-eslint/no-confusing-void-expression': ['error', {
        ignoreArrowShorthand: true,
        ignoreVoidOperator: true,
      }],

      // Don't flag onClick={() => navigate(...)} — React ignores returned Promises from event handlers
      '@typescript-eslint/no-misused-promises': ['error', {
        checksVoidReturn: { attributes: false },
      }],

      // Conflicts with no-non-null-assertion: prefer the readable `as T` form at query boundaries
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',

      // No inline style with raw color values (remind dev to use CSS vars)
      'react/forbid-component-props': 'off',
    },
  },
])
