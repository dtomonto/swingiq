import type { SwingIQState } from '@/store';
import type { SwingIQBackup, RestorePreview, RestoreResult } from './schema';

export function previewRestore(
  backup: SwingIQBackup,
  currentState: SwingIQState,
): RestorePreview {
  const warnings: string[] = [];
  const categories: string[] = [];

  const existingSessionIds = new Set(currentState.sessions.map((s) => s.id));
  const existingSessionKeys = new Set(
    currentState.sessions.map((s) => `${s.sport}|${s.date}|${s.launch_monitor}`),
  );

  let newSessions = 0;
  let skippedSessions = 0;
  for (const s of backup.data.sessions ?? []) {
    const key = `${s.sport}|${s.date}|${s.launch_monitor}`;
    if (existingSessionIds.has(s.id) || existingSessionKeys.has(key)) {
      skippedSessions++;
    } else {
      newSessions++;
    }
  }

  const existingClubIds = new Set(currentState.clubs.map((c) => c.id));
  const existingClubKeys = new Set(
    currentState.clubs.map((c) => `${c.name.toLowerCase()}|${c.category}`),
  );

  let newClubs = 0;
  let skippedClubs = 0;
  for (const c of backup.data.clubs ?? []) {
    const key = `${c.name.toLowerCase()}|${c.category}`;
    if (existingClubIds.has(c.id) || existingClubKeys.has(key)) {
      skippedClubs++;
    } else {
      newClubs++;
    }
  }

  const existingVideoIds = new Set(currentState.video_analyses.map((v) => v.id));
  let newVideos = 0;
  let skippedVideos = 0;
  for (const v of backup.data.videoAnalyses ?? []) {
    if (existingVideoIds.has(v.id)) {
      skippedVideos++;
    } else {
      newVideos++;
    }
  }

  let profileUpdated = false;
  if (backup.data.profile && !currentState.profile) {
    profileUpdated = true;
  } else if (backup.data.profile && currentState.profile) {
    warnings.push('A golf profile already exists — it will not be overwritten in merge mode');
  }

  const sportProfilesUpdated: string[] = [];
  for (const sport of Object.keys(backup.data.sportProfiles ?? {})) {
    if (!(sport in currentState.sportProfiles)) {
      sportProfilesUpdated.push(sport);
    }
  }

  const backupMilestones = backup.data.training?.milestones_earned?.length ?? 0;
  const currentMilestones = currentState.training.milestones_earned.length;
  const trainingUpdated = backupMilestones > currentMilestones;

  if (newSessions > 0) categories.push('sessions');
  if (newClubs > 0) categories.push('clubs');
  if (newVideos > 0) categories.push('video analyses');
  if (profileUpdated) categories.push('profile');
  if (sportProfilesUpdated.length > 0) categories.push('sport profiles');
  if (trainingUpdated) categories.push('training progress');

  const totalNew = newSessions + newClubs + newVideos;
  const summary =
    totalNew === 0 && categories.length === 0
      ? 'No new records found — your data is already up to date'
      : `${totalNew} new record${totalNew !== 1 ? 's' : ''} across ${categories.length} categor${categories.length !== 1 ? 'ies' : 'y'}`;

  return {
    newRecords: { sessions: newSessions, clubs: newClubs, videoAnalyses: newVideos },
    updatedRecords: { profile: profileUpdated, sportProfiles: sportProfilesUpdated, training: trainingUpdated },
    skippedDuplicates: { sessions: skippedSessions, clubs: skippedClubs, videoAnalyses: skippedVideos },
    categories,
    warnings,
    summary,
  };
}

export function mergeRestore(
  backup: SwingIQBackup,
  currentState: SwingIQState,
): Partial<SwingIQState> {
  const existingSessionIds = new Set(currentState.sessions.map((s) => s.id));
  const existingSessionKeys = new Set(
    currentState.sessions.map((s) => `${s.sport}|${s.date}|${s.launch_monitor}`),
  );
  const newSessions = (backup.data.sessions ?? []).filter((s) => {
    const key = `${s.sport}|${s.date}|${s.launch_monitor}`;
    return !existingSessionIds.has(s.id) && !existingSessionKeys.has(key);
  });

  const existingClubIds = new Set(currentState.clubs.map((c) => c.id));
  const existingClubKeys = new Set(
    currentState.clubs.map((c) => `${c.name.toLowerCase()}|${c.category}`),
  );
  const newClubs = (backup.data.clubs ?? []).filter((c) => {
    const key = `${c.name.toLowerCase()}|${c.category}`;
    return !existingClubIds.has(c.id) && !existingClubKeys.has(key);
  });

  const existingVideoIds = new Set(currentState.video_analyses.map((v) => v.id));
  const newVideos = (backup.data.videoAnalyses ?? []).filter(
    (v) => !existingVideoIds.has(v.id),
  );

  const profile = currentState.profile ?? backup.data.profile;

  const mergedSportProfiles = { ...backup.data.sportProfiles };
  for (const [sport, data] of Object.entries(currentState.sportProfiles)) {
    if (data) mergedSportProfiles[sport as keyof typeof mergedSportProfiles] = data;
  }

  const backupMilestones = backup.data.training?.milestones_earned ?? [];
  const currentMilestones = currentState.training.milestones_earned;
  const allMilestones = Array.from(new Set([...currentMilestones, ...backupMilestones]));
  const training = {
    ...currentState.training,
    streak_days: Math.max(
      currentState.training.streak_days,
      backup.data.training?.streak_days ?? 0,
    ),
    milestones_earned: allMilestones,
    drills_completed: {
      ...backup.data.training?.drills_completed,
      ...currentState.training.drills_completed,
    },
  };

  return {
    profile,
    sportProfiles: mergedSportProfiles,
    clubs: [...currentState.clubs, ...newClubs],
    sessions: [...newSessions, ...currentState.sessions],
    video_analyses: [...newVideos, ...currentState.video_analyses],
    training,
    // keep current settings
    settings: currentState.settings,
  };
}

export function replaceRestore(
  backup: SwingIQBackup,
  currentSettings: SwingIQState['settings'],
): Partial<SwingIQState> {
  return {
    profile: backup.data.profile,
    sportProfiles: backup.data.sportProfiles ?? {},
    clubs: backup.data.clubs ?? [],
    sessions: backup.data.sessions ?? [],
    video_analyses: backup.data.videoAnalyses ?? [],
    training: backup.data.training,
    // preserve current settings — don't wipe user preferences
    settings: currentSettings,
  };
}

export function generateRestoreResult(
  preview: RestorePreview,
  applied: boolean,
): RestoreResult {
  return {
    ...preview,
    errors: applied ? [] : ['Restore was not applied'],
  };
}
