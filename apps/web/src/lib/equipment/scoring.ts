// ============================================================
// SwingVantage — Equipment Fit Scoring Engine
// Deterministic rules-based scoring. The LLM layer explains
// findings in plain English; it is NOT the diagnostic engine.
// All scores and evidence are computed here before the AI sees them.
// ============================================================

export type EquipmentFitRating = 'Excellent' | 'Good' | 'Fair' | 'Mismatch' | 'Insufficient Data';
export type UpgradeUrgency = 'None' | 'Low' | 'Moderate' | 'High';
export type SpecConfidence = 'verified' | 'user_entered' | 'estimated' | 'missing';

export interface EquipmentDiagnosticResult {
  overallScore: number;          // 0–100
  fitRating: EquipmentFitRating;
  confidenceScore: number;       // 0–1 — how much data backs this result
  upgradeUrgency: UpgradeUrgency;
  adjustmentFirst: boolean;      // true = recommend adjustment before buying new gear
  evidence: string[];            // what we used to reach this conclusion
  missingData: string[];         // what would improve confidence
  recommendations: string[];     // ordered: highest impact first
  limitations: string[];         // what this score cannot assess
}

// ── Tennis racket fit ─────────────────────────────────────────

export interface TennisRacketFitInputs {
  headSizeSqIn: number | null;
  weightStrungOz: number | null;
  swingweight: number | null;
  stiffnessRa: number | null;
  gripSize: string;
  /** Self-reported skill: beginner | intermediate | advanced | competitive */
  skillLevel: string;
  /** Primary play style: baseline | serve_volley | all_court */
  playStyle: string;
}

