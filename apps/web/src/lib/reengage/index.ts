// SwingVantage — Re-engagement / Outbound OS public surface.
export * from './types';
export { TRIGGERS, triggerById } from './triggers';
export { selectNudge, buildPayloads, inQuietHours, type SelectOptions } from './engine';
export { COHORTS } from './cohorts';
export {
  REENGAGE_KEY, DEFAULT_PREFS, DEFAULT_STATE,
  read, subscribe, setPrefs, markShown, dismiss, resetCaps,
} from './store';
export { useReengage, type UseReengage } from './useReengage';
