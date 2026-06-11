'use client';

import { cn } from '@/lib/utils';

interface DrillCardProps {
  /** Drill number — renders a "DRILL n" label. */
  n?: number;
  name: string;
  /** Rep prescription, e.g. "3×10 swings". */
  reps?: string;
  how?: string;
  done?: boolean;
  /** Presence makes the card checkable (44px target). */
  onToggle?: (next: boolean) => void;
  /** Document-surface ink palette (use inside the report paper). @default false */
  onPaper?: boolean;
  className?: string;
}

/**
 * Drill prescription card: number, name, reps, how-to, and an optional 44px
 * done-toggle. `onPaper` switches the ink to the document surface so it reads
 * on the light report sheet; otherwise it uses theme ink.
 */
export function DrillCard({
  n,
  name,
  reps,
  how,
  done = false,
  onToggle,
  onPaper = false,
  className,
}: DrillCardProps) {
  const interactive = typeof onToggle === 'function';
  const ink = onPaper ? 'text-document-fg' : 'text-foreground';
  const muted = onPaper ? 'text-document-fg/70' : 'text-muted-foreground';
  const accent = onPaper ? 'text-document-accent' : 'text-link';
  const restBorder = onPaper ? 'border-document-fg/15' : 'border-border';

  return (
    <div
      className={cn(
        'flex items-start gap-3.5 rounded-xl border p-3.5 transition-colors',
        done ? 'border-success/40 bg-success/[0.07]' : cn(restBorder, 'bg-transparent'),
        className,
      )}
    >
      {interactive && (
        <button
          type="button"
          aria-pressed={done}
          aria-label={done ? `Mark "${name}" not done` : `Mark "${name}" done`}
          onClick={() => onToggle!(!done)}
          className="-m-2.5 -mr-1 flex h-11 w-11 flex-shrink-0 items-center justify-center"
        >
          <span
            className={cn(
              'flex h-[22px] w-[22px] items-center justify-center rounded-full text-[13px] font-extrabold',
              done ? 'bg-success text-success-foreground' : cn('border-2 bg-transparent', restBorder),
            )}
          >
            {done ? '✓' : ''}
          </span>
        </button>
      )}
      <div className="flex-1">
        <p className={cn('text-sm font-semibold', ink, done && 'line-through opacity-70')}>
          {typeof n === 'number' && (
            <span className={cn('mr-2 text-[11px] font-bold tracking-[0.05em]', accent)}>DRILL {n}</span>
          )}
          {name}
          {reps && <span className={cn('font-normal', muted)}> · {reps}</span>}
        </p>
        {how && <p className={cn('mt-1 text-[13px] leading-relaxed', muted)}>{how}</p>}
      </div>
    </div>
  );
}
