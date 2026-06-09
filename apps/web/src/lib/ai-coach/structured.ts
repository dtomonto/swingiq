// ============================================================
// SwingVantage — Structured AI coach output (recommendation #1)
// ------------------------------------------------------------
// The AICoachResponse type was defined "for future structured parsing" but the
// route shipped free text. This wires real structured output through the AI
// gateway: the model fills a JSON schema (coaching_text + evidence / fix /
// drill / safety fields), so the app can parse, track, and trust-check the
// pieces — while still showing the readable `coaching_text` as the message.
//
// Cross-provider safe: every field required + nullable + additionalProperties
// false (OpenAI strict mode + Anthropic output_config.format both accept this).
// Pure coercion + display-message helpers are unit-tested; the gateway does I/O.
// ============================================================

/** The structured shape the coach model fills (subset of AICoachResponse). */
export interface StructuredCoachResponse {
  /** Full coaching answer to show the athlete, in plain language. */
  coaching_text: string;
  main_issue: string | null;
  /** The specific metric + value from the data context backing the issue. */
  evidence: string | null;
  recommended_fix: string | null;
  drill: string | null;
  safety_note: string | null;
  next_session_focus: string | null;
}

/** JSON schema passed to the gateway's structured-output mode. */
export const COACH_RESPONSE_JSON_SCHEMA: { name: string; schema: Record<string, unknown> } = {
  name: 'swing_coach_response',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      coaching_text: {
        type: 'string',
        description:
          'The complete coaching answer to show the athlete, in plain language, ending with a "What to do next" line. Cite the specific metric and value from the data context as evidence.',
      },
      main_issue: { type: ['string', 'null'], description: 'The single primary issue, or null if none.' },
      evidence: {
        type: ['string', 'null'],
        description: 'The specific metric + value from the [DATA CONTEXT] that supports the main issue.',
      },
      recommended_fix: { type: ['string', 'null'], description: 'The concrete fix, or null.' },
      drill: { type: ['string', 'null'], description: 'A specific drill to practice, or null.' },
      safety_note: { type: ['string', 'null'], description: 'Any pain/injury caution, or null.' },
      next_session_focus: { type: ['string', 'null'], description: 'What to focus on next session, or null.' },
    },
    required: [
      'coaching_text',
      'main_issue',
      'evidence',
      'recommended_fix',
      'drill',
      'safety_note',
      'next_session_focus',
    ],
  },
};

const STRING_FIELDS = [
  'main_issue',
  'evidence',
  'recommended_fix',
  'drill',
  'safety_note',
  'next_session_focus',
] as const;

/**
 * Validate/normalize a parsed structured response. Returns null when it isn't a
 * usable object (e.g. the model returned prose, or `coaching_text` is missing) —
 * the caller then falls back to the raw text. Empty strings normalize to null.
 */
export function coerceStructuredCoachResponse(parsed: unknown): StructuredCoachResponse | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const o = parsed as Record<string, unknown>;
  const coachingText = o.coaching_text;
  if (typeof coachingText !== 'string' || coachingText.trim() === '') return null;

  const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v : null);
  const out = { coaching_text: coachingText } as StructuredCoachResponse;
  for (const f of STRING_FIELDS) out[f] = str(o[f]);
  return out;
}

/** The prose to display: the structured coaching_text, or the raw text fallback. */
export function coachMessageFrom(structured: StructuredCoachResponse | null, rawText: string): string {
  return structured?.coaching_text?.trim() || rawText;
}
