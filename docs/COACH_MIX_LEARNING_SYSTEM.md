# Coach Mix — Ethical Coaching Influence Engine

## 📘 In Plain English (start here)

**What this is:** A new admin-only system inside CentralIntelligenceOS that lets you
**blend "coaching styles"** and use the blend to make SwingVantage's drills and
explanations smarter — *without ever copying, cloning, or impersonating a real coach.*

**The key idea:** Instead of copying a coach's videos or words, the system learns the
*generalized principles* of a teaching style (e.g. "athletic and rotational" vs.
"structured and checkpoint-based"), and writes its **own** original SwingVantage drills
and explanations in that spirit. A user might see *"This recommendation is influenced by an
athletic, rotational teaching model"* — never *"Coach X says to do this."*

**Where to find it:** Admin sidebar → **Media & AI → Coach Mix** (`/admin/coach-mix`).

**Is anything live for users yet?** No. The whole system is **admin-only**. Nothing reaches
real users until you deliberately turn it on (env flag `NEXT_PUBLIC_COACH_MIX_USER_MODULE`).

---

## The ethical guarantees (built into the code)

These live in `lib/central-intelligence/coach-mix/config.ts` and are enforced by the test
suite, so the product's promises and its code can't silently drift apart:

1. Never copy a coach's content. Learn **principles**, never exact phrasing.
2. Never impersonate a coach or recreate their likeness, voice, or branding.
3. Never claim endorsement without a documented partnership.
4. Nothing a source "teaches" influences the product until **an admin approves it**.
5. Never scrape restricted content or bypass a platform's terms.
6. Coach **names are hidden from users** unless an admin explicitly turns them on.
7. Always prefer original SwingVantage explanations, drills, and videos.

Every coach profile carries this disclaimer, everywhere it appears:

> *This profile is an internal SwingVantage teaching-influence framework based on
> admin-approved learning sources and generalized coaching principles. It is not
> affiliated with, endorsed by, or representative of the named coach unless an official
> partnership is documented.*

---

## What's built now (Phase 1)

The engine lives at `apps/web/src/lib/central-intelligence/coach-mix/` and the admin
console at `apps/web/src/app/admin/coach-mix/`.

**The admin console has five tabs** (everything you do here is **saved** in your browser):

| Tab | What it does |
|---|---|
| **Profiles** | The coach-inspired teaching frameworks (all admin-only, all "needs review"), each with its style tags, swing-model target, and the disclaimer. Set each profile's visibility (admin-only / beta / user-visible) or archive it. |
| **Sources** | Add a permission-cleared learning source (title, type, sport, topic, permission & copyright status, "approved for learning"), then **Extract** its concepts into the review queue. |
| **Mix Builder** | Drag weight sliders to blend coaches. See the **resolved coaching strategy** update live. **Save** the mix (name it), load a saved mix, set the **active** mix, or delete one. The SwingVantage house model always fills the remainder, so it's never zeroed out. |
| **Review Queue** | The concepts extracted from approved sources, each graded by **IP-risk** and **confidence**. Approve or reject (decisions are saved). *Only approved concepts can ever influence the product.* |
| **Test Drive** | Pick a sample fault (e.g. early extension) and see the focused, 7-part recommendation the current mix produces — the drills come from the **real DrillMatch engine**, re-weighted by your blend. |

**Seed profiles included (all admin-only, all need your review):**

- **Structured Fundamentals** (Bender-inspired) — setup, plane, connection, checkpoints.
- **Technical Precision** (Kawamura-inspired, `kawamura28`) — balance, rhythm, compact, repeatable.
- **Technical Golf — PLACEHOLDER** (RubyStar-inspired, `rubystar330`) — identity/style **unconfirmed**; explicitly flagged to need admin review before any use.
- **Athletic Rotation** (Gankas-inspired, `georgegankasgolf`) — pivot, ground force, rotation, speed.
- **SwingVantage Default** — the original house model (the only user-visible one).

**It reuses, never rebuilds:** drills come from the existing **DrillMatch** engine and the
per-sport drill libraries; fault relationships come from the existing **fault ontology**.
Coach Mix only *biases and explains* — it never fabricates drills.

---

## How to use it (when you're ready)

1. Open **`/admin/coach-mix` → Profiles** and review the seed frameworks.
2. Under **Sources**, add approved source material, click **Extract**, then review what's
   learned under **Review Queue** (approve/reject — only approved concepts can influence anything).
