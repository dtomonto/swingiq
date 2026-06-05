// ============================================================
// SwingVantage — Club Gapping Analyzer
// Analyzes the carry-distance gaps between clubs in the bag,
// identifies problem areas, and recommends actions.
// All calculations are based on user-entered typical carry values.
// ============================================================

export interface ClubGapInput {
  id: string;
  name: string;
  category: string;
  typical_carry: number | null;
  sort_order: number;
}

export type GapStatus = 'ideal' | 'too_small' | 'too_large' | 'missing_data';

export interface ClubGapResult {
  club_id: string;
  club_name: string;
  category: string;
  carry: number | null;
  gap_to_next: number | null;   // yards to the next longer club
  gap_status: GapStatus;
  recommendation: string | null;
}

export interface GapAnalysis {
  results: ClubGapResult[];
  avg_gap: number;
  largest_gap: ClubGapResult | null;
  smallest_gap: ClubGapResult | null;
  clubs_missing_data: string[];
  summary: string;
  overall_grade: 'A' | 'B' | 'C' | 'D';
}

// Ideal gap windows by category pair (yards)
const IDEAL_GAP_RANGES: Record<string, { min: number; max: number }> = {
  default:  { min: 10, max: 20 },
  driver_wood: { min: 20, max: 35 },
  wood_wood:   { min: 12, max: 22 },
  wood_hybrid: { min: 10, max: 20 },
  hybrid_iron: { min: 10, max: 18 },
  iron_iron:   { min: 10, max: 18 },
  iron_wedge:  { min: 10, max: 20 },
  wedge_wedge: { min: 8,  max: 18 },
};

function getGapRange(catA: string, catB: string) {
  const key = `${catA}_${catB}`;
  return IDEAL_GAP_RANGES[key] ?? IDEAL_GAP_RANGES.default!;
}

function gradeGap(gap: number, catA: string, catB: string): GapStatus {
  const { min, max } = getGapRange(catA, catB);
  if (gap < min) return 'too_small';
  if (gap > max) return 'too_large';
  return 'ideal';
}

function gapRecommendation(status: GapStatus, gap: number, catA: string, catB: string): string | null {
  const { min, max } = getGapRange(catA, catB);
  if (status === 'ideal') return null;
  if (status === 'too_large') {
    return `${gap} yard gap is larger than the ideal ${min}–${max} yard range. Consider adding a club (hybrid, utility iron, or gap wedge) to fill this distance.`;
  }
  if (status === 'too_small') {
    return `${gap} yard gap is smaller than the ideal ${min}–${max} yard range. You may have redundant distance here — consider removing one club and adding coverage elsewhere.`;
  }
  return null;
}

export function analyzeClubGaps(clubs: ClubGapInput[]): GapAnalysis {
  // Sort by carry descending (longest first), put nulls last
  const sorted = [...clubs]
    .filter((c) => c.typical_carry !== null)
    .sort((a, b) => (b.typical_carry ?? 0) - (a.typical_carry ?? 0));

  const missingData = clubs.filter((c) => c.typical_carry === null).map((c) => c.name);

  const results: ClubGapResult[] = sorted.map((club, i) => {
    const next = sorted[i + 1];
    const gap = next ? (club.typical_carry ?? 0) - (next.typical_carry ?? 0) : null;
    const status: GapStatus =
      gap === null ? 'missing_data' : gradeGap(gap, club.category, next?.category ?? 'default');

    return {
      club_id: club.id,
      club_name: club.name,
      category: club.category,
      carry: club.typical_carry,
      gap_to_next: gap,
      gap_status: status,
      recommendation: gap !== null ? gapRecommendation(status, Math.round(gap), club.category, next?.category ?? 'default') : null,
    };
  });

  const gapsWithValues = results.filter((r) => r.gap_to_next !== null);
  const avgGap = gapsWithValues.length
    ? Math.round(gapsWithValues.reduce((s, r) => s + (r.gap_to_next ?? 0), 0) / gapsWithValues.length)
    : 0;

  const largest = gapsWithValues.length
    ? gapsWithValues.reduce((a, b) => ((a.gap_to_next ?? 0) > (b.gap_to_next ?? 0) ? a : b))
    : null;
  const smallest = gapsWithValues.length
    ? gapsWithValues.reduce((a, b) => ((a.gap_to_next ?? 0) < (b.gap_to_next ?? 0) ? a : b))
    : null;

  const problemCount = results.filter((r) => r.gap_status !== 'ideal' && r.gap_status !== 'missing_data').length;
  const grade: GapAnalysis['overall_grade'] =
    problemCount === 0 ? 'A' :
    problemCount === 1 ? 'B' :
    problemCount <= 3 ? 'C' : 'D';

  const summary =
    problemCount === 0
      ? `Your gaps are well-distributed. Average gap of ${avgGap} yards across ${sorted.length} clubs.`
      : `${problemCount} gap issue${problemCount > 1 ? 's' : ''} found. Average gap: ${avgGap} yards. ${largest ? `Biggest gap: ${Math.round(largest.gap_to_next ?? 0)} yards after your ${largest.club_name}.` : ''}`;

  return { results, avg_gap: avgGap, largest_gap: largest, smallest_gap: smallest, clubs_missing_data: missingData, summary, overall_grade: grade };
}
