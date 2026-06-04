# Connect a Database — Supabase Setup Walkthrough (one page)

A click-by-click guide to giving SwingIQ a free cloud database, so people can make real accounts and sync across devices. **Cost: $0. Time: about 15 minutes. No credit card.**

---

## 📘 In Plain English (start here)

**What this page is:** The hand-holding version of "create your Supabase project." Each step below shows a little **sketch of the screen** you'll see and tells you exactly what to click or copy. (The boxes are drawings, not real photos — your screen will look a bit fancier, but the buttons are named the same.)

**What you actually need to know:**
- You only do this **once**. After it's done, SwingIQ quietly switches from "saves in this browser" to "real accounts + cloud sync."
- Two values (a web address and a key) get pasted into one settings file. That's the whole connection.
- Nothing here exposes your proprietary technology — a database only holds your *users'* swing data, never your engines or algorithms.

**What to do next:** Work top to bottom. Don't skip the part where you **save your database password** — it's the one thing that's annoying to recover.

> The exact SQL files and the "what unlocks what" reference live in [INTEGRATIONS_SETUP.md](INTEGRATIONS_SETUP.md). This page is just the visual account-setup part.

---

## Before you start

- [ ] You can run the app locally (`npm run dev:web` opens it at `http://localhost:3000`).
- [ ] You know where the file `apps/web/.env.local` is (it already exists in your project).
- [ ] Have a password manager or notes app open — you'll save one password.

---

## Step 1 — Create your account

Go to **https://supabase.com** and click the green button.

```
┌──────────────────────────────────────────────────────────┐
│  supabase                       [ Sign in ]  [ Start your │
│                                                project ▸ ] │
│                                                            │
│      Build in a weekend.                                   │
│      Scale to millions.                                    │
│                                                            │
│              ▸ Click "Start your project"                  │
└──────────────────────────────────────────────────────────┘
```

Sign up with **GitHub** (one click if you have it) or an **email + password**. Either is fine.

✅ *You'll land on the Supabase dashboard.*

---

## Step 2 — Make a free organization

The first time, Supabase asks you to create an "organization" (just a container for your projects).

```
┌──────────────────────────────────────────────────────────┐
│  Create a new organization                                 │
│  ─────────────────────────────────────────────            │
│  Name:        [ SwingIQ                      ]             │
│  Type:        [ Personal           ▾ ]                     │
│  Plan:        ( ● Free   $0 )  ( ○ Pro  $25 )             │
│                                                            │
│                                   [ Create organization ] │
└──────────────────────────────────────────────────────────┘
```

- Name it anything (e.g. **SwingIQ**).
- **Plan: choose Free.** No card required.

---

## Step 3 — Create the project ⚠️ save the password

```
┌──────────────────────────────────────────────────────────┐
│  New project                                               │
│  ─────────────────────────────────────────────            │
│  Project name:      [ swingiq-prod              ]          │
│                                                            │
│  Database Password:  [ ••••••••••••••• ] [ Generate ]     │
│        ⚠ COPY THIS NOW and save it. You'll need it for     │
│          self-hosting later and it's painful to reset.     │
│                                                            │
│  Region:            [ East US (North Virginia) ▾ ]        │
│        → pick the one closest to most of your users        │
│                                                            │
│                                      [ Create new project ]│
└──────────────────────────────────────────────────────────┘
```

- **Project name:** something like `swingiq-prod`.
- **Database Password:** click **Generate**, then **copy it into your password manager immediately.** 🔐
- **Region:** closest to your users (US East is a safe default).
- Click **Create new project**.

```
┌──────────────────────────────────────────────────────────┐
│   ⏳  Setting up your project…  (about 1–2 minutes)        │
└──────────────────────────────────────────────────────────┘
```

✅ *Grab water. When the spinner finishes, you have a live PostgreSQL database.*

---

## Step 4 — Build the tables (run the SQL)

In the **left sidebar**, click the **SQL Editor** icon, then **+ New query**.

```
┌────────────┬─────────────────────────────────────────────┐
│  ▸ Table   │   SQL Editor              [ + New query ]    │
│  ▸ SQL ◀───┤  ┌───────────────────────────────────────┐  │
│  ▸ Auth    │  │  -- paste the contents of the file     │  │
│  ▸ Storage │  │  -- here, then click Run               │  │
│  ▸ ⚙ Settings  │                                       │  │
│            │  └───────────────────────────────────────┘  │
│            │                              [ Run ▸ ]       │
└────────────┴─────────────────────────────────────────────┘
```

**The easy way — one paste:** open **`server/supabase_setup_all_in_one.sql`** from your project, copy **all** of it, paste into the editor, click **Run**, and wait for "Success." That single file builds every table *and* the per-user security in one go. It's safe to run twice if you're unsure.

