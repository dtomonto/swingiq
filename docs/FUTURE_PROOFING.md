# Future-Proofing Guide

This document explains how SwingIQ is built to stay relevant, adaptable, and trustworthy over the long term. It covers the architectural choices, design patterns, and planned evolution paths that make the platform durable.

**This is a strategic document** — it's useful for understanding where the platform is heading and why it's built the way it is.

---

## The "100-Year" Vision

"Future-proof" doesn't mean literally planning for 100 years. It means:

1. **New sports can be added without rebuilding anything** — the architecture is open to expansion
2. **AI providers can be swapped** — no lock-in to OpenAI, Anthropic, or any single model
3. **User data is never trapped** — export works today, import works tomorrow, on any device
4. **Old data files still import correctly** — a backup from 2024 will still work in 2034
5. **The codebase can be understood and maintained** — by the owner, by a new developer, or by an AI assistant

---

## Pillar 1: Multi-Sport Architecture

### Current State
SwingIQ supports five sports: Golf, Tennis, Baseball, Slow Pitch Softball, Fast Pitch Softball.

Each sport has its own:
- Phase definitions (the stages of the swing)
- Benchmarks (what "good" looks like at each skill level)
- Analysis engine (the rules that detect issues)
- Equipment types (clubs, rackets, bats with appropriate fields)
- UI labels and terminology (e.g., "hat path" for baseball, "face-to-path" for golf)
- Camera angle guidance (which angle reveals which issues)

### How It's Structured
All sport configurations are registered in one file:
```
packages/core/src/sports/sport-registry.ts
```

Adding a new sport requires:
1. Create a folder: `packages/core/src/sports/[sport-name]/`
2. Add files: `phases.ts`, `benchmarks.ts`, `analysis.ts`
3. Register it in `sport-registry.ts`
4. Add the sport ID to `SportId` in `types.ts`

### Future Sports
The architecture can accommodate: pickleball, racquetball, lacrosse, cricket, and any other striking/swinging sport. A new sport can be production-ready in 1–2 weeks of development.

---

## Pillar 2: AI Provider Independence

### The Problem
If SwingIQ was tightly coupled to OpenAI GPT-4, then:
- A price increase would force an emergency refactor
- GPT-5 requiring different prompting would break the coach
- Switching to Anthropic Claude (more privacy-friendly) would be a major project

### How It's Solved
The AI system has two completely separate layers:

**Layer 1 — Prompt Building** (`apps/web/src/lib/ai-coach-prompts.ts`)
- Builds the structured context block (what data to send to the AI)
- Defines the rules the AI must follow (sport-appropriate, no hallucination, etc.)
- Has NO knowledge of which AI provider will receive the prompt

**Layer 2 — API Calls** (`apps/web/src/app/api/ai-coach/route.ts`)
- Receives the prompt from Layer 1
- Looks at the `AI_PROVIDER` environment variable
- Routes to OpenAI, Anthropic, or future providers
- The rest of the app doesn't care which provider is used

**To switch AI providers:** Change one environment variable. No code changes required.

### Structured AI Output (Trust Layer)
The AI coach is constrained to produce structured, verifiable responses:
- It must reference only data explicitly provided to it
- It must separate "what the data shows" from "why it might be happening"
- It must end every response with a specific next action
- It must use plain language and explain any jargon

This structured approach means coaching quality is consistent regardless of which AI model is used.

### Future AI Capabilities to Prepare For
- **AI memory:** Store the last 3 session summaries per user; include in every prompt
- **Longitudinal tracking:** AI detects whether an issue improved or regressed since last session
- **Parent/coach summaries:** Generate a different-length summary for different audiences
- **Simplest fix mode:** "Just tell me the one most important thing to fix"
- **Pro comparison mode:** "Show me how my stats compare to tour average"

---

## Pillar 3: Data Ownership and Portability

### Core Guarantee
Users can always get all their data out. This is not just an ethical choice — it's also a competitive advantage, because users trust apps that let them leave.

### Versioned Schema
Every backup file has a schema version number. When the app evolves and adds new fields, a migration layer automatically upgrades old backups to the current format.

```
v1.0.0 → v1.1.0 → v1.2.0 (current)
```

**Rule:** Old backup files must always import successfully. New fields that older files don't have are given safe default values during migration.

### What This Enables
- **Device switching:** Export on iPhone, import on Android (or vice versa)
- **Account migration:** When Supabase auth is added, existing localStorage data can be migrated to the server
- **Disaster recovery:** Browser clears or reinstalls don't mean lost data
- **Privacy compliance:** Users have a right to their data under GDPR and CCPA

### Future Data Features
- **CSV export:** Tabular export of sessions and shots for Excel/Sheets analysis
- **Supabase sync:** When connected, the backup system syncs automatically
- **Encrypted backups:** Optional password-protected export for sensitive data
- **Coach-approved sharing:** Send a specific session to a coach without sharing everything

---

## Pillar 4: Backward-Compatible Schema Design

### The Problem
As SwingIQ adds features (community, AI coaching, gamification), the database schema and localStorage schema evolve. If old data breaks with new code, users lose their history.

### How It's Solved
**Optional fields:** New fields are always `optional` (marked with `?`) in TypeScript. This means old data without the field doesn't crash the app.

**Default values:** When reading state, missing optional fields get safe defaults:
```typescript
const badges = user.community?.badges ?? [];
const xp = user.community?.xp ?? 0;
```

**Migration layer:** The backup migration system handles structural changes between schema versions.

**Example:** When community features were added in v1.1.0, old backup files didn't have the `community` field. The migration added:
```json
"community": { "badges": [], "xp": 0, "challenges": [], "streaks": {} }
```