export function scoreTennisRacket(inputs: TennisRacketFitInputs): EquipmentDiagnosticResult {
  const evidence: string[] = [];
  const missing: string[] = [];
  const recommendations: string[] = [];
  const limitations: string[] = [];
  let points = 0;
  let maxPoints = 0;

  // Head size
  if (inputs.headSizeSqIn !== null) {
    maxPoints += 20;
    if (inputs.skillLevel === 'beginner' || inputs.skillLevel === 'intermediate') {
      if (inputs.headSizeSqIn >= 98 && inputs.headSizeSqIn <= 110) {
        points += 20;
        evidence.push(`Head size ${inputs.headSizeSqIn} sq in is well-suited for ${inputs.skillLevel} players.`);
      } else if (inputs.headSizeSqIn < 98) {
        points += 8;
        evidence.push(`Head size ${inputs.headSizeSqIn} sq in is smaller than typical for ${inputs.skillLevel} players — reduces sweet spot.`);
        recommendations.push('Consider a mid-plus or oversize (98–110 sq in) for a larger sweet spot.');
      } else {
        points += 14;
        evidence.push(`Head size ${inputs.headSizeSqIn} sq in (oversize) adds power but may reduce control for intermediate players.`);
      }
    } else {
      if (inputs.headSizeSqIn >= 95 && inputs.headSizeSqIn <= 100) {
        points += 20;
        evidence.push(`Head size ${inputs.headSizeSqIn} sq in is standard for advanced / competitive players.`);
      } else if (inputs.headSizeSqIn > 100) {
        points += 12;
        evidence.push(`Head size ${inputs.headSizeSqIn} sq in is larger than typical for advanced play — may reduce precision.`);
        recommendations.push('Advanced players typically prefer 95–100 sq in for better feel and control.');
      } else {
        points += 16;
        evidence.push(`Head size ${inputs.headSizeSqIn} sq in (midsize) is workable for advanced players.`);
      }
    }
  } else {
    missing.push('Head size — required for fit assessment');
  }

  // Weight
  if (inputs.weightStrungOz !== null) {
    maxPoints += 20;
    const w = inputs.weightStrungOz;
    if (w >= 10.5 && w <= 11.5) {
      points += 20;
      evidence.push(`Strung weight ${w} oz is in the widely recommended range for most adult players.`);
    } else if (w < 10.0) {
      points += 8;
      evidence.push(`Strung weight ${w} oz is very light — may cause shanking and arm stress from over-swinging.`);
      recommendations.push('A slightly heavier frame (10.5–11.5 oz strung) often improves consistency.');
    } else if (w > 12.0) {
      points += 10;
      evidence.push(`Strung weight ${w} oz is heavy — increases stability but demands good mechanics to avoid arm fatigue.`);
      recommendations.push('Ensure you have sufficient swing mechanics before using a frame above 12 oz.');
    } else {
      points += 15;
      evidence.push(`Strung weight ${w} oz is acceptable.`);
    }
  } else {
    missing.push('Strung weight — important for arm health and power assessment');
  }

  // Stiffness / RA
  if (inputs.stiffnessRa !== null) {
    maxPoints += 15;
    const ra = inputs.stiffnessRa;
    if (ra >= 66) {
      points += 10;
      evidence.push(`Stiffness RA ${ra} is high — more power potential but elevated arm stress risk.`);
      if (inputs.skillLevel === 'beginner' || inputs.skillLevel === 'intermediate') {
        recommendations.push('High-RA frames can aggravate elbow and wrist issues in players with developing mechanics. Consider RA 58–65 if you experience any discomfort.');
      }
      limitations.push('Arm health assessment requires medical evaluation — SwingVantage cannot diagnose injury risk.');
    } else if (ra >= 58 && ra <= 65) {
      points += 15;
      evidence.push(`Stiffness RA ${ra} is moderate — good balance of power and arm comfort.`);
    } else {
      points += 12;
      evidence.push(`Stiffness RA ${ra} is flexible — arm-friendly but lower power ceiling.`);
    }
  } else {
    missing.push('Stiffness (RA) — helps assess arm comfort risk');
  }

  // Swingweight
  if (inputs.swingweight !== null) {
    maxPoints += 15;
    const sw = inputs.swingweight;
    if (sw >= 310 && sw <= 330) {
      points += 15;
      evidence.push(`Swingweight ${sw} is in the standard range for most players.`);
    } else if (sw < 300) {
      points += 8;
      evidence.push(`Swingweight ${sw} is very low — the racquet may feel whippy and hard to control on fast balls.`);
      recommendations.push('Add lead tape at 3 and 9 o\'clock positions to increase swingweight before buying a new frame.');
    } else if (sw > 340) {
      points += 8;
      evidence.push(`Swingweight ${sw} is high — powerful through the ball but demands strong mechanics.`);
      recommendations.push('Test before committing to this swingweight; fatigue typically sets in late in long matches.');
    } else {
      points += 12;
      evidence.push(`Swingweight ${sw} is acceptable.`);
    }
  } else {
    missing.push('Swingweight — key for plow-through and stability feel');
  }

  // Confidence from data completeness
  const dataFieldCount = [inputs.headSizeSqIn, inputs.weightStrungOz, inputs.stiffnessRa, inputs.swingweight]
    .filter((v) => v !== null).length;
  const confidenceScore = maxPoints > 0 ? Math.min(1, (dataFieldCount / 4) * 0.7 + (points / Math.max(maxPoints, 1)) * 0.3) : 0;

  const rawScore = maxPoints > 0 ? Math.round((points / maxPoints) * 100) : 0;
  const penalizedScore = Math.round(rawScore * (0.4 + 0.6 * (dataFieldCount / 4)));

  limitations.push('This assessment is based on general guidelines, not biomechanical measurement.');
  limitations.push('String type, tension, and grip customization are not fully accounted for.');
  if (missing.length > 0) {
    recommendations.push('Enter the missing specs above to improve diagnostic confidence.');
  }

  return {
    overallScore: penalizedScore,
    fitRating: ratingFromScore(penalizedScore, dataFieldCount),
    confidenceScore: Math.round(confidenceScore * 100) / 100,
    upgradeUrgency: urgencyFromScore(penalizedScore),
    adjustmentFirst: penalizedScore >= 45,
    evidence,
    missingData: missing,
    recommendations,
    limitations,
  };
}

