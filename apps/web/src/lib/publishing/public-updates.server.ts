// ============================================================
// PublishingOS — override-aware public updates read (SERVER-ONLY)
// ------------------------------------------------------------
// The seam that lets a durable PublishingOS publish decision actually change the
// public /updates list in production (where the filesystem is read-only). It
// merges the durable override map on top of each update's base visibility.
//
// ADDITIVE & SAFE: with no overrides (keyless default, or nothing toggled) it
// returns exactly what getPublicUpdates() returns today — a fully reversible
// wrapper. Cache freshness is handled by revalidatePath('/updates') in the
// publish API route (on-demand ISR).
// ============================================================

import { getAllUpdates, isPublicUpdate, type Update } from '@/data/updates';
import { getPublishOverrides } from './store';
import { applyOverrides } from './overrides';

/** Public updates with durable overrides applied, newest-first (pinned first). */
export async function getEffectivePublicUpdates(): Promise<Update[]> {
  const overrides = await getPublishOverrides('update');
  const effective = applyOverrides(getAllUpdates(), overrides, isPublicUpdate);
  return effective.sort((a, b) => {
    if (!!a.isPinned !== !!b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
  });
}

/** Featured update from the override-aware set (mirrors getFeaturedUpdate). */
export async function getEffectiveFeaturedUpdate(): Promise<Update | undefined> {
  const pub = await getEffectivePublicUpdates();
  return pub.find((u) => u.isFeatured) ?? pub[0];
}

/** Major milestones from the override-aware set (mirrors getMilestones). */
export async function getEffectiveMilestones(): Promise<Update[]> {
  const pub = await getEffectivePublicUpdates();
  return pub
    .filter((u) => u.isMajorMilestone)
    .sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime());
}
