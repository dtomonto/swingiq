// ============================================================
// SwingVantage — SwingLab 2.0: per-station status chip styles
// ------------------------------------------------------------
// Literal Tailwind classes per status kind (JIT-safe — never build
// dynamically). Shared by the map markers and the detail panel.
// ============================================================

import type { StationStatusKind } from '@/lib/swinglab/types';

export interface ChipStyle {
  className: string;
  dot: string;
}

export const STATUS_CHIP: Record<StationStatusKind, ChipStyle> = {
  recommended: { className: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30', dot: 'bg-emerald-400' },
  retest_due: { className: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30', dot: 'bg-amber-400' },
  in_progress: { className: 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/30', dot: 'bg-cyan-400' },
  new: { className: 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/30', dot: 'bg-violet-400' },
  visited: { className: 'bg-white/10 text-stage-foreground ring-1 ring-white/15', dot: 'bg-stage-muted' },
  neutral: { className: 'bg-white/10 text-stage-muted ring-1 ring-white/10', dot: 'bg-stage-muted' },
};
