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
      // Storybook (opt-in tooling, like e2e) — deps aren't in the default
      // install, so don't lint its config/stories against missing modules.
      '.storybook/**',
      '**/*.stories.tsx',
      // Local `build-storybook` output (git-ignored). Linting walks into its
      // minified vendor bundles otherwise → 158 phantom errors locally that
      // CI never sees (the dir doesn't exist there). Match CI behaviour.
      'storybook-static/**',
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
  {
    // ── Design-system token purity (raw-color guard) ──────────────────────
    // The audited shared-component surfaces are token-pure: a component must not
    // reach for a raw Tailwind palette color or a hardcoded hex in className —
    // those bypass the theme system and break contrast on the non-default themes.
    // This complements the jest `theme-safety` guard (white-on-light + the shell
    // denylist): here we catch the neutral/rainbow/hex long tail at lint time.
    // Scoped to directories VERIFIED clean today; broaden as more areas migrate
    // (see docs/design-system/figma-structured-usage-audit.md). White/black with
    // an /alpha (scrims) and CSS-var-backed arbitrary values stay allowed.
    files: [
      'src/components/ui/**/*.{ts,tsx}',
      'src/components/layout/**/*.{ts,tsx}',
      'src/components/marketing/**/*.{ts,tsx}',
      'src/components/sport/**/*.{ts,tsx}',
      'src/components/dashboard/**/*.{ts,tsx}',
      'src/components/report/**/*.{ts,tsx}',
      'src/components/trust/**/*.{ts,tsx}',
      'src/components/proof/**/*.{ts,tsx}',
      'src/components/features/**/*.{ts,tsx}',
      'src/components/seo/**/*.{ts,tsx}',
      'src/components/diagnose/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "Literal[value=/\\b(?:text|bg|border|ring|from|via|to|fill|stroke|divide|outline|decoration)-(?:gray|slate|zinc|neutral|stone|green|red|blue|yellow|orange|amber|lime|emerald|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3}\\b/]",
          message:
            'Raw Tailwind palette color in a design-system component — use a semantic theme token (text-foreground / bg-card / text-muted-foreground / text-link / bg-stage …). See docs/design-system/figma-structured-usage-audit.md.',
        },
        {
          selector:
            "TemplateElement[value.raw=/\\b(?:text|bg|border|ring|from|via|to|fill|stroke|divide|outline|decoration)-(?:gray|slate|zinc|neutral|stone|green|red|blue|yellow|orange|amber|lime|emerald|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3}\\b/]",
          message:
            'Raw Tailwind palette color in a design-system component — use a semantic theme token. See docs/design-system/figma-structured-usage-audit.md.',
        },
        {
          selector:
            "Literal[value=/(?:bg|text|border|ring|fill|stroke|from|via|to|decoration|outline|divide|shadow)-\\[#[0-9a-fA-F]/]",
          message:
            'Hardcoded hex color in a design-system component — use a semantic theme token (e.g. bg-stage, text-foreground) or a CSS-var-backed value. See docs/design-system/figma-structured-usage-audit.md.',
        },
        {
          selector:
            "TemplateElement[value.raw=/(?:bg|text|border|ring|fill|stroke|from|via|to|decoration|outline|divide|shadow)-\\[#[0-9a-fA-F]/]",
          message:
            'Hardcoded hex color in a design-system component — use a semantic theme token or a CSS-var-backed value. See docs/design-system/figma-structured-usage-audit.md.',
        },
      ],
    },
  },
];
