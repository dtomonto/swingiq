// ESLint flat config (ESLint 9 / Next 16).
// Replaces the old .eslintrc.json — Next 16 removed `next lint`, so linting now
// runs via the ESLint CLI (`npm run lint`).
//
// `eslint-config-next/core-web-vitals` registers the @next/next, react,
// react-hooks, import and jsx-a11y plugins globally, so we layer rule overrides
// for those on top (re-registering them would error in flat config).
//
// IMPORTANT: it registers the @typescript-eslint plugin ONLY inside a config
// object scoped to `files: ['**/*.ts','**/*.tsx']`. A flat-config object can only
// reference rules from a plugin registered in an object that matches the same
// files. So our @typescript-eslint/* rule overrides must live in a TS-scoped
// object that re-registers the plugin — otherwise ESLint tries to apply them to
// .js/.mjs files where the plugin was never registered and fails config
// validation ("could not find plugin @typescript-eslint").

import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'next-env.d.ts',
      '*.config.js',
      '*.config.mjs',
    ],
  },
  ...nextCoreWebVitals,
  {
    rules: {
      // Full jsx-a11y recommended ruleset (plugin already registered above).
      ...jsxA11y.flatConfigs.recommended.rules,

      // Security guardrails.
      'no-eval': 'error',
      'no-implied-eval': 'error',

      // Pre-existing a11y violations in the older app surface, tracked for
      // incremental cleanup. New code should satisfy these.
      'jsx-a11y/label-has-associated-control': 'warn',
      'jsx-a11y/media-has-caption': 'warn',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/no-redundant-roles': 'warn',
      'jsx-a11y/interactive-supports-focus': 'warn',

      // React Compiler rules newly enforced by eslint-config-next 16. The older
      // app surface has pre-existing violations (setState in effects, refs/impure
      // calls during render); downgraded to warn and tracked for incremental
      // cleanup so they don't block the build. New code should satisfy these.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/use-memo': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/static-components': 'warn',

      // Pre-existing next/react violations in the older app surface (legacy <a>
      // links to in-app pages, unescaped entities in copy), tracked for
      // incremental cleanup. New code should satisfy these.
      '@next/next/no-html-link-for-pages': 'warn',
      'react/no-unescaped-entities': 'warn',
    },
  },
  {
    // @typescript-eslint rules must be scoped to the files where the plugin is
    // registered. We re-register the plugin here so these overrides resolve.
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
];
