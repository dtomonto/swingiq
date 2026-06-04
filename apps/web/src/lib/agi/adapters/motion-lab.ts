// ============================================================
// SwingIQ — AGI: Motion Lab adapter
// ------------------------------------------------------------
// The ONLY file in the AGI layer that imports from @/lib/motion-lab. It reads
// motion-lab sessions (read-only) and normalises them into a sport-neutral
// SignalBundle. Isolating the dependency here is deliberate: Motion Lab is
// under active development by another workstream (temporal intelligence,
// kinetic chain, etc.), so if its internals shift, only this thin adapter
// needs to follow — the engine and reasoners stay untouched.
//
// We read only long-stable, public motion-lab fields (metrics, scoreboard,
// report.topFixes, capture.sport) and read everything defensively.
// ============================================================

import { loadSessions, type MotionSession } from '@/lib/motion-lab';
import { classifyMetric } from '../capabilities';
import { runAthleteGI } from '../engine';
import type {
  AthleteGIResult,
  CapabilityId,
  CapabilitySignal,
  DrillHint,
  SignalBundle,
  SportSessionRef,
} from '../types';

function firstCapabilityFor(metricIds: string[]): CapabilityId | null {
  for (const id of metricIds) {
    const cap = classifyMetric(id);
    if (cap) return cap;
  }
  return null;
}

/** Normalise a list of Motion Lab sessions into a sport-neutral SignalBundle. */
export function bundleFromMotionSessions(sessions: MotionSession[]): SignalBundle {
  const signals: CapabilitySignal[] = [];
  const sportSessions: SportSessionRef[] = [];

  for (const s of sessions) {
    const at = s.createdAt ?? new Date().toISOString();
    const sport = s.capture?.sport;
    if (!sport) continue;

    // Capability signals from each scored metric.
    for (const m of s.metrics ?? []) {
      if (m.value === null || m.normalizedScore === null) continue;
      const capability = classifyMetric(m.id, m.name, m.phase);
      if (!capability) continue;
      signals.push({
        capability,
        sport,
        score: m.normalizedScore,
        confidence: typeof m.confidence === 'number' ? m.confidence : 0.5,
        basis: m.basis ?? 'estimated',
        metricId: m.id,
        metricName: m.name,
        at,
        sessionId: s.id,
      });
    }

    // Drill hints from the coaching report's top fixes.
    const drillHints: DrillHint[] = [];
    for (const fix of s.report?.topFixes ?? []) {
      const capability = firstCapabilityFor(fix.metricIds ?? []);
      if (!capability) continue;
      drillHints.push({
        capability,
        fix: fix.title || fix.fix,
        drillId: fix.drillId ?? null,
      });
    }

    sportSessions.push({
      sport,
      sportLabel: s.sportLabel ?? sport,
      emoji: s.emoji ?? '🏅',
      motionLabel: s.motionLabel ?? '',
      sessionId: s.id,
      at,
      overall: s.scoreboard?.overall ?? 0,
      confidence: s.scoreboard?.confidence ?? 0.5,
      keyFault: s.keyFault ?? '',
      drillHints,
    });
  }

  return { signals, sportSessions };
}

/**
 * Convenience: load every stored Motion Lab session and run the full Athlete
 * General Intelligence pipeline. Browser-only (localStorage); returns an empty
 * model on the server / when there is no data.
 */
export function loadAthleteGI(): AthleteGIResult {
  const sessions = loadSessions();
  return runAthleteGI(bundleFromMotionSessions(sessions));
}
