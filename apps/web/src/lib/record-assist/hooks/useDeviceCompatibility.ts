'use client';

import { useEffect, useState } from 'react';
import { evaluateCompatibility, probeEnvironment } from '../engines/compatibility-engine';
import type { DeviceCompatibilityResult } from '../types';

/**
 * Resolve device capabilities after mount (browser APIs aren't available
 * during SSR). Returns null until measured so callers can show a neutral
 * loading state instead of a hydration-mismatching guess.
 */
export function useDeviceCompatibility(): DeviceCompatibilityResult | null {
  const [result, setResult] = useState<DeviceCompatibilityResult | null>(null);

  useEffect(() => {
    setResult(evaluateCompatibility(probeEnvironment()));
  }, []);

  return result;
}
