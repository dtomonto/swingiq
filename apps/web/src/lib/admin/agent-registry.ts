// ============================================================
// SwingVantage Admin — AI Agent Registry (isomorphic, pure)
// ------------------------------------------------------------
// One honest inventory of EVERY agent/automation in the product, across
// families, with the operational metadata an operator needs: what it
// does, what it reads/produces, whether it is keyless or LLM-capable,
// how it is turned on/off, its safety guardrails, and where to inspect
// it. This does NOT reimplement any agent — it catalogs the real ones
// (lib/agents/*, lib/admin/copilot, lib/central-intelligence/*, etc.)
// so the per-family debug surfaces stay the source of truth.
//
// Pure + dependency-light (types only) → unit testable. The admin page
// annotates each entry with LIVE capability state (e.g. is an LLM
// provider connected) at render time.
// ============================================================

import type { Permission } from './rbac';

export type AgentFamily = 'insight' | 'growth' | 'content-ai' | 'safety';

/** Keyless-first posture: deterministic by default, LLM optional. */
export type AgentRuntime = 'deterministic' | 'deterministic+llm' | 'llm';

export interface RegisteredAgent {
  /** Stable id (unique across the registry). */
  id: string;
  name: string;
  family: AgentFamily;
  /** Plain-English purpose a non-technical operator understands. */
  purpose: string;
  /** What data the agent reads. */
  inputs: string[];
  /** What the agent produces. */
  outputs: string[];
  runtime: AgentRuntime;
  /** How the agent is enabled/disabled (env var, flag, or always-on). */
  control: string;
  /** Where an operator inspects/tests this agent. */
  surface: { label: string; href: string };
  /** Source module (for engineers). */
  module: string;
  /** Optional RBAC permission the surface requires (informational). */
  permission?: Permission;
  /** Guardrail / safety note when relevant. */
  safety?: string;
}

export interface AgentFamilyMeta {
  id: AgentFamily;
  label: string;
  blurb: string;
}

export const AGENT_FAMILY_META: AgentFamilyMeta[] = [
  {
    id: 'insight',
    label: 'Product Intelligence',
    blurb:
      'Deterministic workflows that read structured app data and return the calm, unified "SwingVantage noticed…" cards and next-best-actions users see.',
  },
  {
    id: 'growth',
    label: 'Growth',
    blurb:
      'The growth coordinator and its sub-agents: churn risk, lifecycle dispatch (draft-first), activation, referral moments, practice companion and ad creative.',
  },
  {
    id: 'content-ai',
    label: 'Content & Operator AI',
    blurb:
      'Agentic operator tools that draft content or answer operator questions — keyless-first, with optional, clearly-labeled AI and review gates.',
  },
  {
    id: 'safety',
    label: 'Safety & Trust',
    blurb:
      'Guardrails that keep output honest and safe: youth/medical safety flags and the trust linter that scans copy for unsupported claims.',
  },
];

// ── The catalog (every entry maps to a real module) ────────────

