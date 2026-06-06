// ============================================================
// SwingVantage — Agent: Re-Engagement Dispatch — Public API
// ------------------------------------------------------------
// Import from '@/lib/agents/dispatch'. Self-contained subpath
// barrel (tandem-safe — does not touch the shared agent barrel).
// ============================================================

export * from './types';
export { buildDispatch, executeDispatch } from './engine';
