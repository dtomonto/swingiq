'use client';

// SwingVantage Academy — shared presentational parts + hooks.
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ROLES } from '@/lib/academy/content';
import { useAcademyStore } from '@/lib/academy/store';

/** True after client mount — avoids SSR/localStorage hydration mismatches. */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const v = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${v}%` }} />
    </div>
  );
}

export function ScoreStat({ label, value, suffix = '%' }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-theme border border-border bg-card p-4">
      <p className="text-2xl font-bold text-foreground">{Math.round(value)}<span className="text-base text-muted-foreground">{suffix}</span></p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function DifficultyPill({ level }: { level: 'foundational' | 'intermediate' | 'advanced' }) {
  const map = {
    foundational: 'bg-success/15 text-success',
    intermediate: 'bg-warning/15 text-warning',
    advanced: 'bg-accent-secondary/15 text-accent-secondary',
  } as const;
  return <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', map[level])}>{level}</span>;
}

/** Role selector bound to the academy store. */
export function RoleSelect({ className }: { className?: string }) {
  const roleId = useAcademyStore((s) => s.progress.roleId);
  const setRole = useAcademyStore((s) => s.setRole);
  return (
    <select
      aria-label="Your role"
      value={roleId ?? ''}
      onChange={(e) => setRole((e.target.value || null) as never)}
      className={cn('rounded-theme border border-border bg-card px-3 py-1.5 text-sm text-foreground', className)}
    >
      <option value="">Choose your role…</option>
      {ROLES.map((r) => (
        <option key={r.id} value={r.id}>{r.emoji} {r.label}</option>
      ))}
    </select>
  );
}
