// ============================================================
// SwingVantage — Video Studio: Placement Resolver
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   This decides WHAT renders at a given placement id. It does NOT
//   replace the existing tutorial video map (lib/tutorial/placements) —
//   it EXTENDS it. Every tutorial placement is seeded in here as a
//   read-only entry (source: 'tutorial'), and studio-managed placements
//   (source: 'studio', created in the admin Placement Manager) layer on
//   top by id.
//
//   `<SmartVideoSlot placement="…">` calls resolvePlacement() to get the
//   placement rules + the asset to play (when one is assigned and
//   published). If nothing is assigned, the slot falls back to its honest
//   written state — exactly like the tutorial "coming soon" pattern.
// ============================================================

import type { StudioPlacement, VideoAsset, StudioSport, JourneyStage } from './types';
import { TUTORIAL_PLACEMENTS } from '@/lib/tutorial/placements';
import { APP_SURFACES } from './surfaces';

/** Map a tutorial placement into a read-only studio placement. */
function fromTutorial(p: (typeof TUTORIAL_PLACEMENTS)[number]): StudioPlacement {
  // Try to line the tutorial placement up with a known app surface.
  const surface = APP_SURFACES.find(
    (s) => s.page === p.page && s.journeyStage === (p.journeyStage as JourneyStage),
  );
  return {
    id: p.id,
    assetId: undefined, // tutorial videos serve from lib/tutorial, not studio assets
    surfaceId: surface?.id ?? `tutorial:${p.id}`,
    page: p.page,
    zone: p.location,
    display: p.display === 'inline' ? 'inline' : 'card',
    trigger: p.trigger === 'muted-autoplay' ? 'muted-autoplay' : 'click-to-play',
    audience: 'all',
    sport: 'all',
    device: 'all',
    priority: 50,
    cta: p.cta,
    blurb: p.blurb,
    captionsRequired: p.captionsRequired,
    journeyStage: p.journeyStage as JourneyStage,
    enabled: true,
    source: 'tutorial',
  };
}

/** The read-only placements seeded from the tutorial video map. */
export function seedPlacements(): StudioPlacement[] {
  return TUTORIAL_PLACEMENTS.map(fromTutorial);
}

/**
 * Merge studio-managed placements over the tutorial seeds (by id). Studio
 * entries win; new studio ids are appended.
 */
export function mergePlacements(studio: StudioPlacement[] = []): StudioPlacement[] {
  const byId = new Map<string, StudioPlacement>();
  for (const p of seedPlacements()) byId.set(p.id, p);
  for (const p of studio) byId.set(p.id, p);
  return [...byId.values()];
}

export interface ResolveContext {
  /** Studio placements from the repo (admin-created). */
  studio?: StudioPlacement[];
  /** Published assets from the repo, by id. */
  assets?: Record<string, VideoAsset>;
  /** Active sport for sport gating. */
  sport?: StudioSport | 'all';
  /** Active device for device gating. */
  device?: 'mobile' | 'desktop';
  now?: Date;
}

export interface ResolvedPlacement {
  placement: StudioPlacement;
  /** The asset to render, when assigned, published, and in-window. */
  asset?: VideoAsset;
  /** True when the slot should fall back to its honest written state. */
  fallback: boolean;
}

function inWindow(p: StudioPlacement, now: Date): boolean {
  if (p.startAt && new Date(p.startAt) > now) return false;
  if (p.endAt && new Date(p.endAt) < now) return false;
  return true;
}

function audienceOk(p: StudioPlacement, sport?: StudioSport | 'all'): boolean {
  if (p.sport === 'all' || !sport || sport === 'all') return true;
  return p.sport === sport;
}

/**
 * Resolve a placement id to its rules + the asset to render. Honors enabled,
 * date window, sport, and device gating. Returns fallback:true when there is
 * no servable asset (so the slot shows its written state honestly).
 */
export function resolvePlacement(id: string, ctx: ResolveContext = {}): ResolvedPlacement | undefined {
  const now = ctx.now ?? new Date();
  const all = mergePlacements(ctx.studio);
  const placement = all.find((p) => p.id === id);
  if (!placement) return undefined;

  const gatedOut =
    !placement.enabled ||
    !inWindow(placement, now) ||
    !audienceOk(placement, ctx.sport) ||
    (placement.device !== 'all' && ctx.device && placement.device !== ctx.device);

  if (gatedOut) return { placement, fallback: true };

  const asset = placement.assetId ? ctx.assets?.[placement.assetId] : undefined;
  const servable = asset && asset.published;
  return { placement, asset: servable ? asset : undefined, fallback: !servable };
}

/** All placements for a page (seed + studio), enabled first. */
export function placementsForPage(page: string, studio: StudioPlacement[] = []): StudioPlacement[] {
  return mergePlacements(studio)
    .filter((p) => p.page === page)
    .sort((a, b) => b.priority - a.priority);
}
