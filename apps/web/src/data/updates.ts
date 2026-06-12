// ── Update Types ──────────────────────────────────────────────────────────

export type UpdateStatus =
  | 'published'
  | 'draft'
  | 'hidden'
  | 'planned'
  | 'in_progress'
  | 'beta'
  | 'coming_soon';

export type UpdateCategory =
  | 'New Feature'
  | 'Training Improvement'
  | 'Equipment'
  | 'Data & Insights'
  | 'Multi-Sport Expansion'
  | 'Golf Training'
  | 'Tennis Training'
  | 'Baseball Training'
  | 'Softball Training'
  | 'Video & Swing Comparison'
  | 'Progress Tracking'
  | 'Account & Data'
  | 'Mobile Experience'
  | 'Website'
  | 'SEO & Discoverability'
  | 'Security & Privacy'
  | 'Product Updates';

export type UpdateSport =
  | 'All Sports'
  | 'Golf'
  | 'Tennis'
  | 'Pickleball'
  | 'Padel'
  | 'Baseball'
  | 'Slow Pitch Softball'
  | 'Fast Pitch Softball';

export type UpdateVisibility = 'public' | 'private' | 'internal';

export interface Update {
  id: string;
  title: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  summary: string;
  releaseDate: string;
  displayDate: string;
  category: UpdateCategory;
  status: UpdateStatus;
  audience?: string[];
  sport?: UpdateSport;
  relatedFeature?: string;
  userBenefit: string;
  whyItMatters: string;
  /** Optional honest "previous experience → improved experience" comparison,
   *  rendered as the Before vs After section on the dedicated update page. */
  beforeAfter?: { before: string; after: string };
  whereToFindIt?: string;
  userActionRequired?: string;
  seoKeywords?: string[];
  answerEngineSummary?: string;
  generativeSearchSummary?: string;
  internalLinkTargets?: string[];
  visibility: UpdateVisibility;
  sortOrder: number;
  isFeatured?: boolean;
  isMajorMilestone?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Auto-generated entries (populated by scripts/generate-updates.mjs) ───
// Entries here come from `Update:` commit trailers and land as DRAFTS until you
// flip status→published / visibility→public. See docs/AUTO_PUBLISH_UPDATES.md.
import autoUpdatesJson from './auto-updates.json';
const AUTO_UPDATES = autoUpdatesJson as unknown as Update[];

// Seed UPDATES are size-sharded into siblings (roadmap #20) so no single data
// file exceeds ~600 lines. Spread back in order below — no behavior change.
import { UPDATES_PART_1 } from './updatesPart1';
import { UPDATES_PART_2 } from './updatesPart2';
import { UPDATES_PART_3 } from './updatesPart3';

// ── Visibility logic ──────────────────────────────────────────────────────

export function isPublicUpdate(update: Update): boolean {
  if (update.visibility === 'private' || update.visibility === 'internal') return false;
  if (update.status === 'draft' || update.status === 'hidden') return false;
  if (update.status === 'published') return true;
  // beta, planned, in_progress, coming_soon require explicit public visibility
  return update.visibility === 'public';
}

function allUpdates(): Update[] {
  return [...UPDATES, ...AUTO_UPDATES];
}

/**
 * Every update (seed + auto-generated), UNFILTERED. Used by the override-aware
 * server read path so a durable PublishingOS decision can promote a draft to
 * public or pull a live entry, without editing this registry. Pure (no IO).
 */
export function getAllUpdates(): Update[] {
  return allUpdates();
}

export function getPublicUpdates(): Update[] {
  // Strictly chronological — most recent update first.
  return allUpdates()
    .filter(isPublicUpdate)
    .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
}

export function getFeaturedUpdate(): Update | undefined {
  const pub = getPublicUpdates();
  return pub.find((u) => u.isFeatured) ?? pub[0];
}

export function getMilestones(): Update[] {
  return allUpdates().filter((u) => isPublicUpdate(u) && u.isMajorMilestone).sort(
    (a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime(),
  );
}

// ── Plain-English update template ────────────────────────────────────────
//
// Use this as your starting point when writing a new update.
// See docs/HOW_TO_PUBLISH_UPDATES.md for the full publishing guide.
//
// Example transformation:
//   Technical note: "Added equipment diagnostic data model and brand selector"
//   → title: "New Equipment Diagnostic Tool"
//   → summary: "You can now add details about your equipment..."

export const UPDATE_TEMPLATE: Omit<Update, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '',
  slug: '',
  summary: '',
  releaseDate: '',
  displayDate: '',
  category: 'Product Updates',
  status: 'draft',
  visibility: 'private',
  sortOrder: 0,
  userBenefit: '',
  whyItMatters: '',
  whereToFindIt: '',
  userActionRequired: '',
  seoKeywords: [],
  answerEngineSummary: '',
  generativeSearchSummary: '',
  isFeatured: false,
  isMajorMilestone: false,
};

// ── Seed updates ─────────────────────────────────────────────────────────

export const UPDATES: Update[] = [
  // Size-sharded (parts 1→3) but spread in the original order, so this array is
  // equivalent to the pre-split seed registry.
  ...UPDATES_PART_1,
  ...UPDATES_PART_2,
  ...UPDATES_PART_3,
];
