'use client';

import { cn } from '@/lib/utils';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
  /**
   * "Dark Performance" (B) glowing-data-viz treatment: haloes the progress ring
   * in its own score color. Opt-in (default off) so existing rings are unchanged;
   * use it on prominent metrics (dashboard overall score, diagnose result).
   */
  glow?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 85) return '#16a34a';
  if (score >= 70) return '#2563eb';
  if (score >= 55) return '#ca8a04';
  if (score >= 40) return '#ea580c';
  return '#dc2626';
}

function getGrade(score: number): string {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

export function ScoreRing({ score, size = 80, strokeWidth = 6, label, className, glow = false }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.5s ease',
              ...(glow ? { filter: `drop-shadow(0 0 ${Math.max(4, Math.round(strokeWidth * 0.85))}px ${color})` } : {}),
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold" style={{ color }}>{getGrade(score)}</span>
          <span className="text-xs text-muted-foreground">{score}</span>
        </div>
      </div>
      {label && <p className="text-xs text-muted-foreground text-center">{label}</p>}
    </div>
  );
}
