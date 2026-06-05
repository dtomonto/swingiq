import type { SwingVantageSlice, SwingVantageStore } from '../types';
import { DEFAULT_COMMUNITY_STATE } from '../types';

export const createCommunitySlice: SwingVantageSlice<
  Pick<SwingVantageStore, 'community' | 'updateCommunity' | 'recordExport'>
> = (set) => ({
  community: DEFAULT_COMMUNITY_STATE,

  updateCommunity: (updates) =>
    set((s) => ({ community: { ...s.community, ...updates } })),

  recordExport: () =>
    set((s) => ({
      community: {
        ...s.community,
        lastExportAt: new Date().toISOString(),
        exportCount: s.community.exportCount + 1,
      },
    })),
});
