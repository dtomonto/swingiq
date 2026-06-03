'use client';

import { BagManager } from '../../bag/BagManager';
import { BaseballEquipment } from '../baseball/BaseballEquipment';
import { TennisEquipment } from '../tennis/TennisEquipment';
import { SlowPitchEquipment } from '../softball-slow/SlowPitchEquipment';
import { FastPitchEquipment } from '../softball-fast/FastPitchEquipment';

/**
 * Renders the right equipment manager for the [sport] route segment.
 * Equipment is now unified under /equipment/[sport] (audit finding IA-5);
 * golf (clubs) lives here too — /bag redirects to /equipment/golf.
 */
export function EquipmentDispatcher({ sport }: { sport: string }) {
  switch (sport) {
    case 'golf':
      return <BagManager />;
    case 'tennis':
      return <TennisEquipment />;
    case 'baseball':
      return <BaseballEquipment />;
    case 'softball-slow':
      return <SlowPitchEquipment />;
    case 'softball-fast':
      return <FastPitchEquipment />;
    default:
      return null;
  }
}
