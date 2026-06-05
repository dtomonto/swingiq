# Accounts & Cloud Save (Supabase, relational)

## In Plain English (start here)

SwingVantage used to save everything **on the device** — in the browser's
local storage. If someone cleared their browser, switched phones, or used a
second device, their progress was gone. People were losing their work.

Now the **free account is the home for your progress.** When a player signs
in, all of their data — profiles, equipment, every practice session and shot,
video analyses, streaks, badges/XP, settings — lives in the cloud (Supabase),
in real database tables, one per kind of thing. The app on the device keeps a
fast local copy so it's instant and works offline, but the **account is the
source of truth.** Sign in on any device and your stuff is there.

New visitors can still try the app with no account (so we keep growing free
users). The moment they build real progress, a gentle banner invites them to
**create a free account to save it** — and everything already on the device is
carried into the new account automatically. Nobody loses progress.

### The ONE thing you need to do

The code is shipped, but the cloud database needs its tables created **once**:

1. Open your Supabase project → **SQL Editor** → **New query**.
2. Open the file [`apps/web/supabase-relational-schema.sql`](../apps/web/supabase-relational-schema.sql),
   copy **all** of it, paste into the editor.
3. Click **Run**.

That's it. It takes ~30 seconds and is safe to re-run. Until you do this, the
app keeps working from the local copy and the Settings → Account & Sync panel
honestly says "Cloud sync not available yet." After you run it, sign-in starts
saving everyone's progress to their account.

**Then run the second (additive) file** the same way:
[`apps/web/supabase-user-documents.sql`](../apps/web/supabase-user-documents.sql).
It adds ONE more table (`user_documents`) that backs up the smaller feature
stores (retest reminders, drill feedback, AGI history, saved video-analysis
history, Motion Lab sessions, etc.). ⚠️ Do **not** re-run the main schema file
after the first time — it would drop your now-populated tables. The
user_documents file is additive and safe.

> Note: the main script **drops** five old, empty golf-only tables
> (`golfer_profiles`, `clubs`, `sessions`, `shots`, `golf_bags`) that the app
> never actually used, and recreates them aligned to the real data plus all the
> multi-sport + progress tables. Because nothing ever wrote to them, this is
> safe.

---

## Architecture

```
        ┌─────────────────────────────────────────────┐
        │  React app (every screen reads/writes this)  │
        │            Zustand store  ──►  localStorage   │  ← instant + offline cache
        └───────────────┬─────────────────────────────┘
                        │  RelationalSyncProvider
            sign-in ▲   │   ▼ debounced write-through (minimal diff)
        ┌───────────┴───┴─────────────────────────────┐
        │           Supabase (Postgres)                │  ← SOURCE OF TRUTH
        │  sessions · shots · clubs · tennis_rackets · │
        │  baseball_bats · softball_bats · video_…     │
        │  golfer_profiles · sport_profiles · …        │   every table RLS owner-only
        └──────────────────────────────────────────────┘
```

### Data model (relational — one row per entity)

| Table | What it holds |
| --- | --- |
| `golfer_profiles` | The golf profile (singleton per user). |
| `sport_profiles` | Tennis / baseball / softball profiles (one row per sport). |
| `clubs` | Golf clubs (one row each). |
| `tennis_rackets`, `baseball_bats`, `softball_bats` | Non-golf equipment. |
| `sessions` | Practice sessions (any sport). Computed diagnoses stored as JSON on the row. |
| `shots` | Every shot, one row each; launch-monitor metric bags as JSONB. |
| `video_analyses` | One row per analysed swing video. |
| `training_progress` | Streaks, drills, milestones (singleton). |
| `app_settings` | Units, theme, coaching prefs, onboarding (singleton). |
| `community_state` | Badges, XP (promoted `xp_total` for leaderboards), challenges. |
| `tutorial_progress`, `agent_state` | In-app guide + smart-recommendation continuity. |
| `user_documents` | Per-(user, key) JSON for the smaller feature stores (retests, AGI, video history, Motion Lab, guide). |
| `drill_feedback` | One row per "did this drill help?" verdict (columned, for analytics/leaderboards). |

