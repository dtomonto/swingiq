// ============================================================
// SwingIQ — AGI: Bundle merge
// ------------------------------------------------------------
// Combines SignalBundles from several sources (motion, store sessions, …) into
// one. Session refs are de-duplicated by sessionId so the same session can't be
// counted twice. Identity is taken from the first bundle that supplies one
// (and can be passed explicitly).
// ============================================================

import type { AthleteIdentity, SignalBundle } from '../types';

export function mergeBundles(
  bundles: SignalBundle[],
  identity?: AthleteIdentity,
): SignalBundle {
  const signals = bundles.flatMap((b) => b.signals);

  const seen = new Set<string>();
  const sportSessions = [];
  for (const b of bundles) {
    for (const ref of b.sportSessions) {
      if (seen.has(ref.sessionId)) continue;
      seen.add(ref.sessionId);
      sportSessions.push(ref);
    }
  }

  const mergedIdentity = identity ?? bundles.find((b) => b.identity)?.identity;
  return { signals, sportSessions, identity: mergedIdentity };
}
