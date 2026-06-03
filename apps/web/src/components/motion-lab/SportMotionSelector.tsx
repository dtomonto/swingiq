'use client';

// ============================================================
// SwingIQ — Motion Lab: Sport + Motion Type Selector
// ============================================================

import { useState } from 'react';
import { Check } from 'lucide-react';
import { MOTION_SPORTS, getSport } from '@/lib/motion-lab';
import type { SportId, MotionTypeId } from '@/lib/motion-lab';
import { cn } from '@/lib/utils';

interface Props {
  sport: SportId;
  motionType: MotionTypeId | null;
  onSport: (s: SportId) => void;
  onMotion: (m: MotionTypeId) => void;
}

export function SportMotionSelector({ sport, motionType, onSport, onMotion }: Props) {
  const [activeSport, setActiveSport] = useState<SportId>(sport);
  const sportCfg = getSport(activeSport);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-2">1 · Choose your sport</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {MOTION_SPORTS.map((s) => {
            const active = s.id === activeSport;
            return (
              <button
                key={s.id}
                onClick={() => { setActiveSport(s.id); onSport(s.id); }}
                className={cn(
                  'rounded-xl border p-3 text-left transition-all',
                  active ? 'border-transparent ring-2 shadow-sm' : 'border-border hover:border-primary/40 bg-card',
                )}
                style={active ? { boxShadow: `0 0 0 2px ${s.accent}`, background: `${s.accent}14` } : undefined}
              >
                <div className="text-2xl">{s.emoji}</div>
                <div className="text-sm font-semibold text-foreground mt-1 leading-tight">{s.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-2">2 · Choose the motion</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sportCfg.motions.map((m) => {
            const active = m.id === motionType;
            return (
              <button
                key={m.id}
                onClick={() => onMotion(m.id)}
                className={cn(
                  'flex items-center justify-between rounded-xl border p-3 text-left transition-all',
                  active ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40 bg-card',
                )}
              >
                <div>
                  <div className="text-sm font-semibold text-foreground">{m.label}</div>
                  <div className="text-xs text-muted-foreground">{m.hint}</div>
                </div>
                {active && <Check className="w-4 h-4 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
