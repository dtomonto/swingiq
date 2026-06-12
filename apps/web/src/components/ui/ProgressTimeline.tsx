import { cn } from '@/lib/utils';

export interface ProgressTimelinePoint {
  label: string;
  score: number;
}

interface ProgressTimelineProps {
  points: ProgressTimelinePoint[];
  /** Chart height in px. @default 120 */
  height?: number;
  /** Document-surface ink (dot ring + labels) for the report paper. @default false */
  onPaper?: boolean;
  className?: string;
}

/** Grade-band color for a 0–100 score (shared with ScoreRing's bands). */
export function scoreBandColor(score: number): string {
  if (score >= 85) return '#16a34a';
  if (score >= 70) return '#2563eb';
  if (score >= 55) return '#ca8a04';
  if (score >= 40) return '#ea580c';
  return '#dc2626';
}

/**
 * Retest-over-retest score line. The trend line uses the active sport accent
 * (falling back to --primary); dots are colored by grade band. Horizontally
 * scrollable on mobile.
 */
export function ProgressTimeline({ points, height = 120, onPaper = false, className }: ProgressTimelineProps) {
  if (!points.length) return null;

  // Dot ring blends into the surface it sits on; labels follow the surface ink.
  const dotRing = onPaper ? 'hsl(var(--surface-document))' : 'hsl(var(--card))';
  const labelInk = onPaper ? 'text-document-fg/60' : 'text-muted-foreground';

  const w = 100; // viewBox width units
  const scores = points.map((p) => p.score);
  const min = Math.min(...scores) - 8;
  const max = Math.max(...scores) + 8;
  const range = max - min || 1;
  const x = (i: number) => (points.length === 1 ? w / 2 : (i / (points.length - 1)) * (w - 12) + 6);
  const y = (s: number) => 38 - ((s - min) / range) * 30;
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.score)}`).join(' ');

  return (
    <div className={cn('overflow-x-auto', className)}>
      <svg
        viewBox={`0 0 ${w} 46`}
        className="block w-full"
        style={{ height }}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Score trend across ${points.length} retests`}
      >
        <path
          d={path}
          fill="none"
          stroke="hsl(var(--sport-accent, var(--primary)))"
          strokeWidth={0.8}
          strokeLinecap="round"
          opacity={0.5}
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(p.score)}
            r={2.4}
            fill={scoreBandColor(p.score)}
            stroke={dotRing}
            strokeWidth={0.8}
          />
        ))}
      </svg>
      <div className="mt-0.5 flex justify-between">
        {points.map((p, i) => (
          <div
            key={i}
            className="min-w-0"
            style={{ textAlign: i === 0 ? 'left' : i === points.length - 1 ? 'right' : 'center' }}
          >
            <p className="text-[13px] font-bold tabular-nums" style={{ color: scoreBandColor(p.score) }}>
              {p.score}
            </p>
            <p className={cn('whitespace-nowrap text-[10.5px]', labelInk)}>{p.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
