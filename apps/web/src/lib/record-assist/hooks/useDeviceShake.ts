'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DeviceShakeMonitor } from '../runtime/devicemotion';

export interface UseDeviceShakeResult {
  /** DeviceMotion API present at all. */
  supported: boolean;
  /** Platform needs an explicit permission gesture (iOS 13+). */
  needsPermission: boolean;
  /** True once the monitor is actively receiving motion. */
  enabled: boolean;
  /** Request permission (when needed) + start listening. Call from a gesture. */
  enable: () => Promise<boolean>;
  /** Stable getter the capture loop reads each tick (0–1 shake, or undefined). */
  getMotion: () => number | undefined;
}

/**
 * React glue around DeviceShakeMonitor: lazily constructs the monitor, exposes
 * a stable `getMotion` getter for the guidance loop, and tears down on unmount.
 * Everything is a safe no-op when DeviceMotion is unavailable.
 */
export function useDeviceShake(): UseDeviceShakeResult {
  // Stable instance via a lazy useState initializer (no ref access in render).
  const [monitor] = useState(() => new DeviceShakeMonitor());

  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    return () => {
      monitor.stop();
    };
  }, [monitor]);

  const enable = useCallback(async () => {
    const ok = await monitor.start();
    setEnabled(ok);
    return ok;
  }, [monitor]);

  const getMotion = useCallback(() => monitor.value(), [monitor]);

  return useMemo(
    () => ({
      supported: monitor.supported,
      needsPermission: monitor.needsPermission,
      enabled,
      enable,
      getMotion,
    }),
    [monitor, enabled, enable, getMotion],
  );
}
