# SwingLab 2.0 — Phase 2 Scope: The Interactive Lab Map

> Status: **Scoping / proposed** · Builds on Phase 1 (concept landing page at `/swinglab`, shipped local master `6ed09e0`). No 3D engine in this phase.

---

## In Plain English (start here)

Phase 1 gave us a beautiful **poster** of the future lab: a static map you can look at, with cards explaining each room. You can click a room name and it scrolls you down to read about it.

**Phase 2 turns that poster into something you can actually use.** Instead of a flat picture, the lab map becomes a **clickable floor plan** that:

1. **Reacts to you** — when you click a station, a panel slides open with what it does and a button straight into the real tool. No more scrolling around.
2. **Knows where you are** — if you're signed in, the map lights up the *one* station you should visit next, and quietly marks which rooms have something waiting for you (a swing to retest, a plan in progress, a brand-new tool).
3. **Feels alive** — gentle animations, a glowing "go here next" pulse, and a faint path drawn between the rooms so the whole thing feels like one connected place — not ten separate features.

It's still **not** the walk-around 3D world (that's Phase 4). Think of Phase 2 as the **map you'd see on the wall of the lobby** — interactive and personalized, but still a map. It's the bridge that proves the "one connected environment" idea with real behavior, using tools we already have.

The most important question Phase 2 forces us to answer: **does SwingLab become a real way to navigate the app for signed-in users, or stay a marketing teaser for now?** (See "Decisions" below.)

---

## Where we are (what Phase 1 already gives us to reuse)

- **`content/swinglab.ts`** — the pure data model: 10 stations, each with name, system role, blurb, future functions, connected features, and a **`liveHref`** to the real tool. This is the backbone Phase 2 extends.
- **`components/swinglab/`** — `StationCard`, `LabMap` (CSS blueprint), `RoadmapTimeline`, and `stationVisuals` (shared icon + accent maps). Phase 2 reuses the visuals and adds interactive variants.
- **`/swinglab` route** — public, in the footer + sitemap.
- **Honesty patterns** — every station already distinguishes "tool live today" from "immersive station planned."

Nothing from Phase 1 gets thrown away; Phase 2 layers on top.

---

## Goal & non-goals

**Goal:** A clickable, animated, optionally-personalized lab map that makes the platform feel like one connected environment and routes users to the right tool — built with CSS/SVG only (no WebGL), accessible, and fast.

**Non-goals (explicitly deferred):**
- ❌ First-person / walk-around 3D (Phase 4).
- ❌ Full multi-step guided programs that carry you across several stations in sequence (Phase 3 — Phase 2 only *recommends* the next station).
- ❌ Any new AI model or new data collection. Personalization reuses existing deterministic engines only.
- ❌ Faked progress or status. If we don't know something, the station shows its neutral state.

---

## Feature breakdown

### 2.1 Interactive floor plan (the core)
- A spatially-arranged map (not just a grid): stations placed on a stylized floor plan with the **AI Coach Console** and **Player Profile Wall** central (the "brain" + "memory" everything connects to), and the journey stations around them.
- Hover/focus raises a station and shows a one-line summary.
- **Click opens a detail panel** (see 2.2) instead of scroll-jumping.
- A faint **connective path** is drawn (SVG lines) between stations to visualize "one system."
- **Progressive enhancement:** the map is layered on top of the existing accessible station list. Screen-reader and keyboard users always get a fully usable list; the visual map is the enhancement.

### 2.2 Station detail panel
- Clicking a zone opens a **side drawer** (desktop) / **bottom sheet** (mobile) with: icon, system role, blurb, future functions, connected features, and a primary **"Open the tool"** CTA (`liveHref`) — keeping the user inside the lab frame.
- Keyboard-trappable, `Esc` to close, focus returns to the triggering zone.

### 2.3 Personalization layer ("your lab")
Reuses existing deterministic engines (Next-Best-Action, session/diagnosis history, retest due-dates, progress) — **no new AI**:
- **Recommended next station** gets a glowing pulse + "Start here" label.
- Per-station **status chips** drawn only from real state: `New tool`, `In progress`, `Retest due`, `Last visited`, or neutral.
- Entry Atrium shows a **"Resume"** affordance when there's a last session.
- **Logged-out / no data:** the map shows a generic recommended path labeled as a **preview** (honest — no invented personal state).

### 2.4 Motion & polish
- Entrance animation (staggered fade/scale), a "focus pull" toward the selected station (CSS transform/scale — a *hint* of camera movement, not real 3D), and the recommended-station pulse.
- **`prefers-reduced-motion` fully respected** — animations collapse to instant states.