// ── Baseball / softball bat fit ───────────────────────────────

export interface BatFitInputs {
  lengthIn: number | null;
  weightOz: number | null;
  drop: number | null;
  balance: 'balanced' | 'end_loaded' | '';
  /** Height in inches */
  playerHeightIn: number | null;
  /** Weight in lbs */
  playerWeightLbs: number | null;
  skillLevel: string;
  sport: 'baseball' | 'softball_slow' | 'softball_fast';
}

export function scoreBat(inputs: BatFitInputs): EquipmentDiagnosticResult {
  const evidence: string[] = [];
  const missing: string[] = [];
  const recommendations: string[] = [];
  const limitations: string[] = [];
  let points = 0;
  let maxPoints = 0;

  // Length fit
  if (inputs.lengthIn !== null) {
    maxPoints += 25;
    let ideal: [number, number] = [32, 34];
    if (inputs.sport === 'softball_slow') ideal = [34, 34];
    else if (inputs.sport === 'softball_fast') {
      if (inputs.playerHeightIn && inputs.playerHeightIn < 66) ideal = [32, 33];
      else ideal = [33, 34];
    } else if (inputs.playerHeightIn) {
      if (inputs.playerHeightIn < 60) ideal = [29, 31];
      else if (inputs.playerHeightIn < 66) ideal = [31, 33];
      else ideal = [33, 34];
    }
    if (inputs.lengthIn >= ideal[0] && inputs.lengthIn <= ideal[1]) {
      points += 25;
      evidence.push(`Bat length ${inputs.lengthIn}" is in the typical range for this player profile.`);
    } else if (inputs.lengthIn > ideal[1]) {
      points += 10;
      evidence.push(`Bat length ${inputs.lengthIn}" is longer than typical — can reduce bat control and contact rate.`);
      recommendations.push(`Consider testing a ${ideal[1]}" bat for improved plate coverage and contact consistency.`);
    } else {
      points += 15;
      evidence.push(`Bat length ${inputs.lengthIn}" is shorter than typical — good for contact, may sacrifice reach.`);
    }
  } else {
    missing.push('Bat length — needed for size-fit assessment');
  }

  // Drop / weight fit
  if (inputs.drop !== null && inputs.weightOz !== null) {
    maxPoints += 25;
    const drop = Math.abs(inputs.drop);
    if (inputs.sport === 'softball_slow') {
      // Slow pitch bats are typically -8 to -11
      if (drop >= 8 && drop <= 11) {
        points += 25;
        evidence.push(`Drop ${inputs.drop} (${inputs.weightOz} oz) is standard for slow pitch.`);
      } else if (drop < 8) {
        points += 15;
        evidence.push(`Drop ${inputs.drop} is heavier than typical for slow pitch — may slow bat speed.`);
      } else {
        points += 18;
        evidence.push(`Drop ${inputs.drop} is lighter than typical slow pitch — may sacrifice power.`);
      }
    } else if (inputs.sport === 'softball_fast') {
      if (drop >= 10 && drop <= 13) {
        points += 25;
        evidence.push(`Drop ${inputs.drop} is standard for fast pitch.`);
      } else if (drop < 10) {
        points += 12;
        evidence.push(`Drop ${inputs.drop} is heavy for fast pitch — can slow swing and reduce exit velocity.`);
        recommendations.push('Fast pitch timing windows require quick bat speed; test a lighter drop (-11 or -12) if contact is inconsistent.');
      } else {
        points += 18;
        evidence.push(`Drop ${inputs.drop} is lighter than typical for fast pitch — appropriate for younger or lighter athletes.`);
      }
    } else {
      // Baseball
      if (inputs.skillLevel === 'advanced' || inputs.skillLevel === 'competitive') {
        if (drop <= 3) {
          points += 25;
          evidence.push(`BBCOR (-3) or wood bat is standard for advanced baseball.`);
        } else {
          points += 15;
          evidence.push(`Drop ${inputs.drop} is non-BBCOR — verify league compliance for your level.`);
          recommendations.push('High school and college baseball typically require BBCOR (-3) certified bats.');
        }
      } else {
        if (drop >= 10 && drop <= 12) {
          points += 25;
          evidence.push(`Drop ${inputs.drop} is appropriate for youth/rec baseball.`);
        } else {
          points += 15;
          evidence.push(`Drop ${inputs.drop} — verify this meets your league's performance standards.`);
        }
      }
    }
  } else {
    if (inputs.drop === null) missing.push('Drop weight — needed for fit assessment');
    if (inputs.weightOz === null) missing.push('Weight (oz) — needed for fit assessment');
  }

  // End load fit
  if (inputs.balance) {
    maxPoints += 20;
    if (inputs.sport === 'softball_slow') {
      if (inputs.balance === 'end_loaded' && (inputs.skillLevel === 'advanced' || inputs.skillLevel === 'competitive')) {
        points += 20;
        evidence.push('End-loaded bat is appropriate for experienced slow pitch players with good bat speed.');
      } else if (inputs.balance === 'end_loaded' && (inputs.skillLevel === 'beginner' || inputs.skillLevel === 'intermediate')) {
        points += 10;
        evidence.push('End-loaded bat may be difficult to control for intermediate slow pitch players.');
        recommendations.push('Test a balanced bat first to establish consistent contact before moving to end-loaded.');
      } else {
        points += 20;
        evidence.push('Balanced bat is appropriate for contact-focused hitting.');
      }
    } else {
      points += 16;
      evidence.push(`Bat balance: ${inputs.balance}.`);
    }
  } else {
    missing.push('Balance (balanced vs. end-loaded) — important for slow pitch assessment');
  }

  const dataFieldCount = [inputs.lengthIn, inputs.drop, inputs.weightOz, inputs.balance || null].filter(Boolean).length;
  const confidenceScore = maxPoints > 0 ? Math.min(1, (dataFieldCount / 4) * 0.6 + (points / Math.max(maxPoints, 1)) * 0.4) : 0;
  const rawScore = maxPoints > 0 ? Math.round((points / maxPoints) * 100) : 0;
  const penalizedScore = Math.round(rawScore * (0.4 + 0.6 * (dataFieldCount / 4)));

  limitations.push('Bat fit depends on swing mechanics not yet measured — certification compliance must be verified by the player.');
  if (inputs.sport === 'softball_slow') {
    limitations.push('Association stamp compliance (USSSA, USA/ASA, etc.) must be checked manually — SwingVantage does not verify current approval lists.');
  }
  if (missing.length > 0) {
    recommendations.push('Enter the missing specs to improve diagnostic confidence.');
  }

  return {
    overallScore: penalizedScore,
    fitRating: ratingFromScore(penalizedScore, dataFieldCount),
    confidenceScore: Math.round(confidenceScore * 100) / 100,
    upgradeUrgency: urgencyFromScore(penalizedScore),
    adjustmentFirst: penalizedScore >= 50,
    evidence,
    missingData: missing,
    recommendations,
    limitations,
  };
}

// ── Helpers ───────────────────────────────────────────────────

function ratingFromScore(score: number, dataCount: number): EquipmentFitRating {
  if (dataCount === 0) return 'Insufficient Data';
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Mismatch';
}

function urgencyFromScore(score: number): UpgradeUrgency {
  if (score >= 75) return 'None';
  if (score >= 55) return 'Low';
  if (score >= 35) return 'Moderate';
  return 'High';
}
