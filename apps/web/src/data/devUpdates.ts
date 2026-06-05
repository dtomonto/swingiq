// ── Developer / Engineering Updates ───────────────────────────────────────
//
// This is the *technical* companion to the plain-English product changelog at
// /updates. It exists to show off the engineering milestones behind SwingIQ —
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

export interface DevUpdate {
  id: string;
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
    value: '5',
    label: 'Sports, real engines',
    detail: 'Golf, tennis, baseball, slow- and fast-pitch softball — each with its own diagnostic rules, not shared labels.',
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
      'Coach & Team mode is a local-first roster (its own storage key) with pure aggregation — per-athlete trend, recurring faults, and needs-attention flags, plus team-wide common weaknesses and upload tracking. The AI coach narrative composes the analysis into the SwingIQ 8-part format grounded strictly in real numbers; the existing provider seam can optionally rephrase it with an LLM behind a flag (off by default), so it stays fully functional with no API keys and never invents findings.',
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
      'Shipped readiness scoring, a longitudinal player model, a skill-transfer graph, a performance graph, and a benchmark mirror — all under /labs. Each runs on the data the athlete already has, so insight deepens the more they use SwingIQ without any external dependency.',
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
    date: '2024-09-15',
    displayDate: 'September 2024',
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

// ── Helpers ─────────────────────────────────────────────────────────────────

export function getDevUpdates(): DevUpdate[] {
  return [...DEV_UPDATES].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function getDevMilestones(): DevUpdate[] {
  return DEV_UPDATES.filter((u) => u.isMilestone).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}
