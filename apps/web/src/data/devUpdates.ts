// ── Developer / Engineering Updates ───────────────────────────────────────
//
// This is the *technical* companion to the plain-English product changelog at
// /updates. It exists to show off the engineering milestones behind SwingVantage —
// the architecture decisions, the AI work, and the platform foundations — in
// language written for builders, not end users.
//
// Keep entries honest and concrete. Describe what was actually built and why it
// was hard or interesting. No invented metrics.

export type DevUpdateCategory =
  | 'AI & Vision'
  | 'Motion Intelligence'
  | 'Architecture'
  | 'Platform'
  | 'Performance'
  | 'Design System'
  | 'Security & Privacy'
  | 'Developer Experience';

export type DevUpdateImpact = 'major' | 'notable' | 'foundational';

/**
 * Publication state. Hand-written seed entries omit this and are treated as
 * published (they're already live). Auto-generated entries from commit trailers
 * land as 'draft' and stay hidden from the public page until flipped to
 * 'published' — by hand here or from /admin/updates. See isPublicDevUpdate().
 */
export type DevUpdateStatus = 'draft' | 'published';

export interface DevUpdate {
  id: string;
  /** Draft entries are hidden from the public /dev-updates page. Default: published. */
  status?: DevUpdateStatus;
  /** Optional human tag, e.g. "v1.2" or "Motion Lab". */
  version?: string;
  title: string;
  /** ISO date used for sorting. */
  date: string;
  /** Human-friendly date shown in the UI. */
  displayDate: string;
  category: DevUpdateCategory;
  impact: DevUpdateImpact;
  /** The one-line "show off" headline. */
  headline: string;
  /** A short technical paragraph: what was built and why it mattered. */
  details: string;
  /** Concrete engineering wins worth bragging about. */
  highlights?: string[];
  /** Tech / stack tags. */
  stack?: string[];
  /** How the change was validated — unit/integration tests, build, type, SEO,
   *  a11y checks. Rendered as the Testing / Validation section on the detail page. */
  testing?: string[];
  /** Practical rollback / risk note, rendered on the detail page when present.
   *  Keep it safe: no secrets, infra detail, or exploit paths. */
  rollback?: string;
  /** Surface in the milestone timeline at the top of the page. */
  isMilestone?: boolean;
}

// ── Headline platform facts (the "by the numbers" band) ───────────────────

export interface DevStat {
  label: string;
  value: string;
  detail: string;
}

export const DEV_STATS: DevStat[] = [
  {
    value: '7',
    label: 'Sports, real engines',
    detail: 'Golf, tennis, pickleball, padel, baseball, slow- and fast-pitch softball — each with its own diagnostic rules, not shared labels.',
  },
  {
    value: '3D',
    label: 'Motion analysis in the browser',
    detail: 'Depth-aware pose estimation runs client-side. No app install, no upload of your video to a server.',
  },
  {
    value: '7',
    label: 'Themes, one token engine',
    detail: 'A data-theme palette system retokenizes the entire app — coaching logic and data never change.',
  },
  {
    value: '0',
    label: 'Required accounts',
    detail: 'Local-first by design. You can analyze a swing in seconds with your data kept on your own device.',
  },
];

// ── The log ───────────────────────────────────────────────────────────────
// Newest first by date; the timeline re-sorts milestones oldest → newest.

