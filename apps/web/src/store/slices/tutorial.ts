import type { SwingIQSlice, SwingIQStore } from '../types';
import { DEFAULT_TUTORIAL_PROGRESS } from '../types';

export const createTutorialSlice: SwingIQSlice<
  Pick<SwingIQStore, 'tutorialProgress' | 'updateTutorialProgress'>
> = (set) => ({
  tutorialProgress: DEFAULT_TUTORIAL_PROGRESS,

  updateTutorialProgress: (updates) =>
    set((s) => ({ tutorialProgress: { ...s.tutorialProgress, ...updates } })),
});
