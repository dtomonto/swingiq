import type { SwingIQSlice, SwingIQStore } from '../types';

export const createProfileSlice: SwingIQSlice<
  Pick<SwingIQStore, 'profile' | 'sportProfiles' | 'setProfile' | 'setSportProfile'>
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
