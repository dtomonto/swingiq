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
];

export const findFlagDef = (key: string): FlagDef | undefined =>
  FLAG_DEFS.find((f) => f.key === key);

/** Effective enabled state given the definition default and any override. */
export function evalFlag(def: FlagDef, override?: FlagOverride): boolean {
  return override ? override.enabled : def.defaultEnabled;
}
