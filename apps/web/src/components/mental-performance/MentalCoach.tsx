'use client';

import { useMemo, useState } from 'react';
import { Sparkles, NotebookPen, Dumbbell, Eye, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useMentalPerformance } from '@/lib/mental-performance/useMentalPerformance';
import { buildCoachResponse } from '@/lib/mental-performance/coach';
import { emitMentalEvent, mentalEvent } from '@/lib/mental-performance/telemetry';
import {
  MISTAKE_CATEGORIES, EMOTIONAL_STATES, sportFamilyFor,
} from '@/lib/mental-performance/constants';
import type {
  CoachResponse, CoachMode, EmotionalState, MistakeCategory,
} from '@/lib/mental-performance/types';
import { RoutinePlayer } from './RoutinePlayer';
import { CrisisSupportNotice } from './CrisisSupportNotice';
import { SafetyDisclaimer } from './SafetyDisclaimer';

export interface CoachSeed {
  mistake?: MistakeCategory | null;
  emotion?: EmotionalState | null;
  mode?: CoachMode;
}

export function MentalCoach({ seed }: { seed?: CoachSeed }) {
  const mp = useMentalPerformance();
  const sport = mp.activeSport;

  const [mistake, setMistake] = useState<MistakeCategory | ''>(seed?.mistake ?? '');
  const [emotion, setEmotion] = useState<EmotionalState | ''>(seed?.emotion ?? '');
  const [freeText, setFreeText] = useState('');
  const [response, setResponse] = useState<CoachResponse | null>(null);
  const [saved, setSaved] = useState(false);

  // Mistakes relevant to the active sport family (+ universal "any").
  const mistakes = useMemo(() => {
    const fam = sportFamilyFor(sport);
    return MISTAKE_CATEGORIES.filter((m) => m.sportFamily === fam || m.sportFamily === 'any');
  }, [sport]);

  const run = () => {
    const r = buildCoachResponse(
      {
        sport,
        mistake: mistake || null,
        emotion: emotion || null,
        freeText: freeText.trim() || undefined,
        mode: seed?.mode ?? 'reset',
      },
      mp.state.profile,
    );
    setResponse(r);
    setSaved(false);
    if (mistake) mp.setSettings({ lastSituation: mistake });
    if (r.kind === 'coaching') {
      // Anonymized, opt-in only (no-ops without consent/provider).
      emitMentalEvent(
        mentalEvent.coachReset({
          sport, emotion: emotion || null, mistake: mistake || null,
          errorClass: r.errorClass, routineId: r.routine?.id ?? null,
        }),
        mp.state.settings,
      );
    }
  };

  const reset = () => { setResponse(null); setSaved(false); };

  const saveToJournal = () => {
    if (!response || response.kind !== 'coaching') return;
    const ok = mp.saveLog({
      sport,
      sessionType: null,
      mistake: mistake || null,
      emotion: emotion || null,
      intensity: null,
      recoverySpeed: null,
      whatIDidNext: '',
      whatWorked: '',
      whatDidnt: '',
      nextTimeCue: response.selfTalk,
      confidence: null,
      focus: null,
      composure: null,
      routineUsed: response.routine?.id ?? null,
      effectiveness: null,
      reflection: freeText.trim(),
    });
    setSaved(ok);
  };

  // ── Safety paths ──
  if (response && response.kind !== 'coaching' && response.safety) {
    return (
      <div className="space-y-4">
        <CrisisSupportNotice referral={response.safety} />
        <Button variant="ghost" size="sm" onClick={reset}><RefreshCw size={15} /> Start over</Button>
      </div>
    );
  }

  // ── Result ──
  if (response && response.kind === 'coaching') {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles size={18} aria-hidden="true" />
            <span className="text-sm font-semibold uppercase tracking-wide">Your reset</span>
          </div>
          <p className="mt-2 text-foreground">{response.whatHappened}</p>
        </div>

        {response.routine && (
          <RoutinePlayer
            routine={response.routine}
            onComplete={(routineId) =>
              emitMentalEvent(mentalEvent.routineCompleted({ sport, routineId }), mp.state.settings)
            }
          />
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next-action cue</div>
            <p className="mt-1 text-foreground">{response.nextActionCue}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Say to yourself</div>
            <p className="mt-1 font-medium text-primary">“{response.selfTalk}”</p>
          </div>
          {response.drill && (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Dumbbell size={13} aria-hidden="true" /> Train it
              </div>
              <p className="mt-1 font-medium text-foreground">{response.drill.name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{response.drill.how}</p>
            </div>
          )}
          {response.visualization && (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Eye size={13} aria-hidden="true" /> Visualize
              </div>
              <p className="mt-1 text-foreground">{response.visualization}</p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reflect &amp; keep training</div>
          <p className="mt-1 text-foreground">{response.reflectionPrompt}</p>
          <p className="mt-2 text-sm text-muted-foreground">{response.futureTraining}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={reset}><RefreshCw size={15} /> Another reset</Button>
          {mp.storeLogs ? (
            <Button variant="ghost" size="sm" onClick={saveToJournal} disabled={saved}>
              <NotebookPen size={15} /> {saved ? 'Saved to journal' : 'Save to journal'}
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">Turn on journaling in the Journal tab to save reflections.</span>
          )}
        </div>
        <SafetyDisclaimer variant="short" />
      </div>
    );
  }

  // ── Input form ──
  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-semibold text-foreground">What happened?</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {mistakes.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMistake((cur) => (cur === m.id ? '' : m.id))}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                mistake === m.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground hover:border-primary'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-foreground">How are you feeling?</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {EMOTIONAL_STATES.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setEmotion((cur) => (cur === e.id ? '' : e.id))}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                emotion === e.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground hover:border-primary'
              }`}
            >
              <span aria-hidden="true">{e.emoji}</span> {e.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="mp-free" className="text-sm font-semibold text-foreground">
          Anything else? <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="mp-free"
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          rows={2}
          placeholder="A sentence about the moment…"
          className="mt-2 w-full rounded-xl border border-border bg-card p-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
        />
      </div>

      <Button onClick={run} size="lg" className="w-full">
        <Sparkles size={18} /> Get my reset
      </Button>
      <SafetyDisclaimer variant="short" />
    </div>
  );
}
