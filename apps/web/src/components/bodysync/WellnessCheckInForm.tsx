'use client';

import { useState } from 'react';
import { Check, Moon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { saveCheckin, todayKey, BODY_REGIONS } from '@/lib/bodysync';
import type { ManualCheckin, BodyRegion } from '@/lib/bodysync';

interface Props {
  today: ManualCheckin | null;
  onSaved?: () => void;
}

// A parent-friendly 1–5 (or 0–5) segmented picker.
function Scale({
  label, leftLabel, rightLabel, value, onChange, min = 1, max = 5,
}: {
  label: string; leftLabel: string; rightLabel: string;
  value: number | null; onChange: (v: number) => void; min?: number; max?: number;
}) {
  const opts = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="mt-1.5 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${opts.length}, minmax(0, 1fr))` }}>
        {opts.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            aria-pressed={value === o}
            className={`h-10 rounded-lg text-sm font-semibold transition-colors ${
              value === o
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/70'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{leftLabel}</span><span>{rightLabel}</span>
      </div>
    </div>
  );
}

function Toggle({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        on ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'
      }`}
    >
      {label}
    </button>
  );
}

export function WellnessCheckInForm({ today, onSaved }: Props) {
  const [sleepHours, setSleepHours] = useState<string>(today?.sleepHours != null ? String(today.sleepHours) : '');
  const [sleepQuality, setSleepQuality] = useState<number | null>(today?.sleepQuality ?? null);
  const [energy, setEnergy] = useState<number | null>(today?.energy ?? null);
  const [soreness, setSoreness] = useState<number | null>(today?.soreness ?? null);
  const [pain, setPain] = useState<number | null>(today?.pain ?? null);
  const [painAreas, setPainAreas] = useState<BodyRegion[]>(today?.painAreas ?? []);
  const [stress, setStress] = useState<number | null>(today?.stress ?? null);
  const [hydration, setHydration] = useState<number | null>(today?.hydration ?? null);
  const [mentalFocus, setMentalFocus] = useState<number | null>(today?.mentalFocus ?? null);
  const [warmupQuality, setWarmupQuality] = useState<number | null>(today?.warmupQuality ?? null);
  const [practiceIntensity, setPracticeIntensity] = useState<number | null>(today?.practiceIntensity ?? null);
  const [illness, setIllness] = useState(today?.illness ?? false);
  const [travelFatigue, setTravelFatigue] = useState(today?.travelFatigue ?? false);
  const [alcohol, setAlcohol] = useState(today?.alcohol ?? false);
  const [notes, setNotes] = useState(today?.notes ?? '');
  const [saved, setSaved] = useState(false);

  const toggleRegion = (r: BodyRegion) =>
    setPainAreas((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  const handleSave = () => {
    const hours = sleepHours.trim() === '' ? null : Math.max(0, Math.min(16, Number(sleepHours)));
    saveCheckin({
      date: todayKey(),
      sleepHours: Number.isFinite(hours as number) ? hours : null,
      sleepQuality, energy, soreness, pain,
      painAreas: (pain ?? 0) >= 2 ? painAreas : [],
      stress, hydration, mentalFocus, warmupQuality, practiceIntensity,
      illness, travelFatigue, alcohol, notes: notes.trim(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    onSaved?.();
  };

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-5">
      <div>
        <h3 className="text-sm font-bold text-foreground">Daily check-in</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          A 30-second read on how your body feels today. Answer what you like — more detail sharpens the guidance.
        </p>
      </div>

      <div className="flex items-end gap-2">
        <Moon size={18} className="mb-2 text-muted-foreground" aria-hidden="true" />
        <label className="flex-1">
          <span className="text-sm font-medium text-foreground">Hours of sleep</span>
          <input
            type="number" inputMode="decimal" min={0} max={16} step={0.5}
            value={sleepHours} onChange={(e) => setSleepHours(e.target.value)}
            placeholder="e.g. 7.5"
            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-hidden focus:ring-2 focus:ring-ring"
          />
        </label>
      </div>

      <Scale label="Sleep quality" leftLabel="Poor" rightLabel="Great" value={sleepQuality} onChange={setSleepQuality} />
      <Scale label="Energy" leftLabel="Drained" rightLabel="Energized" value={energy} onChange={setEnergy} />
      <Scale label="Soreness" leftLabel="None" rightLabel="Very sore" value={soreness} onChange={setSoreness} />
      <Scale label="Pain" leftLabel="None" rightLabel="Severe" value={pain} onChange={setPain} />

      {(pain ?? 0) >= 2 && (
        <div>
          <p className="text-sm font-medium text-foreground">Where? (optional)</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {BODY_REGIONS.map((r) => (
              <Toggle key={r.id} label={r.label} on={painAreas.includes(r.id)} onToggle={() => toggleRegion(r.id)} />
            ))}
          </div>
        </div>
      )}

      <Scale label="Stress" leftLabel="Calm" rightLabel="Very stressed" value={stress} onChange={setStress} />
      <Scale label="Hydration" leftLabel="Low" rightLabel="Great" value={hydration} onChange={setHydration} />
      <Scale label="Mental focus" leftLabel="Foggy" rightLabel="Sharp" value={mentalFocus} onChange={setMentalFocus} />
      <Scale label="Planned practice intensity" leftLabel="Rest" rightLabel="Max" value={practiceIntensity} onChange={setPracticeIntensity} min={0} max={5} />
      <Scale label="Warm-up quality (if you practiced)" leftLabel="Skipped" rightLabel="Thorough" value={warmupQuality} onChange={setWarmupQuality} />

      <div>
        <p className="text-sm font-medium text-foreground">Anything else?</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <Toggle label="🤒 Feeling ill" on={illness} onToggle={() => setIllness((v) => !v)} />
          <Toggle label="✈️ Travel fatigue" on={travelFatigue} onToggle={() => setTravelFatigue((v) => !v)} />
          <Toggle label="🍺 Alcohol" on={alcohol} onToggle={() => setAlcohol((v) => !v)} />
        </div>
      </div>

      <textarea
        value={notes} onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional) — anything affecting how you feel today"
        rows={2}
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-hidden focus:ring-2 focus:ring-ring"
      />

      <Button onClick={handleSave} className="w-full" size="lg">
        {saved ? <><Check size={16} /> Saved — guidance updated</> : 'Save today’s check-in'}
      </Button>
    </div>
  );
}
