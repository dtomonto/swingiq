// ============================================================
// SwingIQ — Athlete General Intelligence (AGI): public API (barrel)
// ------------------------------------------------------------
// One general reasoning layer across all sports + all signals.
// Import from '@/lib/agi'. The motion-lab adapter is a sub-path import
// (@/lib/agi/adapters/motion-lab) to keep the engine free of any
// motion-lab dependency.
// ============================================================

export * from './types';
export { CAPABILITIES, getCapability, classifyMetric, goalToCapabilities } from './capabilities';
export { buildWorldModel, scoreBand } from './worldModel';
export { reason } from './reasoning';
export { gradeModel } from './trust';
export { buildTransfers, buildKeystoneTranslations } from './transfer';
export { buildGeneralPlan } from './planner';
export { buildProgress, progressToInsight, snapshotFromModel, focusCapability } from './progress';
export { loadHistory, recordSnapshot, clearAgiHistory } from './history';
export { buildAgiReportText, buildAgiReportHtml, type ReportOptions } from './report';
export { runAthleteGI, AGI_VERSION, type RunOptions } from './engine';
