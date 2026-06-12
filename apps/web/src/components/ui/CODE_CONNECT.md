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

## Prerequisites to publish

Code Connect publishing requires a **Figma Organization or Enterprise plan
with a Developer seat** (confirmed: a Pro plan returns *"You need a Developer
seat in an Organization or Enterprise plan to access Code Connect."*). The
mapping files are committed and ready — publishing just needs the plan + the
components published to a team library.

## Publish steps (once on an Org/Enterprise plan)

```bash
# from apps/web
npm i -D @figma/code-connect
# 1. Publish the DS components to a Figma team library (in the Figma UI)
# 2. Authenticate + publish the mappings
npx figma connect publish --token <FIGMA_ACCESS_TOKEN>
```

The files are excluded from `tsc`/Next builds via `tsconfig.json` (`**/*.figma.tsx`),
mirroring how `*.stories.tsx` is handled — they are tooling files processed only
by the `figma` CLI, so the missing `@figma/code-connect` dep never breaks CI.
