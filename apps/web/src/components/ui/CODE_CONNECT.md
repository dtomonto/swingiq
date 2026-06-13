# Code Connect — Figma ↔ code component mappings

These `*.figma.tsx` files link the SwingVantage Figma design-system components
to their real code counterparts, so Figma **Dev Mode** shows the actual
`<Button>` / `<Badge>` / `<Card>` snippet (with props) instead of raw CSS.

| Figma component | Node | Code component |
| --- | --- | --- |
| Button (set) | `28:26` | [`Button.tsx`](./Button.tsx) |
| Badge (set) | `29:12` | [`Badge.tsx`](./Badge.tsx) |
| Feature Card | `30:2` | [`Card.tsx`](./Card.tsx) (`Card`/`CardBody`/`CardTitle`) |

Figma file: `aXNDKbiBOJPRFWor54x6oC`. Config: [`apps/web/figma.config.json`](../../../figma.config.json).

## Pending mappings (scaffolded — need real node ids)

These nine mappings are **written and `figma:parse`-clean**, but their
`figma.connect(...)` URL still has the sentinel `node-id=TODO-REPLACE`. They are
intentionally not publishable until a real node id is filled in — the prop names
below are **inferred from each component's code** and must be checked against the
Figma component's actual properties.

| Code component | Mapping file | Inferred Figma props |
| --- | --- | --- |
| [`ScoreRing.tsx`](./ScoreRing.tsx) | `ScoreRing.figma.tsx` | Score, Label, Glow |
| [`MetricCard.tsx`](./MetricCard.tsx) | `MetricCard.figma.tsx` | Label, Value, Unit, Target, Trend, Trend label, Status, Description |
| [`SportChip.tsx`](./SportChip.tsx) | `SportChip.figma.tsx` | Sport, Active, Size |
| [`TrustBadge.tsx`](./TrustBadge.tsx) | `TrustBadge.figma.tsx` | Label, Variant |
| [`FixCard.tsx`](./FixCard.tsx) | `FixCard.figma.tsx` | Eyebrow, Fix, Why, Confidence, Confidence note |
| [`DrillCard.tsx`](./DrillCard.tsx) | `DrillCard.figma.tsx` | Number, Name, Reps, How, Done, On paper |
| [`BeforeAfter.tsx`](./BeforeAfter.tsx) | `BeforeAfter.figma.tsx` | Label, Before, After, Unit, Better, Note, On paper |
| [`ProgressTimeline.tsx`](./ProgressTimeline.tsx) | `ProgressTimeline.figma.tsx` | On paper (points are data-driven) |
| [`EmptyState.tsx`](./EmptyState.tsx) | `EmptyState.figma.tsx` | Title, Description, Compact |

To finish one (per file):

1. In Figma ▸ **Dev Mode**, select the component → right-click → **Copy link to
   selection**. Take the `node-id=…` value from that link.
2. In the matching `*.figma.tsx`, replace `node-id=TODO-REPLACE` with it.
3. Open the same component's **Properties** panel in Figma; rename the `figma.string` /
   `figma.boolean` / `figma.enum` keys + enum option labels to match exactly
   (Figma property names are case-sensitive).
4. `npm run figma:parse` → confirm it resolves with no error, then move the row up
   into the table above and `npm run figma:publish` (when on an Org plan).

> If a component does **not** yet exist in the Figma file, design it there first —
> Code Connect can only link to a real Figma node (Figma is the design source of truth).


## Pipeline (runnable)

`@figma/code-connect` is now a `devDependency`, and the CLI is wired into
`apps/web/package.json`:

```bash
# from apps/web
npm run figma:parse       # validate the mappings (no token needed) — run this in review
npm run figma:publish     # publish mappings to Figma  (needs FIGMA_ACCESS_TOKEN)
npm run figma:unpublish   # remove published mappings    (needs FIGMA_ACCESS_TOKEN)
```

`figma:parse` resolves every `*.figma.tsx` against its source component and
prints the generated Dev-Mode snippet — use it to confirm a mapping compiles
before publishing. It needs no token or network, so it is safe in CI/review.

## Prerequisites to publish

Code Connect **publishing** (not parsing) requires a **Figma Organization or
Enterprise plan with a Developer seat** (confirmed: a Pro plan returns *"You
need a Developer seat in an Organization or Enterprise plan to access Code
Connect."*). The mapping files + pipeline are committed and ready — publishing
just needs the plan, the components published to a team library, and a token.

Set the token before `figma:publish` (the CLI reads it from the environment):

```bash
export FIGMA_ACCESS_TOKEN=<your-token>   # see apps/web/.env.example
npm run figma:publish
```

The `*.figma.tsx` files are excluded from `tsc`/Next builds via `tsconfig.json`
(`**/*.figma.tsx`), mirroring how `*.stories.tsx` is handled — they are tooling
files processed only by the `figma` CLI, so they never enter the app bundle.

## Adding a new mapping

1. Get the component's Figma node id (Dev Mode → "Copy link to selection").
2. Add `src/components/ui/<Name>.figma.tsx` next to the component (mirror an
   existing file: import the component, `figma.connect(Component, url, { props, example })`).
3. `npm run figma:parse` — confirm it resolves with no errors.
4. Update the table above, then `npm run figma:publish` (when on an Org plan).
