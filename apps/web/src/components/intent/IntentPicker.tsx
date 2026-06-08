'use client';

// ============================================================
// SwingVantage — Intent Picker (the low-cognition front door)
// ------------------------------------------------------------
// "What do you want to improve today?" — one question at the top of the
// dashboard that lets the athlete switch sport and jump straight into the
// existing flow (analyze / import / progress), instead of scanning the full
// feature grid. Reuses SportContext for sport state and the canonical routes
// from lib/intent. The full dashboard renders right below it.
// ============================================================
import Link from 'next/link';
import { Video, Upload, TrendingUp, ArrowRight } from 'lucide-react';
import { useSport, SPORT_DISPLAY } from '@/contexts/SportContext';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';
import { IMPROVE_INTENTS, type ImproveIntent } from '@/lib/intent/intents';
import { cn } from '@/lib/utils';
import type { SportId } from '@swingiq/core';

const ICONS = { video: Video, upload: Upload, trending: TrendingUp } as const;
const ALL_SPORTS = Object.keys(SPORT_DISPLAY) as SportId[];

export function IntentPicker() {
  const { activeSport, setActiveSport, selectedSports, addSport, sportName } = useSport();
  const addable = ALL_SPORTS.filter((s) => !selectedSports.includes(s));

  const pickSport = (id: SportId) => {
    if (id === activeSport) return;
    setActiveSport(id);
    track(ANALYTICS_EVENTS.SPORT_SELECTED, { sport: id, context: 'intent_picker' });
  };

  const addAndPick = (id: SportId) => {
    addSport(id);
    setActiveSport(id);
    track(ANALYTICS_EVENTS.SPORT_SELECTED, { sport: id, context: 'intent_picker_add' });
  };

  const onIntent = (intent: ImproveIntent) => {
    track(ANALYTICS_EVENTS.CTA_CLICKED, {
      label: `intent_${intent.id}`,
      location: 'intent_picker',
      sport: activeSport,
    });
  };

  return (
    <section className="px-4 sm:px-6 pt-6 max-w-5xl mx-auto" aria-label="What do you want to improve today?">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-lg font-bold text-foreground">What do you want to improve today?</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Pick your sport, then jump straight in. Your full dashboard is right below.
        </p>

        {/* Sport chips — switch the active sport in one tap */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {selectedSports.map((s) => {
            const d = SPORT_DISPLAY[s];
            const active = s === activeSport;
            return (
              <button
                key={s}
                type="button"
                onClick={() => pickSport(s)}
                aria-pressed={active}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40',
                )}
              >
                <span aria-hidden="true">{d.emoji}</span>
                {d.name}
              </button>
            );
          })}

          {addable.length > 0 && (
            <details className="relative">
              <summary className="list-none cursor-pointer inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">
                + Add a sport
              </summary>
              <div className="absolute z-10 mt-1 flex flex-col gap-0.5 rounded-lg border border-border bg-card p-2 shadow-md w-56">
                {addable.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addAndPick(s)}
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-foreground hover:bg-muted text-left"
                  >
                    <span aria-hidden="true">{SPORT_DISPLAY[s].emoji}</span>
                    {SPORT_DISPLAY[s].name}
                  </button>
                ))}
              </div>
            </details>
          )}
        </div>

        {/* Intent actions — route into the existing flow for the active sport */}
        <div className="grid gap-2 sm:grid-cols-3 mt-4">
          {IMPROVE_INTENTS.map((intent) => {
            const Icon = ICONS[intent.icon];
            return (
              <Link
                key={intent.id}
                href={intent.href}
                onClick={() => onIntent(intent)}
                className="group flex flex-col rounded-xl border border-border p-3 transition-colors hover:border-primary hover:bg-primary/5 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
                  {intent.label}
                </span>
                <span className="text-xs text-muted-foreground mt-1 grow">{intent.description}</span>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  {sportName}
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
