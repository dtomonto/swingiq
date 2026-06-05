// ============================================================
// SwingVantage — Motion Lab: AI Coach Narrative
// ------------------------------------------------------------
// Turns a MotionSession into a conversational coach explanation in the
// SwingVantage output format: Main finding → Why it matters → Evidence →
// What it may cause → What to feel → One cue → One drill → Next upload.
//
// HONESTY: the narrative is built DETERMINISTICALLY from the grounded
// analysis (report, scoreboard, kinetic chain, temporal, implement path,
// weakest metric) — it never invents findings. The optional LLM only
// REPHRASES the already-grounded text into warmer language, behind the
// existing `getActiveProvider()` flag (OFF by default → fully functional
// with no API keys). Any failure falls back to the deterministic text.
//
// Pure builder is unit-tested in __tests__/coachNarrative.test.ts.
// ============================================================

import type { MotionSession, MotionMetric, MotionBasis } from './types';
import { getActiveProvider } from '@/lib/agents';
import type { SportId } from '@swingiq/core';

export type CoachNarrativeTone = 'warm' | 'concise' | 'coach';

export interface MotionCoachNarrative {
  mainFinding: string;
  whyItMatters: string;
  evidence: string;
  whatItMayCause: string;
  whatToFeel: string;
  cue: string;
  drill: string;
  nextUpload: string;
  /** The assembled narrative (this is what an LLM optionally rephrases). */
  fullText: string;
  /** 'local' = deterministic; 'llm' = optionally rephrased by the flagged model. */
  source: 'local' | 'llm';
  basis: MotionBasis;
  confidence: number;
  disclaimer: string;
}

const DISCLAIMER =
  'This read is generated from your single-camera analysis — directional coaching, not a lab measurement or medical advice. Review big changes with a qualified coach.';

const SPORT_IMPACT: Record<SportId, string> = {
  golf: 'a cut/slice pattern or an inconsistent strike',
  tennis: 'reduced pace and control, or late contact',
  baseball: 'weaker contact and lost carry',
  softball_slow: 'weaker contact and pop-ups',
  softball_fast: 'weaker contact and lost carry',
};

/** The lowest-scoring metric that actually has a value — the priority. */
function weakestMetric(session: MotionSession): MotionMetric | null {
  const scored = (session.metrics ?? []).filter((m) => m.normalizedScore != null && m.value != null);
  if (scored.length === 0) return null;
  return scored.reduce((lo, m) => ((m.normalizedScore ?? 100) < (lo.normalizedScore ?? 100) ? m : lo), scored[0]);
}

/**
 * Build the grounded, deterministic coach narrative. Pure — no I/O, never throws.
 */
export function buildMotionCoachNarrative(session: MotionSession): MotionCoachNarrative {
  const report = session.report;
  const weakest = weakestMetric(session);
  const kc = session.kineticChain;
  const tp = session.temporal;
  const ot = session.objectTracking;
  const sport = session.capture.sport;

  const topFix = report?.topFixes?.[0] ?? null;

  const mainFinding = topFix
    ? `${topFix.title}. ${topFix.problem}`
    : report?.diagnosis || 'Your motion is broadly sound — the work now is refining the details and making it repeatable.';

  const whyItMatters =
    weakest?.whyItMatters || report?.rootCause || 'Small, repeatable gains in your priority area compound into real consistency.';

  // Evidence — only real numbers from the analysis.
  const ev: string[] = [];
  if (session.scoreboard) {
    ev.push(`Overall ${session.scoreboard.overall}/100 (confidence ${Math.round(session.scoreboard.confidence * 100)}%).`);
  }
  if (kc && kc.comparableLinks > 0) {
    const leak = kc.powerLeakFlags[0];
    ev.push(`Kinetic sequence ${kc.sequenceQuality}/100${leak ? ` — ${leak.label.toLowerCase()}` : ''}.`);
  }
  if (weakest && weakest.value != null) {
    ev.push(`${weakest.name} read about ${weakest.value}${weakest.unit}.`);
  }
  if (ot?.available) {
    ev.push(`Estimated ${ot.implement} path looked ${ot.swingPath.approach} through contact.`);
  }
  const evidence = ev.length ? ev.join(' ') : 'Based on the tracked motion in this clip.';

  const whatItMayCause = `For ${session.sportLabel?.toLowerCase() ?? sport}, this may contribute to ${SPORT_IMPACT[sport] ?? 'inconsistent contact'}.`;

  const whatToFeel =
    kc?.recommendedFocus || tp?.summary || weakest?.recommendedFix || 'Smooth, balanced, and in sequence — let speed arrive at contact, not before.';

  const drillObj = session.drills?.immediate ?? null;
  const cue = drillObj?.successCue || weakest?.recommendedFix || 'Smooth and balanced through the ball.';

  const drill = drillObj
    ? `${drillObj.name} — ${drillObj.problemItSolves} (about ${drillObj.estimatedMinutes} min).`
    : 'Slow, deliberate reps of the motion, holding your finish for a two-count.';

  const focusName = weakest?.name?.toLowerCase() || 'your priority area';
  const nextUpload = `Record from the same angle next time and check whether your ${focusName} looks smoother.`;

  const fullText = [
    `Main finding: ${mainFinding}`,
    `Why it matters: ${whyItMatters}`,
    `Evidence: ${evidence}`,
    `What it may cause: ${whatItMayCause}`,
    `What to feel: ${whatToFeel}`,
    `One cue: ${cue}`,
    `One drill: ${drill}`,
    `Next upload: ${nextUpload}`,
  ].join('\n');

  return {
    mainFinding,
    whyItMatters,
    evidence,
    whatItMayCause,
    whatToFeel,
    cue,
    drill,
    nextUpload,
    fullText,
    source: 'local',
    basis: session.poseTrack?.basis ?? 'estimated',
    confidence: session.scoreboard?.confidence ?? 0,
    disclaimer: DISCLAIMER,
  };
}

/**
 * Build the narrative, then OPTIONALLY rephrase it with the flagged LLM provider
 * (warmer language only — the substance is always the deterministic build).
 * Never throws; returns the deterministic narrative when the LLM is off/fails.
 */
export async function narrateMotionSession(
  session: MotionSession,
  opts: { tone?: CoachNarrativeTone } = {},
): Promise<MotionCoachNarrative> {
  const base = buildMotionCoachNarrative(session);
  try {
    const provider = getActiveProvider();
    if (provider.id === 'llm' && provider.isAvailable()) {
      const enhanced = await provider.enhanceSummary({
        text: base.fullText,
        sport: session.capture.sport,
        tone: opts.tone ?? 'coach',
      });
      if (enhanced && enhanced.trim() && enhanced.trim() !== base.fullText.trim()) {
        return { ...base, fullText: enhanced, source: 'llm' };
      }
    }
  } catch {
    // Deterministic fallback — the app never depends on the LLM.
  }
  return base;
}
