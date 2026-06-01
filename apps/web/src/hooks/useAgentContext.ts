'use client';

// ============================================================
// SwingIQ — useAgentContext
// ------------------------------------------------------------
// Lightweight hook that gives any page the normalized
// AgentContext so it can call a specific workflow directly
// (practice planner, pre-game, coach sharing, intake quality…).
// Hydration-safe: ctx is null until the store mounts on client.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { useSwingIQStore } from '@/store';
import { useSport } from '@/contexts/SportContext';
import { buildAgentContext, type AgentContext } from '@/lib/agents';

export function useAgentContext(): { ready: boolean; ctx: AgentContext | null } {
  const state = useSwingIQStore();
  const { activeSport } = useSport();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const ctx = useMemo(
    () => (mounted ? buildAgentContext(state, activeSport) : null),
    [mounted, state, activeSport],
  );

  return { ready: mounted, ctx };
}
