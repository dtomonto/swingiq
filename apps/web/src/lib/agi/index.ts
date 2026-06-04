// ============================================================
// SwingIQ — Athlete General Intelligence (AGI): public API (barrel)
// ------------------------------------------------------------
// One general reasoning layer across all sports + all signals.
// Import from '@/lib/agi'. The motion-lab adapter is a sub-path import
// (@/lib/agi/adapters/motion-lab) to keep the engine free of any
// motion-lab dependency.
// ============================================================

export * from './types';
export { CAPABILITIES, getCapability, classifyMetric } from './capabilities';
export { buildWorldModel } from './worldModel';
export { reason } from './reasoning';
export { buildTransfers } from './transfer';
export { buildGeneralPlan } from './planner';
export { runAthleteGI, AGI_VERSION, type RunOptions } from './engine';
