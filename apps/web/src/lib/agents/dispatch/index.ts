// ============================================================
// SwingVantage — Agent: Re-Engagement Dispatch — Public API
// ------------------------------------------------------------
// Import from '@/lib/agents/dispatch'. Self-contained subpath
// barrel (tandem-safe — does not touch the shared agent barrel).
// ============================================================

export * from './types';
export { buildDispatch, executeDispatch } from './engine';
// Delivery adapters (client-safe). The server-only email sender lives in
// ./sendEmail and is imported directly by the API route, never via this barrel.
export { buildDispatchAdapters, webPushAdapter, createEmailAdapter } from './adapters';
