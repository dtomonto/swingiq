// ============================================================
// SwingVantage Admin — feature flag registry (isomorphic)
// ------------------------------------------------------------
// Declares the flags an operator can manage. The persisted override
// values live in stores/feature-flags.ts; features read the effective
// value via `isFlagEnabled(key)`.
//
// HONESTY: `status` says whether app code already consumes a flag.
//   • 'wired'    — a real feature reads this flag today.
//   • 'registry' — the toggle persists and is ready to be consumed,
//                  but no feature reads it yet (no silent no-ops).
// ============================================================

export type FlagRisk = 'low' | 'medium' | 'high';
export type FlagStatus = 'wired' | 'registry';

export interface FlagDef {
  key: string;
  label: string;
  description: string;
  group: string;
  owner: string;
  defaultEnabled: boolean;
  risk: FlagRisk;
  status: FlagStatus;
}

export interface FlagOverride {
  enabled: boolean;
  /** 0–100. Informational rollout target (cohorting is feature-specific). */
  rolloutPct: number;
  /** Free-form audience/sport segment labels this rollout targets. */
  segments: string[];
  updatedAt: string;
  updatedBy: string;
}

export const FLAG_DEFS: FlagDef[] = [
  {
    key: 'recording.in_app',
    label: 'In-app video recording',
    description: 'Show the browser swing recorder on the upload screen.',
    group: 'Capture', owner: 'Product', defaultEnabled: true, risk: 'low', status: 'registry',
  },
  {
    key: 'ai.autopublish_fixes',
    label: 'Auto-publish generated fix pages',
    description: 'Allow high-scoring AI fix pages to publish without human review. Keep OFF for safety.',
    group: 'AI', owner: 'AI Review', defaultEnabled: false, risk: 'high', status: 'registry',
  },
  {
    key: 'ads.paid_enabled',
    label: 'Paid ads',
    description: 'Allow paid ad networks to serve (in addition to house ads). Mirrors NEXT_PUBLIC_ADS_*.',
    group: 'Monetization', owner: 'Monetization', defaultEnabled: false, risk: 'medium', status: 'registry',
  },
  {
    key: 'content.generated_drafts',
    label: 'AI content drafts',
    description: 'Enable AI-generated draft creation across blog/SEO tooling.',
    group: 'Content', owner: 'Content', defaultEnabled: true, risk: 'low', status: 'registry',
  },
  {
    key: 'bodysync.enabled',
    label: 'BodySync wellness layer',
    description: 'Expose the readiness / wellness intelligence surface.',
    group: 'Experimental', owner: 'Product', defaultEnabled: true, risk: 'low', status: 'registry',
  },
  {
    key: 'motion_lab.enabled',
    label: 'Motion Lab (3D)',
    description: 'Browser-side 3D motion analysis lab. Live today at /motion-lab — default reflects that.',
    group: 'Experimental', owner: 'Product', defaultEnabled: true, risk: 'medium', status: 'registry',
  },

  // ── Coaching Intelligence initiative (see /admin/development) ──
  {
    key: 'coaching_intelligence_enabled',
    label: 'Coaching Intelligence',
    description: 'Master switch for the coaching-strategy initiative. Today the engine (Coach Mix) is admin-gated by route; this flag is reserved for the staged rollout.',
    group: 'Coaching Intelligence', owner: 'Product', defaultEnabled: false, risk: 'medium', status: 'registry',
  },
  {
    key: 'admin_coach_strategy_lab_enabled',
    label: 'Coach Strategy Lab (admin)',
    description: 'Gate for the admin Coach Mix / Coach Strategy Lab console. The console is reachable via admin nav today; this flag is reserved for future per-operator gating.',
    group: 'Coaching Intelligence', owner: 'Product', defaultEnabled: false, risk: 'low', status: 'registry',
  },
  {
    key: 'curated_drills_widget_enabled',
    label: 'Curated Swing Drills widget',
    description: 'Athlete-facing "Curated Swing Drills for Your Current Game" module. The live switch today is the NEXT_PUBLIC_COACH_MIX_USER_MODULE env var; this operator flag is reserved for the in-app rollout.',
    group: 'Coaching Intelligence', owner: 'Product', defaultEnabled: false, risk: 'medium', status: 'registry',
  },
  {
    key: 'ai_video_learning_pipeline_enabled',
    label: 'AI drill & video learning pipeline',
    description: 'Enable the AI video-concept generation pipeline once built. Planned — nothing reads this yet.',
    group: 'Coaching Intelligence', owner: 'AI Review', defaultEnabled: false, risk: 'medium', status: 'registry',
  },
  {
    key: 'development_roadmap_visible_to_admin',
    label: 'Development Roadmap (admin)',
    description: 'The /admin/development roadmap is admin-only via the route guard today; this flag is reserved for hiding it from non-owner admins later.',
    group: 'Coaching Intelligence', owner: 'Product', defaultEnabled: true, risk: 'low', status: 'registry',
  },
  {
    key: 'development_roadmap_visible_to_public',
    label: 'Development Roadmap (public)',
    description: 'Expose a public version of the development roadmap. OFF — no public route consumes this yet.',
    group: 'Coaching Intelligence', owner: 'Product', defaultEnabled: false, risk: 'medium', status: 'registry',
  },

  // ── Mental Performance pillar ──────────────────────────────
  {
    key: 'mental_performance.enabled',
    label: 'Mental Performance',
    description: 'Master switch for the emotion-management & mistake-recovery pillar (landing, /mental coach, journal, plans, dashboard card). Content is keyless and safe, so it ships ON; this is the kill-switch. Mirrors NEXT_PUBLIC_MENTAL_PERFORMANCE.',
    group: 'Experimental', owner: 'Product', defaultEnabled: true, risk: 'low', status: 'registry',
  },
  {
    key: 'mental_performance.ai_enabled',
    label: 'Mental Performance AI polish',
    description: 'Optional AI-rewrite of the deterministic coach output. OFF by default and cost-capped; the keyless coach is always complete on its own. Mirrors MENTAL_AI_ENABLED.',
    group: 'Experimental', owner: 'AI Review', defaultEnabled: false, risk: 'medium', status: 'registry',
  },
];

export const findFlagDef = (key: string): FlagDef | undefined =>
  FLAG_DEFS.find((f) => f.key === key);

/** Effective enabled state given the definition default and any override. */
export function evalFlag(def: FlagDef, override?: FlagOverride): boolean {
  return override ? override.enabled : def.defaultEnabled;
}
