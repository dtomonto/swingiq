# Floating Utility Dock

## In Plain English (start here)

The app has small round helper buttons that float in the **bottom-right corner**
of every in-app screen — the **AI Coach** (chat) and the **Guide** (the friendly
"genie" that shows you what to do on each page). They used to be two completely
separate pieces of code, and each one decided **on its own** where to sit. They
both picked the same corner, so on some screen sizes they ended up **stacked on
top of each other / overlapping**, which looked broken.

The fix: one shared container — the **Floating Utility Dock** — now owns that
corner. The helper buttons are *placed into* the dock, and the dock decides the
spacing, stacking order, layering, and how far up from the bottom edge they sit
(including leaving room for the phone's bottom navigation bar and the iPhone
"home bar"). Because one thing is in charge, they can't fight over the corner
anymore. The dock also makes sure **only one** helper panel is open at a time, so
two open chat/tip windows can never cover each other.

**The one rule:** don't add a new floating button with its own
`fixed bottom-… right-…` position. Add it to the dock instead (recipe below).

---

## Why this exists (root cause it fixed)

Both help tools were mounted independently in `app/(app)/layout.tsx` and each
**hard-coded its own `fixed` position** in the bottom-right corner:

| Tool | Launcher (old) | Panel (old) |
| --- | --- | --- |
| `FloatingCoach` (AI Coach) | `fixed bottom-6 right-4 lg:right-6 z-50` | `fixed bottom-24 right-4 lg:right-6 z-50` |
| `GuideCompanion` (Guide) | `fixed bottom-24 right-4 lg:right-6 z-50` | `fixed bottom-40 … lg:right-6 z-50` |

Problems that produced the overlap:

1. **No single owner of the corner.** Coordination existed only as hand-picked
   magic offsets (`bottom-6` vs `bottom-24`) — a ~16px gap that was one tweak
   away from colliding, and visually read as two competing widgets.
2. **Panels landed on the other tool.** The AI Coach **panel** opened at
   `bottom-24` — exactly where the Guide **launcher** sat — and with both at
   `z-50`, paint order alone decided who covered whom.
3. **Both panels could be open together.** The Guide auto-opens on new pages; if
   the user also opened the Coach, two right-aligned panels overlapped.
4. **Mobile bottom-nav collision + no real safe area.** The Coach launcher
   (`bottom-6` ≈ 24px) overlapped the mobile bottom nav, and the
   `safe-area-inset-bottom` class on the nav wasn't a defined utility (a no-op).
5. The `GuideCompanion` header comment even still claimed it "lives bottom-LEFT"
   while the code placed it bottom-right — proof the position had been ad-hoc
   patched into the Coach's corner.

---

## How it works

```
app/(app)/layout.tsx
└── <FloatingDock>          ← owns the bottom-right corner (one fixed container)
      ├── <GuideCompanion/> ← renders a launcher button + (when open) a panel
      └── <FloatingCoach/>  ← renders a launcher button + (when open) a panel
```

- **`components/layout/FloatingDock.tsx`** renders a single `position: fixed`
  flex **column** in the bottom-right (`.floating-dock`). Launcher buttons are
  its direct children and stack with a consistent gap. The container is
  `pointer-events: none` so it never blocks the page; children opt back in.
- It exposes **`useFloatingDock(id)`** → `{ isOpen, open, close, toggle }`.
  Open state is **mutually exclusive**: opening one tool collapses any other, so
  two panels can never be on screen at once.
- It measures its own launcher-cluster height and republishes it as the CSS
  variable `--floating-dock-height`, so panels (`.floating-panel`) anchor cleanly
  **above** the launchers with no magic numbers — correct whether 0, 1, or 2
  launchers are mounted on a route.
- All the position/spacing/z/safe-area math lives in **`app/globals.css`**
  (`.floating-dock`, `.floating-panel`, and the `--floating-dock-*` /
  `--z-floating-*` tokens), theme-independent, in one auditable place.

