// ============================================================
// SwingVantage — Agent: Growth Coordinator — Public API
// ------------------------------------------------------------
// Import from '@/lib/agents/growth'. Self-contained subpath barrel
// (tandem-safe) that composes the seven growth agents.
// ============================================================

export * from './types';
export { runGrowthAgents } from './orchestrator';
export { useGrowthAgents, type UseGrowthAgents } from './useGrowthAgents';
export {
  selectChurnAwareNudge,
  toActivitySignal,
  isComebackTrigger,
  type ChurnAwareOptions,
  type ChurnAwareResult,
  type ActivitySignalOverrides,
} from './reengageBridge';
