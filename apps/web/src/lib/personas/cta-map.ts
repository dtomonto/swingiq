// ============================================================
// Persona → primary-CTA map (#1 Phase 2) — the single, consolidated source of
// truth for "who is this for, and what is the one action we want them to take?"
// Persona surfaces (the /coaches, /teams, /creators, /partners audience landing
// pages, the /parents page, and the core athlete funnel) read their primary CTA
// from here instead of hard-coding it, so the persona→CTA mapping can never
// drift across surfaces and is auditable in one place.
// ============================================================

export type PersonaId = 'athlete' | 'parents' | 'coaches' | 'teams' | 'creators' | 'partners';

/** The funnel intent of a persona's primary action. */
export type PersonaIntent = 'product' | 'capture' | 'partnership';

export interface PersonaCta {
  persona: PersonaId;
  /** Human label for the audience. */
  audience: string;
  /** The single primary call-to-action label. */
  ctaLabel: string;
  /** Where the primary CTA leads — a route (`/start`) or an in-page anchor
   *  (`#get-started`, the email-capture block on the audience landings). */
  ctaTarget: string;
  /** The persona's own marketing route, where applicable. */
  route?: string;
  intent: PersonaIntent;
}

export const PERSONA_CTA_MAP: Record<PersonaId, PersonaCta> = {
  athlete: {
    persona: 'athlete', audience: 'Individual athlete',
    ctaLabel: 'Analyze My Swing — Free', ctaTarget: '/start', route: '/', intent: 'product',
  },
  parents: {
    persona: 'parents', audience: 'Parents of young athletes',
    ctaLabel: 'Try SwingVantage Free', ctaTarget: '/start', route: '/parents', intent: 'product',
  },
  coaches: {
    persona: 'coaches', audience: 'Coaches',
    ctaLabel: 'Start a free coach pilot', ctaTarget: '#get-started', route: '/coaches', intent: 'capture',
  },
  teams: {
    persona: 'teams', audience: 'Teams & academies',
    ctaLabel: 'Start a team pilot', ctaTarget: '#get-started', route: '/teams', intent: 'capture',
  },
  creators: {
    persona: 'creators', audience: 'Creators',
    ctaLabel: 'Collaborate with SwingVantage', ctaTarget: '#get-started', route: '/creators', intent: 'partnership',
  },
  partners: {
    persona: 'partners', audience: 'Partners',
    ctaLabel: 'Partner with SwingVantage', ctaTarget: '#get-started', route: '/partners', intent: 'partnership',
  },
};

export const ALL_PERSONA_CTAS: PersonaCta[] = Object.values(PERSONA_CTA_MAP);

/** The primary CTA for a persona (typed lookup). */
export function personaCta(persona: PersonaId): PersonaCta {
  return PERSONA_CTA_MAP[persona];
}
