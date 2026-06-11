// ============================================================
// SwingVantage — Motion Lab: Overlay Density Presets
// ------------------------------------------------------------
// The Video Overlay Lab can draw seven analysis layers. Showing all
// of them at once overwhelms a casual user; showing one is too thin
// for a coach. Density presets solve this with progressive disclosure:
//
//   • simple — one key overlay + the contact marker + phase label
//   • coach  — phases, key body angles, contact and balance
//   • lab    — every available overlay for a full breakdown
//
// The presets live here (not in the React component) so the player and
// the admin MotionLab surface read the SAME source of truth and the
// mapping is unit-testable.
// ============================================================

export type OverlayLayerId =
  | 'skeleton'
  | 'angles'
  | 'balance'
  | 'contact'
  | 'path'
  | 'footwork'
  | 'phase';

export type OverlayDensity = 'simple' | 'coach' | 'lab' | 'custom';

export type OverlayLayerState = Record<OverlayLayerId, boolean>;

/** Render order + display metadata for every overlay layer. */
export const OVERLAY_LAYER_META: ReadonlyArray<{ id: OverlayLayerId; label: string }> = [
  { id: 'skeleton', label: 'Skeleton' },
  { id: 'angles', label: 'Joint angles' },
  { id: 'balance', label: 'Balance' },
  { id: 'contact', label: 'Contact' },
  { id: 'path', label: 'Swing path' },
  { id: 'footwork', label: 'Footwork' },
  { id: 'phase', label: 'Phase' },
];

const ALL_OFF: OverlayLayerState = {
  skeleton: false, angles: false, balance: false, contact: false, path: false, footwork: false, phase: false,
};

/**
 * The layers each density turns on. `custom` is not a preset — it is the state
 * a user lands in after manually toggling a single layer.
 */
export const OVERLAY_DENSITY_PRESETS: Record<Exclude<OverlayDensity, 'custom'>, OverlayLayerState> = {
  // Casual: one key overlay (the body), where contact happens, and the phase.
  simple: { ...ALL_OFF, skeleton: true, contact: true, phase: true },
  // Serious athlete / coach: add angles + balance for a real read.
  coach: { ...ALL_OFF, skeleton: true, angles: true, balance: true, contact: true, path: true, phase: true },
  // Lab: everything available.
  lab: { skeleton: true, angles: true, balance: true, contact: true, path: true, footwork: true, phase: true },
};

export const OVERLAY_DENSITY_LABEL: Record<Exclude<OverlayDensity, 'custom'>, string> = {
  simple: 'Simple',
  coach: 'Coach',
  lab: 'Lab',
};

export const OVERLAY_DENSITY_HINT: Record<Exclude<OverlayDensity, 'custom'>, string> = {
  simple: 'One key overlay + contact',
  coach: 'Phases, angles, balance & contact',
  lab: 'Every available overlay',
};

/** The preset layer-map for a density (lab for the unreachable 'custom'). */
export function layersForDensity(density: OverlayDensity): OverlayLayerState {
  if (density === 'custom') return { ...OVERLAY_DENSITY_PRESETS.lab };
  return { ...OVERLAY_DENSITY_PRESETS[density] };
}

/**
 * Which density (if any) a layer-map exactly matches — so toggling a single
 * layer flips the selector to 'custom' instead of lying about a preset.
 */
export function densityForLayers(layers: OverlayLayerState): OverlayDensity {
  for (const key of ['simple', 'coach', 'lab'] as const) {
    const preset = OVERLAY_DENSITY_PRESETS[key];
    if (OVERLAY_LAYER_META.every(({ id }) => preset[id] === layers[id])) return key;
  }
  return 'custom';
}
