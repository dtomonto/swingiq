// ============================================================
// SwingVantage — Feature Education Engine: Publishing Workflow
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   The status machine + version trail that moves an asset from a generated
//   draft to published and back (spec §8, §19). Pure functions return the
//   next asset, a version snapshot (for rollback), and an audit entry — the
//   API routes do the actual persistence + any cross-system handoff.
//
//   Flow: detected → draft → needs-review → approved → published
//                                         ↘ (reject) ↗
//         published → updated (on regenerate) → needs-review → …
//         any → deprecated/archived
// ============================================================

import {
  type EducationAsset,
  type AssetVersion,
  type AssetStatus,
  type PublishTarget,
  type FeeAuditLog,
  makeFeeAudit,
} from './types';
import { isSafeToPublish } from './security';

/** Allowed status transitions (for UI gating + validation). */
export const ASSET_TRANSITIONS: Record<AssetStatus, AssetStatus[]> = {
  detected: ['draft'],
  draft: ['needs-review', 'approved', 'archived'],
  'needs-review': ['approved', 'draft', 'archived'],
  approved: ['published', 'needs-review', 'archived'],
  published: ['updated', 'deprecated', 'archived'],
  updated: ['needs-review', 'approved', 'archived'],
  deprecated: ['archived', 'draft'],
  archived: ['draft'],
};

export function canTransition(from: AssetStatus, to: AssetStatus): boolean {
  return ASSET_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Map an asset to its natural publish destination (spec §8). */
export function defaultPublishTarget(asset: EducationAsset): PublishTarget {
  switch (asset.type) {
    case 'seo-article':
      return 'seo';
    case 'release-note':
      return 'updates';
    case 'video-brief':
      return 'video-studio';
    case 'course-module':
      return 'academy';
    case 'in-app-help':
      return 'in-app';
    case 'support-enablement':
      return 'support-macros';
    case 'admin-guide':
      return 'internal-kb';
    default:
      return 'help-center';
  }
}

export interface WorkflowOptions {
  actor?: string;
  note?: string;
  now?: Date;
}

interface WorkflowResult {
  asset: EducationAsset;
  version: AssetVersion;
  audit: FeeAuditLog;
}

export function makeVersion(
  asset: EducationAsset,
  changeReason: string,
  actor: string,
  now: Date,
): AssetVersion {
  return {
    id: `ver_${asset.id}_v${asset.version}`,
    assetId: asset.id,
    featureId: asset.featureId,
    version: asset.version,
    changeReason,
    status: asset.status,
    snapshot: asset,
    actor,
    createdAt: now.toISOString(),
    isCurrent: true,
  };
}

/** Apply an admin review decision (approve / reject). */
export function applyReview(
  asset: EducationAsset,
  decision: 'approve' | 'reject',
  opts: WorkflowOptions = {},
): WorkflowResult {
  const now = opts.now ?? new Date();
  const actor = opts.actor ?? 'admin';
  const iso = now.toISOString();
  if (decision === 'approve') {
    const next: EducationAsset = {
      ...asset,
      status: 'approved',
      approvedBy: actor,
      needsHumanReview: false,
      updatedAt: iso,
    };
    return {
      asset: next,
      version: makeVersion(next, opts.note ? `Approved: ${opts.note}` : 'Approved', actor, now),
      audit: makeFeeAudit('asset_approved', asset.id, `Approved ${asset.type} for ${asset.featureId}.`, {
        actor,
        detail: { note: opts.note },
        now,
      }),
    };
  }
  const next: EducationAsset = { ...asset, status: 'needs-review', updatedAt: iso };
  return {
    asset: next,
    version: makeVersion(next, opts.note ? `Sent back: ${opts.note}` : 'Sent back for changes', actor, now),
    audit: makeFeeAudit('asset_rejected', asset.id, `Sent ${asset.type} back for changes.`, {
      actor,
      detail: { note: opts.note },
      now,
    }),
  };
}

/** Fold a freshly-regenerated asset onto the existing one (version bump). */
export function prepareRegenerated(
  oldAsset: EducationAsset,
  newAsset: EducationAsset,
  opts: WorkflowOptions = {},
): WorkflowResult {
  const now = opts.now ?? new Date();
  const actor = opts.actor ?? 'admin';
  const merged: EducationAsset = {
    ...newAsset,
    id: oldAsset.id,
    featureId: oldAsset.featureId,
    version: oldAsset.version + 1,
    createdAt: oldAsset.createdAt,
    status: 'updated',
    updatedAt: now.toISOString(),
  };
  return {
    asset: merged,
    version: makeVersion(merged, opts.note ?? 'Regenerated from latest feature data', actor, now),
    audit: makeFeeAudit('asset_regenerated', merged.id, `Regenerated ${merged.type} (v${merged.version}).`, {
      actor,
      now,
    }),
  };
}

/** Whether an asset is allowed to publish right now. */
export function canPublish(asset: EducationAsset): { ok: boolean; reason?: string } {
  if (asset.status !== 'approved') {
    return { ok: false, reason: 'Asset must be approved before publishing.' };
  }
  if (asset.quality && !asset.quality.passed) {
    return { ok: false, reason: `Quality below threshold (${asset.quality.overall}/${asset.quality.threshold}).` };
  }
  if (!isSafeToPublish(asset)) {
    return { ok: false, reason: 'Security scan blocks publishing (sensitive content detected).' };
  }
  return { ok: true };
}

/** Publish an approved asset to a target. Caller should verify canPublish first. */
export function applyPublish(
  asset: EducationAsset,
  target: PublishTarget | undefined,
  opts: WorkflowOptions = {},
): WorkflowResult {
  const now = opts.now ?? new Date();
  const actor = opts.actor ?? 'admin';
  const t = target ?? defaultPublishTarget(asset);
  const next: EducationAsset = {
    ...asset,
    status: 'published',
    publishTarget: t,
    updatedAt: now.toISOString(),
  };
  return {
    asset: next,
    version: makeVersion(next, `Published to ${t}`, actor, now),
    audit: makeFeeAudit('asset_published', asset.id, `Published ${asset.type} → ${t}.`, {
      actor,
      detail: { target: t },
      now,
    }),
  };
}

/** Unpublish (back to approved) or archive an asset. */
export function applyStatus(
  asset: EducationAsset,
  to: AssetStatus,
  opts: WorkflowOptions = {},
): WorkflowResult {
  const now = opts.now ?? new Date();
  const actor = opts.actor ?? 'admin';
  const next: EducationAsset = { ...asset, status: to, updatedAt: now.toISOString() };
  const action = to === 'archived' ? 'asset_archived' : 'asset_unpublished';
  return {
    asset: next,
    version: makeVersion(next, `Status → ${to}`, actor, now),
    audit: makeFeeAudit(action, asset.id, `${asset.type} status → ${to}.`, { actor, now }),
  };
}
