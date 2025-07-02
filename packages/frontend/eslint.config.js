import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  // Config for Node.js files
  {
    files: ['tailwind.config.cjs', 'postcss.config.cjs'], // Updated file extensions
    languageOptions: {
      ecmaVersion: 2020, // Or latest
      sourceType: 'commonjs', // Assuming these are CommonJS modules
      globals: {
        ...globals.node, // Use Node.js globals
        module: 'writable', // Define module as writable if needed
        require: 'readonly', // Define require
        process: 'readonly', // Define process if used in these configs
      },
    },
    rules: {
      'no-undef': 'error', // Keep undefined variable checks
       // Add any Node.js specific rules if necessary
    }
  },
  // Config for React/Browser JS/JSX files
  {
    files: ['src/**/*.{js,jsx}'], // Target only files in src for React/browser specific linting
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^[A-Z_]', // For React components, etc.
        argsIgnorePattern: '^_', // For unused function arguments prefixed with _
        caughtErrorsIgnorePattern: '^_' // For unused catch error objects prefixed with _
      }],
    },
  },
])