3. Open **Mix Builder**, set your blend (e.g. 30% structure / 25% precision / 30% athletic /
   15% house), and confirm the resolved strategy reads the way you want.
4. Use **Test Drive** to sanity-check the recommendation against a few faults.
5. Only when you're happy: enable the user module flag to let it shape user recommendations.

---

## Phased plan

**Phase 1 (done):** the engine, ethics layer, seeds, and admin console.

**Phase 2 (done):**
- **Store persistence** — local-first store (mirrors CIOS); profiles, overrides, sources,
  concepts, mixes, and approvals all save in the browser.
- **Full source-add workflow** — the Sources tab (metadata form + Extract action).
- **Saved & active mixes** — name/save/load/activate/delete; build as many as you like
  (Beginner-Friendly, Technical Precision, Athletic Rotation, etc.).
- **User-facing module** — `components/coach-mix/CuratedSwingDrills.tsx`: "Curated Swing
  Drills for Your Current Game", neutral style tags, Start/Save/Complete/Not-relevant/Retest.
  **Built and flag-gated OFF** (`NEXT_PUBLIC_COACH_MIX_USER_MODULE`). **Placed** on the Fix
  Stack page (`/fix`), under the fix panel — invisible until you enable the flag.

**Phase 3 (done):**
- **Video pipeline** — `video.ts` turns an **approved** learned concept + the active blend
  into an **original** video concept (title, script outline, shot list, drill progression,
  retest, SEO/AEO/GEO keywords), using Video Studio's vocabulary so it hands off to the brief
  pipeline. Surfaced as a **Video Concepts** tab + a "Make video concept" button on approved
  concepts. Drafts only; never copies or recreates a coach's video.
- **Trend intelligence** — `trends.ts` turns privacy-safe aggregates (common faults,
  abandoned drills, completion-by-style) into recommendations (videos/drills to create,
  drills to promote, mix adjustments, dashboard tweaks). Small cohorts are suppressed
  (k-anonymity). Surfaced as a **Trends** tab (sample data until real aggregates are wired).
- **Optional AI extraction** — an off-by-default `ConceptRewriter` seam: it may only re-word
  a pending concept's rewrite, never change its meaning, type, confidence, or risk.

**Phase 4 (done):**
- **Live diagnosis** — the user module now reads each athlete's **real** active sport + latest
  diagnosed issue (the same context the Fix Stack uses), with skill level. With no diagnosis
  yet it shows nothing — it never fabricates a fix. **Multi-sport works automatically**: the
  drills come from the correct sport's library.
- **Trends adapter** — a `TrendAggregateSource` seam (`resolveTrendInput`): the Trends tab
  uses real privacy-safe aggregates when one is wired, and the labelled sample otherwise (the
  "sample data" banner disappears once real data flows).

**Remaining (needs a backend / your call):**
- **A real aggregate source** — point `TrendAggregateSource.load()` at an actual analytics /
  aggregate backend. Cross-user trend data can't come from the local-first app by itself.
- **Sport-specific coach seeds** — any sport already works through the admin Sources + mix
  workflow; add ready-made seed coach profiles for other sports only if you want them.

---

## Where the code lives

```
apps/web/src/lib/central-intelligence/coach-mix/
  config.ts          ethics, the disclaimer, IP-risk, style vocab, blend math, the user flag
  types.ts           profiles, sources, learned concepts, mixes, swing-model targets, strategy
  seeds.ts           the admin-only seed profiles (generalized style only)
  mixing.ts          weighted mix → resolved CoachingStrategy (pure, deterministic)
  recommendations.ts biases DrillMatch output + builds the 7-part user recommendation
  extraction.ts      approved source → reviewable concepts (nothing auto-published)
  review-queue.ts    the admin approval gate (only approved concepts influence)
  store.ts           local-first persistence (profiles/sources/concepts/mixes/videos)
  trends.ts          privacy-safe aggregates → recommendations (k-anonymity)
  video.ts           approved concept → original video concept (Video Studio vocab)
  __tests__/         ethics, blend, gate, store, flag, trends, video, AI seam (39 tests)
apps/web/src/app/admin/coach-mix/
  page.tsx           server page (admin-guarded, noindex)
  CoachMixDashboard.tsx  the seven-tab admin console (persistent)
apps/web/src/components/coach-mix/
  CuratedSwingDrills.tsx  the user-facing module (flag-gated off, placed on /fix)
```
