// ============================================================
// Structured AI coach output (intelligence upgrade Sprint 2, #1)
// ============================================================

import {
  coerceStructuredCoachResponse,
  coachMessageFrom,
  COACH_RESPONSE_JSON_SCHEMA,
} from './structured';

describe('#1 coerceStructuredCoachResponse', () => {
  it('coerces a complete structured object', () => {
    const s = coerceStructuredCoachResponse({
      coaching_text: 'Your face is open at impact. What to do next: square the face.',
      main_issue: 'Open face',
      evidence: 'face-to-path +6.2°',
      recommended_fix: 'Strengthen the lead-hand grip',
      drill: 'Gate drill',
      safety_note: null,
      next_session_focus: 'Face control',
    });
    expect(s).not.toBeNull();
    expect(s!.coaching_text).toMatch(/open at impact/);
    expect(s!.evidence).toBe('face-to-path +6.2°');
    expect(s!.safety_note).toBeNull();
  });

  it('returns null when coaching_text is missing or empty (model returned prose)', () => {
    expect(coerceStructuredCoachResponse(null)).toBeNull();
    expect(coerceStructuredCoachResponse('just prose')).toBeNull();
    expect(coerceStructuredCoachResponse({ main_issue: 'x' })).toBeNull();
    expect(coerceStructuredCoachResponse({ coaching_text: '   ' })).toBeNull();
  });

  it('normalizes empty-string fields to null and tolerates missing optional fields', () => {
    const s = coerceStructuredCoachResponse({ coaching_text: 'Hello.', evidence: '' })!;
    expect(s.evidence).toBeNull();
    expect(s.drill).toBeNull();
    expect(s.main_issue).toBeNull();
  });
});

describe('#1 coachMessageFrom', () => {
  it('uses structured coaching_text when present', () => {
    const s = coerceStructuredCoachResponse({ coaching_text: 'Structured answer.' });
    expect(coachMessageFrom(s, 'raw fallback')).toBe('Structured answer.');
  });
  it('falls back to raw text when there is no structured response', () => {
    expect(coachMessageFrom(null, 'raw fallback')).toBe('raw fallback');
  });
});

describe('#1 COACH_RESPONSE_JSON_SCHEMA', () => {
  it('is cross-provider-strict-safe: all properties required + additionalProperties false', () => {
    const schema = COACH_RESPONSE_JSON_SCHEMA.schema as {
      additionalProperties: boolean;
      properties: Record<string, unknown>;
      required: string[];
    };
    expect(schema.additionalProperties).toBe(false);
    expect(schema.required.sort()).toEqual(Object.keys(schema.properties).sort());
  });
});
