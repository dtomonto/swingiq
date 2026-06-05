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

> Note: this script **drops** five old, empty golf-only tables
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

Every table has `user_id` and a Row Level Security policy so a user can only
ever read or write their own rows.

### Key files

- `apps/web/supabase-relational-schema.sql` — the schema + RLS (apply once).
- `apps/web/src/lib/db/projection.ts` — lossless store ⇄ row mapping.
- `apps/web/src/lib/db/cloudRepo.ts` — `loadAll` (rows → store) and
  `reconcile` (store → rows, minimal insert/update/delete diff).
- `apps/web/src/lib/db/RelationalSyncProvider.tsx` — lifecycle: pull + merge
  on sign-in, migrate guest data, debounced write-through, offline retry.
- `apps/web/src/components/sync/SaveProgressBanner.tsx` — the save-wall nudge.
- `apps/web/src/components/sync/AccountSyncCard.tsx` — Settings status panel.
- `apps/web/src/app/api/user/export|import/restore` — server backup/restore
  over the same tables.

## How sign-in handles existing data (never lose progress)

1. **First sign-in (account empty):** whatever is on the device is pushed up —
   the guest's trial data becomes their account data.
2. **Returning / second device (account has data):** the cloud is **union-merged**
   with the device (by entity id) so neither side loses anything, then the
   union is written back.
3. **Editing:** a 2s-debounced diff writes only what changed.
4. **Offline:** edits stay in the local cache and re-sync on reconnect.

## Known limitations (v1)

- **Cross-device deletes don't propagate.** The merge is additive (it favors
  keeping data), so deleting an item on one device can be re-added from another
  device's copy. This is the deliberate "never lose progress" bias; per-entity
  delete propagation (tombstones) is a future improvement.
- **A few secondary feature stores still use local storage** and are queued for
  the same treatment: retest results (`lib/retest`), Motion Lab
  (`lib/motion-lab`), DrillMatch feedback (`lib/drillmatch`), and AGI history /
  commitments (`lib/agi`). The **main store** — profiles, equipment, sessions,
  shots, video analyses, training, streaks, badges/XP, settings, tutorials —
  is fully cloud-synced.

## What's next (optional)

- Migrate the secondary stores above into their own tables.
- Add per-entity timestamps for true cross-device delete propagation.
- Surface server-side leaderboards/analytics now that data is queryable
  (e.g. `select … from community_state order by xp_total desc`).
