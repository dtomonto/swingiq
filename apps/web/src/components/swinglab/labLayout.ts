// ============================================================
// SwingVantage — SwingLab 2.0: isometric floor layout (Phase 2)
// ------------------------------------------------------------
// Hand-tuned positions for the interactive isometric lab map. Kept
// separate from the canonical station data (content/swinglab.ts) so the
// semantic model stays presentation-free and a future first-person / 3D
// build (Phase 4) can reuse these same floor coordinates as its layout.
//
// Positions are percentages of the map stage (left%, top%), arranged in
// a diamond "facility" composition with the AI Coach (the brain) at the
// core and the Entry Atrium at the front door.
// ============================================================

export interface StationPlacement {
  /** Horizontal position on the stage, 0–100 (% from left). */
  left: number;
  /** Vertical position on the stage, 0–100 (% from top). */
  top: number;
}

export const STATION_LAYOUT: Record<string, StationPlacement> = {
  'recovery-readiness-dock': { left: 50, top: 9 }, // back point
  'motion-capture-studio': { left: 27, top: 24 },
  'learning-academy-wing': { left: 73, top: 24 },
  'player-profile-wall': { left: 14, top: 43 },
  'ai-coach-console': { left: 50, top: 41 }, // core / brain
  'film-room': { left: 86, top: 43 },
  'equipment-bay': { left: 28, top: 62 },
  'training-plan-lab': { left: 72, top: 62 },
  'recruiting-studio': { left: 50, top: 65 },
  'entry-atrium': { left: 50, top: 86 }, // front door
};

/**
 * The default "suggested journey" drawn as a connective path on the map:
 * walk in → capture a swing → let the coach read it → get a plan → prove it.
 * Personalization (Phase 2b) can override the highlighted next step, but
 * this is the honest generic flow for logged-out / no-data visitors.
 */
export const RECOMMENDED_PATH: string[] = [
  'entry-atrium',
  'motion-capture-studio',
  'ai-coach-console',
  'training-plan-lab',
  'film-room',
];
