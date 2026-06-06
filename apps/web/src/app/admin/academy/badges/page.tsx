'use client';

import { BADGES } from '@/lib/academy/content';
import { useAcademyStore } from '@/lib/academy/store';
import { useMounted } from '@/components/academy/parts';
import { cn } from '@/lib/utils';

const TIER_RING: Record<string, string> = {
  bronze: 'ring-amber-700/40', silver: 'ring-slate-400/50', gold: 'ring-yellow-500/50', platinum: 'ring-cyan-400/50',
};

export default function BadgesPage() {
  const mounted = useMounted();
  const earned = useAcademyStore((s) => s.progress.earnedBadges);
  const earnedCount = mounted ? Object.keys(earned).length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Performance Badges</h1>
        <p className="text-muted-foreground">{earnedCount} of {BADGES.length} earned.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BADGES.map((b) => {
          const got = mounted && !!earned[b.id];
          return (
            <div key={b.id} className={cn('rounded-theme border border-border bg-card p-5 text-center', !got && 'opacity-60')}>
              <div className={cn('mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted text-3xl ring-2', TIER_RING[b.tier], !got && 'grayscale')}>
                {got ? b.emoji : '🔒'}
              </div>
              <h3 className="mt-3 font-bold text-foreground">{b.name}</h3>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{b.tier}</p>
              <p className="mt-2 text-sm text-muted-foreground">{b.description}</p>
              <p className="mt-2 text-xs text-muted-foreground"><strong className="text-foreground">How to earn:</strong> {b.criteria}</p>
              {got && <p className="mt-2 text-xs font-semibold text-success">✓ Earned</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
