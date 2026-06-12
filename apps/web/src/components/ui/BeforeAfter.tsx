import { cn } from '@/lib/utils';

interface BeforeAfterProps {
  label: string;
  before: string | number;
  after: string | number;
  unit?: string;
  /** Direction of the change. @default true */
  better?: boolean;
  /** Delta chip text, e.g. "+2.4°". Falls back to "improved" / "regressed". */
  note?: string;
  /** Document-surface ink palette (use inside the report paper). @default false */
  onPaper?: boolean;
  className?: string;
}

/**
 * Before/after retest comparison tile with a colorblind-safe delta chip
 * (shape + arrow + color — never color alone). "Before" is struck through;
 * "after" leads. Use on theme surfaces, or pass `onPaper` to re-ink for the
 * light document/report sheet (the delta chip stays — it reads on white).
 */
export function BeforeAfter({ label, before, after, unit = '', better = true, note, onPaper = false, className }: BeforeAfterProps) {
  const surface = onPaper ? 'border-document-fg/15 bg-document-fg/[0.03]' : 'border-border bg-card';
  const muted = onPaper ? 'text-document-fg/60' : 'text-muted-foreground';
  const ink = onPaper ? 'text-document-fg' : 'text-foreground';
  const struck = onPaper
    ? 'text-document-fg/50 line-through decoration-document-fg/30'
    : 'text-muted-foreground line-through decoration-muted-foreground/40';
  return (
    <div className={cn('rounded-theme border p-4 shadow-theme', surface, className)}>
      <p className={cn('mb-2.5 text-[11px] font-semibold uppercase tracking-[0.05em]', muted)}>{label}</p>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className={cn('text-[10.5px]', muted)}>Before</p>
          <p className={cn('text-lg font-semibold tabular-nums', struck)}>
            {before}
            {unit}
          </p>
        </div>
        <span aria-hidden="true" className={cn('text-base', muted)}>
          →
        </span>
        <div className="flex-1">
          <p className={cn('text-[10.5px]', muted)}>After retest</p>
          <p className={cn('text-xl font-bold tabular-nums', ink)}>
            {after}
            {unit}
          </p>
        </div>
        <span
          className={cn(
            'whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold',
            better ? 'bg-success/15 text-success-text' : 'bg-error/15 text-error-text',
          )}
        >
          {better ? '▲' : '▼'} {note || (better ? 'improved' : 'regressed')}
        </span>
      </div>
    </div>
  );
}
