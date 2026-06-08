// ============================================================
// SwingVantage — SwingLab 2.0: shared station visuals
// ------------------------------------------------------------
// Maps the pure string keys from content/swinglab.ts to concrete
// lucide icons and Tailwind accent classes, shared by StationCard and
// LabMap so the two never drift.
//
// Tailwind note: accent classes MUST be full literal strings so the
// JIT compiler can see them. Never build them dynamically.
// ============================================================

import {
  BrainCircuit,
  Clapperboard,
  DoorOpen,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  IdCard,
  ScanLine,
  Trophy,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { StationAccent, StationIcon } from '@/content/swinglab';

export const STATION_ICONS: Record<StationIcon, LucideIcon> = {
  atrium: DoorOpen,
  motion: ScanLine,
  coach: BrainCircuit,
  profile: IdCard,
  training: Dumbbell,
  film: Clapperboard,
  equipment: Wrench,
  recruiting: Trophy,
  recovery: HeartPulse,
  academy: GraduationCap,
};

export interface AccentClasses {
  /** Icon tile background + ring + text. */
  tile: string;
  /** Accent text (role tag, live link, dots). */
  text: string;
  /** Card/tile hover border. */
  hoverBorder: string;
  /** Soft glow behind the icon tile. */
  glow: string;
}

export const STATION_ACCENTS: Record<StationAccent, AccentClasses> = {
  emerald: { tile: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/20', text: 'text-emerald-300', hoverBorder: 'hover:border-emerald-400/40', glow: 'bg-emerald-500/20' },
  cyan: { tile: 'bg-cyan-500/10 text-cyan-300 ring-cyan-400/20', text: 'text-cyan-300', hoverBorder: 'hover:border-cyan-400/40', glow: 'bg-cyan-500/20' },
  violet: { tile: 'bg-violet-500/10 text-violet-300 ring-violet-400/20', text: 'text-violet-300', hoverBorder: 'hover:border-violet-400/40', glow: 'bg-violet-500/20' },
  sky: { tile: 'bg-sky-500/10 text-sky-300 ring-sky-400/20', text: 'text-sky-300', hoverBorder: 'hover:border-sky-400/40', glow: 'bg-sky-500/20' },
  amber: { tile: 'bg-amber-500/10 text-amber-300 ring-amber-400/20', text: 'text-amber-300', hoverBorder: 'hover:border-amber-400/40', glow: 'bg-amber-500/20' },
  rose: { tile: 'bg-rose-500/10 text-rose-300 ring-rose-400/20', text: 'text-rose-300', hoverBorder: 'hover:border-rose-400/40', glow: 'bg-rose-500/20' },
  teal: { tile: 'bg-teal-500/10 text-teal-300 ring-teal-400/20', text: 'text-teal-300', hoverBorder: 'hover:border-teal-400/40', glow: 'bg-teal-500/20' },
  indigo: { tile: 'bg-indigo-500/10 text-indigo-300 ring-indigo-400/20', text: 'text-indigo-300', hoverBorder: 'hover:border-indigo-400/40', glow: 'bg-indigo-500/20' },
  lime: { tile: 'bg-lime-500/10 text-lime-300 ring-lime-400/20', text: 'text-lime-300', hoverBorder: 'hover:border-lime-400/40', glow: 'bg-lime-500/20' },
  orange: { tile: 'bg-orange-500/10 text-orange-300 ring-orange-400/20', text: 'text-orange-300', hoverBorder: 'hover:border-orange-400/40', glow: 'bg-orange-500/20' },
};
