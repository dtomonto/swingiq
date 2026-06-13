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
