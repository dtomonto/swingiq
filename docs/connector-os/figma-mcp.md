# ConnectorOS — Figma MCP (design-truth bridge)

> **Doc stub.** This describes how to enable the Figma MCP server and where it
> fits. It is operator setup (bound to your Figma account + local app), not repo
> code, so there is nothing to install here. Verify the exact endpoint/menu paths
> against Figma's current docs — Figma has changed them between releases.

The Figma MCP server lets an MCP client (Claude Code, the desktop app, IDE
extensions) read directly from a Figma file — frames, component metadata, and
**Variables** — so design work flows **Figma → code** without copy-paste. It is
the live, interactive complement to the two committed, file-based halves of the
integration:

| Layer | What it does | Home |
| --- | --- | --- |
| **Figma MCP** | Live read of frames / variables during a session | operator setup (this doc) |
| **Code Connect** | Maps Figma components → real `<Button>`/… snippets in Dev Mode | `apps/web/src/components/ui/*.figma.tsx` ([CODE_CONNECT.md](../../apps/web/src/components/ui/CODE_CONNECT.md)) |
| **Token sync** | Diffs Figma Variables vs. `globals.css` tokens (advisory) | `apps/web/scripts/figma-tokens-sync.mjs` (`npm run figma:tokens`) |

## Enable it (operator, no code)

There are two flavors — use whichever your plan/setup supports:

1. **Local Dev Mode MCP server** (Figma desktop app): open the desktop app →
   **Figma menu / Preferences → "Enable Dev Mode MCP Server"**. It serves on a
   local endpoint (historically `http://127.0.0.1:3845/...`; confirm the current
   path in Figma's docs). Requires a Dev/Full seat with Dev Mode.
2. **Remote Figma MCP** (hosted): point your client at Figma's hosted MCP URL and
   authenticate. Check Figma's MCP docs for the current URL + auth flow.

Then register it with your MCP client. For Claude Code, add an entry to your MCP
config (e.g. project `.mcp.json` or user settings) — do **not** commit tokens:

```jsonc
{
  "mcpServers": {
    "figma": {
      // Local Dev Mode server (SSE/HTTP) — confirm transport + URL in Figma docs:
      "url": "http://127.0.0.1:3845/mcp"
      // Remote/hosted instead:
      // "url": "https://<figma-hosted-mcp-endpoint>",
      // "headers": { "Authorization": "Bearer ${FIGMA_ACCESS_TOKEN}" }
    }
  }
}
```

## How it fits the workflow

- **Design a component/token in Figma** (Figma stays the source of truth).
- **MCP** pulls its structure/values into the session when you're building or
  reviewing — e.g. "match this frame", or read a Variable's value.
- **Token sync** (`npm run figma:tokens`) then reports where the file's Variables
  have drifted from `globals.css`; you promote changes by hand (the values are
  AA-tuned — never auto-overwritten).
- **Code Connect** keeps Figma Dev Mode showing the real coded component snippet.

## Guardrails

- **Keyless-first / OFF by default** — no token, no MCP, no network (matches the
  ConnectorOS principle). Nothing in the app runtime depends on this.
- **Never commit a Figma token** — reference `FIGMA_ACCESS_TOKEN` from the
  environment (see `apps/web/.env.example`), never inline it in `.mcp.json`.
- **Read-only intent** — use the MCP to bring design *into* code, never to push
  code back as design truth.
