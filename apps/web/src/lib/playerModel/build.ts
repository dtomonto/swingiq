// ============================================================
// SwingIQ — Training Twin Foundation (Player Model): Builder
// ------------------------------------------------------------
// Pure summarization over the user's own saved data. Produces both
// a structured model and a compact `summaryText` that a future AI
// memory layer can ingest verbatim. Never fabricates tendencies it
// can't see in the data.
// ============================================================

import type { TrendDirection } from '@/lib/agents';
import type { PlayerModel, PlayerModelInput } from './types';

const TREND_PHRASE: Record<TrendDirection, string> = {
  improving: 'trending up lately',
  stable: 'holding steady',
  declining: 'dipping a little recently',
  unknown: 'just getting started',
};

const DISCLAIMER =
  'This is your Player Model — the foundation for a future Training Twin. It is assembled only from your own saved sessions and feedback, updates as you add more, and is not an autonomous coach. Export or delete it anytime from the Data Center.';

export function buildPlayerModel(input: PlayerModelInput): PlayerModel {
  const {
    sport,
    sportLabel,
    skillLevel,
    goal,
    constraints = [],
    sessionsLogged,
    trendDirection,
    recurringFaults,
    drillsThatHelped,
    nextBestAction,
    equipmentCompleteness,
  } = input;

  const hasData = sessionsLogged > 0;

  const tendencies: string[] = [];
  if (skillLevel) tendencies.push(`Plays at a ${skillLevel} level`);
  if (hasData) tendencies.push(`Currently ${TREND_PHRASE[trendDirection]}`);
  if (recurringFaults.length > 0) {
    tendencies.push(`Keeps running into: ${recurringFaults.slice(0, 3).join(', ')}`);
  }
  if (drillsThatHelped.length > 0) {
    tendencies.push(`Responds well to drills like "${drillsThatHelped[0]}"`);
  }
  if (equipmentCompleteness >= 70) tendencies.push('Equipment profile is well filled in');
  else if (equipmentCompleteness > 0) tendencies.push('Equipment profile is partial');

  // Compact, ingestible summary line.
  const parts: string[] = [];
  parts.push(`${sportLabel} player${skillLevel ? `, ${skillLevel} level` : ''}.`);
  if (goal) parts.push(`Goal: ${goal}.`);
  if (hasData) parts.push(`Form is ${TREND_PHRASE[trendDirection]} across ${sessionsLogged} session${sessionsLogged > 1 ? 's' : ''}.`);
  if (recurringFaults.length > 0) parts.push(`Recurring focus: ${recurringFaults.slice(0, 3).join(', ')}.`);
  if (drillsThatHelped.length > 0) parts.push(`Drills that have helped: ${drillsThatHelped.slice(0, 2).join(', ')}.`);
  if (constraints.length > 0) parts.push(`Constraints to respect: ${constraints.join(', ')}.`);
  parts.push(`Next best move: ${nextBestAction}`);
  const summaryText = hasData
    ? parts.join(' ')
    : `New ${sportLabel} player${skillLevel ? ` at a ${skillLevel} level` : ''}${goal ? ` with the goal: ${goal}` : ''}. No sessions logged yet — the model fills in as they practise.`;

  return {
    sport,
    generatedAt: new Date().toISOString(),
    hasData,
    tendencies,
    recurringFaults,
    whatWorks: drillsThatHelped,
    goal: goal ?? null,
    constraints,
    nextBestAction,
    summaryText,
    disclaimer: DISCLAIMER,
  };
}
