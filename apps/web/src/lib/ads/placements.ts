// ============================================================
// SwingVantage — AdsOS: placement registry (single source of truth)
// ------------------------------------------------------------
// Add a slot here and drop an <AdSlot> with its id anywhere. Keep youth/
// health/sensitive surfaces marked `sensitive` so paid ads never appear
// there even when a network is configured.
// ============================================================

import type { AdPlacement, AdPlacementId } from './types';

export const AD_PLACEMENTS: AdPlacement[] = [
  {
    id: 'dashboard-feed',
    label: 'Dashboard feed',
    surface: 'Today / dashboard, below the fold',
    format: 'card',
    enabled: true,
    allowHouse: true,
    sensitive: false,
  },
  {
    id: 'between-results',
    label: 'Between results',
    surface: 'After a swing analysis result',
    format: 'inline',
    enabled: true,
    allowHouse: true,
    sensitive: false,
  },
  {
    id: 'library-grid',
    label: 'Library grid',
    surface: 'Video library, between rows',
    format: 'card',
    enabled: true,
    allowHouse: true,
    sensitive: false,
  },
  {
    id: 'drills-list',
    label: 'Drills list',
    surface: 'Drill library list',
    format: 'inline',
    enabled: true,
    allowHouse: true,
    sensitive: false,
  },
  {
    id: 'sessions-list',
    label: 'Sessions list',
    surface: 'Session history list',
    format: 'inline',
    enabled: false,
    allowHouse: true,
    sensitive: false,
  },
];

export function getPlacement(id: AdPlacementId): AdPlacement | undefined {
  return AD_PLACEMENTS.find((p) => p.id === id);
}
