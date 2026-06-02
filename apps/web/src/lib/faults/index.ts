// ============================================================
// SwingIQ — Multi-Sport Fault Ontology: Public API (barrel)
// ------------------------------------------------------------
// One structured vocabulary for what each swing fault means,
// how to retest it, and how to explain it to a parent, coach,
// or advanced athlete. Import from '@/lib/faults'.
// ============================================================

export * from './types';
export {
  getCuratedFaults,
  getFault,
  getFaultsForSport,
  resolveFault,
  retestCriteriaFor,
  explainFault,
  matchFaultId,
} from './ontology';
export { audienceFromTone, audienceFromUsageCategory } from './audience';
