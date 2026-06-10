// ============================================================
// Keys & Secrets — provider auto-detection (PURE, client-safe)
// ------------------------------------------------------------
// "Plug in a key → the source auto-populates." Given a pasted value, match it
// against each managed key's format pattern and return the most specific match,
// so the UI can pre-select the right env var + provider. Heuristic only — the
// operator always confirms before saving.
// ============================================================

import { MANAGED_KEYS, type ManagedKey } from './registry';

export interface DetectionResult {
  key: ManagedKey;
  /** 'format' = matched a provider-specific pattern; 'weak' = generic shape. */
  confidence: 'format' | 'weak';
}

/**
 * Detect which managed key a pasted value most likely is. Returns the candidates
 * ranked best-first (a value like a Supabase JWT can match more than one key, so
 * the UI shows the top guess and lets the operator pick another).
 */
export function detectKeyCandidates(value: string): DetectionResult[] {
  const v = (value ?? '').trim();
  if (!v) return [];
  const matches: DetectionResult[] = [];
  for (const key of MANAGED_KEYS) {
    if (key.detect && key.detect.test(v)) {
      matches.push({ key, confidence: 'format' });
    }
  }
  // Prefer secret/provider-specific keys (longer, more specific patterns) first.
  return matches.sort((a, b) => patternSpecificity(b.key) - patternSpecificity(a.key));
}

/** The single best guess, or null. */
export function detectKey(value: string): ManagedKey | null {
  return detectKeyCandidates(value)[0]?.key ?? null;
}

/** A rough specificity score so e.g. `sk-ant-` beats a generic JWT match. */
function patternSpecificity(key: ManagedKey): number {
  const src = key.detect?.source ?? '';
  // Provider-prefixed patterns (literal prefixes) are more specific than the
  // generic JWT/uuid shapes shared by several keys.
  let score = src.length;
  if (/sk-ant|sk_|pk_|whsec_|re_|ghp_|github_pat|phc_|^.\^G-|AIza/.test(src)) score += 100;
  return score;
}
