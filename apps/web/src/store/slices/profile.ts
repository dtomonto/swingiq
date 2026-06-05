import type { SwingVantageSlice, SwingVantageStore } from '../types';

export const createProfileSlice: SwingVantageSlice<
  Pick<SwingVantageStore, 'profile' | 'sportProfiles' | 'setProfile' | 'setSportProfile'>
> = (set, get) => ({
  profile: null,
  sportProfiles: {},

  setProfile: (profile) => {
    set({ profile });
    get().computeSetupStep();
  },

  setSportProfile: (sport, data) =>
    set((s) => ({ sportProfiles: { ...s.sportProfiles, [sport]: data } })),
});
