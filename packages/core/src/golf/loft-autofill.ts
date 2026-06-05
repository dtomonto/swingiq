// ============================================================
// SwingVantage — Golf Club Loft Autofill Service
// Provides loft lookup and gapping analysis for the golf bag.
// Sources: manufacturer specs, generic industry defaults.
// ============================================================

export type LoftSource = 'manufacturer_model' | 'generic_default' | 'user_custom' | 'unknown';
export type LoftConfidence = 'high' | 'medium' | 'low';

export interface LoftLookupResult {
  loft: number | null;
  source: LoftSource;
  confidence: LoftConfidence;
  label: string; // human-readable e.g. "Estimated (generic default)"
  editable: boolean;
}

export interface ClubLoftEntry {
  clubType: string; // 'driver', '3_wood', '7_iron', etc.
  brand?: string;
  model?: string;
  generation?: string;
  loft: number;
  source: LoftSource;
  confidence: LoftConfidence;
}

// ──────────────────────────────────────────────────────────────
// Generic default loft table (industry average / typical range midpoint)
// ──────────────────────────────────────────────────────────────

const GENERIC_LOFTS: Record<string, number> = {
  // Driver
  driver: 10.5,
  // Fairway Woods
  '2_wood': 12,
  '3_wood': 15,
  '4_wood': 17,
  '5_wood': 18,
  '7_wood': 21,
  '9_wood': 24,
  // Hybrids
  '2_hybrid': 17,
  '3_hybrid': 19,
  '4_hybrid': 22,
  '5_hybrid': 25,
  '6_hybrid': 29,
  // Irons
  '1_iron': 16,
  '2_iron': 18,
  '3_iron': 21,
  '4_iron': 24,
  '5_iron': 27,
  '6_iron': 30,
  '7_iron': 34,
  '8_iron': 38,
  '9_iron': 42,
  // Wedges
  pw: 46,
  gw: 50,
  sw: 55,
  lw: 60,
  chipper: 36,
  putter: 4,
  // Aliases / alternate spellings
  pitching_wedge: 46,
  gap_wedge: 50,
  approach_wedge: 50,
  sand_wedge: 55,
  lob_wedge: 60,
};

// ──────────────────────────────────────────────────────────────
// Manufacturer / model specific lookup table (30+ entries)
// ──────────────────────────────────────────────────────────────

interface ModelEntry {
  brand: string;
  model: string;
  clubType: string;
  loft: number;
  generation?: string;
  notes?: string;
}

