'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardBody } from '@/components/ui/Card';
import { History, X } from 'lucide-react';
import { getSavedAngles, removeSavedAngle, type SavedAngle } from '@/lib/record-assist/saved-angles';
import { getPreset } from '@/lib/record-assist/engines/sport-preset-engine';
import { RECORD_ASSIST_SPORT_META } from '@/lib/record-assist/sports';

export interface SavedAnglesCardProps {
  onRetest: (angle: SavedAngle) => void;
  className?: string;
}

/**
 * "Record the same angle again" — lists saved camera angles so a retest is
 * captured from the same setup as the original (the comparison stays fair).
 * Reads after mount to avoid an SSR/hydration mismatch on localStorage.
 */
export function SavedAnglesCard({ onRetest, className }: SavedAnglesCardProps) {
  const [angles, setAngles] = useState<SavedAngle[]>([]);

  useEffect(() => {
    setAngles(getSavedAngles());
  }, []);

  if (angles.length === 0) return null;

  return (
    <Card className={className}>
      <CardBody className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-primary/15 p-1.5 text-primary">
            <History className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Record the same angle again</h3>
            <p className="text-xs text-muted-foreground">Retest from a setup you’ve saved before.</p>
          </div>
        </div>
        <ul className="space-y-2">
          {angles.map((a) => {
            const meta = RECORD_ASSIST_SPORT_META[a.sport];
            const preset = getPreset(a.sport, a.action);
            return (
              <li key={`${a.sport}-${a.action}`} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onRetest(a)}
                  className={cn(
                    'flex flex-1 items-center gap-2 rounded-xl border border-border bg-card p-2.5 text-left',
                    'hover:border-border/80 hover:bg-muted tap-target',
                  )}
                >
                  <span className="text-lg" aria-hidden>{meta?.emoji}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">
                      {meta?.name} · {preset?.label ?? a.action}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {a.view.replace(/_/g, ' ')} · {a.orientation}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`Remove saved ${meta?.name} ${preset?.label ?? a.action} angle`}
                  onClick={() => setAngles(removeSavedAngle(a.sport, a.action))}
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground tap-target"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      </CardBody>
    </Card>
  );
}