### 2.5 Responsive strategy
- **Desktop/tablet:** the spatial floor plan.
- **Mobile:** falls back to the Phase 1 grid (or a simplified vertical "stacked rooms" layout) — a spatial isometric map is poor on small screens. Same data, same panel, simpler layout.

---

## Architecture & reuse

**Data model extensions (`content/swinglab.ts`):**
- Add optional `map?: { x: number; y: number }` (percent coordinates) per station for spatial placement.
- Add `RECOMMENDED_PATH` (ordered station ids) for the default/preview guided path.
- Keep everything serializable so Phase 4 (3D) can reuse the same coordinates as a starting layout.

**New components (`components/swinglab/`):**
- `InteractiveLabMap.tsx` (**client** — needs selection/hover state + reduced-motion).
- `LabStationPanel.tsx` (drawer/sheet).
- `LabMap.tsx` (Phase 1) stays as the static/mobile fallback.

**Personalization adapter (`lib/swinglab/labState.ts`):**
- Thin, **local-first**, deterministic. Reads existing stores (sessions, active diagnosis, retest schedule, progress, Next-Best-Action) and returns `{ recommendedStationId, perStation: Record<id, status> }`.
- Mode-aware via `useAuth().mode` — honest copy for logged-out vs. signed-in. Reuses `lib/coaching/fixFraming` for CTA wording (don't duplicate it).

**Performance budget:** CSS/SVG only; `InteractiveLabMap` lazy-loaded/`dynamic` so the marketing page stays light; no layout-thrash animations (transform/opacity only).

---

## The decisions (LOCKED by owner — 2026-06-07)

1. **Surface:** ✅ **Real in-app `/lab` hub now, admin-gated for testing.** Build `/lab` as the real future command center, but restrict access to admins so regular users don't see it until it's ready. The interactive map component stays reusable on the public `/swinglab` teaser too.
2. **Visual direction:** ✅ **Isometric facility view** — the most immersive option. Mitigations are mandatory, not optional: a responsive fallback (grid/stacked) on mobile, and full keyboard + screen-reader support via progressive enhancement over a semantic list.
3. **Personalization depth:** ✅ **Full per-station status this phase** — recommended-next + Resume *and* per-station chips (retest-due / in-progress / new-tool / last-visited), drawn only from real state.

**Build order to deliver the above:** 2a (admin-gated `/lab` + isometric interactive map + detail panel, no personalization) → 2b (recommended-next + Resume) → 2c (full per-station status chips). Each is independently shippable; together they satisfy the locked decisions.

---

## Build plan (incremental, each independently shippable)

- **2a — Interactive map + panel (no personalization):** spatial layout, click-to-open drawer, connective path, motion + reduced-motion, mobile fallback. *Pure front-end; fully honest as a preview.*
- **2b — Recommended-next + Resume:** add the `labState` adapter (light), glowing recommended station, Atrium Resume. Logged-out gets the preview path.
- **2c — Per-station status chips:** expand the adapter to surface retest-due / in-progress / new-tool / last-visited from real state.

---

## Honesty & guardrails
- Immersive/3D framing stays clearly **in development**; the interactive map itself is real and labeled honestly.
- Personalization shows **only real state**; neutral when unknown. No fake progress (consistent with existing honest-first standards).
- Data-storage copy stays mode-accurate (hybrid cloud/local) — no "local-only" claims.

## Risks & mitigations
- **Mobile spatial map is hard** → ship the grid/stacked fallback (2.5).
- **Accessibility of a spatial UI** → progressive enhancement over the existing semantic list; full keyboard + SR support is a release gate, not an afterthought.
- **Scope creep into Phase 3** → Phase 2 *recommends*; it does not run multi-station programs.
- **Concurrent-agent churn** → new files where possible; touch shared files (data model) with explicit pathspecs and small diffs.

## Rough effort
- 2a: ~1 focused build session. 2b: ~0.5. 2c: ~0.5–1. (Estimates, not commitments.)

## Acceptance criteria (Phase 2 complete when…)
- The lab map is clickable; selecting a station opens a detail panel with a working CTA into the live tool.
- Signed-in users see a real recommended next station (and Resume); logged-out users see an honest preview path.
- Fully keyboard + screen-reader usable; `prefers-reduced-motion` respected.
- Responsive (spatial on desktop, sensible fallback on mobile); no WebGL; marketing page stays fast.
- No faked state; no claim the 3D lab is live.