Every table has `user_id` and a Row Level Security policy so a user can only
ever read or write their own rows.

### Key files

- `apps/web/supabase-relational-schema.sql` — the schema + RLS (apply once).
- `apps/web/supabase-user-documents.sql` — additive `user_documents` table.
- `apps/web/src/lib/db/projection.ts` — lossless store ⇄ row mapping.
- `apps/web/src/lib/db/cloudRepo.ts` — `loadAll` (rows → store) and
  `reconcile` (store → rows, minimal insert/update/delete diff).
- `apps/web/src/lib/db/syncBase.ts` + `threeWayMerge.ts` — cross-device
  delete-sync (common-ancestor 3-way merge).
- `apps/web/src/lib/db/documentSync.ts` — cloud mirror for the secondary stores.
- `apps/web/src/lib/db/drillFeedbackSync.ts` + `supabase-drill-feedback.sql` —
  the promoted columned drill-feedback table + its sync.
- `apps/web/src/lib/db/RelationalSyncProvider.tsx` — lifecycle: pull + merge
  on sign-in, migrate guest data, debounced write-through, offline retry.
- `apps/web/src/components/sync/SaveProgressBanner.tsx` — the save-wall nudge.
- `apps/web/src/components/sync/AccountSyncCard.tsx` — Settings status panel.
- `apps/web/src/app/api/user/export|import/restore` — server backup/restore
  over the same tables.

## How sign-in handles existing data (never lose progress)

1. **First sign-in (account empty):** whatever is on the device is pushed up —
   the guest's trial data becomes their account data.
2. **Returning / second device (account has data):** a **3-way merge** (see
   below) reconciles device and cloud — keeping new items from both sides and
   propagating deletes — then writes the result back. (The very first sign-in
   on a device, before any base exists, uses a non-destructive union.)
3. **Editing:** a 2s-debounced diff writes only what changed.
4. **Offline:** edits stay in the local cache and re-sync on reconnect.

## Cross-device delete-sync (implemented)

Sign-in does a **3-way merge** against a "base" — a fingerprint of the last
state the device and cloud agreed on, kept per user in localStorage
(`lib/db/syncBase.ts`, `lib/db/threeWayMerge.ts`):

- An item present in the base but now gone from one side → **deleted** →
  removed everywhere (no resurrection).
- An item not in the base → **newly created** → kept/added.
- Edit-vs-edit → the cloud version only when it alone changed, otherwise this
  device's version.

The first sign-in on a brand-new device has no base yet, so it falls back to a
non-destructive union (nothing lost); the base is saved after that first sync,
and delete-sync is active from then on. Covered by
`lib/db/__tests__/threeWayMerge.test.ts`.

## Secondary feature stores (synced)

The smaller, self-contained stores are mirrored to the `user_documents` table
(one JSON row per feature per user) by `lib/db/documentSync.ts`, with a
purpose-built merge per store so sign-in never loses or duplicates: retest
reminders, AGI history / commitments / insight verdicts, the celebration
ledger, saved video-analysis history, Motion Lab sessions + roster, and the
guide / start-here state. The modules themselves are unchanged — they keep
using localStorage; the mirror keeps it in step with the cloud.

## Drill feedback — promoted to a columned table

"Did this drill help?" was promoted OUT of the document mirror into its own
columned `drill_feedback` table (one row per verdict), so it can power
cross-user analytics and a "most-effective drills" leaderboard. The scoring
code is untouched — it still reads the fast local repo; `lib/db/drillFeedbackSync.ts`
keeps the local array and the table in step (union-merge on sign-in by a stable
content id). Apply once (additive):
[`apps/web/supabase-drill-feedback.sql`](../apps/web/supabase-drill-feedback.sql).

```sql
-- effectiveness leaderboard, once verdicts flow in:
select drill_id, value, count(*) AS n
from drill_feedback group by drill_id, value order by n desc;
```

## What's next (optional)

- Promote other document stores to columned tables if you later want
  cross-user analytics on them (same pattern as drill_feedback).
- Surface server-side leaderboards now that data is queryable
  (e.g. `select … from community_state order by xp_total desc`).
