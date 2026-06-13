// ── Developer / Engineering Updates ───────────────────────────────────────
//
// This is the *technical-flavored* companion to the plain-English product
// changelog at /updates. It exists to show the engineering progress behind
// SwingVantage — the capabilities and milestones — for a builder-curious
// audience.
//
// ⚠️ PROPRIETARY-PROTECTION POLICY (read before adding or editing an entry)
// This page is PUBLIC and search-indexed. Treat every field as competitor-
// readable marketing copy, NOT an engineering write-up. Describe WHAT a change
// does for athletes and WHY it matters — never HOW it is built.
//
//   DO   keep it plain-English and benefit-first; an athlete should understand it.
//   DON'T name vendors, libraries, SDKs, models, or infra (e.g. the pose/ML
//        toolkit, the analytics vendor, the database, the AI provider).
//   DON'T expose internal system codenames, file paths, env-var/flag names,
//        table counts, file counts, or specific algorithms/heuristics.
//   DON'T describe internal-only tooling in a way a competitor could copy.
//
// A CI test (see __tests__/devUpdates.test.ts) scans every published entry for
// these tells and fails the build if one slips in. Keep entries honest and
// concrete about outcomes, never about implementation.

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
  /** Optional human tag, e.g. "v1.2". Keep it a product-friendly label — never an
   *  internal engineering codename. */
  version?: string;
  title: string;
  /** ISO date used for sorting. */
  date: string;
  /** Human-friendly date shown in the UI. */
  displayDate: string;
  category: DevUpdateCategory;
  impact: DevUpdateImpact;
  /** The one-line, plain-English "what shipped" headline. */
  headline: string;
  /** A short paragraph: what the change does for athletes and why it matters.
   *  Outcomes only — no implementation detail (see the policy note at the top). */
  details: string;
  /** Concrete, athlete-facing wins worth highlighting — benefits, not internals. */
  highlights?: string[];
  /**
   * @deprecated No longer surfaced on the public page. We do not publish our
   * stack, vendors, or libraries. Kept on the type only so auto-generated data
   * carrying a Dev-Stack value still type-checks; it is intentionally never
   * rendered. Do not add it to new seed entries.
   */
  stack?: string[];
  /**
   * @deprecated No longer surfaced publicly (it tended to leak internal test
   * names and suites). Kept on the type for backwards compatibility only.
   */
  testing?: string[];
  /**
   * @deprecated No longer surfaced publicly (it tended to leak env flags and
   * infra detail). Kept on the type for backwards compatibility only.
   */
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
    detail: 'Golf, tennis, pickleball, padel, baseball, slow- and fast-pitch softball — each with its own coaching, not shared labels.',
  },
  {
    value: '3D',
    label: 'Motion analysis in the browser',
    detail: 'Your swing is analyzed in 3D right on your device. No app install, and your video is never uploaded to a server.',
  },
  {
    value: '7',
    label: 'Themes, one system',
    detail: 'A theming system restyles the entire app — your coaching and your data never change.',
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
    id: 'dev-aio4-orchestrator',
    title: 'Smarter, more honest AI swing coaching',
    date: '2026-06-12',
    displayDate: 'June 2026',
    category: 'AI & Vision',
    impact: 'major',
    headline:
      'AI coaching now grounds every comment in what we actually measured from your swing — so it stays accurate and never overstates what it sees.',
    details:
      'We rebuilt how AI coaching is produced so it always works from the real measurements taken from your video, not a re-guess. The system is careful by design: it won’t make a claim it can’t support, it flags anything that looks inconsistent, and it never sounds more certain than the evidence allows. Coaching works fully even with no paid AI turned on, and the optional AI layer can never break your core swing report.',
    highlights: [
      'Coaching is always grounded in the real measurements from your swing',
      'Won’t overstate findings or sound more confident than the evidence',
      'Flags anything inconsistent instead of hiding it',
      'Works fully even with no paid AI enabled',
      'Built so the optional AI layer can never break your core report',
    ],
    isMilestone: true,
  },
  {
    id: 'dev-ai-feature-switchboard',
    title: 'One switch to turn AI features on or off',
    date: '2026-06-12',
    displayDate: 'June 2026',
    category: 'Security & Privacy',
    impact: 'notable',
    headline:
      'Every AI-powered feature can be turned off instantly — and when it is, that feature quietly falls back to a reliable non-AI version instead of breaking.',
    details:
      'We added a simple master control for the AI features you use, plus a switch for each one. Turning any of them off never leaves you with a broken screen — the feature just uses its dependable built-in version instead, at no extra cost. It’s a safety and cost control that keeps the experience smooth no matter what.',
    highlights: [
      'A master on/off plus a switch for each AI feature',
      'Turning AI off falls back to a reliable version — never an error',
      'No surprise costs when features are switched off',
    ],
  },
  {
    id: 'dev-ai-observability-funnel',
    title: 'Measuring quality without ever seeing your content',
    date: '2026-06-12',
    displayDate: 'June 2026',
    category: 'Platform',
    impact: 'notable',
    headline:
      'We can now measure how well swing analysis and the AI coach perform — speed, success rate, and helpfulness — without ever recording your video, questions, or answers.',
    details:
      'To keep improving the product we needed to know where things are slow or failing. We added privacy-first measurement that tracks only anonymous performance signals — like how fast analysis runs and whether it succeeded — and never your frames, prompts, questions, or answers. You can even give a quick thumbs-up or thumbs-down on a coaching answer to help us improve.',
    highlights: [
      'Tracks speed and success, never your content',
      'No video, questions, or answers are ever recorded',
      'Optional thumbs-up / thumbs-down on coaching answers',
    ],
  },
  {
    id: 'dev-strict-video-seo',
    version: 'Video SEO',
    title: 'Every tutorial video held to the same high standard',
    date: '2026-06-12',
    displayDate: 'June 2026',
    category: 'Developer Experience',
    impact: 'notable',
    headline:
      'All of our how-to videos now carry captions, accurate dates, and rich descriptions — and an automatic check makes sure future videos always do too.',
    details:
      'We brought every tutorial video up to a single high bar: captions for accessibility, accurate publish dates, and complete descriptions so the videos are easy to find and watch. An automatic check keeps that standard in place for every video we add going forward.',
    highlights: [
      'Captions added to every tutorial walkthrough',
      'Accurate dates and complete, searchable descriptions',
      'An automatic check keeps future videos compliant',
    ],
  },
  {
    id: 'dev-branch-guardian',
    title: 'Tools that keep our codebase clean and safe',
    date: '2026-06-08',
    displayDate: 'June 2026',
    category: 'Developer Experience',
    impact: 'major',
    headline:
      'We built internal safeguards that help us keep our code organized and catch risky files before they ever ship.',
    details:
      'Behind the scenes we added tooling that reviews the health of our codebase and flags anything that should be cleaned up or looks risky — always with a person approving each step. It helps us move quickly without letting clutter or mistakes reach the live product.',
    highlights: [
      'Keeps our codebase organized and healthy',
      'Flags risky files before they can ship',
      'Every cleanup step requires human approval',
    ],
    isMilestone: true,
  },
  {
    id: 'dev-mental-performance',
    version: 'Mental Performance',
    title: 'Mental Performance — coaching for focus and mistake recovery',
    date: '2026-06-08',
    displayDate: 'June 2026',
    category: 'Architecture',
    impact: 'major',
    headline:
      'A private, built-in mental-game coach that helps you reset after mistakes and manage emotions — with crisis safety built in and no account required.',
    details:
      'We added a Mental Performance pillar that gives you reset routines, self-talk cues, breathing patterns, and drills matched to your sport and the moment you’re in. It’s private by default and works without any account or paid AI. If someone types something that suggests a crisis or a medical issue, it points them to real help instead of trying to coach. There are guided spoken routines, a journal, and plans — all yours and kept private.',
    highlights: [
      'Reset routines, self-talk, breathing, and drills matched to your sport and moment',
      'Crisis and medical safety built in — points to real help',
      'Guided spoken routines that work for free, no account needed',
      'A private journal and plans you fully control',
    ],
    isMilestone: true,
  },
  {
    id: 'dev-seven-sports',
    version: 'Sports',
    title: 'Seven sports, each with its own real coaching engine',
    date: '2026-06-06',
    displayDate: 'June 2026',
    category: 'Architecture',
    impact: 'major',
    headline:
      'Pickleball and padel were added as genuine, sport-specific coaching engines — not tennis with the labels swapped.',
    details:
      'We expanded to seven sports, and each one gets its own coaching logic, swing phases, benchmarks, and drills. Pickleball understands dinks, third-shot drops, and kitchen play; padel understands wall play and doubles positioning. Where a sport doesn’t have a meaningful single rating, we don’t invent one.',
    highlights: [
      'Pickleball and padel get their own real coaching, not relabeled tennis',
      'Sport-specific phases, benchmarks, and drills for each sport',
      'No invented ratings where a sport doesn’t have one',
    ],
    isMilestone: true,
  },
  {
    id: 'dev-relational-accounts',
    version: 'Accounts',
    title: 'Your account keeps everything in sync — without giving up privacy',
    date: '2026-06-06',
    displayDate: 'June 2026',
    category: 'Architecture',
    impact: 'major',
    headline:
      'Sign in and your full history syncs securely across devices, while everything still works locally first and stays private by default.',
    details:
      'Signing in is optional, but when you do, your sessions and settings sync securely across your devices. We kept the local-first design, so the app still works great without an account. Account emails come from our own brand, with no third-party branding.',
    highlights: [
      'Optional sign-in syncs your history securely across devices',
      'Still works fully without an account, private by default',
      'Branded, on-domain account emails',
    ],
    isMilestone: true,
  },
  {
    id: 'dev-bodysync',
    version: 'BodySync',
    title: 'BodySync — readiness and recovery, your way',
    date: '2026-06-06',
    displayDate: 'June 2026',
    category: 'Security & Privacy',
    impact: 'notable',
    headline:
      'An optional, privacy-first wellness layer that turns a quick check-in into a readiness score and practice adjustments — never medical, and 18+ only.',
    details:
      'BodySync takes a simple wellness check-in and turns it into a readiness score, a fatigue read, and practice-plan tweaks. It’s strictly opt-in, limited to adults, and never claims to be medical advice. You can connect optional sources like Apple Health, and all of your data stays exportable and deletable.',
    highlights: [
      'Turns a quick check-in into readiness and practice adjustments',
      'Opt-in, 18+, and clearly non-medical',
      'Optional Apple Health import; your data stays exportable and deletable',
    ],
    isMilestone: false,
  },
  {
    id: 'dev-athletic-journey',
    version: 'Journey',
    title: 'Athletic Journey — see where you are and what’s next',
    date: '2026-06-06',
    displayDate: 'June 2026',
    category: 'Platform',
    impact: 'notable',
    headline:
      'Places you on a clear development path using many signals from your own data — and honestly says when a sport isn’t ready yet instead of faking a score.',
    details:
      'Athletic Journey blends your profile, optional ratings, video reads, and logged practice into a clear stage on a development ladder for your sport, with momentum and next steps. Golf, tennis, pickleball, and padel are live; baseball and softball show an honest in-development notice instead of a made-up score.',
    highlights: [
      'Blends many signals from your own data into a clear stage',
      'Honest about sports still in development — no faked scores',
      'Optional ratings sharpen the read but are never required',
    ],
    isMilestone: false,
  },
  {
    id: 'dev-recruiting-hub',
    version: 'Recruiting',
    title: 'Recruiting Hub — an honest profile you control',
    date: '2026-06-06',
    displayDate: 'June 2026',
    category: 'Platform',
    impact: 'notable',
    headline:
      'Build a recruiting profile where every stat shows whether it’s verified or self-reported, with a shareable coach view you fully control.',
    details:
      'The Recruiting Hub lets you build a profile where each stat is clearly labeled verified or self-reported, with a profile-strength meter, a film library and highlight builder, a downloadable packet, and coach outreach. You choose exactly what a coach sees on your shareable page, and the guidance describes real evidence instead of overpromising.',
    highlights: [
      'Every stat labeled verified or self-reported',
      'Film library, highlight builder, packet, and outreach',
      'A shareable coach view you fully control',
    ],
    isMilestone: false,
  },
  {
    id: 'dev-security-hardening',
    title: 'Security hardening across the board',
    date: '2026-06-05',
    displayDate: 'June 2026',
    category: 'Security & Privacy',
    impact: 'notable',
    headline: 'A full security review followed by fixes that close the highest-priority gaps first.',
    details:
      'We ran a security review and shipped the highest-impact fixes: safer handling of secrets, locking down protected areas by default, and stronger limits to prevent abuse. Remaining items were tracked and scheduled rather than half-finished.',
    highlights: [
      'Safer secret handling and locked-down protected areas',
      'Stronger abuse limits that hold across our systems',
      'Remaining work tracked, not silently dropped',
    ],
    isMilestone: false,
  },
  {
    id: 'dev-growth-os',
    title: 'Internal tools to grow sustainably',
    date: '2026-06-06',
    displayDate: 'June 2026',
    category: 'Platform',
    impact: 'notable',
    headline:
      'Admin-only tooling that helps us reach and re-engage athletes responsibly, with every AI draft reviewed by a person before anything goes out.',
    details:
      'We built internal, admin-only tooling that helps us grow the community in a sustainable, honest way. Anything AI-assisted is created as a draft for a person to review — nothing publishes itself.',
    highlights: [
      'Admin-only, never visible to athletes',
      'AI output is always draft-first and human-reviewed',
      'Built to grow responsibly and honestly',
    ],
    isMilestone: false,
  },
  {
    id: 'dev-i18n-self-maintaining',
    title: 'Multilingual pages that stay accurate',
    date: '2026-06-06',
    displayDate: 'June 2026',
    category: 'Developer Experience',
    impact: 'notable',
    headline:
      'Localized pages (Spanish first) that automatically refuse to show a translation once the original content has changed underneath it.',
    details:
      'We began offering localized pages, starting with Spanish, with the search-engine details handled automatically. A built-in check blocks a translated page from going live if its original content has changed, so visitors never see a stale or mismatched translation. Optional AI translation is off by default.',
    highlights: [
      'Localized pages, starting with Spanish',
      'An automatic check blocks stale translations from going live',
      'Optional AI translation, off by default',
    ],
    isMilestone: false,
  },
  {
    id: 'dev-rebrand-swingvantage',
    version: 'Brand',
    title: 'Full rebrand: SwingIQ → SwingVantage',
    date: '2026-06-04',
    displayDate: 'June 2026',
    category: 'Platform',
    impact: 'notable',
    headline:
      'A careful, top-to-bottom rename to SwingVantage that updated the entire app without losing a single byte of anyone’s saved data.',
    details:
      'We renamed the product from SwingIQ to SwingVantage (swingvantage.com) as a careful, end-to-end migration — every visible mention updated across the app, while the behind-the-scenes identifiers that hold your saved data were deliberately preserved. That’s what let every existing user keep all of their swings, sessions, and settings straight through the change.',
    highlights: [
      'Every visible mention updated to SwingVantage',
      'Saved data preserved end-to-end — nothing lost',
      'Verified across the whole app before launch',
    ],
    isMilestone: false,
  },
  {
    id: 'dev-monetization-free-ads-tiers',
    version: 'Strategy',
    title: 'A clear, athlete-first path to sustainability',
    date: '2026-06-04',
    displayDate: 'June 2026',
    category: 'Platform',
    impact: 'foundational',
    headline:
      'One simple order for how the product grows and earns: a great free experience first, then light optional ads, then memberships later.',
    details:
      'We made our approach explicit and athlete-first: grow a genuinely useful free experience, then introduce light, youth-safe ads, and only later add optional paid memberships. Paid features stay clearly “coming soon” until then, with optional email notifications.',
    highlights: [
      'A great free experience comes first',
      'Any ads are light and youth-safe',
      'Memberships are optional and clearly “coming soon”',
    ],
    isMilestone: false,
  },
  {
    id: 'dev-implement-kinetic-temporal',
    version: 'Motion',
    title: 'Reading club/bat/racket path, sequencing, and timing',
    date: '2026-06-04',
    displayDate: 'June 2026',
    category: 'Motion Intelligence',
    impact: 'major',
    headline:
      'Our motion engine now follows the path of your club, bat, or racket, reads the firing order of your body’s power chain, and measures how your swing unfolds over time.',
    details:
      'We added three new layers on top of our motion analysis. One estimates the path of your club, bat, or racket and is honestly labeled as an inferred read. Another measures the order your body segments fire in and flags power leaks. The third measures the timing of each phase of your swing and how repeatable your contact is. Every new reading is clearly labeled with how confident we are.',
    highlights: [
      'Estimates the path of your club, bat, or racket',
      'Reads your body’s power sequence and flags leaks',
      'Measures swing timing and how repeatable your contact is',
      'Every reading honestly labeled with a confidence level',
    ],
    isMilestone: true,
  },
  {
    id: 'dev-coach-team-narrative',
    version: 'Coach & Team',
    title: 'Coach & Team — a group view plus a grounded coaching summary',
    date: '2026-06-04',
    displayDate: 'June 2026',
    category: 'Platform',
    impact: 'notable',
    headline:
      'Coaches can group athletes and see trends at a glance, with a written coaching summary that never makes up findings.',
    details:
      'Coach & Team mode lets a coach group sessions by athlete and see each athlete’s trends, recurring issues, and who needs attention, plus team-wide patterns. The written coaching summary is built strictly from your real numbers and never invents findings. It works fully without any account or paid AI.',
    highlights: [
      'Group sessions by athlete; see trends and who needs attention',
      'Team-wide patterns at a glance',
      'Coaching summary built only from real numbers — never fabricated',
    ],
    isMilestone: false,
  },
  {
    id: 'dev-pose-adapters-debug',
    title: 'Flexible motion analysis with a look under the hood',
    date: '2026-06-04',
    displayDate: 'June 2026',
    category: 'Architecture',
    impact: 'foundational',
    headline:
      'Our motion analysis can run in more ways while keeping private, on-device analysis the default — and we can now inspect its inner workings to verify accuracy.',
    details:
      'We made our motion analysis more flexible in how it can run, while keeping private, on-device analysis the default and falling back gracefully when needed. We also added an internal view that shows the detailed output of the analysis so we can verify it’s accurate rather than trusting it blindly.',
    highlights: [
      'Private, on-device analysis stays the default',
      'Falls back gracefully when needed',
      'An internal view to verify accuracy, not trust blindly',
    ],
    isMilestone: false,
  },
  {
    id: 'dev-motion-lab-3d',
    version: 'Motion Lab',
    title: '3D swing analysis, right in your browser',
    date: '2026-06-02',
    displayDate: 'June 2026',
    category: 'Motion Intelligence',
    impact: 'major',
    headline: '3D swing analysis across all seven sports, running entirely in your browser — your video never leaves your device.',
    details:
      'Motion Lab analyzes your swing in three dimensions from a single phone video, so rotation, tilt, and sequencing are measured properly instead of guessed from a flat image. It all runs on your own device, which keeps your video private and works on everyday phones.',
    highlights: [
      '3D swing analysis from a single phone video',
      'Runs on your device — your video stays private',
      'Works across all seven sports, even on everyday phones',
    ],
    isMilestone: true,
  },
  {
    id: 'dev-pose-consolidation',
    title: 'One shared foundation for movement analysis',
    date: '2026-05-30',
    displayDate: 'May 2026',
    category: 'Architecture',
    impact: 'foundational',
    headline: 'We unified our movement analysis into a single, well-tested foundation that every sport and feature builds on.',
    details:
      'Our movement analysis had grown duplicated across features. We consolidated it into one shared, well-tested foundation, so an improvement to the core makes every feature better at once.',
    highlights: [
      'One shared movement foundation for every sport',
      'Removed duplicated logic',
      'Improvements flow to every feature at once',
    ],
    isMilestone: true,
  },
  {
    id: 'dev-retest-engine',
    title: 'Proving a fix actually worked',
    date: '2026-06-01',
    displayDate: 'June 2026',
    category: 'Motion Intelligence',
    impact: 'major',
    headline: 'A structured way to track each swing fault plus a retest that gives you an honest before-and-after.',
    details:
      'Every issue we diagnose is tracked, and when you re-record under the same conditions, we give you an honest before-and-after read so you can see whether a fix actually held. We’re clear that these are directional reads from video, not lab measurements.',
    highlights: [
      'Each fault tracked with clear retest conditions',
      'Honest before-and-after when you re-record',
      'Explanations tailored to player, parent, or coach',
    ],
    isMilestone: true,
  },
  {
    id: 'dev-ai-vision',
    title: 'Real AI vision — frames in, coaching out',
    date: '2026-05-29',
    displayDate: 'May 2026',
    category: 'AI & Vision',
    impact: 'major',
    headline: 'The video analyzer reads real frames from your swing instead of faking analysis.',
    details:
      'Our swing-video analyzer pulls representative frames from your video and uses AI vision to read them, then combines that with our reliable rule-based coaching. The AI part can be upgraded over time without changing the rest of the experience.',
    highlights: [
      'Reads real frames from your swing',
      'Combined with reliable rule-based coaching',
      'Upgradeable over time without disruption',
    ],
    isMilestone: true,
  },
  {
    id: 'dev-moat-labs',
    version: 'Labs',
    title: 'Labs — insights that grow with your data',
    date: '2026-06-02',
    displayDate: 'June 2026',
    category: 'Platform',
    impact: 'notable',
    headline: 'A set of insight tools that get smarter the more you use SwingVantage, all running on your own data.',
    details:
      'We shipped a cluster of insight tools under Labs — things like readiness, a long-term picture of your progress, and personal benchmarks — that all run on the data you already have. The more you use SwingVantage, the sharper they get, with no outside dependency.',
    highlights: [
      'Insights that deepen the more you use the app',
      'Runs on your own data, privately',
      'Built as composable pieces, not one black box',
    ],
  },
  {
    id: 'dev-fix-stack-drillmatch',
    title: 'From diagnosis to the right drill',
    date: '2026-06-02',
    displayDate: 'June 2026',
    category: 'Platform',
    impact: 'notable',
    headline: 'Turns your ranked list of swing faults into a prioritized set of fixes and the exact drills that address them.',
    details:
      'We connect each diagnosed fault to a matching drill and order them so you always see the single highest-impact thing to work on first. The way it’s framed stays consistent everywhere you see it.',
    highlights: [
      'Matches faults to the right drills automatically',
      'Always shows your highest-impact fix first',
      'Consistent guidance everywhere it appears',
    ],
  },
  {
    id: 'dev-theme-engine',
    title: 'Seven themes, zero risk to your data',
    date: '2026-06-01',
    displayDate: 'June 2026',
    category: 'Design System',
    impact: 'notable',
    headline: 'A theming system that restyles the entire app while your coaching and data stay completely untouched.',
    details:
      'We built seven hand-crafted themes powered by a single set of design tokens, so switching themes is purely cosmetic and provably can’t change any coaching logic or your stored data. Your theme choice is saved and included in your backups.',
    highlights: [
      'Seven hand-built themes',
      'Purely cosmetic — never touches coaching or data',
      'Your choice is saved and backed up',
    ],
  },
  {
    id: 'dev-agent-layer',
    title: '“Welcome Back” — your best next step, instantly',
    date: '2026-05-31',
    displayDate: 'May 2026',
    category: 'AI & Vision',
    impact: 'notable',
    headline: 'When you return, the app recaps your last focus and suggests the single best next step — all from your own data, no AI account needed.',
    details:
      'On return, SwingVantage summarizes what you were working on, gauges how your top priority is going, and proposes one easy next step. It’s built to be consistent and reliable, using only your own data.',
    highlights: [
      'Recaps your focus and suggests one clear next step',
      'Uses only your own data — no AI account required',
      'Consistent, reliable guidance every visit',
    ],
  },
  {
    id: 'dev-keyless-start',
    title: 'Instant start — no sign-up required',
    date: '2026-06-01',
    displayDate: 'June 2026',
    category: 'Architecture',
    impact: 'foundational',
    headline: 'Jump straight into analyzing a swing with your data kept on your device. Accounts are optional, forever.',
    details:
      'The app starts straight into analysis, with your data saved on your own device. Sign-up and sign-in exist, but they’re always optional. The whole experience is built around you owning your data first.',
    highlights: [
      'No email or sign-up to get started',
      'Your data lives on your device by default',
      'Accounts optional, with sync when you want it',
    ],
    isMilestone: true,
  },
  {
    id: 'dev-offline-pwa',
    title: 'Works at the range, even with bad signal',
    date: '2026-06-01',
    displayDate: 'June 2026',
    category: 'Performance',
    impact: 'notable',
    headline: 'Handles spotty connections gracefully and finishes any pending work automatically once you’re back online.',
    details:
      'The places people train often have terrible reception. The app now detects when you lose signal, keeps your work safe on your device, shows a clear offline notice, and finishes anything network-related automatically when you reconnect.',
    highlights: [
      'Detects lost signal and keeps your work safe',
      'A clear offline notice',
      'Finishes pending work automatically on reconnect',
    ],
  },
  {
    id: 'dev-backup-schema',
    version: 'v1.2',
    title: 'Complete, portable backups of your data',
    date: '2026-05-31',
    displayDate: 'May 2026',
    category: 'Security & Privacy',
    impact: 'notable',
    headline: 'A versioned backup format that captures everything you own — sessions, badges, streaks, and more — with a clear restore preview.',
    details:
      'Backups now capture all of your data — sessions, equipment, achievements, and progress — in a portable, versioned format. Restoring shows a preview by category with the choice to merge or replace, and every new feature is required to define how it backs up so your backups stay complete as the app grows.',
    highlights: [
      'Captures all of your data in one portable file',
      'Restore preview with merge or replace',
      'Backups stay complete as the app grows',
    ],
  },
  {
    id: 'dev-monorepo-ci',
    title: 'Quality checks on every single change',
    date: '2026-05-31',
    displayDate: 'May 2026',
    category: 'Developer Experience',
    impact: 'foundational',
    headline: 'Automated quality and security checks run on every change before it can ship.',
    details:
      'Every change to SwingVantage runs through automated checks — for correctness, consistency, honesty of anything shown to you, and security — before it can go live. Regular automated audits roll up into a single health report.',
    highlights: [
      'Automated quality and security checks on every change',
      'Honesty checks so nothing misleading ships',
      'Regular audits compiled into one report',
    ],
  },
  {
    id: 'dev-multi-sport-engines',
    title: 'Seven sports, seven real coaching engines',
    date: '2026-05-29',
    displayDate: 'May 2026',
    category: 'Architecture',
    impact: 'foundational',
    headline: 'Each sport is treated as its own distinct motion, not golf with relabeled tips.',
    details:
      'A tennis serve, a baseball swing, and a golf swing are fundamentally different. Instead of one engine with swapped words, each sport got its own coaching logic, benchmarks, drills, and language — so switching sports retargets the whole experience.',
    highlights: [
      'Real per-sport coaching, benchmarks, and drills',
      'Switching sports retargets everything',
      'The foundation our motion work builds on',
    ],
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
