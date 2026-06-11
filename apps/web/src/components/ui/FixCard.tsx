import { cn } from '@/lib/utils';

interface FixCardProps {
  /** @default 'Primary fix identified' */
  eyebrow?: string;
  /** The one fix, sentence case ("Let your hips finish loading first"). */
  fix: string;
  /** Why it matters — one short paragraph. */
  why?: string;
  /** @default 'High confidence' */
  confidence?: string;
  /** e.g. "video + launch data agree". */
  confidenceNote?: string;
  className?: string;
}

/**
 * THE component: the single priority fix, rendered on the light "document"
 * surface (the report is paper, sunlight-proof in every theme) with the
 * mandatory confidence label. Never render two on one screen — one fix, one
 * plan, one retest.
 */
export function FixCard({
  eyebrow = 'Primary fix identified',
  fix,
  why,
  confidence = 'High confidence',
  confidenceNote,
  className,
}: FixCardProps) {
  return (
    <div className={cn('rounded-2xl bg-document p-6 text-document-fg shadow-theme-lg', className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-document-accent">{eyebrow}</p>
      <h2 className="mt-1.5 text-xl font-bold leading-snug tracking-[-0.01em] text-document-fg">{fix}</h2>
      {why && <p className="mt-2 text-sm leading-relaxed text-document-fg/70">{why}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center rounded-full bg-document-accent/10 px-3 py-0.5 text-xs font-semibold text-document-accent">
          {confidence}
        </span>
        {confidenceNote && <span className="text-xs text-document-fg/70">{confidenceNote}</span>}
      </div>
    </div>
  );
}
