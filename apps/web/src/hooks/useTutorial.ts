'use client';

import { useCallback } from 'react';
import { useSwingIQStore } from '@/store';
import type { TutorialContent } from '@/lib/tutorial/types';

/**
 * Hook for reading and updating tutorial progress.
 * Components use this to check if a tutorial has been seen
 * and to mark it as completed or dismissed.
 */
export function useTutorial() {
  const tutorialProgress = useSwingIQStore((s) => s.tutorialProgress);
  const updateTutorialProgress = useSwingIQStore((s) => s.updateTutorialProgress);

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
    updateTutorialProgress({ completed: [], dismissed: [], lastViewedAt: {} });
  }, [updateTutorialProgress]);

  return {
    tutorialProgress,
    isCompleted,
    isDismissed,
    hasBeenSeen,
    markCompleted,
    markDismissed,
    resetAll,
  };
}