export const AGENT_REGISTRY: RegisteredAgent[] = [
  // ── Product Intelligence (lib/agents) ──
  {
    id: 'resume',
    name: 'Welcome Back / Resume',
    family: 'insight',
    purpose: 'Reconstructs where each returning athlete left off and the single best next step.',
    inputs: ['profile', 'session history', 'plan status', 'recency'],
    outputs: ['resume state', 'next-best-action', 'continuity summary'],
    runtime: 'deterministic',
    control: 'Always on (keyless)',
    surface: { label: 'Insights', href: '/admin/insights' },
    module: 'lib/agents/workflows/resume.ts',
  },
  {
    id: 'next_best_action',
    name: 'Next Best Action',
    family: 'insight',
    purpose: 'Scores competing actions in the activation funnel and picks the highest-leverage one.',
    inputs: ['profile completeness', 'sessions', 'equipment', 'plan status'],
    outputs: ['ranked action'],
    runtime: 'deterministic',
    control: 'Always on (keyless)',
    surface: { label: 'Insights', href: '/admin/insights' },
    module: 'lib/agents/scoring.ts',
  },
  {
    id: 'diagnosis_confidence',
    name: 'Diagnosis Confidence',
    family: 'insight',
    purpose: 'Turns the latest diagnosis into a plain-English top priority with an honest confidence score.',
    inputs: ['latest diagnosis', 'session history'],
    outputs: ['priority issue', 'confidence', 'evidence', 'next step'],
    runtime: 'deterministic',
    control: 'Always on (keyless)',
    surface: { label: 'AI Analyses', href: '/admin/ai-analyses' },
    module: 'lib/agents/workflows/diagnosis-confidence.ts',
    permission: 'ai.review',
  },
  {
    id: 'progress_memory',
    name: 'Progress Memory',
    family: 'insight',
    purpose: 'Detects score trends (improving / plateaued / declining) across sessions and suggests an adjustment.',
    inputs: ['session scores over time'],
    outputs: ['trend', 'improved/stalled areas', 'suggested adjustment'],
    runtime: 'deterministic',
    control: 'Always on (keyless)',
    surface: { label: 'Insights', href: '/admin/insights' },
    module: 'lib/agents/workflows/progress-memory.ts',
  },
  {
    id: 'practice_planner',
    name: 'Practice Planner',
    family: 'insight',
    purpose: 'Builds a focused practice plan (warmup, drills, pressure test) from the athlete’s priority.',
    inputs: ['priority focus', 'skill level', 'equipment', 'time available'],
    outputs: ['structured practice plan'],
    runtime: 'deterministic+llm',
    control: 'Keyless default; optional LLM via AI_PROVIDER',
    surface: { label: 'Sports config', href: '/admin/sports' },
    module: 'lib/agents/workflows/practice-planner.ts',
  },
  {
    id: 'equipment_fit',
    name: 'Equipment Fit',
    family: 'insight',
    purpose: 'Flags when equipment data is too thin for fit guidance and what to add.',
    inputs: ['equipment completeness', 'sport'],
    outputs: ['fit score / data-needed prompts'],
    runtime: 'deterministic',
    control: 'Always on (keyless)',
    surface: { label: 'Insights', href: '/admin/insights' },
    module: 'lib/agents/workflows/equipment-fit.ts',
  },
  {
    id: 'intake_quality',
    name: 'Intake Quality',
    family: 'insight',
    purpose: 'Checks whether an upload is ready to analyze and gives filming tips when not.',
    inputs: ['upload metadata', 'sport'],
    outputs: ['ready flag', 'blocking issues', 'filming tips'],
    runtime: 'deterministic',
    control: 'Always on (keyless)',
    surface: { label: 'Uploads & Media', href: '/admin/uploads' },
    module: 'lib/agents/workflows/intake-quality.ts',
    permission: 'media.view',
  },
  {
    id: 'pre_game',
    name: 'Pre-Game',
    family: 'insight',
    purpose: 'Produces a tiny, calm pre-round/match plan (1–2 swing thoughts, warmup focus).',
    inputs: ['recent focus', 'sport'],
    outputs: ['pre-game plan'],
    runtime: 'deterministic',
    control: 'Always on (keyless)',
    surface: { label: 'Insights', href: '/admin/insights' },
    module: 'lib/agents/workflows/pre-game.ts',
  },
  {
    id: 'retention',
    name: 'Re-engagement',
    family: 'insight',
    purpose: 'Crafts an honest "come back" insight when an athlete has been away but has real history.',
    inputs: ['days since last activity', 'session count'],
    outputs: ['re-engagement insight'],
    runtime: 'deterministic',
    control: 'Always on (keyless)',
    surface: { label: 'Re-engage', href: '/admin/reengage' },
    module: 'lib/agents/workflows/retention.ts',
  },
  {
    id: 'pro_upgrade',
    name: 'Pro Upgrade Suggestion',
    family: 'insight',
    purpose: 'Suggests a relevant paid feature only when the athlete’s usage actually warrants it.',
    inputs: ['session count', 'history depth'],
    outputs: ['upgrade suggestion (or none)'],
    runtime: 'deterministic',
    control: 'Always on (keyless)',
    surface: { label: 'Monetization', href: '/admin/monetization' },
    module: 'lib/agents/workflows/pro-upgrade.ts',
    permission: 'monetization.manage',
  },
  {
    id: 'coach_sharing',
    name: 'Coach Share Summary',
    family: 'insight',
    purpose: 'Summarizes an athlete for a coach: key evidence, recent trend, questions to ask.',
    inputs: ['session history', 'diagnosis', 'trend'],
    outputs: ['coach-facing summary'],
    runtime: 'deterministic+llm',
    control: 'Keyless default; optional LLM via AI_PROVIDER',
    surface: { label: 'Insights', href: '/admin/insights' },
    module: 'lib/agents/workflows/coach-sharing.ts',
  },
  {
    id: 'parent_sharing',
    name: 'Parent Share Summary',
    family: 'insight',
    purpose: 'Safety-first, encouragement-led summary for a parent, with at-home homework.',
    inputs: ['session history', 'diagnosis'],
    outputs: ['parent-facing summary', 'safety note'],
    runtime: 'deterministic+llm',
    control: 'Keyless default; optional LLM via AI_PROVIDER',
    surface: { label: 'Insights', href: '/admin/insights' },
    module: 'lib/agents/workflows/parent-sharing.ts',
    safety: 'Youth-aware: encouragement-led, includes a safety note, never medical.',
  },
  {
    id: 'report',
    name: 'Report Builder',
    family: 'insight',
    purpose: 'Assembles session / 30-day / coach / equipment reports from structured data.',
    inputs: ['sessions', 'diagnosis', 'trend'],
    outputs: ['structured report'],
    runtime: 'deterministic+llm',
    control: 'Keyless default; optional LLM via AI_PROVIDER',
    surface: { label: 'Insights', href: '/admin/insights' },
    module: 'lib/agents/workflows/report.ts',
  },
  {
    id: 'contextual_help',
    name: 'Contextual Help',
    family: 'insight',
    purpose: 'Explains what the current screen does, the next action and common mistakes.',
    inputs: ['current page', 'profile state'],
    outputs: ['on-screen help'],
    runtime: 'deterministic',
    control: 'Always on (keyless)',
    surface: { label: 'Feature Education', href: '/admin/feature-education' },
    module: 'lib/agents/workflows/contextual-help.ts',
  },

  // ── Growth (lib/agents/growth + sub-agents) ──
  {
    id: 'growth_coordinator',
    name: 'Growth Coordinator',
    family: 'growth',
    purpose: 'Unifies the growth sub-agents into ONE "what to surface now" decision (single calm voice).',
    inputs: ['churn', 'activation', 'dispatch', 'referral'],
    outputs: ['single growth surface'],
    runtime: 'deterministic',
    control: 'Always on (keyless)',
    surface: { label: 'Growth Agents', href: '/admin/growth-agents' },
    module: 'lib/agents/growth/orchestrator.ts',
  },
  {
    id: 'churn',
    name: 'Churn Risk',
    family: 'growth',
    purpose: 'Scores churn risk and its drivers from behavioral signals; the brain behind re-engagement.',
    inputs: ['activity recency', 'engagement signals', 'daily notes'],
    outputs: ['churn risk', 'drivers'],
    runtime: 'deterministic',
    control: 'Always on (keyless)',
    surface: { label: 'Growth Agents', href: '/admin/growth-agents' },
    module: 'lib/agents/churn/engine.ts',
  },
  {
    id: 'dispatch',
    name: 'Lifecycle Dispatch',
    family: 'growth',
    purpose: 'Decides outbound lifecycle messages — draft-first, never auto-sends without review.',
    inputs: ['churn', 'activation', 'eligibility'],
    outputs: ['draft outreach decision'],
    runtime: 'deterministic',
    control: 'Draft-first; sending requires email config + review',
    surface: { label: 'Re-engage', href: '/admin/reengage' },
    module: 'lib/agents/dispatch/engine.ts',
    safety: 'Draft-first: proposes outreach but never sends without explicit review.',
  },
  {
    id: 'activation',
    name: 'Activation',
    family: 'growth',
    purpose: 'Detects funnel friction (incomplete profile, abandoned upload) and the unblocking nudge.',
    inputs: ['funnel state'],
    outputs: ['activation nudge'],
    runtime: 'deterministic',
    control: 'Always on (keyless)',
    surface: { label: 'Growth Agents', href: '/admin/growth-agents' },
    module: 'lib/agents/activation/engine.ts',
  },
  {
    id: 'earn_moments',
    name: 'Referral Moments',
    family: 'growth',
    purpose: 'Finds the genuine "you just had a win" moment to invite a share — never spammy.',
    inputs: ['recent wins', 'streaks'],
    outputs: ['referral prompt (or none)'],
    runtime: 'deterministic',
    control: 'Always on (keyless)',
    surface: { label: 'Growth Agents', href: '/admin/growth-agents' },
    module: 'lib/agents/earn-moments/engine.ts',
  },
  {
    id: 'practice_companion',
    name: 'Practice Companion',
    family: 'growth',
    purpose: 'Keeps an athlete’s practice loop alive between sessions with timely, light touches.',
    inputs: ['practice cadence', 'plan status'],
    outputs: ['companion nudge'],
    runtime: 'deterministic',
    control: 'Always on (keyless)',
    surface: { label: 'Growth Agents', href: '/admin/growth-agents' },
    module: 'lib/agents/practice-companion/engine.ts',
  },
  {
    id: 'ad_creative',
    name: 'Ad Creative',
    family: 'growth',
    purpose: 'Drafts ad creative variations with built-in compliance checks.',
    inputs: ['offer', 'audience', 'channel'],
    outputs: ['compliant creative drafts'],
    runtime: 'deterministic+llm',
    control: 'Keyless default; ads off unless NEXT_PUBLIC_ADS_* set',
    surface: { label: 'AdsOS', href: '/admin/ads' },
    module: 'lib/agents/ad-creative/engine.ts',
    permission: 'ads.manage',
    safety: 'Compliance pass screens claims before any creative is surfaced.',
  },

  // ── Content & Operator AI ──
  {
    id: 'admin_copilot',
    name: 'Admin Copilot',
    family: 'content-ai',
    purpose: 'Answers operator questions about the platform from live aggregate data — read-only.',
    inputs: ['platform metrics', 'system health', 'alerts', 'action inbox', 'coverage'],
    outputs: ['grounded answers', 'next steps'],
    runtime: 'deterministic+llm',
    control: 'Always on; optional AI via ADMIN_COPILOT_AI',
    surface: { label: 'Admin Copilot', href: '/admin/copilot' },
    module: 'lib/admin/copilot/*',
    permission: 'analytics.view',
    safety: 'Read-only: never publishes, emails or deletes. Aggregate-only (no PII).',
  },
  {
    id: 'coach_mix',
    name: 'Coach Mix',
    family: 'content-ai',
    purpose: 'Ethical coaching-influence layer: learns teaching principles and biases drills/explanations.',
    inputs: ['coach-style profiles', 'fault ontology'],
    outputs: ['style-biased drill/explanation selection'],
    runtime: 'deterministic+llm',
    control: 'Flag: NEXT_PUBLIC_COACH_MIX_USER_MODULE',
    surface: { label: 'Coach Mix', href: '/admin/coach-mix' },
    module: 'lib/central-intelligence/coach-mix/*',
    safety: 'Learns principles only — original content, never copies protected material.',
  },
  {
    id: 'feature_education',
    name: 'Feature Education Generator',
    family: 'content-ai',
    purpose: 'Detects shipped features and drafts tutorials, manuals, FAQs and video scripts.',
    inputs: ['routes/nav/API/commits', 'feature registry'],
    outputs: ['draft learning content (review-gated)'],
    runtime: 'deterministic+llm',
    control: 'Keyless default; review-gated before publish',
    surface: { label: 'Feature Education', href: '/admin/feature-education' },
    module: 'lib/feature-education/*',
    permission: 'content.edit',
    safety: 'Quality-scored + security-scanned; nothing publishes without review.',
  },
  {
    id: 'social_generator',
    name: 'Social Generator',
    family: 'content-ai',
    purpose: 'Turns published content into platform-native social posts across channels.',
    inputs: ['published blog/content'],
    outputs: ['draft social posts (per-channel)'],
    runtime: 'deterministic+llm',
    control: 'Keyless-first; optional AI',
    surface: { label: 'Social Generator', href: '/admin/social' },
    module: 'lib/social/*',
    permission: 'content.publish',
  },
  {
    id: 'video_studio',
    name: 'Video Studio',
    family: 'content-ai',
    purpose: 'Finds video gaps, writes briefs and generates/places tutorial videos.',
    inputs: ['content/video coverage'],
    outputs: ['briefs', 'generated videos (spend-gated)'],
    runtime: 'deterministic+llm',
    control: 'Spend off by default (VIDEO_STUDIO_MAX_COST_CENTS=0)',
    surface: { label: 'Video Studio', href: '/admin/video-studio' },
    module: 'lib/video-studio/*',
    permission: 'content.edit',
    safety: 'Spend capped to zero by default; pluggable providers opt-in.',
  },
  {
    id: 'milestone_authority',
    name: 'Milestone Authority',
    family: 'content-ai',
    purpose: 'Detects verifiable brand/product/SEO milestones from real metrics and drafts dedicated authority pages — never fabricated, never thin.',
    inputs: ['platform metrics', 'content registries', 'feature flags', 'milestone catalog (100 definitions)'],
    outputs: ['milestone status + progress', 'Authority Impact Score', 'page content drafts', 'published /milestones pages (admin-approved)'],
    runtime: 'deterministic',
    control: 'Always on (keyless); public pages require admin approval + commit',
    surface: { label: 'Milestone Authority', href: '/admin/milestones' },
    module: 'lib/milestones/*',
    permission: 'milestones.manage',
    safety: 'Truthful by construction: unreadable metrics → "needs data source" (never auto-earned), and a page goes public only after explicit admin approval. No fabricated numbers.',
  },
  {
    id: 'link_intelligence',
    name: 'Link Intelligence',
    family: 'content-ai',
    purpose: 'SEO authority engine: real internal links + curated backlink/competitor intelligence.',
    inputs: ['sitemap', 'SEO pages', 'library', 'blog'],
    outputs: ['internal-link recommendations', 'PR/backlink findings'],
    runtime: 'deterministic',
    control: 'Keyless-first; env-gated external adapters',
    surface: { label: 'Link Intelligence', href: '/admin/growth/link-intelligence' },
    module: 'lib/growth/link-intelligence/*',
    permission: 'seo.edit',
  },

  // ── Safety & Trust ──
  {
    id: 'guardrail',
    name: 'Safety Guardrail',
    family: 'safety',
    purpose: 'Raises youth / pain / medical-claim / overtraining flags that gate or annotate advice.',
    inputs: ['profile (age/usage)', 'session notes', 'recommendation text'],
    outputs: ['safety flags (info/caution/stop)'],
    runtime: 'deterministic',
    control: 'Always on (keyless) — cannot be disabled',
    surface: { label: 'Legal & Privacy', href: '/admin/legal' },
    module: 'lib/agents/guardrails.ts',
    permission: 'legal.manage',
    safety: 'Performance coaching only — recommends a professional, never gives medical advice.',
  },
  {
    id: 'trust_linter',
    name: 'Trust Linter',
    family: 'safety',
    purpose: 'Scans user-facing copy for unsupported claims, hype and trust violations.',
    inputs: ['copy / generated text'],
    outputs: ['claim findings', 'rewrites'],
    runtime: 'deterministic',
    control: 'Always on (keyless)',
    surface: { label: 'Audit Reports', href: '/admin/audits' },
    module: 'lib/agents/trust-linter/engine.ts',
    safety: 'Honest-first: flags overpromises before copy ships.',
  },
  {
    id: 'branch_guardian',
    name: 'BranchGuardianOS',
    family: 'safety',
    purpose: 'Git/worktree governance: scores branch & worktree health and prepares non-destructive cleanup so work is never lost and the repo stays release-ready.',
    inputs: ['committed git snapshot (scripts/scan-branches.mjs)', 'branches', 'worktrees', 'stashes'],
    outputs: ['Git Cleanliness Score', 'branch/worktree health', 'ranked cleanup recommendations', 'safe command text'],
    runtime: 'deterministic',
    control: 'Snapshot via `npm run scan:branches` (monthly); dashboard always on (keyless)',
    surface: { label: 'BranchGuardianOS', href: '/admin/branch-guardian' },
    module: 'lib/branch-guardian/*',
    permission: 'devops.manage',
    safety: 'Never runs git from the app; all cleanup is copy-paste only and destructive commands sit behind explicit approval. Protected branches are never deletion candidates.',
  },
];

