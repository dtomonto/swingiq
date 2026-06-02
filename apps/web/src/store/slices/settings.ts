import type { SwingIQSlice, SwingIQStore } from '../types';
import { DEFAULT_SETTINGS } from '../types';

export const createSettingsSlice: SwingIQSlice<
  Pick<SwingIQStore, 'settings' | 'updateSettings'>
> = (set) => ({
  settings: DEFAULT_SETTINGS,

  updateSettings: (updates) =>
    set((s) => ({ settings: { ...s.settings, ...updates } })),
});
