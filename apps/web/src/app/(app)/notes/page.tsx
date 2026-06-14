'use client';

// ============================================================
// SwingVantage — Daily Notes ("How did you play today?")
// ------------------------------------------------------------
// A fast, sport-neutral place to log how a round / match / game /
// practice went. Pick a feel, jot what happened, and we honestly
// pull faults out of your own words — then feed them into your
// Athlete GI player profile so the picture sharpens every day,
// no launch monitor or video required.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  NotebookPen,
  Trash2,
  Sparkles,
  CheckCircle2,
  X,
  BrainCircuit,
  CalendarDays,
} from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useSport, SPORT_DISPLAY } from '@/contexts/SportContext';
import { useSwingVantageStore } from '@/store';
import {
  extractFaultsFromText,
  feelEmoji,
  summarizeNote,
  takePendingFeel,
  todayISODate,
  FEEL_LABELS,
  FEEL_HINTS,
  type PlayFeel,
  type ExtractedFault,
} from '@/lib/dailyNotes';
import type { SportId } from '@swingiq/core';

const FEELS: PlayFeel[] = [1, 2, 3, 4, 5];

export default function DailyNotesPage() {
  const { activeSport, selectedSports } = useSport();
  const dailyNotes = useSwingVantageStore((s) => s.dailyNotes);
  const addDailyNote = useSwingVantageStore((s) => s.addDailyNote);
  const removeDailyNote = useSwingVantageStore((s) => s.removeDailyNote);

  // ── Capture form state ──
  const [sport, setSport] = useState<SportId>(activeSport);
  const [date, setDate] = useState(todayISODate());
  const [feel, setFeel] = useState<PlayFeel | null>(null);
  const [context, setContext] = useState('');
  const [text, setText] = useState('');
  const [removedFaultIds, setRemovedFaultIds] = useState<Set<string>>(new Set());
  const [justSaved, setJustSaved] = useState(false);

  // One-tap handoff from the dashboard prompt: prefill the feel they picked.
  useEffect(() => {
    const pending = takePendingFeel();
    if (pending) setFeel(pending);
  }, []);

  // Live, honest fault detection from the user's own words.
  const detected = useMemo(() => extractFaultsFromText(text, sport), [text, sport]);
  const faults: ExtractedFault[] = useMemo(
    () => detected.filter((f) => !removedFaultIds.has(f.id)),
    [detected, removedFaultIds],
  );

  const canSave = feel !== null;

  const resetForm = () => {
    setFeel(null);
    setContext('');
    setText('');
    setRemovedFaultIds(new Set());
  };

  const handleSave = () => {
    if (feel === null) return;
    addDailyNote({ date, sport, feel, text: text.trim(), faults, context: context.trim() });
    resetForm();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2600);
  };

  const dismissFault = (id: string) =>
    setRemovedFaultIds((prev) => new Set(prev).add(id));

  const sportLabel = (s: SportId) => SPORT_DISPLAY[s]?.name ?? s;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
          <NotebookPen size={20} className="text-primary" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Daily Notes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            How did you play today? A quick note after any round, match, game, or practice —
            we&apos;ll pull the faults from your own words and add them to your AI player profile.
          </p>
        </div>
      </div>

      {/* Capture card */}
      <Card>
        <CardBody className="space-y-5">
          {/* Sport + date */}
          <div className="flex flex-wrap items-end gap-4">
            {selectedSports.length > 1 && (
              <div>
                <span className="block text-xs font-medium text-muted-foreground mb-1.5">Sport</span>
                <div role="group" aria-label="Sport" className="flex flex-wrap gap-1.5">
                  {selectedSports.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSport(s)}
                      className={
                        'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ' +
                        (sport === s
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card text-foreground border-border hover:bg-muted')
                      }
                    >
                      <span className="mr-1" aria-hidden="true">{SPORT_DISPLAY[s]?.emoji}</span>
                      {sportLabel(s)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label htmlFor="note-date" className="block text-xs font-medium text-muted-foreground mb-1.5">
                Date
              </label>
              <input
                id="note-date"
                type="date"
                value={date}
                max={todayISODate()}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Feel — the "how did you play today?" answer */}
          <div>
            <span className="block text-sm font-medium text-foreground mb-2">
              How did you play today? <span className="text-error">*</span>
            </span>
            <div role="group" aria-label="How did you play today?" className="grid grid-cols-5 gap-2">
              {FEELS.map((f) => {
                const selected = feel === f;
                return (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setFeel(f)}
                    className={
                      'flex flex-col items-center gap-1 rounded-lg border px-2 py-3 transition-colors text-center ' +
                      (selected
                        ? 'border-primary bg-primary/10 ring-1 ring-primary'
                        : 'border-border bg-card hover:bg-muted')
                    }
                  >
                    <span className="text-2xl" aria-hidden="true">{feelEmoji(f)}</span>
                    <span className="text-xs font-semibold text-foreground leading-tight">{FEEL_LABELS[f]}</span>
                    <span className="hidden sm:block text-3xs text-muted-foreground leading-tight">{FEEL_HINTS[f]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Context (optional) */}
          <div>
            <label htmlFor="note-context" className="block text-xs font-medium text-muted-foreground mb-1.5">
              Where / what? <span className="font-normal">(optional)</span>
            </label>
            <input
              id="note-context"
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. 18 holes at Pine Ridge · range session · match vs. Sam"
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Free text */}
          <div>
            <label htmlFor="note-text" className="block text-xs font-medium text-muted-foreground mb-1.5">
              What happened? What felt off, what worked? <span className="font-normal">(optional)</span>
            </label>
            <textarea
              id="note-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="Type like you'd tell a friend — e.g. &quot;Sliced it off the tee most of the day and topped a couple irons. Putting felt great.&quot;"
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring resize-y"
            />
          </div>

          {/* Live-detected faults */}
          {faults.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles size={14} className="text-primary" aria-hidden="true" />
                <p className="text-xs font-semibold text-foreground">
                  Detected from your notes — these get added to your profile
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {faults.map((f) => (
                  <span
                    key={f.id}
                    className="inline-flex items-center gap-1 rounded-full bg-card border border-border pl-2.5 pr-1 py-0.5 text-xs font-medium text-foreground"
                  >
                    {f.label}
                    {f.curated && (
                      <span className="text-3xs text-primary" title="Linked to a known fault with retest guidance">★</span>
                    )}
                    <button
                      type="button"
                      onClick={() => dismissFault(f.id)}
                      aria-label={`Remove ${f.label}`}
                      className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <p className="text-2xs text-muted-foreground mt-2 leading-relaxed">
                These are read straight from your words, not measured. Remove anything that doesn&apos;t fit —
                ★ means it links to a known fault with retest guidance.
              </p>
            </div>
          )}

          {/* Save */}
          <div className="flex items-center gap-3 pt-1">
            <Button onClick={handleSave} disabled={!canSave}>
              <NotebookPen size={16} aria-hidden="true" />
              Save note
            </Button>
            {!canSave && (
              <span className="text-xs text-muted-foreground">Pick how you played to save.</span>
            )}
            {justSaved && (
              <span className="inline-flex items-center gap-1 text-sm text-success font-medium">
                <CheckCircle2 size={16} aria-hidden="true" />
                Saved — added to your profile
              </span>
            )}
          </div>
        </CardBody>
      </Card>

      {/* What this does */}
      <Card className="bg-accent-secondary/5 border-accent-secondary/20">
        <CardBody className="flex items-start gap-3">
          <BrainCircuit size={20} className="text-accent-secondary shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm text-foreground">
            <p className="font-semibold">How this builds your profile</p>
            <p className="text-muted-foreground mt-1 leading-relaxed">
              Each note is saved to your profile and counts as a low-confidence self-report.
              When the same fault shows up across several days, your{' '}
              <Link href="/agi" className="text-primary font-medium hover:underline">Athlete GI</Link>{' '}
              profile flags it as a recurring pattern worth a dedicated fix — across every sport you track.
              You can export or delete everything anytime from the{' '}
              <Link href="/data" className="text-primary font-medium hover:underline">Data Center</Link>.
            </p>
          </div>
        </CardBody>
      </Card>

      {/* History */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Recent notes {dailyNotes.length > 0 && <span className="text-muted-foreground font-normal">({dailyNotes.length})</span>}
        </h2>
        {dailyNotes.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                icon={CalendarDays}
                title="No notes yet"
                description="After your next round, match, game, or practice, drop a quick note above. It only takes a few seconds and your profile gets sharper every time."
              />
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {dailyNotes.map((n) => (
              <Card key={n.id}>
                <CardBody className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl" aria-hidden="true">{feelEmoji(n.feel)}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {SPORT_DISPLAY[n.sport]?.emoji} {FEEL_LABELS[n.feel]}
                          {n.context && <span className="font-normal text-muted-foreground"> · {n.context}</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{n.date}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDailyNote(n.id)}
                      aria-label="Delete note"
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-error/10 hover:text-error transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {n.text && <p className="text-sm text-foreground/90 leading-relaxed">{n.text}</p>}

                  {n.faults.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {n.faults.map((f) => (
                        <Badge key={f.id} variant="warning">{f.label}</Badge>
                      ))}
                    </div>
                  )}

                  {!n.text && n.faults.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">{summarizeNote(n)}</p>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
