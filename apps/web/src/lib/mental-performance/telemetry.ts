// ============================================================
// SwingVantage — Mental Performance: anonymized telemetry pipe (Phase 3)
//
// The CONSENTED transport that turns local activity into the anonymized,
// aggregate signals the intelligence layer needs — closing the loop on the
// real aggregator (aggregateMentalSignals).
//
// PRIVACY (non-negotiable):
//   • OFF by default — fires ONLY when the user explicitly opts in
//     (settings.enabled && settings.shareAnonymousInsights).
//   • Anonymized — sport + emotion + mistake category + routine id +
//     effectiveness only. NEVER free text, NEVER identity, NEVER a log id.
//   • Fire-and-forget — writes to whatever analytics provider is present
//     (PostHog / Plausible), never throws, no-ops with no provider/consent.
//
// READ SIDE: a backend that collects these events (PostHog export, a Supabase
// events table, …) calls eventsToLogs() → aggregateMentalSignals() to produce
// real cross-user signals. Wiring that backend is the only remaining infra; the
// transport + normalization below are complete.
// ============================================================

import type {
  MentalSport, EmotionalState, MistakeCategory, ErrorClass, MentalLog, MentalSettings,
} from './types';

export type MentalEventKind = 'coach_reset' | 'routine_completed' | 'journal_logged';

/** One anonymized event. No PII, no free text, no identity. */
export interface MentalTelemetryEvent {
  kind: MentalEventKind;
  sport: MentalSport;
  emotion?: EmotionalState | null;
  mistake?: MistakeCategory | null;
  errorClass?: ErrorClass | null;
  routineId?: string | null;
  /** 1–5, only for journal_logged with a routine rating. */
  effectiveness?: number | null;
  /** ISO timestamp. */
  at: string;
}

type ConsentView = Pick<MentalSettings, 'enabled' | 'shareAnonymousInsights'>;

/** Pure consent gate — the single source of truth for "may we emit?". */
export function canShareInsights(settings: ConsentView): boolean {
  return settings.enabled === true && settings.shareAnonymousInsights === true;
}

interface ProviderWindow extends Window {
  posthog?: { capture: (event: string, props?: Record<string, unknown>) => void };
  plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
}

/** Build the anonymized property bag (drops nullish + never includes PII). */
export function eventProps(ev: MentalTelemetryEvent): Record<string, unknown> {
  const p: Record<string, unknown> = { sport: ev.sport };
  if (ev.emotion) p.emotion = ev.emotion;
  if (ev.mistake) p.mistake = ev.mistake;
  if (ev.errorClass) p.errorClass = ev.errorClass;
  if (ev.routineId) p.routineId = ev.routineId;
  if (typeof ev.effectiveness === 'number') p.effectiveness = ev.effectiveness;
  return p;
}

/**
 * Emit one anonymized event IF the user consented. Fire-and-forget; safe to
 * call anywhere (no-ops on the server, without consent, or without a provider).
 */
export function emitMentalEvent(ev: MentalTelemetryEvent, settings: ConsentView): void {
  if (!canShareInsights(settings)) return;
  if (typeof window === 'undefined') return;
  const w = window as ProviderWindow;
  const name = `mp_${ev.kind}`;
  const props = eventProps(ev);
  try {
    w.posthog?.capture(name, props);
    if (typeof w.plausible === 'function') w.plausible(name, { props });
    if (!w.posthog && typeof w.plausible !== 'function' && process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[MentalTelemetry]', name, props);
    }
  } catch {
    /* analytics is best-effort — never break the app */
  }
}

/**
 * READ SIDE: normalize collected telemetry events back into MentalLog-shaped
 * records so the existing aggregateMentalSignals() can consume them. A backend
 * that has the events pool calls this, then aggregateMentalSignals(logs, users).
 */
export function eventsToLogs(events: MentalTelemetryEvent[]): MentalLog[] {
  return events.map((ev, i) => ({
    id: `mpevt_${i}`,
    date: ev.at,
    sport: ev.sport,
    sessionType: null,
    mistake: (ev.mistake ?? null) as MistakeCategory | null,
    emotion: (ev.emotion ?? null) as EmotionalState | null,
    intensity: null,
    recoverySpeed: null,
    whatIDidNext: '',
    whatWorked: '',
    whatDidnt: '',
    nextTimeCue: '',
    confidence: null,
    focus: null,
    composure: null,
    routineUsed: ev.routineId ?? null,
    effectiveness: typeof ev.effectiveness === 'number' ? ev.effectiveness : null,
    reflection: '',
  }));
}

/** Convenience builders so callers can't accidentally include PII. */
export const mentalEvent = {
  coachReset(input: { sport: MentalSport; emotion?: EmotionalState | null; mistake?: MistakeCategory | null; errorClass?: ErrorClass | null; routineId?: string | null }): MentalTelemetryEvent {
    return { kind: 'coach_reset', at: new Date().toISOString(), ...input };
  },
  routineCompleted(input: { sport: MentalSport; routineId: string }): MentalTelemetryEvent {
    return { kind: 'routine_completed', at: new Date().toISOString(), ...input };
  },
  journalLogged(input: { sport: MentalSport; emotion?: EmotionalState | null; mistake?: MistakeCategory | null; routineId?: string | null; effectiveness?: number | null }): MentalTelemetryEvent {
    return { kind: 'journal_logged', at: new Date().toISOString(), ...input };
  },
};