export const DEV_UPDATES: DevUpdate[] = [
  {
    id: 'dev-seven-sports',
    version: 'Sports',
    title: 'Seven sports from one taxonomy — pickleball and padel as first-class engines',
    date: '2026-06-06',
    displayDate: 'June 2026',
    category: 'Architecture',
    impact: 'major',
    headline: 'Pickleball and padel were added as genuine diagnostic engines, not relabeled tennis — driven by a single canonical sport taxonomy.',
    details:
      'A single ordered SPORT_TAXONOMY in @swingiq/core (golf → tennis → pickleball → padel → baseball → slow- → fast-pitch softball) is now the one source of truth that the marketing surface, filters, sport selector, and internal-linking strategy all read from. Pickleball and padel each got their own analysis rules, phase definitions, benchmarks, and drill libraries — modeling compact paddle mechanics, dinks, third-shot drops and kitchen play for pickleball, and wall play, the bandeja/vibora, and doubles positioning for padel. The fault union was extended with pb_* and pd_* issue ids. Padel deliberately has no single numeric rating, so none was invented.',
    highlights: [
      'One canonical SPORT_TAXONOMY drives every sport-aware surface',
      'Per-sport analysis, phases, benchmarks, and drills for pickleball + padel',
      'Typed pb_*/pd_* fault ids; padel rating intentionally omitted',
      'Live Athletic Journeys for all four racket/club sports',
    ],
    stack: ['TypeScript', 'Monorepo', 'Rules engine'],
    testing: [
      'Unit tests for the new pb_*/pd_* fault ids and per-sport rules',
      'Type-check across the monorepo (one canonical SPORT_TAXONOMY)',
      'Production build + sport-selector and filter smoke checks',
    ],
    rollback: 'Additive and config-driven — sports are gated by the taxonomy, so a sport can be disabled without touching the shared engine.',
    isMilestone: true,
  },
  {
    id: 'dev-relational-accounts',
    version: 'Accounts',
    title: 'The account becomes the source of truth — relational sync, real auth, white-label email',
    date: '2026-06-06',
    displayDate: 'June 2026',
    category: 'Architecture',
    impact: 'major',
    headline: 'A relational Supabase schema plus a sync engine that mirrors the whole local-first store to the cloud — without giving up local-first.',
    details:
      'Local-first stayed the default, but signed-in accounts now cloud-sync the entire main store through a relational Supabase schema (14 tables) and a dedicated sync engine in lib/db — projection, a three-way merge for conflict resolution, and a relational sync provider. Real Supabase auth is wired (keys in env, RLS applied), so middleware enforces login on protected routes only in real-accounts mode. Auth email is fully white-labeled: every message sends from the product domain via Resend SMTP with branded templates and on-domain /auth/confirm and /reset-password — no third-party branding visible to users.',
    highlights: [
      'Relational schema (14 tables) + projection and three-way merge in lib/db',
      'Local-first preserved; cloud sync layers on for signed-in accounts',
      'Real Supabase auth with RLS; middleware fail-closed on protected routes',
      'White-label auth email via Resend SMTP, on-domain confirm/reset flows',
    ],
    stack: ['TypeScript', 'Supabase', 'Postgres', 'Resend SMTP'],
    isMilestone: true,
  },
  {
    id: 'dev-bodysync',
    version: 'BodySync',
    title: 'BodySync — a consent-gated health-performance layer with a connector seam',
    date: '2026-06-06',
    displayDate: 'June 2026',
    category: 'Security & Privacy',
    impact: 'notable',
    headline: 'Readiness scoring and health-aware coaching built privacy-first: opt-in, age-gated to 18+, and never claiming to be medical.',
    details:
      'BodySync (lib/bodysync) turns a manual wellness check-in into a readiness score, a fatigue-risk read, and practice-plan adjustments, all behind an explicit consent gate and a hard 18+ age gate tied to the account usage category. It is self-contained and account-synced via a document mirror, with a connector framework that abstracts optional sources (e.g. an Apple Health import) behind one interface. Every surface carries a non-medical disclaimer, and the data is fully user-owned — exportable and deletable.',
    highlights: [
      'Deterministic readiness + fatigue scoring from manual check-ins',
      'Explicit consent gate and 18+ age gate enforced before any data is taken',
      'Connector seam for optional imports (Apple Health) behind one interface',
      'Non-medical by design; data exportable and deletable',
    ],
    stack: ['TypeScript', 'React', 'localStorage', 'Provider seam'],
    isMilestone: false,
  },
  {
    id: 'dev-athletic-journey',
    version: 'Journey',
    title: 'Athletic Journey — a config-driven, multi-signal stage classifier',
    date: '2026-06-06',
    displayDate: 'June 2026',
    category: 'Platform',
    impact: 'notable',
    headline: 'A blended classifier that places an athlete on a development pathway from many signals — and refuses to fake a score for sports it does not model yet.',
    details:
      'The Athletic Journey (local-first lib/athletic-journey) blends profile, optional ratings (handicap/UTR/NTRP/DUPR), video reads, logged play, and practice into a stage on a sport-specific ladder (e.g. G0–G10 for golf, T0–T10 for tennis), with momentum and prescriptions, and an optional structured AI narrative. Sport availability is config-driven from one source of truth: golf, tennis, pickleball, and padel are live; baseball and softball render an honest in-development card with a waitlist and never produce stage scoring.',
    highlights: [
      'Multi-signal classifier with evidence for and against each stage',
      'Config-driven sport availability (one source of truth)',
      'In-development sports represented honestly — no faked scoring',
      'Structured AI narrative stays grounded and provider-optional',
    ],
    stack: ['TypeScript', 'Config-as-code', 'Provider seam'],
    isMilestone: false,
  },
  {
    id: 'dev-recruiting-hub',
    version: 'Recruiting',
    title: 'Recruiting Hub — provenance-labeled profiles with a public coach view',
    date: '2026-06-06',
    displayDate: 'June 2026',
    category: 'Platform',
    impact: 'notable',
    headline: 'A recruiting profile where every claim carries its source, and a shareable coach view the athlete fully controls.',
    details:
      'The Recruiting Hub (local-first lib/recruiting) builds a profile in which every stat is tagged verified vs. self-reported, with a profile-strength meter, a film library and highlight builder, a downloadable recruiting packet, coach outreach, and analytics. A public /player/[slug] coach view exposes only what the athlete chooses to share. Honest-first guardrails keep the AI describing evidence rather than projecting a ceiling. A cloud schema exists but is optional and currently unapplied — the hub works fully local-first.',
    highlights: [
      'Source-labeled stats (verified vs. self-reported) end to end',
      'Film library, highlight builder, packet generator, outreach, analytics',
      'Public coach-view page gated by per-coach visibility controls',
      'Honest-first AI guardrails; local-first with an optional cloud schema',
    ],
    stack: ['TypeScript', 'React', 'Next.js dynamic routes'],
    isMilestone: false,
  },
  {
    id: 'dev-security-hardening',
    title: 'Security hardening — constant-time secrets, fail-closed middleware, distributed rate limiting',
    date: '2026-06-05',
    displayDate: 'June 2026',
    category: 'Security & Privacy',
    impact: 'notable',
    headline: 'A full audit followed by shipped Tier-1 fixes that close the highest-leverage gaps first.',
    details:
      'A security audit drove a set of concrete fixes: constant-time comparison for secret/token checks (removing timing side-channels), middleware that fails closed (deny by default) on protected routes, and a distributed rate limiter backed by Upstash so limits hold across serverless instances instead of per-process. Deeper items (row-level security everywhere, CSP nonces, admin RBAC) were deliberately deferred and tracked rather than half-built.',
    highlights: [
      'Constant-time secret/token comparison',
      'Fail-closed middleware on protected routes',
      'Distributed Upstash rate limiting across instances',
      'Remaining items deferred on purpose, not silently dropped',
    ],
    stack: ['TypeScript', 'Next.js middleware', 'Upstash Redis'],
    testing: [
      'Unit tests for constant-time comparison and fail-closed middleware paths',
      'Rate-limiter verified against the shared store across instances',
      'Dependency + secret-scan security checks in CI',
    ],
    rollback: 'The rate limiter degrades safely if its store is unreachable; middleware stays fail-closed, so a rollback never opens a protected route.',
    isMilestone: false,
  },
  {
    id: 'dev-growth-os',
    version: 'GrowthOS',
    title: 'GrowthOS — a config-driven marketing OS, deterministic growth agents, and Link Intelligence',
    date: '2026-06-06',
    displayDate: 'June 2026',
    category: 'Platform',
    impact: 'notable',
    headline: 'An admin-only growth platform whose engine is config-driven, whose agents are deterministic, and whose AI is draft-first.',
    details:
      'GrowthOS is an in-app omnichannel marketing system (admin-guarded, noindex) with a config-driven engine and Supabase persistence with full CRUD. Underneath sit deterministic growth agents (churn, dispatch, activation, referral, practice-companion, trust-linter, ad-creative) coordinated behind one interface, reconciled with the re-engagement layer through a churn-aware bridge so retention logic is not duplicated. Link Intelligence adds a GrowthOS-native agent engine with its own UI, APIs, and a cron trigger. AI output is draft-first throughout — nothing publishes itself.',
    highlights: [
      'Config-driven engine + Supabase persistence with full CRUD',
      'Deterministic growth agents behind a single coordinator',
      'Churn-aware bridge avoids duplicating the re-engagement layer',
      'Link Intelligence agent (engine + UI + APIs + cron), draft-first AI',
    ],
    stack: ['TypeScript', 'Next.js', 'Supabase', 'Cron'],
    isMilestone: false,
  },
  {
    id: 'dev-i18n-self-maintaining',
    title: 'Self-maintaining multilingual SEO — localized routes with a drift honesty gate',
    date: '2026-06-06',
    displayDate: 'June 2026',
    category: 'Developer Experience',
    impact: 'notable',
    headline: 'Localized marketing routes that keep themselves honest: shared dictionaries, hreflang/sitemap automation, and a gate that refuses to ship stale translations.',
    details:
      'Marketing SEO localization (Spanish wave 1) ships /es localized routes with correct hreflang alternates and sitemap entries. App and CLI read the same JSON dictionaries, so there is one source of truth for copy. An upkeep job runs weekly as a local-commit-only task, and a drift "honesty gate" blocks publishing a localized page whose source content has changed out from under its translation. AI-assisted translation is keyless-first and off by default, so the system is fully functional with no API keys.',
    highlights: [
      'Shared JSON dictionaries read by both app and CLI',
      'Automated hreflang + sitemap for localized routes',
      'Drift honesty gate prevents stale translations going live',
      'Keyless-first: AI translation optional and off by default',
    ],
    stack: ['TypeScript', 'Next.js i18n', 'Docs-as-code'],
    isMilestone: false,
  },
  {
    id: 'dev-rebrand-swingvantage',
    version: 'Brand',
    title: 'Full identity migration: SwingIQ → SwingVantage',
    date: '2026-06-04',
    displayDate: 'June 2026',
    category: 'Platform',
    impact: 'notable',
    headline: 'A whole-codebase rename to SwingVantage that touched 650+ files without wiping a single byte of anyone’s saved data.',
    details:
      'The product was renamed from SwingIQ to SwingVantage (swingvantage.com) as a real identity migration, not a blind find-and-replace. A cased sweep moved every visible “SwingIQ” to “SwingVantage” across UI copy, page metadata, OpenGraph/Twitter cards, the PWA manifest, all i18n locales, JSON-LD, docs, and TypeScript identifiers — while a deliberately protected set of lowercase, data-contract identifiers was left untouched: the localStorage persistence key, the @swingiq/* workspace scope, and the backup format (swingiq-backup-v1, the .swingiqbackup extension, and the encryption marker). That boundary is exactly what lets existing users keep every saved swing, session, and setting straight through the rename. The domain and role-based contact emails moved to swingvantage.com, the SQ monogram became SV across the app and the code-generated app icons / OG image, and the homepage now leads with the brand promise.',
    highlights: [
      'Cased sweep: 2,174 lines across 655 files, zero “SwingIQ” left',
      'Protected data-contract identifiers so no local user data was lost',
      'Regenerated the SV app icons + OG share image from code (no design files)',
      'Verified end-to-end: type-check, 410 tests, production build, live homepage',
    ],
    stack: ['TypeScript', 'Next.js', 'Codemod', 'sharp'],
    isMilestone: false,
  },
  {
    id: 'dev-monetization-free-ads-tiers',
    version: 'Strategy',
    title: 'Monetization re-sequenced: free → ads → membership tiers',
    date: '2026-06-04',
    displayDate: 'June 2026',
    category: 'Platform',
    impact: 'foundational',
    headline: 'One canonical monetization order across the whole codebase: grow the free base, monetize via ads for first revenue, then roll out paid tiers.',
    details:
      'The project was implicitly subscription-first (the checklist, roadmap, and live Pro/Team tiers all treated paid plans as the next step). We made the order explicit and fixed: Phase 1 grow free users → Phase 2 ads (first revenue from the free audience) → Phase 3 membership tiers, each advancing only when the gate ahead is met. A new north-star doc (docs/MONETIZATION_STRATEGY.md) governs the subordinate docs. In code, ads get a keyless-first capability seam (isAdsConfigured + the /api/capabilities summary) that renders zero ads until an ad-network id is set — mirroring how Stripe stays dormant until keys exist — and the pricing CTA now reads "Coming Soon" (with an optional email notify) instead of a waitlist, since subscriptions are Phase 3.',
    highlights: [
      'docs/MONETIZATION_STRATEGY.md as the single source of truth (3 phases + the gate between each)',
      'Ads wired keyless-first/off by default; non-personalized/contextual for youth-safety',
      'Stripe/Pro/Team rails kept pre-built but explicitly deferred to Phase 3',
      'Pricing page tiers now show "Coming Soon"',
    ],
    stack: ['TypeScript', 'Next.js', 'Capability seam', 'Docs-as-code'],
    isMilestone: false,
  },
  {
    id: 'dev-implement-kinetic-temporal',
    version: 'Motion Lab',
    title: 'Implement path, kinetic chain, and temporal intelligence',
    date: '2026-06-04',
    displayDate: 'June 2026',
    category: 'Motion Intelligence',
    impact: 'major',
    headline: 'The motion engine now reads the implement path, the firing order of the kinetic chain, and how the swing unfolds over time.',
    details:
      'Three new analysis layers sit on top of the existing pose pipeline. Object tracking estimates the club/bat/racket head path by extrapolating along the grip forearm — no pixel detector, so it is honestly labeled ai_inferred with capped confidence and a provider seam for a future ML detector. The kinetic-chain engine times when each link (lower body → torso → arms → implement) peaks and flags power leaks. Temporal intelligence anchors load/transition/acceleration durations to the detected top-of-backswing and strike, and scores contact-window stability and deceleration. Every output is an optional, backward-compatible field on the session, basis + confidence carried through.',
    highlights: [
      'Markerless implement path + contact zone (forearm extrapolation, provider seam)',
      'Kinetic sequencing with power-leak detection, depth-aware',
      'Phase durations, contact-window stability, and cross-session repeatability',
      'An AR-style implement-path overlay rendered in the 3D viewer',
    ],
    stack: ['TypeScript', 'Canvas 2D', 'Pure functions', 'Jest'],
    isMilestone: true,
  },
  {
    id: 'dev-coach-team-narrative',
    version: 'Motion Lab',
    title: 'Coach & Team roster + a grounded, LLM-optional coach narrative',
    date: '2026-06-04',
    displayDate: 'June 2026',
    category: 'Platform',
    impact: 'notable',
    headline: 'A local-first coaching layer: group sessions by athlete, and a conversational coach read that never fabricates.',
    details:
      'Coach & Team mode is a local-first roster (its own storage key) with pure aggregation — per-athlete trend, recurring faults, and needs-attention flags, plus team-wide common weaknesses and upload tracking. The AI coach narrative composes the analysis into the SwingVantage 8-part format grounded strictly in real numbers; the existing provider seam can optionally rephrase it with an LLM behind a flag (off by default), so it stays fully functional with no API keys and never invents findings.',
    highlights: [
      'Local-first roster, pure tested aggregation, no accounts',
      'Sessions link to athletes via an optional, backward-compatible field',
      'Deterministic 8-part coach read, LLM only warms the wording',
    ],
    stack: ['TypeScript', 'React', 'Provider seam', 'localStorage'],
    isMilestone: false,
  },
  {
    id: 'dev-pose-adapters-debug',
    title: 'Pose-provider adapter set + an AI-validation debug panel',
    date: '2026-06-04',
    displayDate: 'June 2026',
    category: 'Architecture',
    impact: 'foundational',
    headline: 'The pose seam now has cloud + MoveNet adapters, and the analysis exposes its full internals for validation.',
    details:
      'Completed the PoseProvider adapter set: a cloud adapter (opt-in via env, validates the untrusted response, stays basis estimated, never throws) and a documented MoveNet placeholder, with a selector that prefers on-device for privacy and falls back honestly. A new AI-validation panel surfaces the raw pipeline output — per-frame pose confidence, dropped frames, phase timestamps, raw metrics, object-tracking and kinetic-chain internals, and device capabilities (WebGPU/WebNN/WASM) — so model output can actually be inspected, not trusted blindly.',
    highlights: [
      'Cloud + MoveNet adapters behind one interface; on-device stays the default',
      'Per-frame confidence, dropped frames, and raw internals in one panel',
      'Everything additive — no change to the working pipeline’s shape',
    ],
    stack: ['TypeScript', 'MediaPipe', 'useSyncExternalStore'],
    isMilestone: false,
  },
  {
    id: 'dev-motion-lab-3d',
    version: 'Motion Lab',
    title: 'Depth-aware 3D biomechanics — rotation that finally reads the z-axis',
    date: '2026-06-02',
    displayDate: 'June 2026',
    category: 'Motion Intelligence',
    impact: 'major',
    headline: 'Browser-native 3D swing analysis across all five sports, with no video ever leaving the device.',
    details:
      'Motion Lab estimates body pose from a single phone video and reconstructs the swing in three dimensions — so rotation, tilt, and sequencing are measured through depth instead of guessed from a flat silhouette. The whole pipeline runs client-side, which keeps athletes’ video private and removes server cost from the most expensive part of the product.',
    highlights: [
      'Single-camera pose → depth-aware 3D reconstruction',
      'Custom canvas viewer (not a heavyweight Three.js scene) for low-end phones',
      'Same engine generalizes across all 5 sports',
    ],
    stack: ['TypeScript', 'MediaPipe', 'Canvas 2D', 'WebWorkers'],
    isMilestone: true,
  },
  {
    id: 'dev-pose-consolidation',
    title: 'Unified lib/pose — one source of truth for movement',
    date: '2026-05-30',
    displayDate: 'May 2026',
    category: 'Architecture',
    impact: 'foundational',
    headline: 'Collapsed scattered pose/motion code into a single shared library every sport draws from.',
    details:
      'Pose estimation, smoothing, and keypoint math had grown duplicated across features. Consolidating it into lib/pose gave the retest engine, Motion Lab, and the fault ontology a single, tested foundation — so a fix to the math improves every surface at once instead of one.',
    highlights: [
      'One pose pipeline shared by diagnosis, retest, and Motion Lab',
      'Removed duplicated keypoint/smoothing implementations',
      'Tested core that downstream features build on',
    ],
    stack: ['TypeScript', 'Monorepo'],
    isMilestone: true,
  },
  {
    id: 'dev-retest-engine',
    title: 'Fault ontology + retest engine — closing the improvement loop',
    date: '2026-06-01',
    displayDate: 'June 2026',
    category: 'Motion Intelligence',
    impact: 'major',
    headline: 'A structured fault taxonomy plus an engine that proves whether a fix actually held.',
    details:
      'Every diagnosed fault maps into a shared ontology with retest conditions (same camera angle, distance, equipment). The engine reminds you when a finding is due, then produces an honest before/after read once you re-analyze. Comparisons are deliberately labelled as directional video reads, not measured biomechanics.',
    highlights: [
      'Typed fault taxonomy reused across all sports',
      'Condition-matched retests for fair before/after comparison',
      'Role-aware explanations (player / parent / coach) off the same finding',
    ],
    stack: ['TypeScript', 'Rules engine'],
    isMilestone: true,
  },
  {
    id: 'dev-ai-vision',
    title: 'Real AI vision — frames in, coaching out',
    date: '2026-05-29',
    displayDate: 'May 2026',
    category: 'AI & Vision',
    impact: 'major',
    headline: 'The video analyzer now sends real frames to a vision model instead of faking analysis.',
    details:
      'The swing-video analyzer extracts representative frames and routes them to a vision provider, then folds the result into the deterministic diagnostic layer. The provider is abstracted behind an interface so the model can be swapped without touching feature code.',
    highlights: [
      'Frame extraction → vision provider → ranked faults',
      'Provider-agnostic interface (swap models without rewrites)',
      'Layered on top of the deterministic rules engine, not replacing it',
    ],
    stack: ['TypeScript', 'Vision LLM', 'Next.js route handlers'],
    isMilestone: true,
  },
  {
    id: 'dev-moat-labs',
    title: 'Moat Foundations — readiness, player model, skill transfer & benchmark mirror',
    date: '2026-06-02',
    displayDate: 'June 2026',
    category: 'Platform',
    impact: 'notable',
    headline: 'A cluster of local-first intelligence modules that compound on a player’s own data.',
    details:
      'Shipped readiness scoring, a longitudinal player model, a skill-transfer graph, a performance graph, and a benchmark mirror — all under /labs. Each runs on the data the athlete already has, so insight deepens the more they use SwingVantage without any external dependency.',
    highlights: [
      'readiness · playerModel · skillTransfer · performanceGraph · benchmarkMirror',
      'Honest-first, local-first, no account required',
      'Composable modules rather than one monolith',
    ],
    stack: ['TypeScript'],
  },
  {
    id: 'dev-fix-stack-drillmatch',
    title: 'Fix Stack + DrillMatch — from diagnosis to the right drill',
    date: '2026-06-02',
    displayDate: 'June 2026',
    category: 'Platform',
    impact: 'notable',
    headline: 'Turns a ranked fault list into a prioritized stack of fixes and the drills that address them.',
    details:
      'DrillMatch maps diagnosed faults to a curated drill library, and Fix Stack orders them so the athlete always sees the single highest-leverage thing first. The framing copy lives in one place (lib/coaching/fixFraming) so the message stays consistent everywhere it appears.',
    highlights: [
      'Fault → drill matching with a single prioritized stack',
      'Centralized framing copy (no duplicated CTA strings)',
      'Player Arc progress intelligence alongside it',
    ],
    stack: ['TypeScript'],
  },
  {
    id: 'dev-theme-engine',
    title: '7-theme token engine — restyle everything, change nothing',
    date: '2026-06-01',
    displayDate: 'June 2026',
    category: 'Design System',
    impact: 'notable',
    headline: 'A data-theme palette system retokenizes the entire app while coaching and data stay untouched.',
    details:
      'A single set of CSS custom properties (driven by a data-theme attribute and palette definitions in globals.css) powers seven hand-built themes. Components reference semantic tokens — bg-card, text-foreground, bg-primary — so a theme swap is purely cosmetic and provably can’t alter logic or stored data.',
    highlights: [
      'Semantic tokens, not hard-coded colors, across the app',
      'Theme choice persisted and included in user backups',
      'Cosmetic-only guarantee: no coaching/data ever changes',
    ],
    stack: ['CSS variables', 'Tailwind', 'Next.js'],
  },
  {
    id: 'dev-agent-layer',
    title: 'Deterministic agent layer + "Welcome Back"',
    date: '2026-05-31',
    displayDate: 'May 2026',
    category: 'AI & Vision',
    impact: 'notable',
    headline: 'A deterministic intelligence layer that resumes context and surfaces the single best next step.',
    details:
      'On return, the app summarizes a player’s last focus, rates confidence in their top priority, and proposes one low-friction next step — all derived from their own data with no AI account required. It is deterministic by design, so the same inputs always produce the same guidance.',
    highlights: [
      'Resume-context + next-best-step on every visit',
      'Runs with zero external AI dependency',
      'Wired into both the marketing and app dashboards',
    ],
    stack: ['TypeScript'],
  },
  {
    id: 'dev-keyless-start',
    title: 'Keyless instant start — local-first by default',
    date: '2026-06-01',
    displayDate: 'June 2026',
    category: 'Architecture',
    impact: 'foundational',
    headline: 'Removed the sign-up wall: full value with data kept on the device, accounts optional forever.',
    details:
      'The app boots straight into analysis with state persisted locally in the browser. Sign-up, sign-in, and password reset all exist, but they’re strictly opt-in. This reframed the entire data model around local ownership first, sync second.',
    highlights: [
      'Zero-friction first run, no email required',
      'Local-first persistence with optional account sync',
      'Privacy posture that respects parents setting up for kids',
    ],
    stack: ['TypeScript', 'IndexedDB / localStorage'],
    isMilestone: true,
  },
  {
    id: 'dev-offline-pwa',
    title: 'Offline-resilient at the range',
    date: '2026-06-01',
    displayDate: 'June 2026',
    category: 'Performance',
    impact: 'notable',
    headline: 'Graceful offline handling with a queue that completes network work when signal returns.',
    details:
      'The places people actually train have the worst reception. The app now detects connectivity loss, keeps work safely on-device, surfaces a clear offline banner, and queues anything network-bound to finish automatically on reconnect.',
    highlights: [
      'Connectivity-aware UI with an offline banner',
      'Durable on-device work buffer',
      'Auto-flushing action queue on reconnect',
    ],
    stack: ['TypeScript', 'Service Worker', 'PWA'],
  },
  {
    id: 'dev-backup-schema',
    version: 'v1.2',
    title: 'Backup schema v1.2 — every feature must declare how it exports',
    date: '2026-05-31',
    displayDate: 'May 2026',
    category: 'Security & Privacy',
    impact: 'notable',
    headline: 'A versioned, portable backup format that now covers badges, XP, streaks, and tutorial state.',
    details:
      'Backups moved to a versioned schema (v1.2) that captures all user-owned data — sessions, equipment, gamification, community progress, and tutorial history. Restore shows a per-category preview with merge or replace modes. New features are now required to define their export/restore contract so backups stay complete as the platform grows.',
    highlights: [
      'Versioned, forward-compatible export format',
      'Per-category restore preview with merge / replace',
      'Export contract enforced for every new feature',
    ],
    stack: ['TypeScript', 'JSON schema'],
  },
  {
    id: 'dev-monorepo-ci',
    title: 'Turbo monorepo with quality gates wired into CI',
    date: '2026-05-31',
    displayDate: 'May 2026',
    category: 'Developer Experience',
    impact: 'foundational',
    headline: 'Type-checking, naming rules, placeholder/trust scans, and security checks all gate every change.',
    details:
      'The project is a Turborepo of apps, packages, and a server, with a CI pipeline that runs type-check, a naming linter, a placeholder/trust scanner, and dependency + secret security checks. Automated monthly audits (SEO/AEO/GEO, AI features, engagement, build health) compile into a single master report.',
    highlights: [
      'Turborepo workspaces: apps / packages / server',
      'CI gate: type-check · naming · trust scan · security',
      'Scheduled monthly audits compiled into one executive report',
    ],
    stack: ['Turborepo', 'TypeScript', 'ESLint', 'GitHub Actions'],
  },
  {
    id: 'dev-multi-sport-engines',
    title: 'Five sports, five real diagnostic engines',
    date: '2026-05-29',
    displayDate: 'May 2026',
    category: 'Architecture',
    impact: 'foundational',
    headline: 'Treated each sport as a distinct movement model instead of golf with relabeled tips.',
    details:
      'A tennis serve, a baseball swing, and a golf swing are fundamentally different motions. Rather than share one engine with swapped vocabulary, each sport got its own diagnostic rules, benchmarks, drill library, and coaching language — switching sports retargets the whole experience.',
    highlights: [
      'Per-sport rules, benchmarks, and drill libraries',
      'Sport switch retargets dashboard, plan, and feedback',
      'Foundation the later motion + retest work built on',
    ],
    stack: ['TypeScript', 'Rules engine'],
    isMilestone: true,
  },
];

// ── Auto-generated entries (populated by scripts/generate-updates.mjs) ───────
// These come from `Dev-Update:` commit trailers and land as DRAFTS (hidden)
// until flipped to published — by hand here or from /admin/updates.
import autoDevUpdatesJson from './auto-dev-updates.json';
const AUTO_DEV_UPDATES = autoDevUpdatesJson as unknown as DevUpdate[];

/** Every dev update, draft or live — for the admin Publishing screen only. */
export function getAllDevUpdates(): DevUpdate[] {
  return [...DEV_UPDATES, ...AUTO_DEV_UPDATES];
}

/**
 * Whether a dev update may appear on the public /dev-updates page. Drafts are
 * hidden; a missing status means "published" so hand-written seeds stay live.
 */
export function isPublicDevUpdate(u: DevUpdate): boolean {
  return u.status !== 'draft';
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function getDevUpdates(): DevUpdate[] {
  return getAllDevUpdates()
    .filter(isPublicDevUpdate)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getDevMilestones(): DevUpdate[] {
  return getAllDevUpdates()
    .filter((u) => isPublicDevUpdate(u) && u.isMilestone)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
