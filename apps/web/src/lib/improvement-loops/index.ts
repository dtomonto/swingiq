// ============================================================
// SwingVantage — Improvement Loops: public API (barrel)
// ------------------------------------------------------------
// The issue → drill → outcome moat record, derived from already-captured
// local signals. Import from '@/lib/improvement-loops'.
// ============================================================
export * from './types';
export { buildImprovementLoops, aggregateDrillEffectiveness, type BuildLoopsInput } from './build';
export { useImprovementLoops, type ImprovementLoopsView } from './useImprovementLoops';
