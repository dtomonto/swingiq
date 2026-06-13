# ConnectorOS — Design System Layer

SwingVantage already ships a coherent design system: **Tailwind v4** with CSS-variable
tokens, Radix UI primitives (shadcn-style), `class-variance-authority` variants, and a
consistent admin "OS command-center" idiom (score header → findings → recommendations).
This layer **hardens and documents** that system; it does **not** introduce a new one.

## Truth assignment

- **Figma = design source of truth.** Components/tokens are designed in Figma (paid),
  optionally via the Figma MCP, and flow into code — never the reverse.
- **Tokens Studio = token interchange.** When adopted, tokens export from Figma →
  JSON → mapped to the Tailwind theme / CSS variables. Keep it simple: one flat token
  schema (color, space, radius, type, motion), not a labyrinth.

## Token schema (initial)

```
brand.*        parent SwingVantage tokens (primary, foreground, surface, …)
sport.<id>.*   per-sport accent/identity (golf, tennis, baseball, softball, pickleball, padel)
theme.*        experience/theme tokens (light, dark, high-contrast)
```

Each sport feels like its own premium branded experience while inheriting the parent
brand's spacing/type/motion — distinct accent, shared skeleton.

## Token sync (runnable — advisory)

The token-interchange step above is wired up as a **non-destructive drift check**:

```bash
# from apps/web
npm run figma:tokens                      # theme 'standard' vs Figma
npm run figma:tokens -- --theme=dark-performance
npm run figma:tokens -- --check           # exit 1 on drift (optional CI gate)
```

`scripts/figma-tokens-sync.mjs` reads your Figma tokens — from `apps/web/figma.tokens.json`
(a Tokens Studio / Variables export you drop in), or the Figma Variables REST API
when `FIGMA_ACCESS_TOKEN` + `FIGMA_FILE_KEY` are set — and **compares** them to the
CSS variables in `globals.css`, printing what's in-sync, drifted, missing, or
unmapped. It writes a `.figma-ds-state.json` snapshot (gitignored) and **never
edits `globals.css`**: those values are hand-tuned to clear the enforced WCAG-AA
gates, so promoting a Figma change into code stays a reviewed, manual edit. With no
source configured it is a keyless no-op (CI-safe). Extend the Figma-path → CSS-var
mapping in the script's `NAME_MAP` as the Figma file grows.

> **Code Connect** (the components half of the integration) lives separately in
> `src/components/ui/*.figma.tsx` — see that folder's `CODE_CONNECT.md`.

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
