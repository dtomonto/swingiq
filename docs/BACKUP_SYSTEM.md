# SwingIQ Backup & Data Portability System

**Schema Version:** 1.2.0  
**App Version:** 1.1.0  
**Last Updated:** May 2026

---

## 📘 In Plain English (start here)

**What this page is:** The under-the-hood blueprint for the **Download Backup / Restore Backup** feature in the app.

**What you actually need to know:**
- You never have to operate any of the machinery on this page. As a user, you just click **Download Backup** and **Restore** in the app. The simple, step-by-step instructions for that are in [WEB_APP_GUIDE.md](WEB_APP_GUIDE.md) (section 21) and [DATA_IMPORT_GUIDE.md](DATA_IMPORT_GUIDE.md).
- The three promises this system keeps: a backup file holds **all** of your data, you can **password-protect** it, and an **old backup still works** even after the app is updated.
- It's safe to back up often. Save the file somewhere safe (cloud drive, email to yourself). If you ever switch phones or browsers, restoring that file brings everything back.

**What to do next:** To actually back up your data right now, follow the steps in [WEB_APP_GUIDE.md](WEB_APP_GUIDE.md). You can ignore the rest of this page.

> Everything below this point is technical reference for a developer or an AI assistant adding new features to the backup system. You don't need to read it to back up or restore your data.

---

## Overview

SwingIQ stores all user data in the browser's `localStorage` via Zustand. Because there is no cloud sync yet (Supabase is schema-ready but not activated), data portability depends entirely on the backup/restore system.

The backup system lets users:
- Download a complete `.json` backup of all their data
- Optionally encrypt the backup with a password
- Upload and restore a previous backup (with merge or replace)
- Receive a plain-language preview before any data changes

---

## Architecture

```
apps/web/src/lib/backup/
├── schema.ts       — TypeScript types for the backup format
├── registry.ts     — Centralized feature registry (see below)
├── export.ts       — exportUserData(), downloadBackup()
├── validate.ts     — validateBackupFile(), parseBackupFile() with security guards
├── migrate.ts      — Schema migration chain (v1.0 → v1.1 → v1.2)
├── restore.ts      — previewRestore(), mergeRestore(), replaceRestore()
└── crypto.ts       — Optional AES-256-GCM password encryption
```

---

## Backup Schema (v1.2.0)

```typescript
interface SwingIQBackup {
  backupFormat:   'swingiq-backup-v1'
  backupVersion:  string          // semver e.g. '1.2.0'
  appVersion:     string
  schemaVersion:  string
  createdAt:      string          // ISO 8601
  exportedAt:     string
  sourceInfo:     { userAgent, platform }
  dataScope:      'full'
  encrypted:      false           // or absent in encrypted files
  preferredLanguage?: LanguageCode

  data: {
    profile:          GolferProfileInput | null
    sportProfiles:    SportProfiles       // tennis, baseball, softball_slow/fast
    clubs:            LocalClub[]
    sessions:         LocalSession[]
    videoAnalyses:    LocalVideoAnalysis[]
    training:         TrainingProgress
    settings:         AppSettings
    community?:       CommunityState      // badges, XP, challenges, privacy
    tutorialProgress?: TutorialProgress   // completed/dismissed guide IDs
    preferredLanguage?: LanguageCode
  }

  metadata: {
    recordCounts: {
      sessions, clubs, videoAnalyses,
      milestones, drillsCompleted,
      achievementsEarned?, challengesCompleted?,
      xpTotal?, tutorialsCompleted?
    }
    sportsIncluded:   SportId[]
    dateRange:        { earliest, latest }
    warnings:         string[]
  }
}
```

---

## Backup Data Registry

Every feature that stores user data **must** register in `registry.ts`:

```typescript
// apps/web/src/lib/backup/registry.ts
registerBackupModule({
  id:           'my_feature',
  label:        'My Feature',
  description:  'One sentence for users explaining what this stores.',
  sensitive:    false,         // set true if it contains personal data
  exportable:   true,
  getCount:     (state) => state.myFeature.items.length,
  getSummaryLine: (state) => `${state.myFeature.items.length} items`,
  getBackupCount: (backup) => backup.data.myFeature?.items?.length ?? 0,
});
```

The `getExportableModules()` function returns all registered modules. The Data Center UI uses this to dynamically generate the "Your backup includes…" list.

**Current registered modules:**

| ID                 | Label                 | Sensitive |
|--------------------|-----------------------|-----------|
| `golf_profile`     | Golf Profile          | Yes       |
| `sport_profiles`   | Sport Profiles        | Yes       |
| `sessions`         | Practice Sessions     | No        |
| `clubs`            | Equipment             | No        |
| `video_analyses`   | Video Analyses        | No        |
| `training`         | Training Progress     | No        |
| `community`        | Badges, XP & Community| Yes       |
| `tutorial_progress`| Tutorial Progress     | No        |
| `settings`         | App Settings          | No        |

---

## Migration Chain

Old backup files are automatically upgraded before import. The migration chain is in `migrate.ts`:

```
v1.0.0  →  v1.1.0  →  v1.2.0 (current)
```

**Adding a new migration:**

1. Define a function `migrateVX_to_VY(backup: SwingIQBackup): SwingIQBackup`
2. Add an entry to `MIGRATION_CHAIN` in `migrate.ts`
3. Update `CURRENT_BACKUP_VERSION` in `schema.ts`
4. Update `SUPPORTED_VERSIONS` in `migrate.ts`
5. Add a test in `backup/__tests__/backup.test.ts`

