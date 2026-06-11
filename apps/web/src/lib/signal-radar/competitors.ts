// ============================================================
// SignalRadar OS — competitor intelligence (PURE)
// ------------------------------------------------------------
// Mines competitor-referencing signals into per-competitor insight:
// volume, sentiment split, recurring weakness themes, and positioning
// angles SwingVantage can press. Weaknesses are derived from the signal
// text (honest, not invented) — when none are found, the insight says so.
// ============================================================

import type { Signal, CompetitorDef, CompetitorInsight, Sentiment } from './types';
import { normalizeText } from './classify';

const EMPTY_SENTIMENT = (): Record<Sentiment, number> => ({
  positive: 0, neutral: 0, negative: 0, mixed: 0, unknown: 0,
});

/** Recurring complaint phrases worth surfacing as a weakness theme. */
const WEAKNESS_PHRASES: { match: string; theme: string; angle: string }[] = [
  { match: 'expensive', theme: 'Seen as expensive', angle: 'Lead with a genuinely free, keyless first experience' },
  { match: 'overpriced', theme: 'Seen as overpriced', angle: 'Lead with a genuinely free, keyless first experience' },
  { match: 'subscription', theme: 'Subscription fatigue', angle: 'Emphasize no-paywall analysis up front' },
  { match: 'complicated', theme: 'Hard to use', angle: 'Emphasize the one-fix / one-plan / one-retest simplicity' },
  { match: 'confusing', theme: 'Confusing UX', angle: 'Emphasize mobile-first, premium clarity' },
  { match: 'inaccurate', theme: 'Accuracy doubts', angle: 'Show honest confidence scoring + transparent data sources' },
  { match: 'privacy', theme: 'Privacy concerns', angle: 'Emphasize privacy-forward, no-data-sale stance' },
  { match: 'support', theme: 'Poor support', angle: 'Highlight responsiveness + clear guidance' },
  { match: 'only golf', theme: 'Single-sport', angle: 'Highlight true multi-sport coverage (6+ sports)' },
  { match: 'just golf', theme: 'Single-sport', angle: 'Highlight true multi-sport coverage (6+ sports)' },
];

export function buildCompetitorInsights(
  signals: Signal[],
  competitors: CompetitorDef[],
): CompetitorInsight[] {
  const live = signals.filter((s) => s.status !== 'archived' && s.status !== 'ignored');

  return competitors
    .filter((c) => c.enabled)
    .map((c) => {
      const terms = c.terms.map(normalizeText);
      const matched = live.filter((s) => {
        const hay = normalizeText(`${s.title ?? ''} ${s.cleanText}`);
        return terms.some((t) => t && hay.includes(t));
      });

      const sentimentBreakdown = EMPTY_SENTIMENT();
      const weaknesses = new Map<string, string>(); // theme → angle
      for (const s of matched) {
        sentimentBreakdown[s.classification.sentiment]++;
        const hay = normalizeText(`${s.title ?? ''} ${s.cleanText}`);
        for (const w of WEAKNESS_PHRASES) {
          if (hay.includes(w.match)) weaknesses.set(w.theme, w.angle);
        }
      }

      return {
        competitorId: c.id,
        competitorName: c.name,
        signalCount: matched.length,
        sentimentBreakdown,
        weaknesses: Array.from(weaknesses.keys()),
        positioningAngles: Array.from(weaknesses.values()),
      };
    })
    .sort((a, b) => b.signalCount - a.signalCount);
}
