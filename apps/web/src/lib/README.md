# `apps/web/src/lib` — app glue

This folder holds **Next.js / React-specific application code**: hooks, context
wiring, the Zustand store helpers, browser APIs (camera, canvas, localStorage),
i18n, SEO/JSON-LD builders, analytics, and other glue that only makes sense
inside the web app.

## Boundary with `@swingiq/core` (audit finding AA-4)

| Belongs in `packages/core` | Belongs here in `lib/` |
| --- | --- |
| Framework-agnostic **domain** logic | React/Next-specific **app** logic |
| Pure TypeScript, no DOM, no React | Hooks, contexts, browser APIs |
| Diagnostics, scoring, sports models | Store wiring, i18n, SEO, analytics |
| Reusable by any consumer | Specific to this web client |

**Rule of thumb:** if a module doesn't need React or the browser, it belongs in
`packages/core`, not here. Import domain logic via a sub-path for clarity:

```ts
import { runDiagnosticEngine } from '@swingiq/core/diagnostic';
import { SPORTS } from '@swingiq/core/sports';
```

## Naming convention

Module files use **kebab-case** (`fix-framing.ts`, `pose-detection.ts`).
Exceptions: React hooks are `useThing.ts`, and `index.ts` / `types.ts` barrels.
A small set of legacy camelCase files remains and is being migrated
incrementally; `scripts/check-naming.mjs` blocks **new** camelCase modules.
