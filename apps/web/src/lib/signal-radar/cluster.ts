// ============================================================
// SignalRadar OS — theme clustering (PURE)
// ------------------------------------------------------------
// Groups related signals into named themes so the operator sees patterns
// ("People asking for free golf analysis") instead of raw rows. The key
// is intent + sport, which is cheap, deterministic, and explainable. A
// theme is only surfaced when at least two signals share it.
// ============================================================

import type { Signal, SignalCluster, SignalIntent, SignalSport } from './types';
import { hashString } from './normalize';

const INTENT_PHRASE: Record<SignalIntent, string> = {
  brand_mention: 'Brand mentions',
  product_question: 'Product questions',
  support_issue: 'Support issues',
  feature_request: 'Feature requests',
  bug_report: 'Bug reports',
  purchase_comparison: 'People comparing apps',
  coaching_need: 'People wanting swing feedback',
  seo_content_opportunity: 'Unanswered questions',
  backlink_opportunity: 'Backlink opportunities',
  partnership_opportunity: 'Partnership opportunities',
  creator_opportunity: 'Creators worth contacting',
  competitive_intel: 'Competitor chatter',
  reputation_risk: 'Reputation risks',
  press_media: 'Press / media',
  spam_noise: 'Noise',
};

const SPORT_PHRASE: Record<SignalSport, string> = {
  golf: 'golf',
  tennis: 'tennis',
  baseball: 'baseball',
  softball_fast: 'fastpitch softball',
  softball_slow: 'slowpitch softball',
  pickleball: 'pickleball',
  padel: 'padel',
  multi_sport: 'multiple sports',
  unknown: 'general',
};

function themeLabel(intent: SignalIntent, sport: SignalSport): string {
  const base = INTENT_PHRASE[intent];
  if (sport === 'unknown') return base;
  return `${base} · ${SPORT_PHRASE[sport]}`;
}

/** Build clusters (size ≥ 2) sorted largest-first. Pure. */
export function clusterSignals(signals: Signal[], minSize = 2): SignalCluster[] {
  const groups = new Map<string, Signal[]>();
  for (const s of signals) {
    if (s.classification.intent === 'spam_noise') continue;
    const key = `${s.classification.intent}|${s.classification.sport}`;
    const arr = groups.get(key) ?? [];
    arr.push(s);
    groups.set(key, arr);
  }

  const clusters: SignalCluster[] = [];
  for (const [key, members] of groups) {
    if (members.length < minSize) continue;
    const [intent, sport] = key.split('|') as [SignalIntent, SignalSport];
    clusters.push({
      id: `cl_${hashString(key)}`,
      theme: themeLabel(intent, sport),
      signalIds: members.map((m) => m.id),
      size: members.length,
      topSport: sport,
      topIntent: intent,
    });
  }
  return clusters.sort((a, b) => b.size - a.size);
}
