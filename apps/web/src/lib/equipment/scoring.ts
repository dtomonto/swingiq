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

// ── Pickleball paddle fit ─────────────────────────────────────

export interface PicklePaddleFitInputs {
  shape: string;            // elongated | standard | widebody | ''
  coreThicknessMm: number | null;
  weightOz: number | null;
  faceMaterial: string;     // graphite | carbon_fiber | fiberglass | composite | ''
  gripSize: string;
  /** beginner | intermediate | advanced | competitive */
  skillLevel: string;
  /** control | power | all_court */
  playStyle: string;
}

export function scorePicklePaddle(inputs: PicklePaddleFitInputs): EquipmentDiagnosticResult {
  const evidence: string[] = [];
  const missing: string[] = [];
  const recommendations: string[] = [];
  const limitations: string[] = [];
  let points = 0;
  let maxPoints = 0;

  // Weight (most impactful spec) — typical 7.3–8.4 oz
  if (inputs.weightOz !== null) {
    maxPoints += 25;
    const w = inputs.weightOz;
    if (w >= 7.6 && w <= 8.3) {
      points += 25;
      evidence.push(`Paddle weight ${w} oz is in the balanced midweight range most players control well.`);
    } else if (w < 7.4) {
      points += 14;
      evidence.push(`Paddle weight ${w} oz is light — quick hands at the kitchen, but less drive power and stability.`);
      if (inputs.playStyle === 'power') recommendations.push('For more drive power, a midweight (7.8–8.3 oz) paddle suits a power style better.');
    } else if (w > 8.5) {
      points += 12;
      evidence.push(`Paddle weight ${w} oz is heavy — more power and stability, but can slow hands battles and stress the arm.`);
      limitations.push('Arm-comfort risk requires medical evaluation — SwingVantage cannot diagnose injury risk.');
    } else {
      points += 19;
      evidence.push(`Paddle weight ${w} oz is acceptable.`);
    }
  } else {
    missing.push('Paddle weight — the single most important spec for control vs. power');
  }

  // Core thickness — typical 13mm (control) to 16mm (control/soft)
  if (inputs.coreThicknessMm !== null) {
    maxPoints += 20;
    const t = inputs.coreThicknessMm;
    if (t >= 14 && t <= 16) {
      points += 20;
      evidence.push(`Core thickness ${t}mm favors control and a soft touch for the dink/reset game.`);
    } else if (t < 13) {
      points += 13;
      evidence.push(`Core thickness ${t}mm is thin — more pop/power but a smaller margin on touch shots.`);
      if (inputs.playStyle === 'control') recommendations.push('A 14–16mm core gives more control for a dink/reset style.');
    } else {
      points += 17;
      evidence.push(`Core thickness ${t}mm is on the thicker, control-oriented side.`);
    }
  } else {
    missing.push('Core thickness (mm) — drives the control vs. power balance');
  }

  // Face material
  if (inputs.faceMaterial) {
    maxPoints += 15;
    if (inputs.faceMaterial === 'carbon_fiber' || inputs.faceMaterial === 'graphite') {
      points += 15;
      evidence.push(`A ${inputs.faceMaterial.replace('_', ' ')} face offers a good blend of control and spin for most players.`);
    } else if (inputs.faceMaterial === 'fiberglass') {
      points += 12;
      evidence.push('A fiberglass face is more powerful but offers slightly less touch and spin than carbon.');
    } else {
      points += 12;
      evidence.push(`Face material: ${inputs.faceMaterial}.`);
    }
  } else {
    missing.push('Face material — affects spin and control');
  }

  // Shape
  if (inputs.shape) {
    maxPoints += 10;
    if (inputs.shape === 'elongated') {
      points += 9;
      evidence.push('Elongated shape adds reach and power but has a narrower sweet spot — better for experienced players.');
      if (inputs.skillLevel === 'beginner') recommendations.push('A standard shape has a more forgiving sweet spot while you develop consistency.');
    } else if (inputs.shape === 'widebody' || inputs.shape === 'standard') {
      points += 10;
      evidence.push(`A ${inputs.shape} shape offers a forgiving, wide sweet spot.`);
    } else {
      points += 8;
      evidence.push(`Shape: ${inputs.shape}.`);
    }
  } else {
    missing.push('Paddle shape — affects sweet spot and reach');
  }

  // Grip size
  if (inputs.gripSize) {
    maxPoints += 10;
    points += 10;
    evidence.push(`Grip size ${inputs.gripSize} recorded — a grip that is too large reduces wrist action on dinks.`);
  } else {
    missing.push('Grip size — too large limits touch and wrist action');
  }

  const dataFieldCount = [inputs.weightOz, inputs.coreThicknessMm, inputs.faceMaterial || null, inputs.shape || null, inputs.gripSize || null]
    .filter((v) => v !== null && v !== '').length;
  const confidenceScore = maxPoints > 0 ? Math.min(1, (dataFieldCount / 5) * 0.7 + (points / Math.max(maxPoints, 1)) * 0.3) : 0;
  const rawScore = maxPoints > 0 ? Math.round((points / maxPoints) * 100) : 0;
  const penalizedScore = Math.round(rawScore * (0.4 + 0.6 * (dataFieldCount / 5)));

  limitations.push('This assessment is based on general guidelines, not biomechanical measurement.');
  if (missing.length > 0) recommendations.push('Enter the missing specs above to improve diagnostic confidence.');

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

// ── Padel racket fit ──────────────────────────────────────────

export interface PadelRacketFitInputs {
  shape: string;            // round | teardrop | diamond | ''
  weightG: number | null;
  balance: string;          // low | medium | high | ''
  coreFoam: string;         // soft_eva | medium_eva | hard_eva | foam | ''
  faceMaterial: string;     // carbon | fiberglass | composite | ''
  gripSize: string;
  /** beginner | intermediate | advanced | competitive */
  skillLevel: string;
}

export function scorePadelRacket(inputs: PadelRacketFitInputs): EquipmentDiagnosticResult {
  const evidence: string[] = [];
  const missing: string[] = [];
  const recommendations: string[] = [];
  const limitations: string[] = [];
  let points = 0;
  let maxPoints = 0;

  const isDev = inputs.skillLevel === 'beginner' || inputs.skillLevel === 'intermediate';

  // Shape (defines control vs. power in padel)
  if (inputs.shape) {
    maxPoints += 25;
    if (inputs.shape === 'round') {
      points += 25;
      evidence.push('Round shape centers the sweet spot — the most control-oriented and forgiving, ideal while developing.');
    } else if (inputs.shape === 'teardrop') {
      points += isDev ? 20 : 25;
      evidence.push('Teardrop shape balances control and power — a versatile all-court choice.');
    } else if (inputs.shape === 'diamond') {
      points += isDev ? 12 : 22;
      evidence.push('Diamond shape is power-oriented with a high sweet spot — demanding and best for advanced players.');
      if (isDev) recommendations.push('A round or teardrop shape is more forgiving while you build consistency and net control.');
    } else {
      points += 16;
      evidence.push(`Shape: ${inputs.shape}.`);
    }
  } else {
    missing.push('Racket shape — the biggest driver of control vs. power in padel');
  }

  // Weight — typical 350–375 g
  if (inputs.weightG !== null) {
    maxPoints += 20;
    const w = inputs.weightG;
    if (w >= 355 && w <= 370) {
      points += 20;
      evidence.push(`Weight ${w} g is in the standard range most players handle well.`);
    } else if (w < 350) {
      points += 14;
      evidence.push(`Weight ${w} g is light — fast handling, but less stability on smashes.`);
    } else if (w > 375) {
      points += 12;
      evidence.push(`Weight ${w} g is heavy — more power but harder on the arm in long matches.`);
      limitations.push('Arm-comfort risk requires medical evaluation — SwingVantage cannot diagnose injury risk.');
    } else {
      points += 17;
      evidence.push(`Weight ${w} g is acceptable.`);
    }
  } else {
    missing.push('Weight (g) — affects handling and arm comfort');
  }

  // Balance
  if (inputs.balance) {
    maxPoints += 15;
    if (inputs.balance === 'low') {
      points += 15;
      evidence.push('Low balance (head-light) aids control and quick hands at the net.');
    } else if (inputs.balance === 'high') {
      points += isDev ? 9 : 13;
      evidence.push('High balance (head-heavy) boosts smash power but is harder to control.');
      if (isDev) recommendations.push('A low or medium balance is easier to control while developing.');
    } else {
      points += 13;
      evidence.push('Medium balance offers a control/power compromise.');
    }
  } else {
    missing.push('Balance — head-light vs. head-heavy changes control and power');
  }

  // Core foam softness
  if (inputs.coreFoam) {
    maxPoints += 15;
    if (inputs.coreFoam === 'soft_eva' || inputs.coreFoam === 'foam') {
      points += 15;
      evidence.push(`A ${inputs.coreFoam.replace('_', ' ')} core is softer — more comfort and control, arm-friendlier.`);
    } else if (inputs.coreFoam === 'hard_eva') {
      points += isDev ? 10 : 14;
      evidence.push('A hard EVA core is more powerful but firmer and less forgiving.');
    } else {
      points += 13;
      evidence.push('A medium EVA core balances comfort and power.');
    }
  } else {
    missing.push('Core foam (EVA softness) — affects comfort and power');
  }

  // Face material
  if (inputs.faceMaterial) {
    maxPoints += 10;
    points += inputs.faceMaterial === 'carbon' ? 10 : 8;
    evidence.push(`A ${inputs.faceMaterial} face ${inputs.faceMaterial === 'carbon' ? 'adds grip for spin and durability' : 'is softer and more comfortable'}.`);
  } else {
    missing.push('Face material — affects spin and feel');
  }

  const dataFieldCount = [inputs.shape || null, inputs.weightG, inputs.balance || null, inputs.coreFoam || null, inputs.faceMaterial || null]
    .filter((v) => v !== null && v !== '').length;
  const confidenceScore = maxPoints > 0 ? Math.min(1, (dataFieldCount / 5) * 0.7 + (points / Math.max(maxPoints, 1)) * 0.3) : 0;
  const rawScore = maxPoints > 0 ? Math.round((points / maxPoints) * 100) : 0;
  const penalizedScore = Math.round(rawScore * (0.4 + 0.6 * (dataFieldCount / 5)));

  limitations.push('This assessment is based on general guidelines, not biomechanical measurement.');
  if (missing.length > 0) recommendations.push('Enter the missing specs above to improve diagnostic confidence.');

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