const MODEL_LOFTS: ModelEntry[] = [
  // ── Drivers ───────────────────────────────────────────────────
  { brand: 'TaylorMade', model: 'Stealth 2', clubType: 'driver', loft: 9.0 },
  { brand: 'TaylorMade', model: 'Stealth 2 HD', clubType: 'driver', loft: 10.5 },
  { brand: 'TaylorMade', model: 'Qi10', clubType: 'driver', loft: 9.0 },
  { brand: 'TaylorMade', model: 'Qi10 Max', clubType: 'driver', loft: 10.5 },
  { brand: 'Callaway', model: 'Paradym', clubType: 'driver', loft: 9.0 },
  { brand: 'Callaway', model: 'Paradym X', clubType: 'driver', loft: 10.5 },
  { brand: 'Callaway', model: 'Ai Smoke', clubType: 'driver', loft: 9.0 },
  { brand: 'Titleist', model: 'TSR3', clubType: 'driver', loft: 10.0 },
  { brand: 'Titleist', model: 'TSR4', clubType: 'driver', loft: 8.0 },
  { brand: 'Titleist', model: 'GT3', clubType: 'driver', loft: 9.0 },
  { brand: 'Ping', model: 'G430 Max', clubType: 'driver', loft: 10.5 },
  { brand: 'Ping', model: 'G430 LST', clubType: 'driver', loft: 9.0 },
  { brand: 'Cobra', model: 'Aerojet', clubType: 'driver', loft: 9.0 },
  { brand: 'Cobra', model: 'Darkspeed', clubType: 'driver', loft: 9.0 },
  { brand: 'Cleveland', model: 'Launcher XL', clubType: 'driver', loft: 10.5 },
  // ── Fairway Woods ─────────────────────────────────────────────
  { brand: 'TaylorMade', model: 'Stealth 2', clubType: '3_wood', loft: 15.0 },
  { brand: 'TaylorMade', model: 'Stealth 2', clubType: '5_wood', loft: 18.0 },
  { brand: 'Callaway', model: 'Paradym', clubType: '3_wood', loft: 15.0 },
  { brand: 'Callaway', model: 'Paradym', clubType: '5_wood', loft: 18.0 },
  { brand: 'Titleist', model: 'TSR2', clubType: '3_wood', loft: 15.0 },
  { brand: 'Ping', model: 'G430', clubType: '3_wood', loft: 14.5 },
  { brand: 'Ping', model: 'G430', clubType: '5_wood', loft: 17.5 },
  // ── Hybrids ───────────────────────────────────────────────────
  { brand: 'TaylorMade', model: 'Stealth 2', clubType: '3_hybrid', loft: 19.0 },
  { brand: 'TaylorMade', model: 'Stealth 2', clubType: '4_hybrid', loft: 22.0 },
  { brand: 'Callaway', model: 'Paradym', clubType: '3_hybrid', loft: 18.0 },
  { brand: 'Ping', model: 'G430', clubType: '3_hybrid', loft: 19.0 },
  { brand: 'Titleist', model: 'TSi2', clubType: '3_hybrid', loft: 19.0 },
  // ── Iron Sets ─────────────────────────────────────────────────
  { brand: 'TaylorMade', model: 'P790', clubType: '7_iron', loft: 34.0, notes: 'P790 standard' },
  { brand: 'TaylorMade', model: 'P790', clubType: '6_iron', loft: 30.0 },
  { brand: 'Callaway', model: 'Apex', clubType: '7_iron', loft: 34.0 },
  { brand: 'Callaway', model: 'Apex', clubType: '6_iron', loft: 29.0 },
  { brand: 'Titleist', model: 'T100', clubType: '7_iron', loft: 34.0 },
  { brand: 'Titleist', model: 'T200', clubType: '7_iron', loft: 32.0 },
  { brand: 'Ping', model: 'i230', clubType: '7_iron', loft: 34.0 },
  { brand: 'Ping', model: 'G430', clubType: '7_iron', loft: 31.0, notes: 'Strong loft' },
  { brand: 'Cleveland', model: 'Launcher UHX', clubType: '7_iron', loft: 31.0 },
  // ── Wedges ────────────────────────────────────────────────────
  { brand: 'Titleist', model: 'Vokey SM10', clubType: 'pw', loft: 46.0 },
  { brand: 'Titleist', model: 'Vokey SM10', clubType: 'gw', loft: 50.0 },
  { brand: 'Titleist', model: 'Vokey SM10', clubType: 'sw', loft: 54.0 },
  { brand: 'Titleist', model: 'Vokey SM10', clubType: 'lw', loft: 60.0 },
  { brand: 'Cleveland', model: 'RTX6 ZipCore', clubType: 'sw', loft: 54.0 },
  { brand: 'Cleveland', model: 'RTX6 ZipCore', clubType: 'lw', loft: 60.0 },
  { brand: 'Callaway', model: 'Jaws Raw', clubType: 'sw', loft: 54.0 },
  { brand: 'Callaway', model: 'Jaws Raw', clubType: 'lw', loft: 60.0 },
  { brand: 'TaylorMade', model: 'MG4', clubType: 'sw', loft: 56.0 },
  { brand: 'TaylorMade', model: 'MG4', clubType: 'lw', loft: 60.0 },
  // ── Putters (standard loft) ───────────────────────────────────
  { brand: 'Scotty Cameron', model: 'Phantom', clubType: 'putter', loft: 3.5 },
  { brand: 'Odyssey', model: 'White Hot', clubType: 'putter', loft: 3.0 },
  { brand: 'TaylorMade', model: 'Spider', clubType: 'putter', loft: 3.0 },
  { brand: 'Ping', model: 'PLD', clubType: 'putter', loft: 4.0 },
];

