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
  className?: string;
}

/**
 * Before/after retest comparison tile with a colorblind-safe delta chip
 * (shape + arrow + color — never color alone). "Before" is struck through;
 * "after" leads. Use on theme surfaces.
 */
export function BeforeAfter({ label, before, after, unit = '', better = true, note, className }: BeforeAfterProps) {
  return (
    <div className={cn('rounded-theme border border-border bg-card p-4 shadow-theme', className)}>
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">{label}</p>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-[10.5px] text-muted-foreground">Before</p>
          <p className="text-lg font-semibold tabular-nums text-muted-foreground line-through decoration-muted-foreground/40">
            {before}
            {unit}
          </p>
        </div>
        <span aria-hidden="true" className="text-base text-muted-foreground">
          →
        </span>
        <div className="flex-1">
          <p className="text-[10.5px] text-muted-foreground">After retest</p>
          <p className="text-xl font-bold tabular-nums text-foreground">
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
