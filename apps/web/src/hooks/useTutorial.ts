'use client';

import { useCallback } from 'react';
import { useSwingVantageStore } from '@/store';
import type { TutorialContent, TutorialAudience } from '@/lib/tutorial/types';

/**
 * Hook for reading and updating tutorial progress.
 * Components use this to check if a tutorial has been seen
 * and to mark it as completed or dismissed.
 */
export function useTutorial() {
  const tutorialProgress = useSwingVantageStore((s) => s.tutorialProgress);
  const updateTutorialProgress = useSwingVantageStore((s) => s.updateTutorialProgress);

  const isCompleted = useCallback(
    (tutorialId: string) => tutorialProgress.completed.includes(tutorialId),
    [tutorialProgress.completed],
  );

  const isDismissed = useCallback(
    (tutorialId: string) => tutorialProgress.dismissed.includes(tutorialId),
    [tutorialProgress.dismissed],
  );

  const hasBeenSeen = useCallback(
    (tutorialId: string) =>
      tutorialProgress.completed.includes(tutorialId) ||
      tutorialProgress.dismissed.includes(tutorialId),
    [tutorialProgress.completed, tutorialProgress.dismissed],
  );

  const markCompleted = useCallback(
    (tutorial: TutorialContent) => {
      updateTutorialProgress({
        completed: [...new Set([...tutorialProgress.completed, tutorial.id])],
        dismissed: tutorialProgress.dismissed.filter((id) => id !== tutorial.id),
        lastViewedAt: {
          ...tutorialProgress.lastViewedAt,
          [tutorial.id]: new Date().toISOString(),
        },
      });
    },
    [tutorialProgress, updateTutorialProgress],
  );

  const markDismissed = useCallback(
    (tutorial: TutorialContent) => {
      updateTutorialProgress({
        dismissed: [...new Set([...tutorialProgress.dismissed, tutorial.id])],
        lastViewedAt: {
          ...tutorialProgress.lastViewedAt,
          [tutorial.id]: new Date().toISOString(),
        },
      });
    },
    [tutorialProgress, updateTutorialProgress],
  );

  const resetAll = useCallback(() => {
    updateTutorialProgress({
      completed: [],
      dismissed: [],
      lastViewedAt: {},
      watchedVideos: [],
      skippedTour: false,
      preferredAudience: undefined,
    });
  }, [updateTutorialProgress]);

  // ── Video Tutorial Center ───────────────────────────────────
  // These fields are optional on older persisted state, so default
  // them defensively rather than assuming they exist.
  const watchedVideos = tutorialProgress.watchedVideos ?? [];
  const skippedTour = tutorialProgress.skippedTour ?? false;
  const preferredAudience = tutorialProgress.preferredAudience;

  const isVideoWatched = useCallback(
    (videoId: string) => (tutorialProgress.watchedVideos ?? []).includes(videoId),
    [tutorialProgress.watchedVideos],
  );

  const markVideoWatched = useCallback(
    (videoId: string) => {
      updateTutorialProgress({
        watchedVideos: [...new Set([...(tutorialProgress.watchedVideos ?? []), videoId])],
        lastViewedAt: {
          ...tutorialProgress.lastViewedAt,
          [`video:${videoId}`]: new Date().toISOString(),
        },
      });
    },
    [tutorialProgress.watchedVideos, tutorialProgress.lastViewedAt, updateTutorialProgress],
  );

  const unmarkVideoWatched = useCallback(
    (videoId: string) => {
      updateTutorialProgress({
        watchedVideos: (tutorialProgress.watchedVideos ?? []).filter((id) => id !== videoId),
      });
    },
    [tutorialProgress.watchedVideos, updateTutorialProgress],
  );

  const setSkippedTour = useCallback(
    (skipped: boolean) => updateTutorialProgress({ skippedTour: skipped }),
    [updateTutorialProgress],
  );

  const setPreferredAudience = useCallback(
    (audience: TutorialAudience) => updateTutorialProgress({ preferredAudience: audience }),
    [updateTutorialProgress],
  );

  return {
    tutorialProgress,
    isCompleted,
    isDismissed,
    hasBeenSeen,
    markCompleted,
    markDismissed,
    resetAll,
    // Video tutorial center
    watchedVideos,
    skippedTour,
    preferredAudience,
    isVideoWatched,
    markVideoWatched,
    unmarkVideoWatched,
    setSkippedTour,
    setPreferredAudience,
  };
}
