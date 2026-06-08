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

**The admin console has four tabs:**

| Tab | What it does |
|---|---|
| **Profiles** | The coach-inspired teaching frameworks (all admin-only, all "needs review"), each with its style tags, swing-model target, and the disclaimer. |
| **Mix Builder** | Drag weight sliders to blend coaches. See the **resolved coaching strategy** update live — the influence summary, which faults get prioritized, which drill families get favored, how technical the voice sounds. The SwingVantage house model always fills the remainder, so it's never zeroed out. |
| **Review Queue** | The concepts the engine extracted from approved sources, each graded by **IP-risk** and **confidence**. Approve or reject. *Only approved concepts can ever influence the product.* |
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
2. For a profile you want to use, add **approved source material** and review what's learned
   (Phase 2 wires the full add-source form; today the Review Queue demonstrates the gate).
3. Open **Mix Builder**, set your blend (e.g. 30% structure / 25% precision / 30% athletic /
   15% house), and confirm the resolved strategy reads the way you want.
4. Use **Test Drive** to sanity-check the recommendation against a few faults.
5. Only when you're happy: enable the user module flag to let it shape user recommendations.

---

## Phased plan — what's next (not yet built)

Phase 1 delivered the engine, the ethics layer, the seeds, and the admin console. The
following are deliberately deferred so the foundation could land clean and tested:

- **Store persistence** — today the console is a live preview; Phase 2 saves profiles,
  sources, mixes, and approvals to a store (local-first, mirroring the rest of CIOS).
- **Full source-add workflow** — the per-source metadata form (URL/upload, permission &
  copyright status, attribution) and the "extract from this source" action.
- **Multiple saved mixes** — Beginner-Friendly, Technical Precision, Athletic Rotation,
  Data-Driven Ball-Striking, Competitive, Junior, Senior Mobility-Friendly.
- **User-facing module** — "Curated Swing Drills for Your Current Game" behind the flag,
  with the neutral style tags and Start/Save/Complete/Not-relevant/Retest actions.
- **Video pipeline** — generate **original** SwingVantage video concepts from approved
  learned concepts, via the existing Video Studio brief pipeline.
- **Trend intelligence** — use privacy-safe aggregate data (which faults are most common,
  which drills get abandoned) to recommend what to create and which mix adjustments help.
- **Optional AI extraction** — an off-by-default provider seam to expand concept extraction
  (it may only re-word, never invent claims or copy phrasing).
- **More sports** — the data model already supports all seven sports; seeds beyond golf
  come as you add and approve sources.

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
  __tests__/         ethics invariants + blend math + extraction/approval gate (18 tests)
apps/web/src/app/admin/coach-mix/
  page.tsx           server page (admin-guarded, noindex)
  CoachMixDashboard.tsx  the four-tab admin console
```
