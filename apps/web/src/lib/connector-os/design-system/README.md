# ConnectorOS — Design System Layer

SwingVantage already ships a coherent design system: **Tailwind v4** with CSS-variable
tokens, Radix UI primitives (shadcn-style), `class-variance-authority` variants, and a
consistent admin "OS command-center" idiom (score header → findings → recommendations).
This layer **hardens and documents** that system; it does **not** introduce a new one.

## Truth assignment

- **Figma = design source of truth.** Components/tokens are designed in Figma (paid),
  optionally via the Figma MCP, and flow into code — never the reverse.
- **Tokens Studio = token interchange.** Implemented: `globals.css` (source of
  truth) is extracted to a Tokens-Studio / W3C-DTCG file at
  [`tokens/swingvantage.tokens.json`](./tokens/swingvantage.tokens.json) via
  `npm run tokens:build`, with `npm run tokens:check` guarding drift. Import that
  file into the Figma Tokens Studio plugin to seed/sync variables. Full pipeline
  + round-trip steps: [`docs/design-tokens.md`](../../../../../../docs/design-tokens.md).
  Keep it simple: one flat token schema (color, radius, type), not a labyrinth —
  gradients/shadows/motion stay code-only.

## Token schema (initial)

```
brand.*        parent SwingVantage tokens (primary, foreground, surface, …)
sport.<id>.*   per-sport accent/identity (golf, tennis, baseball, softball, pickleball, padel)
theme.*        experience/theme tokens (light, dark, high-contrast)
```

Each sport feels like its own premium branded experience while inheriting the parent
brand's spacing/type/motion — distinct accent, shared skeleton.

## Component standards

Core reusable components to give stories first (when Storybook is added):
Button · Card · Sport card · Report card · Confidence badge · Upload state · Drill
module · Practice-plan module · Trust/privacy callout · Theme switcher ·
Navigation/header/footer · Admin metric card.

Extract reusable versions from existing UI before inventing — most already exist.

## Accessibility standards

WCAG AA contrast is **enforced** (axe color-contrast gate in CI + `/admin/accessibility`
live audit). Any new token pair must pass AA for readability-critical text/background.
44px minimum tap targets; ≥16px mobile inputs (unlayered in `globals.css`).

## Motion rules

Subtle, purposeful, reduced-motion aware. Respect `prefers-reduced-motion`. No motion
inside the report/analysis surface that distracts from the result.

## Implementation rules for Claude Code

- Match surrounding code's idiom (CVA variants, Tailwind utilities, Radix).
- Reuse tokens — never hardcode hex in components.
- Keep sport theming token-driven, not per-component branching.

## Storybook / Chromatic (scaffold — not installed)

Heavy dev dependencies; install when design-system work is funded. To enable:

1. `npx storybook@latest init` in `apps/web` (Next.js + Vite builder).
2. Add stories for the components above (start with Button/Card/Sport card).
3. Chromatic: add `CHROMATIC_PROJECT_TOKEN` (CI secret), `npx chromatic` in a
   workflow. Do **not** require Chromatic to pass locally without the token.

Until then this README + the Tailwind theme are the documented source of truth.
