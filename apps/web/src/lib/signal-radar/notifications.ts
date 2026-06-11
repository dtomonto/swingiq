// ============================================================
// SignalRadar OS — notification derivation (PURE)
// ------------------------------------------------------------
// Turns a signal set into a prioritized list of in-dashboard alerts.
// Pure + deterministic (no Date.now): "what changed / what matters" is
// computed from the signals themselves. The UI renders these in the
// dashboard notification rail; a future cron can forward high-severity
// ones to email/webhook via the same shape.
// ============================================================

import type { Signal, SignalRadarConfig, SignalNotification, SignalSport } from './types';
import { SPORT_LABEL } from './labels';

const SPORT_SPIKE_THRESHOLD = 3;

export function deriveNotifications(signals: Signal[], _config: SignalRadarConfig): SignalNotification[] {
  const live = signals.filter((s) => s.status !== 'archived' && s.status !== 'ignored');
  const out: SignalNotification[] = [];

  // High-priority unreviewed signals
  for (const s of live.filter((x) => x.status === 'new' && x.scores.priority >= 75)) {
    out.push({
      id: `n_hp_${s.id}`,
      kind: 'high_priority',
      severity: s.scores.priority >= 85 ? 'critical' : 'high',
      title: 'High-priority signal needs review',
      detail: truncate(s.title || s.cleanText, 90),
      signalId: s.id,
    });
  }

  // Negative / reputation-risk signals
  for (const s of live.filter((x) => x.classification.intent === 'reputation_risk')) {
    out.push({
      id: `n_rep_${s.id}`,
      kind: 'negative_mention',
      severity: s.classification.sentiment === 'negative' ? 'critical' : 'high',
      title: 'Possible reputation risk',
      detail: truncate(s.title || s.cleanText, 90),
      signalId: s.id,
    });
  }

  // Backlink opportunities (brand mentioned, no link present)
  for (const s of live.filter((x) => x.classification.intent === 'backlink_opportunity')) {
    out.push({
      id: `n_bl_${s.id}`,
      kind: 'backlink_opportunity',
      severity: 'medium',
      title: 'Backlink opportunity',
      detail: `${s.sourceDomain ?? s.sourceName}: mentions SwingVantage — pursue a link`,
      signalId: s.id,
    });
  }

  // Competitor comparisons
  for (const s of live.filter((x) => x.classification.intent === 'purchase_comparison' && x.classification.competitorTermsMatched.length)) {
    out.push({
      id: `n_cmp_${s.id}`,
      kind: 'competitor_comparison',
      severity: 'medium',
      title: 'Competitor comparison detected',
      detail: `vs ${s.classification.competitorTermsMatched.join(', ')}`,
      signalId: s.id,
    });
  }

  // Bug / complaint
  for (const s of live.filter((x) => x.classification.intent === 'bug_report')) {
    out.push({
      id: `n_bug_${s.id}`,
      kind: 'bug_complaint',
      severity: 'high',
      title: 'Bug / complaint reported',
      detail: truncate(s.title || s.cleanText, 90),
      signalId: s.id,
    });
  }

  // Sport demand spikes
  const sportCounts = new Map<SignalSport, number>();
  for (const s of live) {
    if (s.classification.sport === 'unknown') continue;
    sportCounts.set(s.classification.sport, (sportCounts.get(s.classification.sport) ?? 0) + 1);
  }
  for (const [sport, count] of sportCounts) {
    if (count >= SPORT_SPIKE_THRESHOLD) {
      out.push({
        id: `n_spike_${sport}`,
        kind: 'sport_spike',
        severity: 'low',
        title: `${SPORT_LABEL[sport]} demand is active`,
        detail: `${count} signals reference ${SPORT_LABEL[sport]} — consider prioritizing that surface`,
      });
    }
  }

  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  return out.sort((a, b) => order[a.severity] - order[b.severity]);
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
