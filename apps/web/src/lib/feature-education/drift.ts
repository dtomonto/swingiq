// ============================================================
// SwingVantage — Feature Education Engine: Drift Detection
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   Documentation should never silently go stale (spec §7). When the product
//   changes but the docs don't, this flags it and proposes a fix:
//     - a feature was REMOVED but still has live assets       → retire
//     - a feature's surfaces CHANGED (fingerprint differs)    → regenerate
//     - an asset is OLD (older than the freshness window)      → review
//     - a feature's detection confidence DROPPED below review  → review
//
//   Pure + deterministic. The API "scan/drift" route feeds it the previous
//   registry (from the repo) and the freshly-detected one.
// ============================================================

import {
  type FeatureRecord,
  type EducationAsset,
  type DriftFinding,
  type DriftKind,
  type RiskLevel,
} from './types';

const STALE_AFTER_DAYS = 120;

function isStale(updatedAt: string | undefined, now: Date): boolean {
  if (!updatedAt) return false;
  return now.getTime() - new Date(updatedAt).getTime() > STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;
}

function make(
  feature: FeatureRecord,
  kind: DriftKind,
  detail: string,
  action: DriftFinding['proposedAction'],
  severity: RiskLevel,
  now: Date,
  assetId?: string,
): DriftFinding {
  return {
    id: `drift_${feature.id}_${kind}${assetId ? `_${assetId}` : ''}`,
    featureId: feature.id,
    assetId,
    kind,
    detail,
    proposedAction: action,
    severity,
    createdAt: now.toISOString(),
  };
}

export interface DriftOptions {
  /** The registry as it was before the latest scan (for fingerprint diff). */
  previous?: FeatureRecord[];
  now?: Date;
}

/**
 * Compare the current registry + assets (and optionally the previous registry)
 * and return drift findings ranked by severity.
 */
export function detectDrift(
  features: FeatureRecord[],
  assets: EducationAsset[],
  opts: DriftOptions = {},
): DriftFinding[] {
  const now = opts.now ?? new Date();
  const prevById = new Map((opts.previous ?? []).map((f) => [f.id, f]));
  const assetsByFeature = new Map<string, EducationAsset[]>();
  for (const a of assets) {
    const arr = assetsByFeature.get(a.featureId) ?? [];
    arr.push(a);
    assetsByFeature.set(a.featureId, arr);
  }

  const findings: DriftFinding[] = [];

  for (const f of features) {
    const own = (assetsByFeature.get(f.id) ?? []).filter((a) => a.status !== 'archived');
    const live = own.filter((a) => a.status === 'published');

    // 1. Removed feature with live/active assets.
    if ((f.status === 'removed' || f.category === 'removed') && own.length > 0) {
      for (const a of own) {
        findings.push(
          make(f, 'route-removed', `${f.name} was removed but its ${a.type} is still active.`, 'retire', 'high', now, a.id),
        );
      }
      continue;
    }

    // 2. Surfaces changed since last scan (fingerprint diff) → regenerate assets.
    const prev = prevById.get(f.id);
    if (prev && prev.fingerprint !== f.fingerprint && own.length > 0) {
      for (const a of own) {
        findings.push(
          make(
            f,
            'route-changed',
            `${f.name} changed (routes/components/flags differ from when its ${a.type} was written).`,
            'regenerate',
            a.status === 'published' ? 'high' : 'medium',
            now,
            a.id,
          ),
        );
      }
    }

    // 3. Stale assets (older than the freshness window).
    for (const a of own) {
      if (isStale(a.updatedAt, now)) {
        findings.push(
          make(f, 'stale-age', `${a.type} for ${f.name} hasn't been refreshed in ${STALE_AFTER_DAYS}+ days.`, 'review', 'low', now, a.id),
        );
      }
    }

    // 4. Confidence dropped below review threshold but assets are live.
    if (f.needsHumanReview && live.length > 0) {
      findings.push(
        make(f, 'copy-changed', `${f.name} is now low-confidence but has published learning assets — re-confirm accuracy.`, 'review', 'medium', now),
      );
    }
  }

  const rank: Record<RiskLevel, number> = { high: 3, medium: 2, low: 1 };
  return findings.sort((a, b) => rank[b.severity] - rank[a.severity]);
}