// ── Helpers (pure) ─────────────────────────────────────────────

/** Group the registry by family in display order. */
export function groupAgentsByFamily(
  agents: RegisteredAgent[] = AGENT_REGISTRY,
): { family: AgentFamilyMeta; agents: RegisteredAgent[] }[] {
  return AGENT_FAMILY_META.map((family) => ({
    family,
    agents: agents.filter((a) => a.family === family.id),
  })).filter((g) => g.agents.length > 0);
}

export interface AgentRegistryStats {
  total: number;
  byFamily: Record<AgentFamily, number>;
  keyless: number;
  llmCapable: number;
  withSafety: number;
}

/** Roll-up counts for the registry header. */
export function agentRegistryStats(agents: RegisteredAgent[] = AGENT_REGISTRY): AgentRegistryStats {
  const byFamily = { insight: 0, growth: 0, 'content-ai': 0, safety: 0 } as Record<AgentFamily, number>;
  let keyless = 0;
  let llmCapable = 0;
  let withSafety = 0;
  for (const a of agents) {
    byFamily[a.family] += 1;
    if (a.runtime === 'deterministic') keyless += 1;
    if (a.runtime !== 'deterministic') llmCapable += 1;
    if (a.safety) withSafety += 1;
  }
  return { total: agents.length, byFamily, keyless, llmCapable, withSafety };
}

export const findAgent = (id: string): RegisteredAgent | undefined =>
  AGENT_REGISTRY.find((a) => a.id === id);
