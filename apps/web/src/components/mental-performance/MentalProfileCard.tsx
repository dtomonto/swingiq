'use client';

import { User } from 'lucide-react';
import { useMentalPerformance } from '@/lib/mental-performance/useMentalPerformance';
import { EMOTIONAL_STATES, TONE_LABELS } from '@/lib/mental-performance/constants';
import type { CoachTone, EmotionalState, ResetStyle } from '@/lib/mental-performance/types';

const RESET_STYLES: Array<{ id: ResetStyle; label: string }> = [
  { id: 'breath', label: 'Breath' },
  { id: 'physical', label: 'Physical' },
  { id: 'verbal', label: 'Self-talk' },
  { id: 'visual', label: 'Visualize' },
];

const TONES: CoachTone[] = ['calm', 'direct', 'encouraging', 'tactical'];

/**
 * Edits the user's mental profile (preferences + self-ratings). Lives in the
 * mental-performance store — NOT the main profile schema — so it stays isolated
 * and consent-gated like BodySync.
 */
export function MentalProfileCard() {
  const mp = useMentalPerformance();
  const p = mp.state.profile;

  const toggleTrigger = (e: EmotionalState) => {
    const has = p.commonTriggers.includes(e);
    mp.setProfile({
      commonTriggers: has ? p.commonTriggers.filter((x) => x !== e) : [...p.commonTriggers, e],
    });
  };

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <User size={18} aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-bold text-foreground">Your mental profile</h3>
          <p className="text-xs text-muted-foreground">Personalizes the coach. Stays on your device.</p>
        </div>
      </div>

      <div>
        <span className="text-sm font-medium text-foreground">Preferred reset style</span>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {RESET_STYLES.map((s) => (
            <button key={s.id} type="button"
              onClick={() => mp.setProfile({ preferredResetStyle: p.preferredResetStyle === s.id ? null : s.id })}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${p.preferredResetStyle === s.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="text-sm font-medium text-foreground">Coaching tone</span>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {TONES.map((t) => (
            <button key={t} type="button"
              onClick={() => mp.setProfile({ preferredTone: p.preferredTone === t ? null : t })}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${p.preferredTone === t ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary'}`}>
              {TONE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="text-sm font-medium text-foreground">Common triggers</span>
        <p className="text-xs text-muted-foreground">What tends to throw you off?</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {EMOTIONAL_STATES.map((e) => (
            <button key={e.id} type="button" onClick={() => toggleTrigger(e.id)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${p.commonTriggers.includes(e.id) ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary'}`}>
              <span aria-hidden="true">{e.emoji}</span> {e.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
