# Theme contrast — contingency patches

This folder holds small, ready-to-apply safety-net patches so that fixes which
currently live on `origin/master` are **not lost** if the theme work is
consolidated by making a *different* branch the base.

Background: two agents fixed the same mobile white-on-white theme defect in
parallel — `fix/theme-contrast-mobile` (shipped to `master`) and
`feature/theme-contrast-fix` (a more complete token/component architecture,
still being finished). The plan is to fold them together. Most of the work
overlaps, but **one fix exists only in the `master` version** and is captured
here as a patch in case the other branch becomes the base.

---

## `theme-hero-cards-dark-on-dark.patch`

**What it fixes:** three dashboard "hero" cards render on the FIXED dark-green
brand surface `bg-golf-dark`. They used `text-primary-foreground`, which is
white in light themes but flips to **near-black in the Dark Performance theme**
→ invisible (dark-on-dark). The patch switches those to white-based text, which
is always correct on that fixed dark surface.

Files touched (text only, 9 lines):
- `apps/web/src/components/agents/FirstSwingJourneyCard.tsx`
- `apps/web/src/components/agents/NextBestActionCard.tsx`
- `apps/web/src/components/guide/GuideCompanion.tsx`

**When you need it:** ONLY if the consolidated result does **not** already have
white text on those cards — i.e. if any of the three files still contains
`text-primary-foreground` inside a `bg-golf-dark` block. If you rebased onto
`origin/master` (commit `48f10ca` or later), it's already included — **skip
this patch.**

**How to apply** (from the repo root):

```bash
git apply patches/theme-hero-cards-dark-on-dark.patch
# if the surrounding code drifted (e.g. GuideCompanion was refactored):
git apply --3way --ignore-whitespace patches/theme-hero-cards-dark-on-dark.patch
```

**If the patch won't apply, do it by hand** (bulletproof — the patch is just
this rule): in the three files above, on every element **inside a
`bg-golf-dark` surface**, replace:

- `text-primary-foreground/80` → `text-white/80`
- `text-primary-foreground/90` → `text-white/90`

(Leave `text-primary-foreground` that sits on `bg-primary` / accent surfaces
alone — those are correct.)

**Verify afterwards:**

```bash
cd apps/web && npx jest src/lib/theme && npx tsc --noEmit
```

Source of truth: this fix originally shipped in commit `48f10ca`
("fix(themes): eliminate white-on-white & dark-on-dark contrast defects") on
`master`, also available on branch `fix/theme-contrast-mobile`.
