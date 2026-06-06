// ============================================================
// Player Recruiting Hub — profile-strength engine (pure)
// ------------------------------------------------------------
// Scores how complete + credible a recruiting profile is, derives
// a tier (incomplete → elite), and returns the highest-leverage
// missing sections so the builder can guide the athlete. Credibility
// is part of the score: a profile that is entirely self-reported is
// capped, because coaches discount unverified claims.
// ============================================================

import {
  type RecruitingState,
  type StrengthTier,
  VERIFIED_SOURCES,
} from './types';

export interface StrengthCheck {
  id: string;
  label: string;
  weight: number;
  met: boolean;
  /** Action shown to the athlete when this check is unmet. */
  recommendation: string;
}

export interface ProfileStrength {
  score: number; // 0–100
  tier: StrengthTier;
  checks: StrengthCheck[];
  /** Top unmet checks by weight — what to do next. */
  recommendations: string[];
  /** True when nothing on the profile is independently verified. */
  selfReportedOnly: boolean;
  /** Honest notes (e.g. credibility cap). */
  notes: string[];
}

const TIER_THRESHOLDS: { tier: StrengthTier; min: number }[] = [
  { tier: 'elite', min: 90 },
  { tier: 'strong', min: 72 },
  { tier: 'recruitable', min: 50 },
  { tier: 'basic', min: 25 },
  { tier: 'incomplete', min: 0 },
];

function tierFor(score: number): StrengthTier {
  return TIER_THRESHOLDS.find((t) => score >= t.min)!.tier;
}

function hasVerified(sources: { source: string }[]): boolean {
  return sources.some((s) => VERIFIED_SOURCES.has(s.source as never));
}

export function computeProfileStrength(state: RecruitingState): ProfileStrength {
  const p = state.profile;
  const film = state.film.filter((f) => !f.deletedAt);
  const metrics = state.metrics;

  const checks: StrengthCheck[] = [
    {
      id: 'identity',
      label: 'Core identity',
      weight: 10,
      met: !!p && !!p.athleteName.trim() && !!p.primarySport,
      recommendation: 'Add your name, sport, and player type.',
    },
    {
      id: 'class',
      label: 'Class / graduation year',
      weight: 6,
      met: !!p?.graduationYear,
      recommendation: 'Add your graduation year or playing class — coaches filter by it first.',
    },
    {
      id: 'position',
      label: 'Position / specialty',
      weight: 8,
      met: !!p && Object.values(p.sportProfiles).some((sp) => !!sp.position.trim()),
      recommendation: 'Add your primary position or event so coaches know how to evaluate you.',
    },
    {
      id: 'measurables',
      label: 'Physical measurables',
      weight: 6,
      met: !!p && (!!p.heightInches || !!p.weightLbs),
      recommendation: 'Add height/weight where relevant — a quick credibility signal.',
    },
    {
      id: 'bio',
      label: 'Bio / personal statement',
      weight: 6,
      met: !!p && (!!p.bio?.trim() || !!p.personalStatement?.trim()),
      recommendation: 'Write a short bio and personal statement — your story in your words.',
    },
    {
      id: 'contact',
      label: 'Contact path',
      weight: 8,
      met: !!p && (!!p.contactEmail?.trim() || !!p.guardianEmail?.trim()),
      recommendation: 'Add a contact path (athlete or guardian) so coaches can reach you.',
    },
    {
      id: 'film_any',
      label: 'At least one video',
      weight: 12,
      met: film.length > 0,
      recommendation: 'Upload your first film — coaches want to see you move.',
    },
    {
      id: 'film_featured',
      label: 'A featured highlight',
      weight: 8,
      met: film.some((f) => f.featured) || state.reels.some((r) => r.featured),
      recommendation: 'Feature a highlight reel so the best clip opens your profile.',
    },
    {
      id: 'film_game',
      label: 'Real-game / match footage',
      weight: 8,
      met: film.some((f) =>
        ['full_game', 'tournament_footage', 'match_play', 'full_at_bat', 'coach_evaluation'].includes(f.category),
      ),
      recommendation: 'Add game, match, or tournament footage — coaches discount practice-only reels.',
    },
    {
      id: 'metrics_any',
      label: 'Performance data',
      weight: 12,
      met: metrics.length >= 2,
      recommendation: 'Add at least a couple of sport-specific metrics with their source.',
    },
    {
      id: 'metrics_verified',
      label: 'Verified data',
      weight: 8,
      met: hasVerified(metrics),
      recommendation: 'Import device data or get a coach to verify a metric — verified numbers carry far more weight.',
    },
    {
      id: 'summary',
      label: 'AI player summary',
      weight: 4,
      met: state.summaries.length > 0,
      recommendation: 'Generate your player summary so coaches get an honest read in seconds.',
    },
    {
      id: 'coach_note',
      label: 'Coach / trainer note',
      weight: 4,
      met: state.coachNotes.length > 0,
      recommendation: 'Add a coach or trainer note — third-party credibility matters.',
    },
  ];

  const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
  const metWeight = checks.filter((c) => c.met).reduce((s, c) => s + c.weight, 0);
  let score = Math.round((metWeight / totalWeight) * 100);

  // Credibility cap: an entirely self-reported profile can't read as "elite".
  const anyVerified =
    hasVerified(metrics) ||
    film.some((f) => VERIFIED_SOURCES.has(f.source as never)) ||
    state.coachNotes.some((n) => n.verified);
  const selfReportedOnly = !anyVerified && (metrics.length > 0 || film.length > 0);

  const notes: string[] = [];
  if (selfReportedOnly && score > 70) {
    score = 70;
    notes.push(
      'Capped below "Strong" until something is independently verified — coaches weight verified data far more heavily.',
    );
  }

  const recommendations = checks
    .filter((c) => !c.met)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 4)
    .map((c) => c.recommendation);

  return {
    score,
    tier: tierFor(score),
    checks,
    recommendations,
    selfReportedOnly,
    notes,
  };
}
