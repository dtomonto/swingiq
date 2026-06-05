'use client';

// ============================================================
// SwingIQ — AGI: Proven-drills hook
// ------------------------------------------------------------
// Reads the athlete's DrillMatch feedback (local-first) and resolves the drills
// they marked as helping into ProvenDrill[]. The only drillmatch coupling in
// the AGI layer; the mapping itself lives in the pure ./feedback-map.
// ============================================================

import { useMemo } from 'react';
import { localDrillFeedbackRepo, getDrillCandidateById } from '@/lib/drillmatch';
import { provenDrillsFrom } from './feedback-map';
import type { ProvenDrill } from '../types';

export function useProvenDrills(): ProvenDrill[] {
  return useMemo(
    () =>
      provenDrillsFrom(
        localDrillFeedbackRepo.all(),
        (id) => getDrillCandidateById(id)?.name ?? null,
      ),
    [],
  );
}
