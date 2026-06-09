// ============================================================
// SwingVantage — Swing Education System: public barrel.
// Import from '@/lib/learn'.
// ============================================================

export * from './types';
export * from './seo';
export {
  getPublishedLearnEntries,
  getConceptEntries,
  getDataPointEntries,
  getLearnEntry,
  getConceptEntry,
  getDataPointEntry,
  getDataPointsByCategory,
  resolveRelatedPages,
  resolveRelatedFaults,
  resolveRelatedCoachStyles,
  learnPageForFault,
  type ResolvedLink,
} from './registry';
