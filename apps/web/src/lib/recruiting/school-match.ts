// ============================================================
// SwingVantage Recruiting — School & division match engine
// ------------------------------------------------------------
// Turns an athlete's distilled performance (golf handicap / scoring + the
// recruiting profile-strength tier) plus academics (GPA, grad year, region)
// into:
//   1. DIVISION FIT — which college levels are realistic (safety/match/reach),
//      using coarse, openly-approximate competitiveness bands.
//   2. SCHOOL RECOMMENDATIONS — programs from a curated seed list, ranked by
//      division fit + region preference.
//
// HONEST-FIRST (matches the rest of lib/recruiting):
//   • Division bands are GENERAL, gender-varying ESTIMATES, not cutoffs.
//   • Seed schools are tagged only by DIVISION + REGION (public facts). We do
//     NOT fabricate per-school competitiveness or coach contacts.
//   • Output always carries disclaimers + a data-confidence level so the read
//     is never mistaken for an official recruiting verdict.
//
// Pure + deterministic: no network, no AI, no PII. The UI feeds it an input
// object and reuses buildOutreach() to draft messages for a chosen school.
// ============================================================

import type { SportId } from '@swingiq/core';
import type { StrengthTier } from './types';

export type Division = 'NCAA D1' | 'NCAA D2' | 'NCAA D3' | 'NAIA' | 'NJCAA';

/** Fit of a level/school RELATIVE to the athlete's current level. */
export type FitLevel = 'safety' | 'match' | 'reach' | 'stretch';

export const FIT_ORDER: FitLevel[] = ['match', 'reach', 'safety', 'stretch'];

export interface RecruitInput {
  sport: SportId;
  /** Golf handicap index (lower = stronger). Primary signal when present. */
  handicap?: number | null;
  /** Golf scoring average (informational; refines the read). */
  scoringAverage?: number | null;
  gpa?: number | null;
  graduationYear?: number | null;
  /** Coarse region string (e.g. "West", "US-CA", "Southeast"). */
  region?: string;
  /** Profile-strength tier — proxy signal used when handicap is missing. */
  strengthTier?: StrengthTier;
}

export interface SeedSchool {
  id: string;
  name: string;
  division: Division;
  /** Coarse US region — a factual, stable tag (verify membership before contact). */
  region: string;
}

export interface DivisionFit {
  division: Division;
  fit: FitLevel;
  rationale: string;
}

export interface SchoolRecommendation {
  school: SeedSchool;
  fit: FitLevel;
  reasons: string[];
}

export interface SchoolMatchResult {
  supported: boolean;
  message?: string;
  /** Plain-language summary of the athlete's current competitive level. */
  athleticLevelLabel: string;
  divisionFits: DivisionFit[];
  recommendations: SchoolRecommendation[];
  /** How much to trust the read, given how much input data was supplied. */
  dataConfidence: 'low' | 'medium' | 'high';
  disclaimers: string[];
}

/**
 * Coarse, APPROXIMATE men's college-golf competitiveness by division, expressed
 * as a rough handicap ceiling a typical competitive roster spot implies. Women's
 * and individual programs vary widely — these are starting guidance, not cutoffs.
 * Ordered strongest → most accessible.
 */
const DIVISION_BANDS: { division: Division; ceiling: number; label: string }[] = [
  { division: 'NCAA D1', ceiling: 2, label: 'highly competitive (near scratch)' },
  { division: 'NCAA D2', ceiling: 5, label: 'competitive' },
  { division: 'NAIA', ceiling: 8, label: 'competitive, varies widely' },
  { division: 'NCAA D3', ceiling: 9, label: 'broad range; academics matter most' },
  { division: 'NJCAA', ceiling: 14, label: 'development / two-year pathway' },
];

/** Strength-tier → an approximate handicap when no real handicap is supplied. */
const TIER_TO_HANDICAP: Record<StrengthTier, number> = {
  elite: 1,
  strong: 4,
  recruitable: 8,
  basic: 14,
  incomplete: 20,
};

