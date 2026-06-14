'use client';

// ============================================================
// SwingVantage — Athletic Journey: rating & inputs panel
// ------------------------------------------------------------
// OPTIONAL rating entry (golf handicap / UTR / USTA-NTRP) plus a few
// quick inputs (typical score, logged rounds/matches). Ratings are
// never required, always labeled by source, and never presented as
// verified unless the source says so.
// ============================================================

import { useState } from 'react';
import { Save, Trash2, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { SportId } from '@swingiq/core';
import {
  normalizeRatingValue,
  RATING_SOURCE_LABEL,
  type RatingSource,
  type RatingType,
} from '@/lib/athletic-journey';
import {
  upsertRating,
  removeRating,
  setProfileExtra,
  useJourneyStoreData,
} from '@/lib/athletic-journey/store';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';

const SOURCES: RatingSource[] = ['self_reported', 'coach_entered', 'imported', 'verified'];

function RatingField({
  sport,
  type,
  label,
  hint,
  placeholder,
}: {
  sport: SportId;
  type: RatingType;
  label: string;
  hint: string;
  placeholder: string;
}) {
  const store = useJourneyStoreData();
  const existing = store.ratings.find((r) => r.sport === sport && r.ratingType === type);
  const [value, setValue] = useState(existing ? String(existing.value) : '');
  const [source, setSource] = useState<RatingSource>(existing?.source ?? 'self_reported');
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const num = Number(value);
    const valid = value.trim() !== '' ? normalizeRatingValue(type, num) : null;
    if (valid === null) {
      setError(`Enter a valid ${label.toLowerCase()}.`);
      return;
    }
    setError(null);
    upsertRating({ sport, ratingType: type, value: valid, source, dateRecorded: new Date().toISOString() });
    track(type === 'golf_handicap' ? ANALYTICS_EVENTS.JOURNEY_HANDICAP_ADDED : ANALYTICS_EVENTS.JOURNEY_RATING_ADDED, {
      sport, rating_type: type, source,
    });
  };

  return (
    <div className="rounded-theme border border-border p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <Badge variant="default">Optional</Badge>
      </div>
      <p className="text-2xs text-muted-foreground">{hint}</p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          className="w-24 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-ring"
        />
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as RatingSource)}
          className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs focus:outline-hidden focus:ring-2 focus:ring-ring"
          aria-label="Rating source"
        >
          {SOURCES.map((s) => (
            <option key={s} value={s}>{RATING_SOURCE_LABEL[s]}</option>
          ))}
        </select>
        <Button size="sm" variant="outline" onClick={save}>
          <Save size={14} aria-hidden="true" /> Save
        </Button>
        {existing && (
          <button
            type="button"
            onClick={() => { removeRating(sport, type); setValue(''); }}
            className="text-muted-foreground hover:text-error"
            aria-label={`Remove ${label}`}
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        )}
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
      {existing && !error && (
        <p className="text-2xs text-muted-foreground">
          Current: <span className="font-medium text-foreground">{existing.value}</span> · {RATING_SOURCE_LABEL[existing.source]}
        </p>
      )}
    </div>
  );
}

function QuickNumber({
  sport,
  field,
  label,
  hint,
  placeholder,
}: {
  sport: SportId;
  field: 'typicalScore' | 'loggedCompetitions';
  label: string;
  hint: string;
  placeholder: string;
}) {
  const store = useJourneyStoreData();
  const current = store.profileExtras[sport]?.[field];
  const [value, setValue] = useState(current != null ? String(current) : '');

  return (
    <div className="rounded-theme border border-border p-3 space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <p className="text-2xs text-muted-foreground">{hint}</p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          className="w-24 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-ring"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const n = value.trim() === '' ? null : Number(value);
            setProfileExtra(sport, { [field]: n == null || Number.isNaN(n) ? null : n });
          }}
        >
          <Save size={14} aria-hidden="true" /> Save
        </Button>
      </div>
    </div>
  );
}

export function RatingPanel({ sport }: { sport: SportId }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-theme border border-accent-secondary/30 bg-accent-secondary/10 p-2.5">
        <Info size={15} className="mt-0.5 shrink-0 text-accent-secondary" aria-hidden="true" />
        <p className="text-xs text-foreground leading-relaxed">
          Ratings are <span className="font-medium">optional</span>. SwingVantage uses them as one
          guidepost among many — your journey works fine without them.
        </p>
      </div>

      {sport === 'golf' ? (
        <>
          <RatingField sport={sport} type="golf_handicap" label="USGA Handicap Index" hint="Plus handicaps use a minus sign (e.g. +2 = -2). Max index 54.0." placeholder="14.0" />
          <QuickNumber sport={sport} field="typicalScore" label="Typical 18-hole score" hint="A quick anchor when you have no handicap." placeholder="92" />
          <QuickNumber sport={sport} field="loggedCompetitions" label="Rounds logged recently" hint="More logged rounds sharpen your scoring read." placeholder="3" />
        </>
      ) : (
        <>
          <RatingField sport={sport} type="utr" label="UTR" hint="Universal Tennis Rating, 1.00–16.50." placeholder="6.50" />
          <RatingField sport={sport} type="ntrp" label="USTA / NTRP" hint="USTA rating, 1.5–7.0." placeholder="4.0" />
          <QuickNumber sport={sport} field="loggedCompetitions" label="Matches logged recently" hint="More logged matches sharpen your results read." placeholder="3" />
        </>
      )}
    </div>
  );
}