Migrations must:
- Return a new object (never mutate)
- Add sensible defaults for new required fields
- Only remove deprecated fields when it is safe to do so

---

## Security Model

| Threat                        | Mitigation                                           |
|-------------------------------|------------------------------------------------------|
| Prototype pollution           | `containsDangerousKeys()` checks `__proto__` etc.   |
| JSON bomb / oversized objects | `estimateObjectComplexity()` caps at 500k nodes     |
| File size abuse               | Hard cap at 50 MB                                    |
| Wrong file type               | Extension check: `.json` / `.swingiqbackup` only    |
| Code execution                | No `eval()`, no dynamic script loading               |
| HTML injection                | Notes/text fields are never rendered as HTML         |
| Analytics leakage             | Backup contents never sent to analytics endpoints   |
| Third-party leakage           | All parsing is client-side; no server involved      |

---

## Restore Modes

### Merge
- Adds new records from the backup without deleting current data
- Deduplicates by ID and by a composite key (sport + date + launch monitor)
- For community: takes the higher XP, combines unique badge IDs
- For training: combines milestones (dedup), takes higher streak
- For tutorial: combines completed + dismissed arrays
- Current settings are preserved

### Replace
- Clears all current data and restores from backup
- Settings are **preserved** even in replace mode (language, units, etc.)
- Community data, tutorial progress, and training are fully replaced

---

## Tutorial System

The tutorial system lives in `apps/web/src/lib/tutorial/`.

### Content Registry

All tutorial content is in `content.ts` as a `Record<string, TutorialContent>` keyed by route path.

```typescript
// apps/web/src/lib/tutorial/content.ts
TUTORIAL_REGISTRY['/my-new-page'] = {
  id: '/my-new-page',
  pageTitle: 'My New Page',
  intro: 'What this page does in one or two plain sentences.',
  steps: [
    { title: 'Step Title', body: 'Step explanation for users.' },
  ],
};
```

The `getTutorialForRoute(pathname)` function finds the best match, falling back to parent routes and then the homepage.

### Progress Tracking

Tutorial progress (`completed`, `dismissed`, `lastViewedAt`) is stored in the Zustand store under `tutorialProgress`. It is included in every backup and restored on import.

Users can reset all tutorial progress from **Settings → Data Management → In-App Guides → Reset Guides**.

### Components

| Component              | Purpose                                                |
|------------------------|--------------------------------------------------------|
| `ContextualHelpButton` | The "?" button — `compact`, `inline`, or `floating`    |
| `TutorialDrawer`       | Step-by-step slide panel (slides up on mobile, side panel on desktop) |

Both components are keyboard accessible:
- `Escape` closes the drawer
- `←` / `→` arrows navigate between steps

### Adding a Help Button to a New Page

```tsx
import { ContextualHelpButton } from '@/components/tutorial/ContextualHelpButton';

// Inline variant (in page header):
<ContextualHelpButton variant="inline" />

// The AppShell already provides a compact variant in the top bar
// (mobile) and sidebar (desktop) — individual pages don't need to add it.
```

---

## Localization

All tutorial and backup UI text is localization-ready:

- Tutorial content in `content.ts` is in English and is designed to be extracted into translation files
- i18n keys for backup/data UI are in `translations/en.ts` under the `data:` namespace
- Tutorial UI strings are under the `tutorial:` namespace
- Non-English languages use `PartialTranslations` (deep partial) and fall back to English for any missing key
- Adding a new language: create `translations/[langCode].ts` implementing `PartialTranslations`
- RTL languages (Arabic, Urdu) are auto-detected via `RTL_LANGUAGES` set in `types.ts`

---

## Testing

Tests live at:
- `apps/web/src/lib/backup/__tests__/backup.test.ts` — 25 tests covering export, merge, replace, preview, community restore, tutorial restore
- `apps/web/src/lib/tutorial/__tests__/tutorial.test.ts` — 8 tests covering registry completeness and route lookup
- `apps/web/src/lib/community/__tests__/community.test.ts` — 25 tests covering achievements, backup health, XP

Run with:
```bash
npx jest --no-coverage        # from apps/web/
npm run type-check            # from root
npx turbo run build --filter=@swingiq/web
```

---

## How to Add a New Feature to the Backup

1. **Define your data** in the Zustand store (`store/index.ts`)
2. **Add to `SwingIQBackupData`** in `backup/schema.ts`
3. **Register a module** in `backup/registry.ts` using `registerBackupModule()`
4. **Update `exportUserData()`** in `backup/export.ts` to include your field
5. **Update `mergeRestore()` and `replaceRestore()`** in `backup/restore.ts`
6. **Update `previewRestore()`** to show your data category in the preview
7. **Add a migration** in `migrate.ts` if the new field is required
8. **Write tests** covering export, merge, replace, and preview
9. **Add tutorial content** in `tutorial/content.ts` if your feature has a new screen

---

## Known Limitations

- Video files are NOT included in backups — only analysis results and metadata
- There is no server-side sync yet; data persists in `localStorage` only
- Backup encryption uses `window.crypto.subtle` (Web Crypto API) — not available in some older browsers
- The backup file can exceed the download limit on older iOS browsers if the session count is very large (>5,000 sessions)
- Selective category restore (import only sessions, import only equipment, etc.) is architecturally ready but the UI is not yet implemented
