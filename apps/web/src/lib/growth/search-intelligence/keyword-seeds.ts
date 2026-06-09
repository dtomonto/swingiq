// ============================================================
// SearchIntelligenceOS — Keyword seed clusters (§20)
// ------------------------------------------------------------
// The opportunity clusters from the brief — golf (beachhead) + slow-pitch
// softball (named secondary) in depth, plus lighter seeds for the other
// sports. These are STRATEGIC seeds, not measured demand: volume/difficulty
// are derived as RELATIVE estimates in keywords.ts and labeled accordingly.
// A real provider (GSC/Ahrefs/CSV import) layers verified data on top later.
// ============================================================

import type { LinkSport, LinkIntent, LinkFunnel } from './types';

export interface KeywordSeed {
  keyword: string;
  intent: LinkIntent;
  funnelStage: LinkFunnel;
  sport: LinkSport;
}

const golf = (keyword: string, intent: LinkIntent, funnelStage: LinkFunnel): KeywordSeed =>
  ({ keyword, intent, funnelStage, sport: 'golf' });
const slow = (keyword: string, intent: LinkIntent, funnelStage: LinkFunnel): KeywordSeed =>
  ({ keyword, intent, funnelStage, sport: 'softball' });

export const KEYWORD_SEEDS: KeywordSeed[] = [
  // ── Golf (beachhead) ──
  golf('fix golf slice', 'informational', 'consideration'),
  golf('golf swing analysis', 'commercial', 'consideration'),
  golf('ai golf swing analyzer', 'commercial', 'consideration'),
  golf('golf swing plane', 'informational', 'awareness'),
  golf('golf grip', 'informational', 'awareness'),
  golf('golf weight distribution', 'informational', 'awareness'),
  golf('golf drills at home', 'informational', 'consideration'),
  golf('stop chunking golf shots', 'informational', 'consideration'),
  golf('stop topping golf ball', 'informational', 'consideration'),
  golf('driver slice fix', 'informational', 'consideration'),
  golf('iron consistency', 'informational', 'consideration'),
  golf('wedge distance control', 'informational', 'consideration'),
  golf('practice plan to break 90', 'informational', 'consideration'),
  golf('practice plan to break 80', 'informational', 'consideration'),
  golf('golf swing faults', 'informational', 'awareness'),
  golf('launch monitor practice', 'informational', 'consideration'),
  golf('mevo gen 2 golf practice', 'commercial', 'consideration'),
  golf('golf swing video analysis', 'commercial', 'consideration'),

  // ── Slow-pitch softball (secondary) ──
  slow('slow pitch softball swing', 'informational', 'consideration'),
  slow('slow pitch softball hitting drills', 'informational', 'consideration'),
  slow('how to hit line drives in slow pitch', 'informational', 'consideration'),
  slow('slow pitch softball bat speed', 'informational', 'consideration'),
  slow('slow pitch softball ground ball drills', 'informational', 'consideration'),
  slow('softball shortstop drills', 'informational', 'consideration'),
  slow('slow pitch softball practice plan', 'informational', 'consideration'),
  slow('slow pitch softball swing analysis', 'commercial', 'consideration'),

  // ── Lighter cross-sport seeds ──
  { keyword: 'tennis forehand analysis', intent: 'commercial', funnelStage: 'consideration', sport: 'tennis' },
  { keyword: 'tennis serve technique', intent: 'informational', funnelStage: 'awareness', sport: 'tennis' },
  { keyword: 'baseball bat speed drills', intent: 'informational', funnelStage: 'consideration', sport: 'baseball' },
  { keyword: 'exit velocity training', intent: 'informational', funnelStage: 'consideration', sport: 'baseball' },
  { keyword: 'pickleball third shot drop', intent: 'informational', funnelStage: 'awareness', sport: 'pickleball' },
  { keyword: 'padel bandeja technique', intent: 'informational', funnelStage: 'awareness', sport: 'padel' },
  { keyword: 'fast pitch softball hitting', intent: 'informational', funnelStage: 'consideration', sport: 'softball' },
];
