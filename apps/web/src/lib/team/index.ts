// SwingVantage — TeamOS public surface.
export * from './types';
export { buildTeamPulse, WEAK_THRESHOLD } from './engine';
export {
  TEAM_KEY, read, subscribe,
  addAthlete, updateAthlete, setScore, removeAthlete,
} from './store';
export { useTeam, type UseTeam } from './useTeam';
