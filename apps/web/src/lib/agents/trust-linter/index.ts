// ============================================================
// SwingVantage — Agent: Trust / Honesty Linter — Public API
// ------------------------------------------------------------
// Import from '@/lib/agents/trust-linter'. Self-contained subpath
// barrel (tandem-safe).
// ============================================================

export * from './types';
export { RULES } from './rules';
export { lintCopy, lintMany, hasBlockingIssues } from './engine';
