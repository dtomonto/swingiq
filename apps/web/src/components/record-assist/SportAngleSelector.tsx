'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { actionsForSport } from '@/lib/record-assist/engines/sport-preset-engine';
import { RECORD_ASSIST_SPORT_META } from '@/lib/record-assist/sports';
import type { RecordAssistSport, SportActionId } from '@/lib/record-assist/types';

const SPORT_ORDER: RecordAssistSport[] = ['golf', 'tennis', 'baseball', 'softball', 'pickleball', 'padel'];

export interface SportAngleSelectorProps {
  sport: RecordAssistSport;
  action: SportActionId | null;
  onSportChange: (sport: RecordAssistSport) => void;
  onActionChange: (action: SportActionId) => void;
  className?: string;
}

/** Sport + action picker. Sport-specialized while staying one SwingVantage. */
export function SportAngleSelector({
  sport, action, onSportChange, onActionChange, className,
}: SportAngleSelectorProps) {
  const actions = actionsForSport(sport);

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">Sport</h3>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {SPORT_ORDER.map((id) => {
            const meta = RECORD_ASSIST_SPORT_META[id];
            const selected = sport === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={selected}
                onClick={() => onSportChange(id)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium transition-colors tap-target',
                  selected
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground',
                )}
                style={selected ? { borderColor: `hsl(var(${meta.accentVar}))` } : undefined}
              >
                <span className="text-xl" aria-hidden>{meta.emoji}</span>
                {meta.name}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">Shot / action</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {actions.map((p) => {
            const selected = action === p.action;
            return (
              <button
                key={p.action}
                type="button"
                aria-pressed={selected}
                onClick={() => onActionChange(p.action)}
                className={cn(
                  'flex items-start justify-between gap-2 rounded-xl border p-3 text-left transition-colors tap-target',
                  selected
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:border-border/80',
                )}
              >
                <span>
                  <span className="block text-sm font-semibold text-foreground">{p.label}</span>
                  <span className="block text-xs text-muted-foreground">{p.hint}</span>
                </span>
                {selected && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
