import type { StorybookConfig } from '@storybook/nextjs-vite';

// Storybook (Phase 12). Opt-in tooling — like Playwright, the deps are NOT in
// the default install (run `npm run storybook:install` once) and this dir is
// excluded from tsconfig + eslint so a missing dep never affects type-check or
// the production build. `reactDocgen: 'react-docgen'` avoids spinning up a TS
// program (which trips on Tailwind v4 CSS-first config).
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y'],
  framework: { name: '@storybook/nextjs-vite', options: {} },
  typescript: { reactDocgen: 'react-docgen' },
};

export default config;
