// ============================================================
// SwingVantage — SwingLab 2.0: connected ecosystem (Phase 5)
// ------------------------------------------------------------
// PURE, deterministic model of the lab as one living system: the data
// flow loop between stations (each link active only when real data is
// flowing), each station's online/standby status, and a grounded
// one-line read across the whole lab.
//
// HONESTY RULE: a link is `active` / a system is `online` ONLY from real
// evidence. Stations with no signal yet read "standby" — never faked.
// Self-contained: derives everything from the same AgentContext signals
// the rest of the lab already uses (no new engines/stores).
// ============================================================

import { LAB_STATIONS } from '@/content/swinglab';
import type { LabSignals } from './lab-state';

/** A directed data-flow link in the improvement loop. */
export interface LabConnection {
  from: string;
  to: string;
  /** What flows along this link. */
  label: string;
  /** True only when real data is actually flowing. */
  active: boolean;
}

/** A station as a "system" in the ecosystem. */
export interface LabSystem {
  stationId: string;
  /** Online = contributing real data right now. */
  online: boolean;
  /** What this system contributes to the whole. */
  contributes: string;
}

export interface LabSystemsModel {
  connections: LabConnection[];
  systems: LabSystem[];
  /** Grounded one-line read across the lab. */
  summary: string;
  onlineCount: number;
  totalSystems: number;
}

const STATION_NAME: Record<string, string> = Object.fromEntries(LAB_STATIONS.map((s) => [s.id, s.name]));

/** Build the connected-ecosystem model from real signals. Pure. */
export function buildLabSystems(s: LabSignals, recommendedStationId: string | null): LabSystemsModel {
  const hasCaptures = s.captures > 0;
  const hasPlan = s.planStatus !== 'none';
  const planDone = s.planStatus === 'completed';

  // The core improvement loop — each edge active only when data flows.
  const connections: LabConnection[] = [
    { from: 'player-profile-wall', to: 'motion-capture-studio', label: 'your profile shapes how swings are read', active: s.hasProfile },
    { from: 'motion-capture-studio', to: 'ai-coach-console', label: 'a captured swing gives the coach data to read', active: hasCaptures },
    { from: 'ai-coach-console', to: 'training-plan-lab', label: 'the read becomes a prescription', active: hasPlan },
    { from: 'training-plan-lab', to: 'film-room', label: 'training gets proven on film', active: planDone },
    { from: 'film-room', to: 'player-profile-wall', label: 'proof updates your record', active: planDone },
  ];

  // Every station as a system. Online only from positive evidence; the ones
  // without a signal in the main context read "standby" (honest).
  const systems: LabSystem[] = [
    { stationId: 'entry-atrium', online: s.hasProfile || hasCaptures, contributes: 'Your home base and next move' },
    { stationId: 'player-profile-wall', online: s.hasProfile, contributes: 'Your athlete identity, goals and history' },
    { stationId: 'motion-capture-studio', online: hasCaptures, contributes: 'Swing captures and diagnoses' },
    { stationId: 'ai-coach-console', online: hasCaptures, contributes: 'Reasoning that ties your data together' },
    { stationId: 'training-plan-lab', online: hasPlan, contributes: 'Your active plan and drills' },
    { stationId: 'film-room', online: hasCaptures, contributes: 'Your film and before/after proof' },
    { stationId: 'equipment-bay', online: s.clubCount > 0, contributes: 'Your gear profile and fit context' },
    { stationId: 'recruiting-studio', online: false, contributes: 'Shareable showcase (connects as you build it)' },
    { stationId: 'recovery-readiness-dock', online: false, contributes: 'Readiness and health (connect to light up)' },
    { stationId: 'learning-academy-wing', online: false, contributes: 'Guided learning and onboarding' },
  ];

  const onlineCount = systems.filter((x) => x.online).length;

  let summary: string;
  if (!s.hasProfile && !hasCaptures) {
    summary = 'Your lab is powered down. Set up a profile and capture a swing to bring the systems online and start connecting them.';
  } else {
    const parts: string[] = [];
    if (s.hasProfile) parts.push('your profile');
    if (hasCaptures) parts.push(`${s.captures} swing${s.captures > 1 ? 's' : ''}`);
    if (hasPlan) parts.push('an active plan');
    if (s.clubCount > 0) parts.push('your equipment');
    const recName = recommendedStationId ? STATION_NAME[recommendedStationId] : undefined;
    const lead = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0];
    summary = `Your lab is connecting ${lead} into one read${recName ? `, pointing you to ${recName} next` : ''}.`;
  }

  return { connections, systems, summary, onlineCount, totalSystems: systems.length };
}
