# Data Portability Guide

This document explains how SwingIQ handles your data — what you can export, how to import it back, what the backup file contains, and how the system protects your privacy.

**Written for:** App owners and developers who need to understand the data portability system. For a user-facing guide, see `docs/DATA_IMPORT_GUIDE.md`.

## 📘 In Plain English (start here)

**What this page is:** A deeper look at how your data gets in and out of SwingIQ, and the privacy promises behind it.

**What you actually need to know:**
- **You own your data.** You can export everything as one file and load it back on any phone, tablet, or computer.
- **Your actual swing videos never leave your device.** Only the analysis results (scores, detected issues) are saved — not the video itself. Keep your original video files separately if you want to hang on to them.
- **Old backup files always still work.** When the app gets new features, it quietly upgrades your old backup during import so nothing breaks.
- For the simple "how do I export / import" steps, see [DATA_IMPORT_GUIDE.md](DATA_IMPORT_GUIDE.md) and [WEB_APP_GUIDE.md](WEB_APP_GUIDE.md).

**What to do next:** Nothing technical. The JSON examples and the "Developer Notes" section near the bottom are for a developer or an AI assistant — you can skip them.

> The sections below get into the technical detail. You're welcome to read it, but you don't need any of it to export, back up, or restore your data.

---

## Core Philosophy

SwingIQ is built on the principle that **you own your data**. This means:

1. You can export everything — profiles, sessions, equipment, progress, settings — as a single JSON file
2. You can import that file on any device or browser and restore your full history
3. The app works without an account — all data is local until you connect Supabase
4. We will never delete your data without explicit confirmation
5. AI disclaimers and privacy notices are shown before any AI features are used

---

## What Gets Exported

When you use the Data Center export, the backup file contains:

| Data Type | What It Includes | Format |
|-----------|-----------------|--------|
| Golf Profile | Name, handicap, skill level, typical miss, goals | JSON |
| Sport Profiles | Tennis, baseball, softball player info | JSON |
| Golf Equipment | All clubs — brand, model, loft, shaft, carry distances | JSON |
| Sport Equipment | Tennis rackets, baseball bats, softball bats with full specs | JSON |
| Sessions | Every practice session — shots, dates, notes, club used | JSON |
| Diagnoses | AI and engine diagnostic results for each session | JSON (nested in sessions) |
| Video Analyses | Video analysis results (not the video itself — see below) | JSON |
| Training Progress | Streak, drills completed, milestones earned | JSON |
| Community/Gamification | Badges, XP points, challenges completed, level | JSON |
| Tutorial Progress | Which tutorial guides you've completed | JSON |
| Settings | Units, theme, language, coaching style, usage category | JSON |
| Language Preference | Your selected display language | JSON |

**What is NOT exported:**
- Actual video files (these stay in your browser — see "Video Privacy" below)
- Account credentials (password, email) — these belong to Supabase Auth, not the backup
- AI conversation history (future feature)

---

## Backup File Structure

Every backup is a JSON file with this top-level structure:

```json
{
  "backupFormat": "swingiq-backup-v1",
  "backupVersion": "1.2.0",
  "appVersion": "1.1.0",
  "schemaVersion": "1.2.0",
  "createdAt": "2025-05-01T12:00:00.000Z",
  "exportedAt": "2025-05-01T12:00:00.000Z",
  "sourceInfo": {
    "userAgent": "Mozilla/5.0...",
    "platform": "Win32"
  },
  "dataScope": "full",
  "encrypted": false,
  "preferredLanguage": "en",
  "data": {
    "profile": { ... },
    "sportProfiles": { ... },
    "clubs": [ ... ],
    "sportEquipment": { ... },
    "sessions": [ ... ],
    "videoAnalyses": [ ... ],
    "training": { ... },
    "settings": { ... },
    "community": { ... },
    "tutorialProgress": { ... }
  },
  "metadata": {
    "recordCounts": {
      "sessions": 42,
      "clubs": 14,
      "videoAnalyses": 8,
      "milestones": 5,
      "drillsCompleted": 23,
      "achievementsEarned": 12,
      "xpTotal": 1850
    },
    "sportsIncluded": ["golf", "tennis"],
    "dateRange": {
      "earliest": "2024-03-15T00:00:00.000Z",
      "latest": "2025-04-28T00:00:00.000Z"
    },
    "warnings": []
  }
}
```

> **Encrypted exports (live).** The `encrypted` flag above is `false` for a plain `.json` backup. When you set a password at export time, SwingIQ writes an encrypted `.swingiqbackup` file instead — AES-256-GCM with a PBKDF2-derived key (310k iterations, Web Crypto API, no external dependencies). Import detects either format automatically and prompts for the password when needed.

---

## Schema Versioning

The backup schema uses semantic versioning. Any time the structure changes, the version number increases. This ensures old backup files can always be imported even if the app has been updated.

