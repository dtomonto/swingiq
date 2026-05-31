import type { SwingIQState } from '@/store';
import type { SwingIQBackup, RestorePreview, RestoreResult } from './schema';
import type { CommunityState, AchievementEarned } from '@/lib/community/types';
import type { TutorialProgress } from '@/lib/tutorial/types';
import { DEFAULT_TUTORIAL_PROGRESS } from '@/lib/tutorial/types';

export function previewRestore(
  backup: SwingIQBackup,
  currentState: SwingIQState,
): RestorePreview {
  const warnings: string[] = [];
  const categories: string[] = [];

  // ── Sessions ──────────────────────────────────────────────
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

  // ── Clubs ─────────────────────────────────────────────────
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

  // ── Video analyses ────────────────────────────────────────
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

  // ── Profile ───────────────────────────────────────────────
  let profileUpdated = false;
  if (backup.data.profile && !currentState.profile) {
    profileUpdated = true;
  } else if (backup.data.profile && currentState.profile) {
    warnings.push('A golf profile already exists — it will not be overwritten in merge mode');
  }

  // ── Sport profiles ────────────────────────────────────────
  const sportProfilesUpdated: string[] = [];
  for (const sport of Object.keys(backup.data.sportProfiles ?? {})) {
    if (!(sport in currentState.sportProfiles)) {
      sportProfilesUpdated.push(sport);
    }
  }

  // ── Training ──────────────────────────────────────────────
  const backupMilestones = backup.data.training?.milestones_earned?.length ?? 0;
  const currentMilestones = currentState.training.milestones_earned.length;
  const trainingUpdated = backupMilestones > currentMilestones;

  // ── Community / gamification ──────────────────────────────
  const backupBadges = backup.data.community?.achievementsEarned?.length ?? 0;
  const currentBadges = currentState.community.achievementsEarned.length;
  const backupXP = backup.data.community?.xpTotal ?? 0;
  const currentXP = currentState.community.xpTotal;
  const backupChallenges = backup.data.community?.challengesCompleted?.length ?? 0;
  const currentChallenges = currentState.community.challengesCompleted.length;

  let communityUpdated = false;
  if (backupBadges > currentBadges || backupXP > currentXP || backupChallenges > currentChallenges) {
    communityUpdated = true;
  }
  if (communityUpdated && (backupXP < currentXP)) {
    warnings.push('Your current XP is higher than the backup — the higher value will be kept during merge');
  }

  // ── Tutorial progress ─────────────────────────────────────
  const backupTutorials = backup.data.tutorialProgress?.completed?.length ?? 0;
  const currentTutorials = currentState.tutorialProgress.completed.length;
  const tutorialUpdated = backupTutorials > currentTutorials;

  // ── Build category list ───────────────────────────────────
  if (newSessions > 0) categories.push('sessions');
  if (newClubs > 0) categories.push('clubs');
  if (newVideos > 0) categories.push('video analyses');
  if (profileUpdated) categories.push('profile');
  if (sportProfilesUpdated.length > 0) categories.push('sport profiles');
  if (trainingUpdated) categories.push('training progress');
  if (communityUpdated) categories.push('badges & XP');
  if (tutorialUpdated) categories.push('tutorial progress');

  const totalNew = newSessions + newClubs + newVideos;
  const summary =
    totalNew === 0 && categories.length === 0
      ? 'No new records found — your data is already up to date'
      : `${totalNew} new record${totalNew !== 1 ? 's' : ''} across ${categories.length} categor${categories.length !== 1 ? 'ies' : 'y'}`;

  return {
    newRecords: { sessions: newSessions, clubs: newClubs, videoAnalyses: newVideos },
    updatedRecords: {
      profile: profileUpdated,
      sportProfiles: sportProfilesUpdated,
      training: trainingUpdated,
      communityBadges: backupBadges,
      communityXP: backupXP,
      communityUpdated,
      tutorialUpdated,
    },
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
  // ── Sessions ──────────────────────────────────────────────
  const existingSessionIds = new Set(currentState.sessions.map((s) => s.id));
  const existingSessionKeys = new Set(
    currentState.sessions.map((s) => `${s.sport}|${s.date}|${s.launch_monitor}`),
  );
  const newSessions = (backup.data.sessions ?? []).filter((s) => {
    const key = `${s.sport}|${s.date}|${s.launch_monitor}`;
    return !existingSessionIds.has(s.id) && !existingSessionKeys.has(key);
  });

  // ── Clubs ─────────────────────────────────────────────────
  const existingClubIds = new Set(currentState.clubs.map((c) => c.id));
  const existingClubKeys = new Set(
    currentState.clubs.map((c) => `${c.name.toLowerCase()}|${c.category}`),
  );
  const newClubs = (backup.data.clubs ?? []).filter((c) => {
    const key = `${c.name.toLowerCase()}|${c.category}`;
    return !existingClubIds.has(c.id) && !existingClubKeys.has(key);
  });

  // ── Video analyses ────────────────────────────────────────
  const existingVideoIds = new Set(currentState.video_analyses.map((v) => v.id));
  const newVideos = (backup.data.videoAnalyses ?? []).filter(
    (v) => !existingVideoIds.has(v.id),
  );

  // ── Profile ───────────────────────────────────────────────
  const profile = currentState.profile ?? backup.data.profile;

  // ── Sport profiles ────────────────────────────────────────
  const mergedSportProfiles = { ...backup.data.sportProfiles };
  for (const [sport, data] of Object.entries(currentState.sportProfiles)) {
    if (data) mergedSportProfiles[sport as keyof typeof mergedSportProfiles] = data;
  }

  // ── Training ──────────────────────────────────────────────
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

  // ── Community / gamification merge ────────────────────────
  // Strategy: take higher XP, combine badges (dedup by id), combine challenges
  const backupCommunity = backup.data.community;
  let mergedCommunity: CommunityState = currentState.community;

  if (backupCommunity) {
    // Merge badges: keep all unique badge IDs
    const currentBadgeIds = new Set(currentState.community.achievementsEarned.map((a) => a.id));
    const newBadges: AchievementEarned[] = (backupCommunity.achievementsEarned ?? []).filter(
      (a) => !currentBadgeIds.has(a.id),
    );

    // Merge completed challenges
    const currentChallengeIds = new Set(
      currentState.community.challengesCompleted.map((c) => c.id),
    );
    const newChallenges = (backupCommunity.challengesCompleted ?? []).filter(
      (c) => !currentChallengeIds.has(c.id),
    );

    // Merge XP events (dedup by timestamp)
    const currentXPEventKeys = new Set(
      currentState.community.xpEvents.map((e) => `${e.type}|${e.at}`),
    );
    const newXPEvents = (backupCommunity.xpEvents ?? []).filter(
      (e) => !currentXPEventKeys.has(`${e.type}|${e.at}`),
    );

    mergedCommunity = {
      ...currentState.community,
      achievementsEarned: [
        ...currentState.community.achievementsEarned,
        ...newBadges,
      ],
      challengesCompleted: [
        ...currentState.community.challengesCompleted,
        ...newChallenges,
      ],
      xpTotal: Math.max(currentState.community.xpTotal, backupCommunity.xpTotal ?? 0),
      xpEvents: [...currentState.community.xpEvents, ...newXPEvents],
      exportCount: Math.max(
        currentState.community.exportCount,
        backupCommunity.exportCount ?? 0,
      ),
      lastExportAt:
        currentState.community.lastExportAt && backupCommunity.lastExportAt
          ? currentState.community.lastExportAt > backupCommunity.lastExportAt
            ? currentState.community.lastExportAt
            : backupCommunity.lastExportAt
          : currentState.community.lastExportAt ?? backupCommunity.lastExportAt,
      // Keep current privacy/profile settings
      profile: currentState.community.profile,
      privacy: currentState.community.privacy,
      // Merge groups joined
      groupsJoined: Array.from(
        new Set([
          ...currentState.community.groupsJoined,
          ...(backupCommunity.groupsJoined ?? []),
        ]),
      ),
    };
  }

  // ── Tutorial progress merge ───────────────────────────────
  const backupTutorial: TutorialProgress = backup.data.tutorialProgress ?? DEFAULT_TUTORIAL_PROGRESS;
  const mergedTutorialProgress: TutorialProgress = {
    completed: Array.from(
      new Set([...currentState.tutorialProgress.completed, ...backupTutorial.completed]),
    ),
    dismissed: Array.from(
      new Set([...currentState.tutorialProgress.dismissed, ...backupTutorial.dismissed]),
    ),
    lastViewedAt: {
      ...backupTutorial.lastViewedAt,
      ...currentState.tutorialProgress.lastViewedAt,
    },
  };

  return {
    profile,
    sportProfiles: mergedSportProfiles,
    clubs: [...currentState.clubs, ...newClubs],
    sessions: [...newSessions, ...currentState.sessions],
    video_analyses: [...newVideos, ...currentState.video_analyses],
    training,
    community: mergedCommunity,
    tutorialProgress: mergedTutorialProgress,
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
    community: backup.data.community,
    tutorialProgress: backup.data.tutorialProgress ?? DEFAULT_TUTORIAL_PROGRESS,
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
