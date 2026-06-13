# Design Tokens — Figma ⇄ code interchange

SwingVantage's visual system is **token-driven**: every theme redefines the same
set of semantic CSS variables, and components reach for those tokens (never raw
hex). This doc covers the **interchange layer** that connects those code tokens
to Figma via the [Tokens Studio](https://tokens.studio/) plugin.

## Source of truth

`apps/web/src/app/globals.css` is the **source of truth** for tokens. It holds:

- the static **brand** + **golf** hex scales and fonts (in the `@theme` block);
- **9 theme palettes** — one `[data-theme='…']` block each, ~40 AA-tuned HSL
  color tokens + radius (`standard`, `dark-performance`, `coach-mode`,
  `coach-night`, `heritage-club`, `field-court`, `arcade-practice`,
  `bird-print`, `christmas-swing-lab`);
- **7 sport identity blocks** (`[data-sport='…']`) — accent/foreground/text +
  data-viz series per sport;
- the theme-agnostic **sport accent swatches** (one identity color per sport).

These values are hand-tuned for WCAG AA and validated by
`apps/web/src/lib/theme/__tests__/theme-contrast.test.ts`. We do **not** generate
the CSS from JSON — the art direction (gradients, shadows, motion, SVG textures)
and the AA tuning live in CSS and stay there.

## The interchange artifact

`scripts/design-tokens/build-tokens.mjs` extracts the **color + radius** tokens
out of `globals.css` into a single Tokens-Studio / W3C-DTCG file:

```
apps/web/src/lib/connector-os/design-system/tokens/swingvantage.tokens.json
```

It is a [Tokens Studio single-file](https://docs.tokens.studio/) document:

| Set | Origin | Notes |
| --- | --- | --- |
| `primitives` | `@theme` | brand/golf hex scale + font families |
| `sport-accents` | `:root` sport block | one identity color (+fg) per sport |
| `theme/<id>` | each `[data-theme]` | one palette per theme (only one "enabled" at a time) |
| `sport/<id>` | each `[data-sport]` | per-sport identity accents |

`$themes` wires each theme so that **exactly one** `theme/<id>` set is enabled
while `primitives` + sports stay "source" — so flipping a theme in the Tokens
Studio plugin restyles the whole Figma library, mirroring how `data-theme`
works in the app. Token keys are the **bare CSS var name** (`primary`,
`primary-foreground`, …) so the JSON ↔ CSS mapping is 1:1.

Values are kept as authored — `hsl(H S% L%)` strings and hex — so nothing is
lost in conversion. Non-color tokens (gradients, shadows, `--app-bg-*`, motion,
`url()` textures) and derived `var()` aliases are intentionally **not** exported;
they remain code-only.

## Commands

```bash
npm run tokens:build   # regenerate the JSON from globals.css
npm run tokens:check   # CI guard — fails if the JSON is stale vs globals.css
```

`tokens:check` is also covered by `scripts/__tests__/design-tokens.test.mjs`
(run via `npm run test:scripts`), so a token change in `globals.css` that isn't
rebuilt will fail tests.

## Round-trip with Figma (Tokens Studio)

1. **Code → Figma (today).** In Figma, open the **Tokens Studio** plugin →
   *Settings → File/JSON* and import `swingvantage.tokens.json`. The plugin
   creates variables/styles for every theme + sport set. Apply a theme by
   enabling its `theme/<id>` set. This seeds the Figma design source so the
   Code Connect components (`*.figma.tsx`, see
   `apps/web/src/components/ui/CODE_CONNECT.md`) reference real tokens.
2. **Figma → code (when adopted).** When designers change a token in Figma,
   export the set from Tokens Studio and reconcile it back into the matching
   `[data-theme]` / `[data-sport]` block in `globals.css`. Re-run
   `npm run tokens:build` and confirm `theme-contrast.test.ts` still passes
   (any new color pair must clear AA before it lands).

## Adding or changing a token

1. Edit the value(s) in `globals.css` (the right `[data-theme]` / `[data-sport]`
   block, or `@theme` for a primitive).
2. `npm run tokens:build` and commit the regenerated JSON alongside the CSS.
3. If you added a whole new theme or sport, add its id to `THEME_IDS` /
   `SPORT_IDS` in `build-tokens.mjs` so its set is extracted.