### Design tokens (`globals.css`)

| Token | Default | Purpose |
| --- | --- | --- |
| `--fab-size` | `3.5rem` | Launcher button diameter |
| `--floating-dock-gap` | `0.875rem` | Vertical space between stacked tools |
| `--floating-dock-bottom` | `1.5rem` | Gap from the bottom edge |
| `--floating-dock-right` | `1rem` (→ `1.5rem` at `lg`) | Gap from the right edge |
| `--mobile-nav-height` | `4rem` | Reserved for the mobile bottom nav |
| `--floating-dock-height` | `8rem` (runtime-measured) | Launcher cluster height; panels anchor above it |
| `--z-floating-dock` | `50` | Launcher cluster z-index |
| `--z-floating-panel` | `55` | Expanded panel z-index (above launchers) |

Offsets are composed as, e.g.:
`bottom: calc(var(--mobile-nav-height) + var(--floating-dock-bottom) + env(safe-area-inset-bottom))`
(the `--mobile-nav-height` term is dropped at `lg`, where there is no bottom nav).

---

## Recipe: add a new floating help/support tool

1. **Build the tool** as a normal component that renders a launcher `<button>`
   (no `fixed`/`bottom`/`right`/`z-index` classes — the dock owns those) and,
   optionally, an expandable panel.
2. **Drive open state from the dock:**
   ```tsx
   const { isOpen, toggle, close } = useFloatingDock('my-tool'); // unique id
   ```
3. **Position the panel** (if any) with the shared anchor class plus your own
   size/mobile-inset utilities:
   ```tsx
   {isOpen && (
     <div className="floating-panel w-[min(20rem,calc(100vw-2rem))] …">…</div>
   )}
   ```
4. **Add stable test ids:** `data-testid="help-tool-<n>"` on the launcher and
   `data-testid="help-panel-<n>"` on the panel.
5. **Mount it inside the dock** in `app/(app)/layout.tsx` (order = top→bottom of
   the column):
   ```tsx
   <FloatingDock>
     <GuideCompanion />
     <FloatingCoach />
     <MyTool />        {/* new */}
   </FloatingDock>
   ```
6. **Add it to the regression test** in `e2e/floating-help-overlap.spec.ts`.

> If three+ tools ever crowd small screens, collapse them into a single
> expandable "Help" launcher (an `aria-expanded` menu) — still inside the dock.

---

## The rule

**No new floating, fixed-position widget may be added outside the dock** unless
there's a clearly documented reason (e.g. a full-width bottom banner like the
cookie/consent bars, or the bottom-**left** background-task center). Anything that
lives in the bottom-**right** corner must be a `<FloatingDock>` child. The
deprecated self-positioned `floating` variant of `ContextualHelpButton` is kept
only for its `inline`/`compact` variants and must not be mounted standalone.

## Tests

`e2e/floating-help-overlap.spec.ts` (Playwright) signs up in keyless mode and, at
375 / 390 / 768 / 1024 / 1440 px, asserts the two launchers' bounding boxes don't
intersect, stay within the viewport, and clear the mobile bottom nav. It also
checks the launchers stay fixed while scrolling a long page, and that opening the
AI Coach collapses the Guide (only one panel open at a time).

```bash
cd apps/web
npm i -D @playwright/test     # one-time, if not installed
npm run test:e2e:install      # one-time, downloads Chromium
npm run test:e2e -- floating-help-overlap
```

The suite runs in **keyless** mode (sign-up creates a device-local account). The
Playwright `webServer` sets `ALLOW_ANONYMOUS_APP=1` so the production auth
middleware (which fails closed on protected routes when Supabase env is absent)
lets the test reach the authenticated surface. If you have a real `.env.local`
locally, build keyless first (move `.env.local` aside, then
`ALLOW_ANONYMOUS_APP=1 npm run build && npm run start -- -p 3100`) and run the
spec against that server. Verified: **8/8 passing** at 375/390/768/1024/1440.