// Normalize strings for comparison
function norm(s: string | undefined): string {
  return (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// ──────────────────────────────────────────────────────────────
// Core lookup function
// ──────────────────────────────────────────────────────────────

export function lookupLoft(
  clubType: string,
  brand?: string,
  model?: string,
  _generation?: string,
): LoftLookupResult {
  const normalizedType = norm(clubType);

  // 1. Try model-specific lookup (brand + model + clubType all match)
  if (brand && model) {
    const match = MODEL_LOFTS.find(
      (e) =>
        norm(e.brand) === norm(brand) &&
        norm(e.model) === norm(model) &&
        norm(e.clubType) === normalizedType,
    );
    if (match) {
      return {
        loft: match.loft,
        source: 'manufacturer_model',
        confidence: 'high',
        label: `${match.brand} ${match.model} (manufacturer spec)`,
        editable: true,
      };
    }
  }

  // 2. Try brand-only partial match (brand + clubType)
  if (brand) {
    const brandMatch = MODEL_LOFTS.find(
      (e) => norm(e.brand) === norm(brand) && norm(e.clubType) === normalizedType,
    );
    if (brandMatch) {
      return {
        loft: brandMatch.loft,
        source: 'manufacturer_model',
        confidence: 'medium',
        label: `${brandMatch.brand} ${brandMatch.model} — similar model (estimated)`,
        editable: true,
      };
    }
  }

  // 3. Try generic defaults
  const genericLoft =
    GENERIC_LOFTS[normalizedType] ??
    GENERIC_LOFTS[clubType] ??
    null;

  if (genericLoft !== null) {
    return {
      loft: genericLoft,
      source: 'generic_default',
      confidence: 'medium',
      label: 'Generic default — editable',
      editable: true,
    };
  }

  // 4. No data available
  return {
    loft: null,
    source: 'unknown',
    confidence: 'low',
    label: 'Unknown — enter manually',
    editable: true,
  };
}

// ──────────────────────────────────────────────────────────────
// Loft gapping analysis
// ──────────────────────────────────────────────────────────────

// Typical ideal loft gap between successive clubs (degrees)
const IDEAL_LOFT_GAP = 4; // degrees — industry standard target
const LARGE_GAP_THRESHOLD = 6; // degrees — considered a coverage gap
const OVERLAP_THRESHOLD = 2; // degrees — clubs too close

export interface GapEntry {
  from: string;
  to: string;
  gap: number;
  ideal: number;
  warning: string | null;
}

export interface LoftGappingResult {
  gaps: GapEntry[];
  missingLofts: string[];
  largeGaps: string[];
  recommendations: string[];
}

export function analyzeLoftGapping(
  clubs: Array<{ name: string; loft: number | null }>,
): LoftGappingResult {
  // Filter to clubs that have a loft value, sort ascending (lowest loft first)
  const withLoft = clubs
    .filter((c): c is { name: string; loft: number } => c.loft !== null && c.loft !== undefined)
    .sort((a, b) => a.loft - b.loft);

  const missingLofts = clubs
    .filter((c) => c.loft === null || c.loft === undefined)
    .map((c) => c.name);

  const gaps: GapEntry[] = [];
  const largeGaps: string[] = [];
  const recommendations: string[] = [];

  for (let i = 0; i < withLoft.length - 1; i++) {
    const current = withLoft[i];
    const next = withLoft[i + 1];
    const gap = +(next.loft - current.loft).toFixed(1);
    let warning: string | null = null;

    if (gap > LARGE_GAP_THRESHOLD) {
      warning = `Large gap (${gap}°) — consider adding a club between ${current.name} and ${next.name}`;
      largeGaps.push(`${current.name} → ${next.name} (${gap}° gap)`);
    } else if (gap < OVERLAP_THRESHOLD && gap >= 0) {
      warning = `Overlap (${gap}°) — ${current.name} and ${next.name} may have similar distances`;
    } else if (gap < 0) {
      warning = `Duplicate or inverted lofts — check entries for ${current.name} and ${next.name}`;
    }

    gaps.push({
      from: current.name,
      to: next.name,
      gap,
      ideal: IDEAL_LOFT_GAP,
      warning,
    });
  }

  // Recommendations
  if (largeGaps.length > 0) {
    recommendations.push(
      `You have ${largeGaps.length} large gap(s) in your bag. Adding a hybrid, fairway wood, or wedge in those ranges can improve distance coverage.`,
    );
  }
  if (missingLofts.length > 0) {
    recommendations.push(
      `Add loft values to: ${missingLofts.join(', ')} for a complete gapping picture.`,
    );
  }
  const overlapCount = gaps.filter((g) => g.gap < OVERLAP_THRESHOLD && g.gap >= 0).length;
  if (overlapCount > 0) {
    recommendations.push(
      `You have ${overlapCount} club(s) with overlapping lofts — consider swapping one for a club that fills a gap.`,
    );
  }
  if (gaps.length > 0 && largeGaps.length === 0 && overlapCount === 0) {
    recommendations.push('Your loft gapping looks well balanced across the bag.');
  }

  return { gaps, missingLofts, largeGaps, recommendations };
}
