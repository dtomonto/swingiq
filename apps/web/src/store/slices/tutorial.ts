import type { SwingVantageSlice, SwingVantageStore } from '../types';
import { DEFAULT_TUTORIAL_PROGRESS } from '../types';

export const createTutorialSlice: SwingVantageSlice<
  Pick<SwingVantageStore, 'tutorialProgress' | 'updateTutorialProgress'>
> = (set) => ({
  tutorialProgress: DEFAULT_TUTORIAL_PROGRESS,

  updateTutorialProgress: (updates) =>
    set((s) => ({ tutorialProgress: { ...s.tutorialProgress, ...updates } })),
});
