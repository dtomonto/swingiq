# Storybook (#1 Phase 12)

Component workshop for the core design-system primitives, on the real B (Dark
Performance) theme with a theme-switcher toolbar (all 7 shipped `[data-theme]`s).

## Opt-in, like the e2e suite

The Storybook deps are **not** in the default `npm install` (to keep it lean),
and `.storybook/` + `**/*.stories.tsx` are excluded from `tsconfig`/`eslint`, so
a missing dep never affects `type-check`, `lint`, or the production `build`.

```bash
# one-time: install the (heavy) Storybook deps
npm run storybook:install   # from apps/web

# run it
npm run storybook           # dev server on :6006
npm run build-storybook     # static build (CI/visual review)
```

## What's covered

Stories ship for the reusable core primitives:

- `UI/Button`, `UI/Card`, `UI/Badge`, `UI/MetricCard`, `UI/EmptyState`,
  `UI/ScoreRing` (incl. the glow on/off + grade range)
- `Marketing/SportAnalysisHero` (per-sport branded hero)

Add a story by dropping a `Component.stories.tsx` next to any component — the
glob in `main.ts` (`../src/**/*.stories.@(ts|tsx)`) picks it up automatically.

## Config notes

- Framework: `@storybook/nextjs-vite` (officially supports Next 16 / React 19).
- `typescript.reactDocgen: 'react-docgen'` — avoids spinning up a TS program,
  which trips on the Tailwind v4 CSS-first config.
- `preview.tsx` imports `globals.css` and wraps every story in a `[data-theme]`
  container (default `dark-performance`) so tokens resolve exactly as in-app.
