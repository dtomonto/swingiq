// ============================================================
// SignalRadar OS — default configuration (PURE)
// ------------------------------------------------------------
// The seed vocabularies + scoring weights the rules classifier reads.
// Everything here is operator-tunable: the admin Settings panel layers
// localStorage overrides on top of these defaults (useSignalRadar).
// No secrets, no network — just the words SwingVantage cares about.
// ============================================================

import type {
  SignalRadarConfig,
  ScoringWeights,
  CompetitorDef,
  SignalSport,
} from './types';

export const DEFAULT_WEIGHTS: ScoringWeights = {
  directBrandMention: 22,
  hasLink: 8,
  sentimentRisk: 16,
  sourceAuthority: 14,
  audienceRelevance: 12,
  recency: 10,
  demandSignal: 14,
  competitorMention: 10,
  sportMapped: 8,
};

/** Per-sport keyword lists used to tag a signal's sport. */
export const DEFAULT_SPORT_TERMS: Partial<Record<SignalSport, string[]>> = {
  golf: ['golf', 'golfer', 'golf swing', 'driver', 'iron', 'putt', 'putting', 'handicap', 'tee shot', 'wedge', 'backswing', 'downswing'],
  tennis: ['tennis', 'forehand', 'backhand', 'serve', 'volley', 'groundstroke', 'racket', 'racquet'],
  baseball: ['baseball', 'batting', 'bat speed', 'pitching', 'hitting', 'swing plane', 'launch angle', 'mlb', 'little league'],
  softball_fast: ['fastpitch', 'fast-pitch', 'fast pitch softball', 'windmill pitch'],
  softball_slow: ['slowpitch', 'slow-pitch', 'slow pitch softball', 'beer league'],
  pickleball: ['pickleball', 'dink', 'third shot drop', 'paddle', 'kitchen', 'pickle ball'],
  padel: ['padel', 'padel tennis', 'bandeja', 'vibora', 'padel court'],
};

/** Generic cross-sport demand keywords (people wanting what SwingVantage does). */
export const DEFAULT_DEMAND_TERMS: string[] = [
  'ai swing analysis',
  'swing analysis app',
  'analyze my swing',
  'analyze my stroke',
  'upload swing video',
  'video swing analysis',
  'swing feedback',
  'stroke analysis',
  'biomechanics',
  'motion analysis',
  'video breakdown',
  'free swing analysis',
  'swing app',
  'coach feedback app',
  'youth swing',
  'how do i fix my swing',
  'whats wrong with my swing',
];

export const DEFAULT_OPPORTUNITY_TERMS: string[] = [
  'how do i',
  'how to',
  'best app',
  'recommend',
  'alternative to',
  'vs',
  'compared to',
  'looking for',
  'anyone know',
  'is there an app',
  'which app',
  'help me',
  'review',
];

export const DEFAULT_RISK_TERMS: string[] = [
  'scam',
  'refund',
  'broken',
  'doesn’t work',
  'does not work',
  'waste of money',
  'terrible',
  'disappointed',
  'misleading',
  'privacy',
  'cancel',
  'overpriced',
  'inaccurate',
  'wrong',
  'bug',
  'crash',
  'error',
];

export const DEFAULT_SPAM_TERMS: string[] = [
  'buy followers',
  'crypto',
  'casino',
  'make money fast',
  'click here',
  'free gift card',
  'viagra',
  'loan approved',
];

/** Configurable competitors / adjacent products (operator can extend). */
export const DEFAULT_COMPETITORS: CompetitorDef[] = [
  { id: 'sportsbox', name: 'Sportsbox AI', category: 'AI swing analysis', terms: ['sportsbox', 'sportsbox ai'], enabled: true },
  { id: 'onform', name: 'OnForm', category: 'Video analysis apps', terms: ['onform'], enabled: true },
  { id: 'v1sports', name: 'V1 Sports', category: 'Video analysis apps', terms: ['v1 sports', 'v1 golf', 'v1sports'], enabled: true },
  { id: 'coachnow', name: 'CoachNow', category: 'Coach communication tools', terms: ['coachnow', 'coach now'], enabled: true },
  { id: 'blast', name: 'Blast Motion', category: 'Biomechanics/motion tools', terms: ['blast motion', 'blast baseball', 'blast golf'], enabled: true },
  { id: 'swingcatalyst', name: 'Swing Catalyst', category: 'Golf instruction tech', terms: ['swing catalyst'], enabled: true },
  { id: 'arccos', name: 'Arccos', category: 'Launch monitor/data tools', terms: ['arccos'], enabled: true },
  { id: 'rapsodo', name: 'Rapsodo', category: 'Launch monitor/data tools', terms: ['rapsodo'], enabled: true },
  { id: 'trackman', name: 'TrackMan', category: 'Launch monitor/data tools', terms: ['trackman'], enabled: true },
  { id: 'hudl', name: 'Hudl Technique', category: 'Video analysis apps', terms: ['hudl technique', 'hudl'], enabled: true },
  { id: 'diamondkinetics', name: 'Diamond Kinetics', category: 'Baseball/softball training tools', terms: ['diamond kinetics'], enabled: true },
  { id: 'zepp', name: 'Zepp', category: 'Biomechanics/motion tools', terms: ['zepp'], enabled: true },
];

export const DEFAULT_CONFIG: SignalRadarConfig = {
  brandTerms: ['swingvantage', 'swing vantage', 'swing-vantage'],
  brandMisspellings: ['swingvantge', 'swing vantge', 'swingvantege', 'swingadvantage'],
  domainTerms: ['swingvantage.com'],
  oldBrandTerms: ['swingiq', 'swing iq'],
  founderHandles: [],
  sportTerms: DEFAULT_SPORT_TERMS,
  demandTerms: DEFAULT_DEMAND_TERMS,
  opportunityTerms: DEFAULT_OPPORTUNITY_TERMS,
  riskTerms: DEFAULT_RISK_TERMS,
  spamTerms: DEFAULT_SPAM_TERMS,
  weights: DEFAULT_WEIGHTS,
  aiClassificationEnabled: false,
  alertMinSeverity: 'low',
  mutedAlertKinds: [],
  feedSources: [],
};

/** All competitor match terms flattened — used by the classifier. */
export function competitorTermsFor(competitors: CompetitorDef[]): string[] {
  return competitors.filter((c) => c.enabled).flatMap((c) => c.terms);
}

/** Merge stored partial overrides onto the defaults (operator settings). */
export function resolveConfig(overrides?: Partial<SignalRadarConfig>): SignalRadarConfig {
  if (!overrides) return DEFAULT_CONFIG;
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    sportTerms: { ...DEFAULT_CONFIG.sportTerms, ...(overrides.sportTerms ?? {}) },
    weights: { ...DEFAULT_CONFIG.weights, ...(overrides.weights ?? {}) },
  };
}
