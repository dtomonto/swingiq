// ============================================================
// SwingVantage — AI output grounding (recommendation #2)
// ------------------------------------------------------------
// The coach system prompt says "never invent numbers" — this VERIFIES it.
// Given an AI response and the structured context it was built from, it checks
// every physical-measurement claim (degrees / yards / mph / rpm) against the
// numbers actually present in the player's data. Anything not traceable to the
// context (within a rounding tolerance) is flagged as a potential fabrication.
//
// Deliberately scoped to unambiguous MEASUREMENT units — it does NOT touch
// prescriptive numbers ("hit 30 balls", "2 minutes", "150 words"), which are
// legitimate coaching and carry non-measurement units. Pure + keyless: runs on
// any response string, including the no-key placeholder. Storage-free.
// ============================================================

import type { CoachContext } from '../ai-coach-prompts';

type Unit = 'deg' | 'yard' | 'mph' | 'rpm';

/** Per-unit tolerance for matching a stated number to a context value (rounding). */
const TOLERANCE: Record<Unit, number> = {
  deg: 0.6,
  yard: 4,
  mph: 2.5,
  rpm: 200,
};

function normalizeUnit(raw: string): Unit | null {
  const u = raw.toLowerCase();
  if (u === '°' || u.startsWith('deg')) return 'deg';
  if (u.startsWith('yard') || u === 'yds' || u === 'yd') return 'yard';
  if (u === 'mph') return 'mph';
  if (u === 'rpm') return 'rpm';
  return null;
}

/** Collect every number the AI is allowed to cite, from the structured context. */
export function extractContextNumbers(ctx: CoachContext): number[] {
  const nums: number[] = [];
  const push = (v: number | undefined | null) => {
    if (typeof v === 'number' && Number.isFinite(v)) {
      nums.push(v);
      nums.push(Math.abs(v)); // copy phrased as "X yards right" drops the sign
    }
  };

  const s = ctx.current_session_stats;
  if (s) {
    push(s.avg_carry);
    push(s.avg_ball_speed);
    push(s.avg_launch_angle);
    push(s.avg_spin_rate);
    push(s.avg_spin_axis);
    push(s.avg_smash_factor);
    push(s.avg_face_to_path);
    push(s.avg_club_path);
    push(s.avg_face_angle);
    push(s.avg_attack_angle);
    push(s.avg_dynamic_loft);
    push(s.avg_spin_loft);
    push(s.avg_lateral_offline);
    push(s.avg_apex);
    push(s.carry_std_dev);
  }
  return nums;
}

export interface GroundingResult {
  /** True when no measurement claim is unsupported by the context. */
  grounded: boolean;
  /** True when the response cites at least one real data number. */
  referencedData: boolean;
  /** Measurement phrases in the response that don't trace to the context. */
  ungroundedClaims: string[];
  /** How many measurement claims were checked. */
  measurementClaims: number;
}

/**
 * Validate that the response's physical-measurement claims trace to the data.
 * `grounded: false` means the AI stated a degree/yard/mph/rpm value that isn't
 * in the player's data within tolerance — a likely fabrication to surface or
 * regenerate.
 */
export function validateGrounding(responseText: string, ctx: CoachContext): GroundingResult {
  const allowed = extractContextNumbers(ctx);
  const ungroundedClaims: string[] = [];
  let measurementClaims = 0;
  let referencedData = false;

  // number (optional sign/decimal) + optional space + a measurement unit.
  // `°` matches boundary-free (it's punctuation); word-units keep a trailing \b
  // so "yardstick" / "degrade" don't false-match.
  const re = /([+-]?\d+(?:\.\d+)?)\s*(°|(?:degrees?|deg|yards?|yds?|yd|mph|rpm)\b)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(responseText)) !== null) {
    const value = parseFloat(m[1]);
    const unit = normalizeUnit(m[2]);
    if (unit === null || !Number.isFinite(value)) continue;
    measurementClaims++;
    const tol = TOLERANCE[unit];
    const matches = allowed.some((n) => Math.abs(n - value) <= tol || Math.abs(Math.abs(n) - Math.abs(value)) <= tol);
    if (matches) referencedData = true;
    else ungroundedClaims.push(m[0].trim());
  }

  return {
    grounded: ungroundedClaims.length === 0,
    referencedData,
    ungroundedClaims,
    measurementClaims,
  };
}
