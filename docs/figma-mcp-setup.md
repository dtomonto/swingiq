# Figma MCP — environment setup

This repo declares a Figma MCP server in [`.mcp.json`](../.mcp.json) so a Claude
Code session can read the SwingVantage Figma file (Dev Mode, variables, Code
Connect). **Authentication is token-based** and the token is kept in an
environment secret — never committed.

> **Two facts to expect:**
> 1. MCP servers load at **session start**. After you add the secret, start a
>    **new** session — the server won't appear in an already-running one.
> 2. The **local** Figma Dev Mode server (`http://127.0.0.1:3845/mcp`) only works
>    when Claude Code runs on a machine with the Figma **desktop app** open. It
>    does **not** work in a cloud/web container — use the remote server below.

## Primary: official remote server (`.mcp.json` as committed)

```json
{
  "mcpServers": {
    "figma": {
      "type": "http",
      "url": "https://mcp.figma.com/mcp",
      "headers": { "Authorization": "Bearer ${FIGMA_ACCESS_TOKEN}" }
    }
  }
}
```

Steps:

1. **Create a Figma personal access token** — Figma → Settings → Security →
   *Personal access tokens* → generate. Give it at least *File content: read* and
   *Dev resources / Code Connect* scopes.
2. **Add it as an environment secret** named `FIGMA_ACCESS_TOKEN` in the Claude
   Code on the web environment config (Settings → Environment → variables/secrets).
   `.mcp.json` expands `${FIGMA_ACCESS_TOKEN}` at launch, so the secret stays out
   of git.
3. **Start a new session.** Approve the `figma` project MCP server if prompted
   (project-scoped MCP servers require approval, or set
   `enableAllProjectMcpServers`). The tools appear as `mcp__figma__*`.

> ⚠️ Figma's hosted server is OAuth-first. If a bearer **personal** token is
> rejected there, either complete the OAuth flow in the web MCP/connectors UI, or
> switch to the stdio fallback below (which is REST + PAT and is known to be
> fully headless).

## Fallback: REST-backed stdio server (fully headless, PAT-only)

If the hosted server won't accept the PAT, swap `.mcp.json` to the Framelink
server, which talks to `api.figma.com` (confirmed reachable from this
environment) using the same token:

```json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "figma-developer-mcp", "--figma-api-key=${FIGMA_ACCESS_TOKEN}", "--stdio"]
    }
  }
}
```

Same secret (`FIGMA_ACCESS_TOKEN`), no OAuth, no browser. Tool surface differs
(`get_figma_data`, `download_figma_images`) but covers reading the node tree,
styles, and variables — enough for the token audit and Code Connect work.

## Verifying

In a fresh session, ask Claude to list Figma tools (they're `mcp__figma__*`). If
none appear: confirm the secret is set, the server was approved, and the session
was started *after* adding the secret. Network to `figma.com` / `api.figma.com`
must be allowed by the environment's network policy (verified reachable as of
this setup).

## Related

- `apps/web/src/components/ui/CODE_CONNECT.md` — Code Connect mappings (needs an
  Org/Enterprise Developer seat to publish).
- `docs/design-tokens.md` — the globals.css → Tokens Studio JSON pipeline the
  Figma variables sync against.
