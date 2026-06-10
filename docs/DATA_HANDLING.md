# SwingVantage — Data Handling, Portability & Retention

Plain-English summary of what data SwingVantage holds, where it lives, how long
it's kept, and the rights every user has over it. This is the developer/owner
reference behind the public privacy copy; pair it with
[privacy-and-youth-safety-notes.md](privacy-and-youth-safety-notes.md) and
[SECURITY.md](../SECURITY.md). It describes current practice in plain English and
is **not** a certification or a substitute for independent legal review.

## 📘 In plain English

- **Your data is yours.** You can take a full copy with you at any time (export),
  and you can erase it completely at any time (delete). Neither needs our help.
- **Private by default.** Before you make an account, everything lives only in
  your browser. Sign in and it syncs to your private account.
- **No ads, no data sales.** We never run advertising cookies and never sell your
  data. We don't claim to be cookieless: the recommended Plausible is cookieless,
  but the optional analytics tools — Microsoft Clarity (heatmaps & session replay),
  Google Analytics, and PostHog — set cookies. These are all governed by your
  choice in the cookie banner; decline and none of them run, and the app works
  exactly the same.

## 1. What data exists, and where it lives

| Data | Local-first (no account) | With an account (cloud) |
| --- | --- | --- |
| Profile, sport, settings | Browser (`swingiq-store`) | Mirrored to Supabase, RLS-scoped to you |
| Sessions, shots, diagnoses, scores | Browser | Relational tables, owner-scoped |
| Swing videos | Analyzed **on-device**; never uploaded by default | (only if/when cloud media is enabled — EXIF stripped at ingest, see privacy notes §1a) |
| Drill feedback / improvement loops | Browser (capped local store) | Owner-scoped rows |
| Usage analytics | None until a provider is set | Aggregate; cookieless with Plausible, or cookie-based with GA4 / Microsoft Clarity when those are configured |

Crown-jewel control: every `public` user table is **Row-Level-Security scoped to
its owner** (admin tables are service-role only). A CI gate
(`scripts/check-rls.mjs`) fails the build if any table ships without RLS.

## 2. Portability — export everything (right to access / portability)

- **Client export (always available):** Data Center (`/data`) → *Export* downloads
  a single `SwingVantageBackup` JSON containing your full profile, sessions,
  clubs, history, and progress. Optional **AES-256-GCM** password encryption.
- **Server export (cloud users):** `GET /api/user/export` assembles the same
  backup from your RLS-scoped rows (401 if unauthenticated, 503 in local-only mode).
- The export format is open JSON (`swingiq-backup-v1`) — re-importable on any
  device, never a locked-in format.

## 3. Erasure — delete everything (right to be forgotten)

- **Local wipe (always available):** Data Center → *Clear Data* runs
  `wipeAllDeviceData()` — removes every SwingVantage key from the device.
- **Account + cloud deletion (cloud users):** the *Delete account & all cloud
  data* card → `POST /api/user/delete`. It authenticates the caller and deletes
  **only their own** auth user; because every user table references
  `auth.users(id) ON DELETE CASCADE`, this removes all owned rows in one atomic
  step (best-effort clears the storage folder first). The card requires typing
  `DELETE` to confirm and is irreversible.

## 4. Retention

- **Active data:** kept until you delete it. We keep no shadow copy.
- **Backups:** routine encrypted backups roll off within **30 days** of deletion.
- **Analysis frames:** when you run an analysis, only sampled still frames are
  sent to the AI vision provider; they are **not retained** after the analysis.
- **Logs:** operational logs are redacted of personal data and short-lived.

## 5. Data-subject requests (DSAR)

Most rights are **self-serve** (export + delete above), which is the fastest path.
For anything that needs human handling — a question, a correction, or a request
on behalf of a minor — contact **privacy@swingvantage.com**. The youth-safety
posture (parent/guardian-managed for under-18s; not directed at under-13s) is in
[privacy-and-youth-safety-notes.md](privacy-and-youth-safety-notes.md) §2.

## 6. Third parties

Disclosed by category on the public privacy page: hosting/CDN (Vercel),
database/auth (Supabase, only when configured), AI narrative/vision (only when a
key is set, frames-only, not retained), and aggregate analytics (off until
configured; cookieless with Plausible, cookie-based with GA4 / Microsoft Clarity).
Keyless-first means **none** of these process your data until the owner enables
them.

> Needs legal review before scale: a formal Privacy Policy + Terms, a documented
> processor list (DPAs), and jurisdiction-specific DSAR SLAs. This document
> describes engineering reality, not legal compliance.
