'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useMentalPerformance } from '@/lib/mental-performance/useMentalPerformance';
import { MISTAKE_CATEGORIES, EMOTIONAL_STATES, sportFamilyFor } from '@/lib/mental-performance/constants';
import type { EmotionalState, MistakeCategory, SessionType } from '@/lib/mental-performance/types';

function Rating({
  label, value, onChange, lowLabel, highLabel,
}: { label: string; value: number | null; onChange: (n: number) => void; lowLabel?: string; highLabel?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${label}: ${n}`}
            className={`h-9 flex-1 rounded-lg border text-sm font-medium transition-colors ${
              value === n ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      {(lowLabel || highLabel) && (
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>{lowLabel}</span><span>{highLabel}</span>
        </div>
      )}
    </div>
  );
}

const SESSION_TYPES: Array<{ id: SessionType; label: string }> = [
  { id: 'practice', label: 'Practice' },
  { id: 'competition', label: 'Competition' },
  { id: 'casual', label: 'Casual' },
  { id: 'lesson', label: 'Lesson' },
];

export function JournalEntryForm({ onSaved }: { onSaved?: () => void }) {
  const mp = useMentalPerformance();
  const sport = mp.activeSport;
  const mistakes = MISTAKE_CATEGORIES.filter(
    (m) => m.sportFamily === sportFamilyFor(sport) || m.sportFamily === 'any',
  );

  const [sessionType, setSessionType] = useState<SessionType | ''>('');
  const [mistake, setMistake] = useState<MistakeCategory | ''>('');
  const [emotion, setEmotion] = useState<EmotionalState | ''>('');
  const [intensity, setIntensity] = useState<number | null>(null);
  const [recoverySpeed, setRecoverySpeed] = useState<number | null>(null);
  const [composure, setComposure] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const [whatWorked, setWhatWorked] = useState('');
  const [nextTimeCue, setNextTimeCue] = useState('');
  const [reflection, setReflection] = useState('');

  const submit = () => {
    const ok = mp.saveLog({
      sport, sessionType: sessionType || null, mistake: mistake || null, emotion: emotion || null,
      intensity, recoverySpeed, whatIDidNext: '', whatWorked, whatDidnt: '', nextTimeCue,
      confidence, focus, composure, routineUsed: null, effectiveness: null, reflection,
    });
    if (ok) onSaved?.();
  };

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-5">
      <h3 className="font-bold text-foreground">Log a moment</h3>

      <div>
        <span className="text-sm font-medium text-foreground">Session</span>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {SESSION_TYPES.map((s) => (
            <button key={s.id} type="button" onClick={() => setSessionType((c) => (c === s.id ? '' : s.id))}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${sessionType === s.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="text-sm font-medium text-foreground">What happened?</span>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {mistakes.map((m) => (
            <button key={m.id} type="button" onClick={() => setMistake((c) => (c === m.id ? '' : m.id))}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${mistake === m.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary'}`}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="text-sm font-medium text-foreground">Emotion</span>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {EMOTIONAL_STATES.map((e) => (
            <button key={e.id} type="button" onClick={() => setEmotion((c) => (c === e.id ? '' : e.id))}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${emotion === e.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary'}`}>
              <span aria-hidden="true">{e.emoji}</span> {e.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Rating label="Intensity" value={intensity} onChange={setIntensity} lowLabel="Mild" highLabel="Intense" />
        <Rating label="Recovery speed" value={recoverySpeed} onChange={setRecoverySpeed} lowLabel="Slow" highLabel="Fast" />
        <Rating label="Composure" value={composure} onChange={setComposure} lowLabel="Low" highLabel="High" />
        <Rating label="Confidence" value={confidence} onChange={setConfidence} lowLabel="Low" highLabel="High" />
        <Rating label="Focus" value={focus} onChange={setFocus} lowLabel="Low" highLabel="High" />
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="mp-worked" className="text-sm font-medium text-foreground">What worked?</label>
          <input id="mp-worked" value={whatWorked} onChange={(e) => setWhatWorked(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-card p-2.5 text-foreground focus:border-primary focus:outline-hidden" />
        </div>
        <div>
          <label htmlFor="mp-cue" className="text-sm font-medium text-foreground">Cue for next time</label>
          <input id="mp-cue" value={nextTimeCue} onChange={(e) => setNextTimeCue(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-card p-2.5 text-foreground focus:border-primary focus:outline-hidden" />
        </div>
        <div>
          <label htmlFor="mp-reflect" className="text-sm font-medium text-foreground">Reflection</label>
          <textarea id="mp-reflect" rows={2} value={reflection} onChange={(e) => setReflection(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-card p-2.5 text-foreground focus:border-primary focus:outline-hidden" />
        </div>
      </div>

      <Button onClick={submit} className="w-full"><Check size={16} /> Save entry</Button>
    </div>
  );
}