### Supabase Migrations
When the database schema needs to change (adding columns, tables):
1. Write a Supabase migration SQL file
2. Test it on a staging environment
3. Apply it — Supabase handles the actual database change
4. Never drop columns that old code might read (mark them deprecated first)

---

## Pillar 5: SEO/GEO/AEO Durability

### Why This Is Future-Proofing
The way people find products is changing:
- **Traditional search** (Google) is still dominant but evolving
- **AI-generated answers** (ChatGPT, Google AI Overview, Perplexity) are growing rapidly
- **Voice search** (Siri, Google Assistant) requires natural language question-answer format

SwingIQ is built to be discovered by all three.

### Content Architecture
Educational content (FAQ, glossary, benchmarks, blog) serves multiple purposes:
1. **SEO:** Brings in organic search traffic
2. **GEO:** Gives AI systems accurate information to cite about SwingIQ
3. **AEO:** Answers specific questions in a format that voice/AI can extract
4. **User trust:** Users who find quality educational content trust the product more

### Long-Term Content Investment
The FAQ and glossary pages are permanent assets that compound in value over time. A well-written FAQ answer about "what is club path" will receive traffic for years, not weeks.

---

## Pillar 6: Trust and Safety Architecture

### Youth Protection
The usage category system (adult/parent/coach/minor) is the foundation for youth safety:
- It identifies which users might be under 18
- Future: age-appropriate feature restrictions
- Future: verified parental consent flow for under-13 accounts
- Future: parent dashboard showing child's AI coaching history

### Medical and AI Disclaimers
SwingIQ proactively shows disclaimers that set correct expectations:
- AI coaching is not a substitute for professional instruction
- SwingIQ is not a medical device
- Data analysis is based on patterns, not real-time video by a human

These disclaimers protect the user (by setting honest expectations) and the company (by defining the product's scope).

### Community Safety Foundation
The community and gamification system was built with moderation readiness from day one:
- Users can report content (architecture is ready; UI to be completed)
- Admin moderation tools exist at `/admin`
- Privacy controls (public/private profiles) are in the data model
- Abuse prevention is in the rate limiter

---

## Pillar 7: Accessibility and Multi-Language

### Why These Are Future-Proofing
Accessibility is increasingly a legal requirement (ADA, WCAG 2.1 AA) and a competitive advantage — accessible apps have a larger addressable market.

Multi-language support opens international markets that monolingual competitors cannot reach.

### What's Already Done
- Skip-to-content link for keyboard/screen reader users
- ARIA labels on all navigation and interactive elements
- Semantic HTML (proper `<nav>`, `<main>`, `<header>`, `<button>` vs. `<div>`)
- Mobile-responsive design tested at 375px width
- 20-language translation architecture (English + 19 others)
- RTL layout support for Arabic and Urdu

### What Needs To Be Done
- Professional translation review (current non-English translations are framework-only)
- Captions/transcripts readiness for any video content
- Color contrast audit across all pages
- Large text mode (OS accessibility settings passthrough)

---

## Technology Evolution Readiness

### If Next.js Changes Significantly
- The core diagnostic engine (`packages/core`) is framework-independent TypeScript
- The state management (Zustand) is not tied to Next.js
- Migrating to a different framework would require rewriting pages but not logic

### If Supabase Changes Pricing
- The database is standard PostgreSQL — it can be exported and self-hosted
- The Supabase client is isolated in two files (`supabase.ts`, `supabase-server.ts`)

### If TypeScript Evolves
- The codebase uses conservative TypeScript features (no experimental flags)
- Types are designed to be readable and maintainable

### If React Changes
- Components use standard React patterns (hooks, context, functional components)
- No reliance on deprecated patterns or experimental features

---

## Deferred Work (Documented, Not Forgotten)

These items are future-proofing priorities that are not yet implemented:

| Item | Priority | Notes |
|------|----------|-------|
| Supabase auth integration | High | Schema ready; client ready; needs wiring |
| Encrypted backup option | Medium | `crypto.ts` skeleton exists |
| CSV export | Medium | JSON export is complete; CSV is additive |
| AI coach memory | Medium | Prompt structure is ready; needs session storage |
| Longitudinal AI tracking | Medium | Detects regression between sessions |
| Verified parental consent | High (legal) | Required before accepting under-13 users |
| Real pose estimation | Long-term | True computer vision on uploaded video |
| White-label config | Long-term | Extract theme/logo into per-tenant config |
| Supabase database migrations | Medium | Needed before schema changes after launch |
| Schema.org structured data | Medium | FAQ page is highest priority |
| CSP headers in vercel.json | High | Security hardening |
| Sentry error monitoring | High | Observability for production issues |

---

## Principles for Future Developers

If you're joining this project and wondering "what should I do or not do?", here are the guiding rules:

1. **Don't scatter sport logic.** Add new sport-specific behavior in the sport config registry, not in individual components.

2. **Don't break old backup files.** Add optional fields, write migration code, never remove fields that users' existing backups might contain.

3. **Don't hardcode AI provider calls.** Use the prompt builder + route layer pattern. Never call OpenAI or Anthropic directly from a component.

4. **Don't trust client-provided user IDs.** Always derive user identity from the server-side Supabase session.

5. **Don't skip the schema migration.** If you change the backup schema, write the migration. An old backup file should always import cleanly.

6. **Don't add heavy dependencies without discussion.** The bundle size affects load time, especially on mobile. Check if a lighter alternative exists.

7. **Do write honest foundations.** If a feature is a placeholder, say so with a clear comment. Don't make scaffolding look like a finished feature.

---

*Last updated: May 2026 | See also: `docs/ARCHITECTURE_DECISIONS.md`, `docs/DATA_PORTABILITY.md`, `docs/SECURITY_AND_PRIVACY.md`, `docs/LAUNCH_READINESS_CHECKLIST.md`*