That's all you need to go live. The files below are **optional** and can be run later the same way (paste → Run):

| File | Needed? | What it adds |
|---|---|---|
| `server/supabase_setup_all_in_one.sql` | **← run this one** | Core tables + per-user security (everything required) |
| `server/supabase_schema_video.sql` | Optional | Cloud history for video analyses |
| `server/supabase_schema_research.sql` | Optional | Admin benchmark-research workflow |

> 💡 Prefer the two-file version? You can still run `server/supabase_schema.sql` then `apps/web/supabase-rls.sql` instead — the all-in-one file is just those two merged so it's one paste.

✅ *Click "Table Editor" in the sidebar — you should now see `golfer_profiles`, `sessions`, and friends.*

---

## Step 5 — Copy your two keys

Click **⚙ Settings** (bottom of the left sidebar) → **API**.

```
┌──────────────────────────────────────────────────────────┐
│  Settings ▸ API                                            │
│  ─────────────────────────────────────────────            │
│  Project URL                                               │
│    https://abcdefgh1234.supabase.co        [ Copy ]       │
│                                                            │
│  Project API keys                                          │
│    anon  public      eyJhbGciOi…            [ Copy ]   ←   │
│    service_role  secret   eyJhbGciOi…  (hidden) [ Copy ]   │
└──────────────────────────────────────────────────────────┘
```

You need:
- **Project URL** (the `https://….supabase.co` address)
- **anon / public** key (safe to use in the browser)

*(The `service_role` / secret key is optional — only needed for some server features. If you copy it, never share it or commit it.)*

> Newer Supabase dashboards may label these **"Publishable"** (= anon) and **"Secret"** (= service_role). Same things.

---

## Step 6 — Paste them into your settings file

Open **`apps/web/.env.local`** in your editor. Find the Supabase lines (they're already there, commented out with a `#`). **Remove the `#`** and paste your values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh1234.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi…your-anon-key…
# Optional, server-only — keep secret, never commit:
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi…your-service-role-key…
```

Save the file. ✅ *This file is gitignored, so your keys never get pushed to GitHub.*

---

## Step 7 — Restart and prove it works

```
┌──────────────────────────────────────────────────────────┐
│  PowerShell                                                │
│  ─────────────────────────────────────────────            │
│  Ctrl + C            ← stop the running app                │
│  npm run dev:web     ← start it again so it reads the keys │
└──────────────────────────────────────────────────────────┘
```

Then in your browser:
1. Go to **`http://localhost:3000/signup`** and create a test account.
2. Back in Supabase → **Table Editor → `golfer_profiles`**.

```
┌──────────────────────────────────────────────────────────┐
│  Table Editor ▸ golfer_profiles                            │
│  ─────────────────────────────────────────────            │
│  id        | user_id   | name        | created_at         │
│  a1b2c3…   | f9e8d7…   | Test User   | 2026-06-03 …  ◀ 🎉 │
└──────────────────────────────────────────────────────────┘
```

**A new row appeared = it's connected.** Real accounts and cloud sync are now live.

---

## If something doesn't work

| What you see | Fix |
|---|---|
| App still says "local profile," no login required | The app didn't reload the keys — fully stop (`Ctrl+C`) and run `npm run dev:web` again. Confirm the two lines in `.env.local` have **no `#`** in front. |
| SQL error "relation already exists" | Harmless — that table was already created. Move to the next file. |
| Signup works but no row in `golfer_profiles` | Re-run `server/supabase_schema.sql`; make sure it finished with "Success." |
| "Invalid API key" in the browser console | You copied the wrong key (e.g. the URL into the key line). Re-copy from Settings → API. |
| Project shows "Paused" | Free projects sleep after ~1 week idle. Click **Restore** in the dashboard — your data is safe. |

---

## What's next

- You're now on the **$0 path**. When real traffic outgrows the free tier (or the weekly auto-pause gets annoying), upgrade to Supabase Pro (~$25/mo) **or** move to your own server — both are clean because it's standard PostgreSQL. See the "Outgrowing the free tier → self-hosting" section in [INTEGRATIONS_SETUP.md](INTEGRATIONS_SETUP.md).
- To lock down data even harder before real users, see **Priority 4 — When You Connect Supabase** in [OWNER_TASKS.md](OWNER_TASKS.md).

*Reminder: your proprietary technology (the diagnostic and 3D pose engines) lives in your code and never touches this database. A host can run your database without ever seeing your algorithms.*

---

*Last updated: June 2026 | See also: `docs/INTEGRATIONS_SETUP.md`, `docs/OWNER_TASKS.md`, `docs/SECURITY_AND_PRIVACY.md`*