function fitFromHandicap(handicap: number, ceiling: number): FitLevel {
  // Athlete clearly inside the level → match; comfortably better → safety;
  // a bit beyond → reach; well beyond → stretch.
  if (handicap <= ceiling - 2) return 'safety';
  if (handicap <= ceiling) return 'match';
  if (handicap <= ceiling + 3) return 'reach';
  return 'stretch';
}

function athleticLevelLabel(handicap: number | null | undefined, derived: boolean): string {
  if (handicap == null) return 'Not enough data to estimate a level yet';
  const h = handicap.toFixed(1);
  const base =
    handicap <= 2 ? `Scratch-level (handicap ~${h})`
    : handicap <= 5 ? `Low single digits (handicap ~${h})`
    : handicap <= 9 ? `Single digits (handicap ~${h})`
    : handicap <= 15 ? `Mid handicap (~${h})`
    : `Developing (handicap ~${h})`;
  return derived ? `${base} — estimated from your profile strength` : base;
}

function gpaNote(gpa: number | null | undefined): string | null {
  if (gpa == null) return null;
  if (gpa >= 3.7) return 'Strong GPA — widens academic options, including selective D3.';
  if (gpa >= 3.0) return 'Solid GPA — keeps most programs in play.';
  return 'Ask each program about academic requirements early.';
}

function gradYearNote(year: number | null | undefined): string | null {
  if (year == null) return null;
  const now = new Date().getFullYear();
  const yearsOut = year - now;
  if (yearsOut >= 3) return 'Early in the timeline — build your profile and start a target list now.';
  if (yearsOut >= 1) return 'Prime outreach window — reach out to coaches this cycle.';
  if (yearsOut >= 0) return 'Late timeline — prioritize programs still filling their class.';
  return 'Graduation year has passed — consider transfer or post-grad pathways.';
}

/** Build division fits for the athlete, strongest → most accessible. */
function buildDivisionFits(handicap: number | null): DivisionFit[] {
  if (handicap == null) return [];
  return DIVISION_BANDS.map((b) => {
    const fit = fitFromHandicap(handicap, b.ceiling);
    return {
      division: b.division,
      fit,
      rationale: `${b.division} is ${b.label}; relative to a ~${b.ceiling} ceiling this looks like a ${fit}.`,
    };
  });
}

const REGION_FIELD = (s: string) => s.trim().toLowerCase();

function regionMatches(athleteRegion: string | undefined, schoolRegion: string): boolean {
  if (!athleteRegion) return false;
  const a = REGION_FIELD(athleteRegion);
  const s = REGION_FIELD(schoolRegion);
  return a.includes(s) || s.includes(a);
}

/**
 * Recommend schools from the seed set, ranked by division fit then region
 * preference. Pure: callers pass their own seed list (defaults to SEED_SCHOOLS).
 */
