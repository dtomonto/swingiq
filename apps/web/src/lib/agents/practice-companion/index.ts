// ============================================================
// SwingVantage — Agent: Live Practice Companion — Public API
// ------------------------------------------------------------
// Import from '@/lib/agents/practice-companion'. Self-contained
// subpath barrel (tandem-safe).
// ============================================================

export * from './types';
export {
  fromPracticePlan,
  startSession,
  recordRep,
  advanceDrill,
  repeatDrill,
  finishSession,
  coach,
} from './engine';
export { COMPANION_KEY, saveCompanion, loadCompanion, clearCompanion } from './store';
