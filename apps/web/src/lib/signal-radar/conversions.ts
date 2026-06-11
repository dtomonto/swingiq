// ============================================================
// SignalRadar OS — conversion builders (PURE)
// ------------------------------------------------------------
// Turns a signal into a pre-filled operational record (content idea,
// product feedback, partnership lead, support response, reputation risk).
// Every conversion preserves a link back to the originating signal. The
// suggested copy is deterministic guidance, not fabricated data — the
// operator reviews + edits before it becomes an action.
// ============================================================

import type { Signal, SignalConversion, ConversionKind } from './types';
import { SPORT_LABEL, INTENT_LABEL } from './labels';

function summaryOf(signal: Signal): string {
  return (signal.title || signal.cleanText).slice(0, 140);
}

/** Suggested response tone for support/reputation replies. */
function suggestedTone(signal: Signal): string {
  return signal.classification.sentiment === 'negative'
    ? 'Empathetic, non-defensive, solution-first'
    : 'Helpful, professional, brand-safe';
}

/** Build the default fields for a conversion of `kind` from `signal`. */
export function buildConversionFields(kind: ConversionKind, signal: Signal): Record<string, string> {
  const sport = SPORT_LABEL[signal.classification.sport];
  const quote = summaryOf(signal);

  switch (kind) {
    case 'content_idea':
      return {
        suggestedTitle: signal.title?.slice(0, 80) || `Answer: ${quote.slice(0, 60)}`,
        targetKeyword: signal.classification.sportTermsMatched[0] ?? signal.classification.brandTermsMatched[0] ?? '',
        sport,
        userIntent: INTENT_LABEL[signal.classification.intent],
        recommendedPageType: signal.classification.intent === 'product_question' ? 'FAQ' : 'Landing / guide page',
        outline: '1. The question users are asking\n2. SwingVantage’s honest answer\n3. How to try it free\n4. Related sports',
        priority: String(signal.scores.priority),
        notes: '',
      };
    case 'product_feedback':
      return {
        productArea: signal.classification.intent === 'bug_report' ? 'Bug' : 'Feature / UX',
        type: INTENT_LABEL[signal.classification.intent],
        sport,
        severity: signal.classification.urgency,
        userQuote: quote,
        suggestedFix: '',
        priority: String(signal.scores.priority),
        notes: '',
      };
    case 'partnership_lead':
      return {
        contact: signal.authorName ?? signal.sourceName,
        source: signal.sourceUrl ?? signal.sourceName,
        reasonForFit: `${INTENT_LABEL[signal.classification.intent]} in ${sport}`,
        audienceType: signal.classification.audience,
        contactUrl: signal.authorUrl ?? signal.sourceUrl ?? '',
        outreachAngle: 'Offer free SwingVantage access + a co-branded swing breakdown',
        priority: String(signal.scores.priority),
        notes: '',
      };
    case 'support_response':
      return {
        sourceUrl: signal.sourceUrl ?? '',
        issue: quote,
        suggestedResponse: '',
        tone: suggestedTone(signal),
        requiredAction: signal.classification.opportunity,
        notes: '',
      };
    case 'reputation_risk':
      return {
        riskType: INTENT_LABEL[signal.classification.intent],
        severity: signal.classification.urgency,
        summary: quote,
        recommendedResponse: 'Acknowledge, take it to a private channel, follow up publicly once resolved',
        whatNotToSay: 'Don’t argue, dismiss, or over-promise. No defensive or legalistic tone.',
        owner: '',
        followUpDate: '',
        notes: '',
      };
    default:
      return { summary: quote };
  }
}

export function buildConversion(
  kind: ConversionKind,
  signal: Signal,
  opts: { id: string; now: string; createdBy: string },
): SignalConversion {
  return {
    id: opts.id,
    kind,
    signalId: signal.id,
    signalSummary: summaryOf(signal),
    createdAt: opts.now,
    createdBy: opts.createdBy,
    status: 'open',
    fields: buildConversionFields(kind, signal),
  };
}
