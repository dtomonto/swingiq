// ============================================================
// SignalRadar OS — orchestration engine (PURE)
// ------------------------------------------------------------
// Ties the pure stages together: normalize → dedupe → classify → score
// → assemble Signal, and rolls a signal set up into the dashboard model
// + inbox filters/sorts. Everything here is deterministic given a `now`
// and an id factory, so it runs identically in the client and in jest.
// ============================================================

import type {
  RawSignalInput,
  Signal,
  SignalRadarConfig,
  CompetitorDef,
  SignalDashboard,
  DistributionBucket,
  SignalSport,
} from './types';
import { normalizeSignal } from './normalize';
import { dedupe } from './dedup';
import { classifySignal } from './classify';
import { computeScores } from './scoring';
import { clusterSignals } from './cluster';
import { deriveNotifications } from './notifications';
import {
  SENTIMENT_LABEL,
  INTENT_LABEL,
  SPORT_LABEL,
  SOURCE_TYPE_LABEL,
} from './labels';

export interface ProcessOptions {
  now: string;
  makeId: (index: number) => string;
  /** Fingerprints already stored, so re-imports don't duplicate. */
  knownFingerprints?: Iterable<string>;
}

export interface ProcessResult {
  signals: Signal[];
  duplicateCount: number;
}

/** Normalize → dedupe → classify → score a batch of raw inputs. */
export function processRawInputs(
  inputs: RawSignalInput[],
  config: SignalRadarConfig,
  competitors: CompetitorDef[],
  opts: ProcessOptions,
): ProcessResult {
  const normalized = inputs.map((input, i) => normalizeSignal(input, { id: opts.makeId(i), now: opts.now }));
  const { unique, duplicates } = dedupe(normalized, opts.knownFingerprints);

  const signals: Signal[] = unique.map((sig) => {
    const sportHint = inputFor(inputs, sig.rawText)?.sportHint;
    const classification = classifySignal(
      { title: sig.title, text: sig.cleanText },
      config,
      { competitors, sportHint },
    );
    const scores = computeScores(sig, classification, config.weights, opts.now);
    return {
      ...sig,
      classification,
      scores,
      status: 'new',
      notes: [],
      createdAt: opts.now,
      updatedAt: opts.now,
    };
  });

  return { signals, duplicateCount: duplicates.length };
}

function inputFor(inputs: RawSignalInput[], rawText: string): RawSignalInput | undefined {
  return inputs.find((i) => i.text === rawText);
}

/** Re-classify + re-score an existing signal (e.g. after settings change). */
export function reprocessSignal(
  signal: Signal,
  config: SignalRadarConfig,
  competitors: CompetitorDef[],
  now: string,
): Signal {
  const classification = classifySignal(
    { title: signal.title, text: signal.cleanText },
    config,
    { competitors },
  );
  const scores = computeScores(signal, classification, config.weights, now);
  return { ...signal, classification, scores, updatedAt: now };
}

// ── Dashboard roll-up ───────────────────────────────────────
const ACTIVE = new Set(['new', 'reviewed', 'in_progress']);

function dist(signals: Signal[], keyOf: (s: Signal) => string, labelOf: (k: string) => string): DistributionBucket[] {
  const counts = new Map<string, number>();
  for (const s of signals) {
    const k = keyOf(s);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([key, count]) => ({ key, label: labelOf(key), count }))
    .sort((a, b) => b.count - a.count);
}

export function buildDashboard(signals: Signal[], config: SignalRadarConfig): SignalDashboard {
  const live = signals.filter((s) => s.status !== 'archived' && s.status !== 'ignored');

  const highPriority = live.filter((s) => s.scores.priority >= 65);
  const negativeRisk = live.filter(
    (s) => s.classification.sentiment === 'negative' || s.classification.intent === 'reputation_risk',
  );
  const seoOpps = live.filter(
    (s) => s.classification.intent === 'seo_content_opportunity' || s.classification.intent === 'coaching_need',
  );
  const productFeedback = live.filter(
    (s) => s.classification.intent === 'feature_request' || s.classification.intent === 'bug_report',
  );
  const backlinkOpps = live.filter((s) => s.classification.intent === 'backlink_opportunity');
  const partnershipLeads = live.filter(
    (s) => s.classification.intent === 'partnership_opportunity' || s.classification.intent === 'creator_opportunity',
  );

  const needsAttention = [...live]
    .filter((s) => ACTIVE.has(s.status))
    .sort((a, b) => b.scores.priority - a.scores.priority)
    .slice(0, 8);

  const priorityBucket = (p: number) =>
    p >= 80 ? 'critical' : p >= 60 ? 'high' : p >= 35 ? 'medium' : 'low';

  return {
    totals: {
      all: signals.length,
      newCount: signals.filter((s) => s.status === 'new').length,
      highPriority: highPriority.length,
      negativeRisk: negativeRisk.length,
      seoOpportunities: seoOpps.length,
      productFeedback: productFeedback.length,
      backlinkOpportunities: backlinkOpps.length,
      partnershipLeads: partnershipLeads.length,
    },
    needsAttention,
    bySource: dist(live, (s) => s.sourceType, (k) => SOURCE_TYPE_LABEL[k as keyof typeof SOURCE_TYPE_LABEL] ?? k),
    bySentiment: dist(live, (s) => s.classification.sentiment, (k) => SENTIMENT_LABEL[k as keyof typeof SENTIMENT_LABEL] ?? k),
    bySport: dist(live, (s) => s.classification.sport, (k) => SPORT_LABEL[k as SignalSport] ?? k),
    byIntent: dist(live, (s) => s.classification.intent, (k) => INTENT_LABEL[k as keyof typeof INTENT_LABEL] ?? k),
    byPriority: dist(live, (s) => priorityBucket(s.scores.priority), (k) => k[0].toUpperCase() + k.slice(1)),
    topDomains: dist(
      live.filter((s) => s.sourceDomain),
      (s) => s.sourceDomain as string,
      (k) => k,
    ).slice(0, 8),
    clusters: clusterSignals(live),
    notifications: deriveNotifications(signals, config),
  };
}

