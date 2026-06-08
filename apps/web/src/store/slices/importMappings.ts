import type { SwingVantageSlice, SwingVantageStore } from '../types';
import {
  makeSavedMapping,
  mergeSavedMapping,
  type SavedMapping,
} from '@/lib/import/mapping-memory';

export interface RememberMappingInput {
  fingerprint: string;
  sourceId: string;
  mapping: Record<string, string>;
  headers: string[];
  /** True when the user manually corrected the mapping. */
  corrected?: boolean;
}

/**
 * Learned column-mapping memory (Phase 3). Keyed by schema fingerprint so a
 * re-upload of the same export layout reuses the mapping instead of asking the
 * user to remap. Upserts: a repeat remembers bumps useCount + keeps the
 * "corrected" flag sticky (see mergeSavedMapping). Local-first like onboarding —
 * re-learned per device, not a synced table.
 */
export const createImportMappingsSlice: SwingVantageSlice<
  Pick<SwingVantageStore, 'importMappings' | 'rememberImportMapping' | 'clearImportMappings'>
> = (set) => ({
  importMappings: {},

  rememberImportMapping: (input: RememberMappingInput) =>
    set((s) => {
      const prev = s.importMappings[input.fingerprint];
      const saved: SavedMapping = prev
        ? mergeSavedMapping(prev, {
            mapping: input.mapping,
            headers: input.headers,
            corrected: input.corrected,
          })
        : makeSavedMapping({
            fingerprint: input.fingerprint,
            sourceId: input.sourceId,
            mapping: input.mapping,
            headers: input.headers,
            corrected: input.corrected,
          });
      // Keep the source id current (a re-detect may refine it).
      if (input.sourceId) saved.sourceId = input.sourceId;
      return { importMappings: { ...s.importMappings, [input.fingerprint]: saved } };
    }),

  clearImportMappings: () => set({ importMappings: {} }),
});
