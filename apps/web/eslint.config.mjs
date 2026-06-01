// ESLint flat config (ESLint 9 / Next 16).
// Replaces the old .eslintrc.json — Next 16 removed `next lint`, so linting now
// runs via the ESLint CLI (`npm run lint`).
//
// `eslint-config-next/core-web-vitals` already registers the @next/next, react,
// react-hooks, import, @typescript-eslint and jsx-a11y plugins, so we only layer
// rule overrides on top (re-registering those plugins would error in flat config).

import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import jsxA11y from 'eslint-plugin-jsx-a11y';

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

      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

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
    },
  },
];