**Migration path:**
```
v1.0.0 (original)
  ↓
v1.1.0 (added community/gamification fields: badges, XP, challenges, streaks)
  ↓
v1.2.0 (added tutorial progress, enhanced community, language preference)
```

**Migration code:** `apps/web/src/lib/backup/migrate.ts`

When you import an older backup file, the migration layer automatically upgrades it to the current schema. You will see a message in the restore preview if migration happened.

**Rule for future changes:** Always add migration code when changing the schema. Never remove fields that older versions wrote — mark them optional instead.

---

## How Import/Restore Works

The restore process has four steps:

### Step 1: Upload
You select your `.json` backup file. The app reads it in the browser — it is never sent to a server.

### Step 2: Validation
The validator checks:
- Is this a SwingIQ backup file? (checks `backupFormat`)
- Is the JSON structure valid?
- Are the data types correct? (e.g., dates are strings, numbers are numbers)
- **Security:** Prototype pollution guard — the file cannot inject harmful properties into the app
- **Security:** Complexity bomb guard — the file cannot contain deeply nested JSON designed to crash the browser

### Step 3: Preview
Before anything is overwritten, you see a summary of what will be restored:
- How many sessions, clubs, and equipment items
- Whether community/badge data is included
- Whether tutorial progress is included
- Any warnings (e.g., "2 sessions with no diagnostic data")

You choose: **Replace all** (overwrites everything) or **Merge** (adds sessions that don't already exist without deleting current data).

### Step 4: Restore
Your selected data is loaded into the Zustand store and immediately persisted to localStorage.

---

## Video Privacy

SwingIQ processes videos **entirely in your browser**. This means:
- The actual video file is never uploaded to our servers
- Only the metadata (camera angle, video duration, analyzed frame count) is saved
- Only the analysis results (detected phases, issues found, scores) are saved
- If you clear your browser data, the video is gone — we recommend keeping your original video files separately

When Supabase Storage is connected (future feature), optional cloud video backup will be available as a premium opt-in. Opting in will be explicit and clearly labeled.

---

## Data Deletion

### Deleting a single session
Go to Sessions → click the session → Delete. The session and its diagnoses are permanently removed from localStorage.

### Deleting all data (account reset)
Settings → Reset all data. This deletes everything in localStorage and returns the app to factory state. 

⚠️ **Export your backup first** — this cannot be undone.

### Deleting a Supabase account
Once Supabase is connected: Settings → Account → Delete account. This removes all Supabase records for your user. Under data protection laws, we retain audit logs for up to 30 days before full deletion.

---

## CSV Export (Planned)

A future enhancement will add CSV export for sessions and shot data, making it easy to analyze your data in Excel or Google Sheets. The JSON backup is the authoritative format; CSV is for convenience.

Planned CSV exports:
- `swingiq_sessions.csv` — one row per session
- `swingiq_shots.csv` — one row per shot
- `swingiq_equipment.csv` — one row per equipment item

---

## Developer Notes

### Adding a new data type to the backup

1. Add the TypeScript type to the relevant store interface in `apps/web/src/store/index.ts`
2. Add the field to `SwingIQBackupData` in `apps/web/src/lib/backup/schema.ts`
3. Add a registry entry in `apps/web/src/lib/backup/registry.ts` — this declares what gets exported and imported
4. Add migration code in `apps/web/src/lib/backup/migrate.ts` to handle old backup files that don't have this field
5. Bump `CURRENT_BACKUP_VERSION` in `schema.ts`
6. Update `BackupMetadata.recordCounts` if the new type has countable records
7. Add validation in `apps/web/src/lib/backup/validate.ts`
8. Update the restore preview in `apps/web/src/lib/backup/restore.ts`

### Key files

| File | Purpose |
|------|---------|
| `schema.ts` | TypeScript types and version constants |
| `export.ts` | Assembles the backup object from the store |
| `validate.ts` | Validates a file before import (security + correctness) |
| `migrate.ts` | Upgrades old backup files to the current schema |
| `restore.ts` | Loads validated data into the Zustand store |
| `registry.ts` | Centralized contract: which features participate in backup |
| `crypto.ts` | AES-256-GCM password encryption (PBKDF2, 310k iterations) — **live**; powers the optional encrypted `.swingiqbackup` export from Data Center and Settings → Backup & Restore |

---

## Compliance Notes

- **GDPR (European users):** Data portability is a right under GDPR Article 20. The export feature satisfies this requirement for data stored locally. When Supabase is connected, the export API route (`/api/user/export`) satisfies server-side data portability.
- **CCPA (California users):** Users have the right to know what data is collected and to delete it. The export feature and reset function satisfy these requirements.
- **COPPA (Children under 13):** The app collects a usage category at first launch. Users identified as under 13 should not have their data shared or exposed to community features without verified parental consent.

---

*Last updated: June 2026 | See also: `docs/BACKUP_SYSTEM.md`, `docs/DATA_IMPORT_GUIDE.md`, `docs/SECURITY_AND_PRIVACY.md`*
