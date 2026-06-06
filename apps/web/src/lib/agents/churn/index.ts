// ============================================================
// SwingVantage — Agent: Churn-Risk Scoring — Public API
// ------------------------------------------------------------
// Import from '@/lib/agents/churn'. Kept as a self-contained
// subpath barrel so this agent can ship without touching the
// shared agent-layer barrel (tandem-safe).
// ============================================================

export * from './types';
export { scoreChurnRisk, summarizeNoteSignals } from './engine';