export function recommendSchools(input: RecruitInput, schools: SeedSchool[] = SEED_SCHOOLS): SchoolMatchResult {
  const disclaimers = [
    'Fit is based on a program’s division and region — verify each program’s current roster level, division, and coach contacts on its official athletics site.',
    'SwingVantage stores no coach contact information and never guarantees recruiting outcomes.',
  ];

  if (input.sport !== 'golf') {
    return {
      supported: false,
      message: 'School matching currently covers golf (handicap-driven). Other sports are coming.',
      athleticLevelLabel: '',
      divisionFits: [],
      recommendations: [],
      dataConfidence: 'low',
      disclaimers,
    };
  }

  const derived = input.handicap == null && input.strengthTier != null;
  const handicap =
    input.handicap != null ? input.handicap
    : input.strengthTier ? TIER_TO_HANDICAP[input.strengthTier]
    : null;

  // Data confidence: real handicap + GPA + grad year = high; some = medium; none = low.
  const signals = [input.handicap != null, input.gpa != null, input.graduationYear != null].filter(Boolean).length;
  const dataConfidence: SchoolMatchResult['dataConfidence'] =
    input.handicap != null && signals >= 2 ? 'high' : signals >= 1 || handicap != null ? 'medium' : 'low';

  const divisionFits = buildDivisionFits(handicap);
  const fitByDivision = new Map(divisionFits.map((d) => [d.division, d.fit]));

  const academicNote = gpaNote(input.gpa);
  const timelineNote = gradYearNote(input.graduationYear);

  const recommendations: SchoolRecommendation[] = handicap == null
    ? []
    : schools
        .map((school): SchoolRecommendation => {
          const fit = fitByDivision.get(school.division) ?? 'stretch';
          const reasons: string[] = [`${school.division} — a ${fit} for your level.`];
          if (regionMatches(input.region, school.region)) reasons.push(`In your region (${school.region}).`);
          if (academicNote) reasons.push(academicNote);
          return { school, fit, reasons };
        })
        // Rank: better fit first, then in-region first, then name.
        .sort((a, b) => {
          const fd = FIT_ORDER.indexOf(a.fit) - FIT_ORDER.indexOf(b.fit);
          if (fd !== 0) return fd;
          const ar = regionMatches(input.region, a.school.region) ? 0 : 1;
          const br = regionMatches(input.region, b.school.region) ? 0 : 1;
          if (ar !== br) return ar - br;
          return a.school.name.localeCompare(b.school.name);
        });

  if (timelineNote) disclaimers.unshift(timelineNote);

  return {
    supported: true,
    athleticLevelLabel: athleticLevelLabel(handicap, derived),
    divisionFits,
    recommendations,
    dataConfidence,
    disclaimers,
  };
}

/**
 * Curated STARTER set of college golf programs, tagged only by division +
 * region (public, stable facts). Intentionally small and illustrative — expand
 * it in this file. Never treat as an authoritative or complete directory, and
 * always verify a program's current division/roster before reaching out.
 */
export const SEED_SCHOOLS: SeedSchool[] = [
  { id: 'd1-west-1', name: 'Stanford University', division: 'NCAA D1', region: 'West' },
  { id: 'd1-west-2', name: 'University of Arizona', division: 'NCAA D1', region: 'West' },
  { id: 'd1-southeast-1', name: 'University of Georgia', division: 'NCAA D1', region: 'Southeast' },
  { id: 'd1-south-1', name: 'University of Texas', division: 'NCAA D1', region: 'South' },
  { id: 'd1-midwest-1', name: 'University of Illinois', division: 'NCAA D1', region: 'Midwest' },
  { id: 'd2-west-1', name: 'Cal State Monterey Bay', division: 'NCAA D2', region: 'West' },
  { id: 'd2-southeast-1', name: 'Lynn University', division: 'NCAA D2', region: 'Southeast' },
  { id: 'd2-midwest-1', name: 'Grand Valley State University', division: 'NCAA D2', region: 'Midwest' },
  { id: 'd3-northeast-1', name: 'Williams College', division: 'NCAA D3', region: 'Northeast' },
  { id: 'd3-midwest-1', name: 'Carleton College', division: 'NCAA D3', region: 'Midwest' },
  { id: 'd3-southeast-1', name: 'Emory University', division: 'NCAA D3', region: 'Southeast' },
  { id: 'naia-south-1', name: 'Oklahoma City University', division: 'NAIA', region: 'South' },
  { id: 'naia-west-1', name: 'Westcliff University', division: 'NAIA', region: 'West' },
  { id: 'naia-southeast-1', name: 'Keiser University', division: 'NAIA', region: 'Southeast' },
  { id: 'njcaa-southwest-1', name: 'New Mexico Junior College', division: 'NJCAA', region: 'Southwest' },
  { id: 'njcaa-southeast-1', name: 'Daytona State College', division: 'NJCAA', region: 'Southeast' },
];
