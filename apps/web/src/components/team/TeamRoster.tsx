'use client';

// ============================================================
// SwingVantage — TeamOS: roster editor
// ------------------------------------------------------------
// Add athletes, set their cross-sport capability scores (0–100), and
// see each athlete's biggest opportunity. All local-first.
// ============================================================

import { useState } from 'react';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CAPABILITIES } from '@/lib/agi';
import { useTeam, WEAK_THRESHOLD } from '@/lib/team';
import type { SportId } from '@swingiq/core';
import type { AthleteFocus, TeamAthlete } from '@/lib/team';

const SPORTS: { id: SportId; label: string }[] = [
  { id: 'golf', label: 'Golf' },
  { id: 'tennis', label: 'Tennis' },
  { id: 'pickleball', label: 'Pickleball' },
  { id: 'padel', label: 'Padel' },
  { id: 'baseball', label: 'Baseball' },
  { id: 'softball_slow', label: 'Softball (slow)' },
  { id: 'softball_fast', label: 'Softball (fast)' },
];

export function TeamRoster() {
  const { state, pulse, addAthlete, setScore, removeAthlete } = useTeam();
  const [name, setName] = useState('');
  const [sport, setSport] = useState<SportId>('golf');

  const focusById = new Map<string, AthleteFocus>(pulse.rosterFocus.map((f) => [f.athleteId, f]));

  const onAdd = () => {
    if (!name.trim()) return;
    addAthlete(name, sport);
    setName('');
  };

  return (
    <div className="space-y-4">
      {/* Add athlete */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="mb-2 text-sm font-semibold text-foreground">Add an athlete</p>
        <div className="flex flex-wrap gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAdd()}
            placeholder="Athlete name"
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          <select
            value={sport}
            onChange={(e) => setSport(e.target.value as SportId)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            {SPORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <Button onClick={onAdd}><Plus size={15} /> Add</Button>
        </div>
      </div>

      {state.athletes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
          <p className="text-sm font-medium text-foreground">No athletes yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add your roster and set capability scores to see the team’s shared focus.
          </p>
        </div>
      ) : (
        state.athletes.map((a) => (
          <AthleteRow
            key={a.id}
            athlete={a}
            focus={focusById.get(a.id) ?? null}
            onScore={(cap, v) => setScore(a.id, cap, v)}
            onRemove={() => removeAthlete(a.id)}
          />
        ))
      )}
    </div>
  );
}

function AthleteRow({
  athlete, focus, onScore, onRemove,
}: {
  athlete: TeamAthlete;
  focus: AthleteFocus | null;
  onScore: (cap: (typeof CAPABILITIES)[number]['id'], v: number | null) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex flex-1 items-center gap-2 text-left">
          <ChevronDown size={16} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''} text-muted-foreground`} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{athlete.name}</p>
            <p className="text-xs text-muted-foreground">
              {focus?.focus
                ? <>Focus: <span className="text-foreground">{focus.focus.name}</span> ({focus.focus.score}/100)</>
                : 'No scores yet'}
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${athlete.name}`}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-error/10 hover:text-error"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          {CAPABILITIES.map((cap) => {
            const score = athlete.scores[cap.id];
            const weak = typeof score === 'number' && score < WEAK_THRESHOLD;
            return (
              <div key={cap.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{cap.name}</span>
                  <span className={weak ? 'font-semibold text-warning' : 'text-muted-foreground'}>
                    {typeof score === 'number' ? `${score}/100` : '—'}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={typeof score === 'number' ? score : 50}
                  onChange={(e) => onScore(cap.id, Number(e.target.value))}
                  className="mt-1 w-full accent-primary"
                  aria-label={`${cap.name} score for ${athlete.name}`}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
