// ============================================================
// SwingVantage — AGI: Cross-domain transfer
// ------------------------------------------------------------
// Generalisation is the whole point of a *general* intelligence: a thing
// learned in one sport should inform the others. This reuses the app's
// shared movement-principle map (@/lib/skillTransfer) and grounds each link
// in THIS athlete's data — we only surface a transfer when the capability is
// actually evidenced in both the source and target sport.
// ============================================================

import type { SportId } from '@swingiq/core';
import { getPrinciple } from '@/lib/skillTransfer';
import { getCapability } from './capabilities';
import type {
  AthleteWorldModel,
  CapabilityId,
  CapabilityState,
  KeystoneTranslation,
  TransferLink,
} from './types';

const TRANSFER_NOTE =
  'Related ideas — a pattern that helps one motion often helps the other, but it may transfer differently. Treat it as a hint, not a guarantee.';

/**
 * Phrase a capability (e.g. the keystone) in each of the athlete's sports, using
 * the shared principle's sport-specific expression. Makes an abstract capability
 * concrete and actionable per sport.
 */
export function buildKeystoneTranslations(
  capId: CapabilityId | null,
  model: AthleteWorldModel,
  sportLabels: Map<SportId, string>,
): KeystoneTranslation[] {
  if (!capId) return [];
  const def = getCapability(capId);
  if (!def.principleId) return [];
  const principle = getPrinciple(def.principleId);
  if (!principle) return [];

  const out: KeystoneTranslation[] = [];
  for (const sport of model.sports) {
    const text = principle.expressions[sport];
    if (!text) continue;
    out.push({ sport, sportLabel: sportLabels.get(sport) ?? sport, text });
  }
  return out;
}

function rationaleFor(cap: CapabilityState, from: SportId, to: SportId): string {
  const fromScore = cap.perSport.find((p) => p.sport === from)?.score;
  const toScore = cap.perSport.find((p) => p.sport === to)?.score;
  if (fromScore == null || toScore == null) {
    return `${cap.name} shows up in both sports, so work on it carries across.`;
  }
  const gap = fromScore - toScore;
  if (gap >= 12) {
    return `Your ${cap.name.toLowerCase()} reads stronger here (${fromScore}) than there (${toScore}) — the skill is already in your body, so this is a translation, not a rebuild.`;
  }
  if (gap <= -12) {
    return `Your ${cap.name.toLowerCase()} reads stronger in the other sport (${toScore} vs ${fromScore}) — borrow that feel back into this one.`;
  }
  return `${cap.name} reads similarly in both (${fromScore} / ${toScore}); training it once maintains both.`;
}

/**
 * Build transfer links from the athlete's primary sport to each other sport,
 * for every capability that has a shared principle AND is evidenced in both.
 */
export function buildTransfers(model: AthleteWorldModel): TransferLink[] {
  const out: TransferLink[] = [];
  const primary = model.primarySport;
  if (!primary || !model.crossSport) return out;

  const others = model.sports.filter((s) => s !== primary);

  for (const cap of model.capabilities) {
    const def = getCapability(cap.capability);
    if (!def.principleId) continue;
    const principle = getPrinciple(def.principleId);
    if (!principle) continue;
    const fromExpr = principle.expressions[primary];
    if (!fromExpr) continue;
    if (!cap.sports.includes(primary)) continue;

    for (const to of others) {
      const toExpr = principle.expressions[to];
      if (!toExpr) continue;
      if (!cap.sports.includes(to)) continue;
      out.push({
        capability: cap.capability,
        principle: principle.name,
        fromSport: primary,
        toSport: to,
        fromExpression: fromExpr,
        toExpression: toExpr,
        rationale: rationaleFor(cap, primary, to),
        note: TRANSFER_NOTE,
      });
    }
  }
  return out;
}
