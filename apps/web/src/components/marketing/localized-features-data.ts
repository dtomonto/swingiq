// ============================================================
// SwingVantage — Localized features hub: group/slug data (no JSX)
// ------------------------------------------------------------
// The localized /[lang]/features hub renders translated copy from the marketing
// dictionary, but links each card to the canonical (English) feature guide at
// /features/<slug>. This plain-data module holds that group→slug mapping so it
// can be unit-tested (LocalizedFeatures.slugs.test) without importing the React
// component. Order matches the English registry's group order.
// ============================================================

export interface LocalFeature {
  /** Dictionary field prefix, e.g. 'f1' → features.groups.<key>.f1Name. */
  k: string;
  /** Registry slug for the detail-page link at /features/<slug>. */
  slug: string;
}

export const LOCALIZED_FEATURE_GROUPS: Array<{ key: string; features: LocalFeature[] }> = [
  { key: 'diagnosis', features: [
    { k: 'f1', slug: 'ai-diagnostic-engine' },
    { k: 'f2', slug: 'confidence-labels' },
    { k: 'f3', slug: 'competing-hypotheses' },
  ] },
  { key: 'dataImport', features: [
    { k: 'f1', slug: 'launch-monitor-csv-import' },
    { k: 'f2', slug: 'screenshot-image-import' },
    { k: 'f3', slug: 'manual-session-log' },
    { k: 'f4', slug: 'tracking-device-support' },
  ] },
  { key: 'training', features: [
    { k: 'f1', slug: 'fix-stack' },
    { k: 'f2', slug: 'personalized-drill-recommendations' },
    { k: 'f3', slug: 'training-routine-generator' },
    { k: 'f4', slug: 'practice-schedule' },
    { k: 'f5', slug: 'drill-library' },
    { k: 'f6', slug: 'pre-round-pre-game-warm-up' },
  ] },
  { key: 'video', features: [
    { k: 'f1', slug: 'swing-video-upload' },
    { k: 'f2', slug: 'phase-by-phase-timeline' },
    { k: 'f3', slug: 'pro-reference-comparison' },
  ] },
  { key: 'motionLab', features: [{ k: 'f1', slug: 'motion-lab-3d' }] },
  { key: 'equipment', features: [
    { k: 'f1', slug: 'golf-bag-manager' },
    { k: 'f2', slug: 'loft-gapping-analysis' },
    { k: 'f3', slug: 'loft-autofill' },
  ] },
  { key: 'progress', features: [
    { k: 'f1', slug: 'session-history' },
    { k: 'f2', slug: 'swing-score-trends' },
    { k: 'f3', slug: 'milestones' },
    { k: 'f4', slug: 'retest' },
    { k: 'f5', slug: 'player-arc' },
    { k: 'f6', slug: 'swingvantage-labs' },
    { k: 'f7', slug: 'ai-coach-chat' },
  ] },
  { key: 'dataSafety', features: [
    { k: 'f1', slug: 'private-by-default' },
    { k: 'f2', slug: 'backup-restore' },
    { k: 'f3', slug: 'deletion-controls' },
  ] },
];

/** Every registry slug referenced above — for the guard test + ItemList schema. */
export const LOCALIZED_FEATURE_SLUGS: string[] = LOCALIZED_FEATURE_GROUPS.flatMap((grp) =>
  grp.features.map((f) => f.slug),
);
