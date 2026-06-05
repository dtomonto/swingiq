import type { SwingVantageSlice, SwingVantageStore } from '../types';
import { DEFAULT_SETTINGS } from '../types';

export const createSettingsSlice: SwingVantageSlice<
  Pick<SwingVantageStore, 'settings' | 'updateSettings'>
> = (set) => ({
  settings: DEFAULT_SETTINGS,

  updateSettings: (updates) =>
    set((s) => ({ settings: { ...s.settings, ...updates } })),
});
