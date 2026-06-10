# UI/UX Master Rebuild — Consolidated Requirements & Relaunch Brief

> **Why this folder exists.** Three large UI/UX master prompts were pasted into Claude Code
> on 2026-06-09, then two follow-up agents ("front-end" / "back-end") were started with only a
> one-line _"continue my large UI/UX … development using stitch.withgoogle.com and Figma"_.
> Those two agents **froze on the Figma MCP call** and did no work, and the master prompts lived
> only inside chat transcripts (not in memory/docs), so a relaunch would have lost them.
> This folder makes the full requirement set **durable in the repo** so any agent — now or later —
> can pick the work up cold. Nothing here is paraphrased away; the three source prompts are stored
> verbatim alongside this README.

## The three source prompts (verbatim)
| File | What it is | Owns |
|---|---|---|
| [prompt-1-frontend-premium-uiux.md](./prompt-1-frontend-premium-uiux.md) | Premium UI/UX Rebuild (Figma + Claude Design + shadcn/ui + Tailwind + Storybook + Playwright + Axe + Lighthouse), 15 phases | **Front-end agent** |
| [prompt-2-backend-admin-dashboard.md](./prompt-2-backend-admin-dashboard.md) | Admin-Dashboard / PublishingOS rebuild — premium SaaS command center, 21 parts | **Back-end agent** |
| [prompt-3-theme-lab-uiux-os.md](./prompt-3-theme-lab-uiux-os.md) | Theme Lab + UI/UX Intelligence OS — admin theming/experimentation engine + user selector, 19 phases | **Both** (admin engine = back-end, user selector = front-end) |

Source sessions (transcripts): `048cf68c` (prompts 1 & 3) and `dc620d52` (prompt 2).

---

## The non-negotiable workflow: Stitch + Figma + Claude Code, used harmoniously
> _"utilize figma paid version with stitch.withgoogle.com wherever each tool is stronger"_

1. **Google Stitch (`stitch.withgoogle.com`)** — rapid UI **ideation**: generate multiple high-fidelity visual directions per screen. Treat as inspiration/concept exploration, **not** final source of truth. Extract the strongest layout patterns, hierarchy, rhythm, status treatments, interaction ideas.
2. **Figma (paid)** — the **design-system source of truth**: tokens, component variants, responsive frames, interaction/prototype states, dev-handoff annotations.
3. **Claude Code** — the **implementation reality**: audit the repo, implement, normalize Stitch/Figma output into the existing **shadcn/ui + Tailwind** design system, accessibility-review, QA. Never blind-copy a design into production.

### ⚠️ Figma connection — read before relaunching (this is what killed the last two agents)
- Use the **remote Figma MCP** (`https://mcp.figma.com/mcp` — the `/mcp` path; `/sse` 404s), **not** the local Dev-Mode server. The local DXT needs the Figma desktop app running on port 3845, which it wasn't → every `get_metadata` call hung forever.
- **Disable the local Figma DXT** (`dev-mode-mcp-server-dxt`) so the working remote connector isn't shadowed by the dead local one (both expose `mcp__Figma__*`).
- The remote server has **no "current selection"** — there is no live canvas. Always pass an explicit **Figma file/frame URL** (e.g. `https://www.figma.com/design/<fileKey>/<name>?node-id=1-2`); the agent extracts the node id. With no URL, proceed from the codebase + Stitch and ask for URLs when needed — **never block** waiting on a selection.
- Full Dev-Mode extraction needs a Figma **Dev or Full seat**; auth errors = seat/login, not connection.

---

## Cross-cutting rules (apply to BOTH agents)
- **Nothing is ever published automatically — everything stays under admin control.** _"Nothing is ever published automatically, all under admin control."_
- **Never launch/finalize without a preview.** _"Do not launch anything without showing me a preview."_ Provide **several switchable UI variations** to try before deciding on a final (like the existing `/admin/publishing` A/B/C directions and the `/design-lab` preview route).
- **Work in tandem with other agents.** Repo has live concurrent churn — commit only with **explicit pathspec** (never `git add -A`/bare), don't clobber others' files.
- **Audit-first, don't rebuild what exists** (see "Already shipped" below).
- **Per-sport branded experiences**, unified parent platform. Complete creative freedom on colors, including **per-sport accents**.
- **Mobile-first** for the public app; **desktop-first** for the admin command center (still responsive for emergency edits).
- Accessibility (Axe/contrast/reduced-motion) and Lighthouse-oriented performance are gates, not afterthoughts.
- **Remove previously-created themes if they become irrelevant.**
- **Generate several UI variations the owner can play with as artifacts in the web app.**

## Discrete preferences captured from the session (chronological)
1. Generate several UI variations to play with as artifacts in the web app.
2. Use Figma paid **with** Stitch, each where stronger.
3. Remove old themes when no longer relevant.
4. Work in tandem with other agents.
5. Complete creative freedom on colors / per-sport colors — "anything that makes this the best webapp".
6. Fix the **Microsoft Clarity cookie banner** placement so it doesn't intrude. _(Likely already done — commit `a88059c2` repositioned it to a compact bottom-left card. Verify, don't redo.)_
7. Be able to **choose in the Lab and publish from the Lab**.
8. Use the Lab in the future to make changes from **learned preferences + new strategies** → "a UI/UX OS that learns from the users."
9. **New themes developed periodically** → a theme library.
10. **Nothing published automatically — all admin-controlled.**

