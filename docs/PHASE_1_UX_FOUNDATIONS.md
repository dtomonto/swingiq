# Phase 1 — UX Foundations (clutter, onboarding memory, sign-out)

## In Plain English (start here)

After signing in, the app felt busy: several cards and pop-ups competed for
attention, the bottom-edge banners could sit on top of each other (and on top of
the mobile menu bar), and the **Sign Out** button did nothing. The app also
behaved as if it kept forgetting who you were.

Phase 1 fixes the foundations behind all of that:

1. **The app now remembers how far you've come.** A single, durable "onboarding
   state" records whether you've told us who you are, picked a sport, set a
   baseline, imported a session, and so on. It **never goes backwards**, so a
   returning athlete is never re-asked who they are.
2. **Only one pop-up banner shows at a time.** The bottom-of-screen nudges
   (restore-backup, save-your-progress, take-the-tour) now share one slot and
   take turns by priority — they can no longer overlap each other or the menu.
3. **The dashboard leads with one clear next step.** The supporting panels are
   tucked behind a "More for you" toggle so the main action stands out.
4. **Sign Out works.** It ends your session and returns you to the login page.

Nothing about your data changed, and nothing was removed — the extra panels are
one tap away.

---

## What changed (for engineers)

### 1. Onboarding state machine — `lib/onboarding/state.ts`
Pure, framework-free. Canonical states (in order):
`new_user → identity_completed → sport_selected → baseline_started →
first_session_imported → active_user`.

Two rules make it durable:
- **Never regress:** the live state is `furthestState(stored, derivedFromData)`.
  The persisted marker (`store.onboarding.furthest`) only ever moves forward
  (`store/slices/onboarding.ts`).
- **Derive from data:** existing users are placed correctly from their
  profile/sessions with no backfill (`deriveOnboardingState`).

`useOnboarding()` (`lib/onboarding/useOnboarding.ts`) is the React entry point:
it resolves the live state, auto-advances + persists the marker, and exposes the
single `nextStep`. The `UsageCategoryModal` feeds it (`setOnboardingRole` +
`advanceOnboarding('identity_completed')`) so identity is recorded once.

> Onboarding progress is **local-first** (not a synced table). On a new device it
> starts at the default and immediately re-derives from the user's synced data,
> so it stays consistent across devices without an extra schema.

### 2. Bottom nudge manager — `lib/floating/nudge-manager.tsx` (+ `nudge-priority.ts`)
Companion to the `FloatingDock` (which owns the bottom-**right** corner). This
owns the bottom **edge**: every transient banner registers via `useNudgeSlot(id,
priority, eligible)` and only the single highest-priority one renders
(`resolveActiveNudge`). The active nudge publishes its height to
`--app-nudge-height` (globals.css) so the dock floats above it. Priorities:
Continue-Progress (30) > Save-Progress (20) > Tutorial-Welcome (10).

> Do **not** add new `fixed bottom-…` banners on the app surface. Add a nudge
> slot. Positioning lives in one place: `.app-nudge` in `globals.css`.

### 3. Dashboard disclosure — `components/dashboard/SecondaryPanels.tsx`
Collapses Athlete-GI / next-badge / daily-note / growth behind "More for you"
(collapsed by default, remembered per session). The hero
(`DashboardIntelligence`, already a one-action selector) stays prominent.

### 4. Sign-out — `lib/auth/useSignOut.ts`
One reusable hook: `await signOut()` → `router.replace('/login')`, with a
`pending` flag. The sidebar button now uses it (it previously had no handler).
The user's persisted data is intentionally **not** wiped on sign-out.

## Tests
- `lib/onboarding/__tests__/state.test.ts` — ordering, derive, never-regress, gating, next-step.
- `lib/floating/__tests__/nudge-manager.test.ts` — one-winner resolution + priority order.
- `components/layout/__tests__/sidebar-signout.test.ts` — guards the dead-button regression.