// ── Inbox views ─────────────────────────────────────────────
export type InboxView =
  | 'all'
  | 'high_priority'
  | 'needs_response'
  | 'negative_risk'
  | 'seo_opportunities'
  | 'product_feedback'
  | 'competitor'
  | 'backlink'
  | 'partnership'
  | 'sport_specific'
  | 'archived'
  | 'ignored';

export function filterByView(signals: Signal[], view: InboxView, sport?: SignalSport): Signal[] {
  const notClosed = (s: Signal) => s.status !== 'archived' && s.status !== 'ignored';
  switch (view) {
    case 'all':
      return signals.filter(notClosed);
    case 'high_priority':
      return signals.filter((s) => notClosed(s) && s.scores.priority >= 65);
    case 'needs_response':
      return signals.filter(
        (s) =>
          notClosed(s) &&
          ACTIVE.has(s.status) &&
          (s.classification.opportunity === 'reply_respond' ||
            s.classification.intent === 'support_issue' ||
            s.classification.intent === 'reputation_risk'),
      );
    case 'negative_risk':
      return signals.filter(
        (s) => notClosed(s) && (s.classification.sentiment === 'negative' || s.classification.intent === 'reputation_risk'),
      );
    case 'seo_opportunities':
      return signals.filter(
        (s) => notClosed(s) && (s.classification.intent === 'seo_content_opportunity' || s.classification.intent === 'coaching_need'),
      );
    case 'product_feedback':
      return signals.filter(
        (s) => notClosed(s) && (s.classification.intent === 'feature_request' || s.classification.intent === 'bug_report'),
      );
    case 'competitor':
      return signals.filter((s) => notClosed(s) && s.classification.competitorTermsMatched.length > 0);
    case 'backlink':
      return signals.filter((s) => notClosed(s) && s.classification.intent === 'backlink_opportunity');
    case 'partnership':
      return signals.filter(
        (s) => notClosed(s) && (s.classification.intent === 'partnership_opportunity' || s.classification.intent === 'creator_opportunity'),
      );
    case 'sport_specific':
      return signals.filter((s) => notClosed(s) && (sport ? s.classification.sport === sport : s.classification.sport !== 'unknown'));
    case 'archived':
      return signals.filter((s) => s.status === 'archived');
    case 'ignored':
      return signals.filter((s) => s.status === 'ignored');
    default:
      return signals;
  }
}

export type SortKey = 'priority' | 'date' | 'sentiment' | 'source' | 'sport' | 'status';

export function sortSignals(signals: Signal[], key: SortKey, dir: 'asc' | 'desc' = 'desc'): Signal[] {
  const mult = dir === 'desc' ? -1 : 1;
  const val = (s: Signal): string | number => {
    switch (key) {
      case 'priority': return s.scores.priority;
      case 'date': return Date.parse(s.discoveredAt) || 0;
      case 'sentiment': return s.classification.sentiment;
      case 'source': return s.sourceType;
      case 'sport': return s.classification.sport;
      case 'status': return s.status;
    }
  };
  return [...signals].sort((a, b) => {
    const av = val(a); const bv = val(b);
    if (av < bv) return -1 * mult;
    if (av > bv) return 1 * mult;
    return 0;
  });
}

/** Free-text search over title/text/source/author/domain. */
export function searchSignals(signals: Signal[], query: string): Signal[] {
  const q = query.trim().toLowerCase();
  if (!q) return signals;
  return signals.filter((s) =>
    [s.title, s.cleanText, s.sourceName, s.authorName, s.sourceDomain]
      .filter(Boolean)
      .some((f) => (f as string).toLowerCase().includes(q)),
  );
}