---

## Already shipped — extend, don't rebuild (audit-first)
- **PublishingOS core** — `lib/publishing/` (types · transitions · risk · validation · entity-registry · overrides · store · service), `/admin/publishing` command center with **3 live-switchable directions** (A Mission Control / B Calm Enterprise [default] / C Sport-Tech, see `components/admin/publishing/directions.ts`), `/updates` override-aware, 37+ tests. Shipped `9c4677ea`. **Remaining:** wire override into `/dev-updates`, `/blog`, `/learn`, milestones, homepage reads; deploy-backed PR-job executor (stub); scheduling cron.
- **Theme System** — existing 7-theme token engine (`data-theme` + `globals.css` palettes) with AA contrast remediation + 335 regression tests. The **Theme Lab OS builds on this engine** — don't replace it.
- **Status color palette is reserved** (emerald=live, amber=high-risk, red=critical, sky=info, violet=deploy). Every brand/direction accent must sit **outside** that palette.
- Stitch prompt pack + Figma handoff spec already exist in [`docs/publishing-os.md`](../publishing-os.md) §11–12.

---

## Relaunch prompts (paste into fresh agents)

> Start each in a **fresh** Claude Code session from `C:\Users\dtomo\Desktop\swingiq` (not the frozen ones), after disabling the local Figma DXT.

### ▶ FRONT-END agent
```
Continue the public-app UI/UX rebuild for SwingVantage. Your full brief is verbatim in
docs/uiux-master-rebuild/prompt-1-frontend-premium-uiux.md (Premium UI/UX Rebuild, 15 phases) —
follow it. Also implement the USER-FACING parts of docs/uiux-master-rebuild/prompt-3-theme-lab-uiux-os.md
(the user theme selector). Read docs/uiux-master-rebuild/README.md first for the workflow + rules.

Workflow: Google Stitch (stitch.withgoogle.com) for rapid UI ideation → Figma (remote MCP) as the
design-system source of truth → implement in Claude Code, normalized to the existing shadcn/ui + Tailwind
tokens. Figma is the REMOTE connector (https://mcp.figma.com/mcp) with no "current selection" — I'll paste
Figma file/frame URLs; if I haven't, proceed from the codebase + Stitch and ask me for URLs when you need
them, never block.

Hard rules: audit-first, don't rebuild working code; per-sport branded accents on a unified platform;
mobile-first; accessibility (Axe/contrast/reduced-motion) + Lighthouse are gates; produce SEVERAL switchable
UI variations I can try before you finalize anything; show me a preview before launching; nothing publishes
automatically. Work in tandem with the back-end/admin agent — commit only with explicit pathspec, never -A,
expect live file churn. Start by auditing, give me a concise plan, then implement the highest-impact slice.
```

### ▶ BACK-END agent
```
Continue the ADMIN-DASHBOARD UI/UX rebuild for SwingVantage. Your full brief is verbatim in
docs/uiux-master-rebuild/prompt-2-backend-admin-dashboard.md (Admin-Dashboard / PublishingOS, 21 parts) —
follow it. Also implement the ADMIN engine of docs/uiux-master-rebuild/prompt-3-theme-lab-uiux-os.md
(Theme Lab: registry, builder, preview, publishing center, rollout/experiments, seasonal, recommendations,
governance). Read docs/uiux-master-rebuild/README.md first for the workflow + rules.

AUDIT FIRST — do NOT rebuild: PublishingOS core already shipped (lib/publishing/, /admin/publishing with 3
switchable directions, /updates override-aware, 37+ tests, commit 9c4677ea); the 7-theme token engine already
exists — build the Theme Lab ON it. Remaining PublishingOS work: wire overrides into /dev-updates, /blog,
/learn, milestones, homepage; deploy-backed PR-job executor; scheduling cron.

Workflow: Google Stitch for rapid admin-UI ideation → Figma (remote MCP, https://mcp.figma.com/mcp) as design
source of truth → implement in Claude Code on shadcn/ui + Tailwind. Remote Figma has no "current selection";
I'll paste file/frame URLs, otherwise proceed and ask — never block. Keep the reserved status palette
(emerald/amber/red/sky/violet); brand accents sit outside it.

Hard rules: desktop-first admin (responsive for emergencies); server-side authz on every write (Zod-validate,
no client-trust, no secrets in the bundle); nothing publishes automatically — all admin-gated with preview +
risk confirmation + rollback; produce SEVERAL switchable admin-UI variations I can try before finalizing.
Work in tandem with the front-end agent — commit only with explicit pathspec, never -A, expect live churn.
Start by auditing the admin dashboard, give me a concise plan, then implement the highest-impact safe slice.
```
