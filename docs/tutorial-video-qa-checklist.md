# Tutorial Video QA Checklist

## In Plain English (start here)

Before shipping new tutorial recordings (or after changing the player), walk this list.
It's the manual test pass the automated tests can't cover — real browsers, real phones,
slow networks, and accessibility. The repo's automated tests only check the data
(manifest + placement map) and the helper logic; everything visual/behavioral is here.

Run the app: `npm run dev` → open the surfaces below. Automated guards:
`npm run type-check` and `npm test` (see `lib/tutorial/__tests__/`).

---

## Surfaces to check

- [ ] Homepage `/` — "See how it works" appears under the hero, poster-first.
- [ ] `/video` (golf) upload step — "How to record your swing" shows for new users.
- [ ] `/video` (tennis/baseball/softball) upload step — same, sport passed through.
- [ ] `/video` results — "How to read your analysis" card shows on first result.
- [ ] `/tutorial` — full Tutorial Center still works (tracks, library, modal player).

## Browsers / devices

- [ ] Desktop Chrome — play, pause, complete, fullscreen.
- [ ] Desktop Safari — MP4 plays; captions toggle works.
- [ ] Desktop Firefox — WebM preferred; controls usable.
- [ ] iPhone Safari — `playsInline` (no forced fullscreen), thumb-friendly controls.
- [ ] Android Chrome — plays inline; mobile source used on small viewport.

## Performance

- [ ] First paint loads **no** video bytes (Network tab: only poster image, if any).
- [ ] Scrolling the placement into view fires one `tutorial_video_impression`.
- [ ] `preload` is `none` (or `metadata` only for `priority: 'high'`).
- [ ] No layout shift when the player area renders (CLS ~0 — aspect-ratio box holds space).
- [ ] Slow 4G simulation — poster + play button are usable before any video loads.
- [ ] Mobile viewport (<640px) loads the `mobile/*.mp4` source, not the desktop file.

## Honest fallbacks

- [ ] **No recording yet** (manifest has no sources) — shows "Walkthrough" card +
      numbered written steps; the play button reveals steps instead of dead-ending.
- [ ] **Missing video file** (manifest points at a 404) — `onError` shows the written
      steps and fires `tutorial_video_error`; the app does not crash.
- [ ] **Missing poster** — falls back to the branded gradient + play glyph (no broken img).
- [ ] **No captions** — player still works; no empty/blank caption track rendered.

## Accessibility

- [ ] Keyboard-only — Tab reaches the play button; Enter/Space starts it; controls reachable.
- [ ] Visible focus ring on the play button.
- [ ] Screen-reader smoke test — region labelled "Tutorial: <title>"; play button has a
      meaningful label; written steps are an ordered list.
- [ ] Captions (`.vtt`) selectable and accurate on clips that require them.
- [ ] **Reduced motion** enabled (OS setting) — nothing autoplays; click-to-play only.
- [ ] Contrast around the card, CTA, and controls passes AA.

## State / behavior

- [ ] First-time user — "how to record" shows on the empty upload state.
- [ ] Returning user (has history) — the upload tutorial is hidden (not nagged).
- [ ] First result — "how to read" shows; after several results it stops.
- [ ] CTA links ("Watch the full guide", "Open this feature") navigate correctly and
      fire `tutorial_video_cta_clicked`.
- [ ] Analytics events carry `{ video_id, placement, page, sport, user_journey_stage,
      device_type }` (check console in dev — `[Analytics]` lines).

## Cross-check after adding a recording

- [ ] Ran `scripts/optimize-tutorial-video.mjs` and produced mp4/webm/mobile/poster/thumb.
- [ ] Set `mp4Src`/`webmSrc`/`mobileSrc`/`poster`/`thumbnail`/`captionsSrc` in the manifest.
- [ ] `npm test` passes (manifest + placement validity).
- [ ] Re-walked the relevant surface above.
