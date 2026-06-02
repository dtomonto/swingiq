'use client';

import Link from 'next/link';
import { ProgressIntelligence } from '@/components/progress';

export default function PlayerArcPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Your Player Arc</h1>
        <p className="text-muted-foreground text-sm mt-1">
          The story of your improvement — what keeps coming back, which drills actually work
          for you, and honest proof of what each retest changed. It builds with every session.
        </p>
      </div>

      <ProgressIntelligence />

      <p className="text-xs text-muted-foreground text-center">
        Working a specific fix?{' '}
        <Link href="/fix" className="text-primary hover:underline">
          Open your Fix Stack
        </Link>{' '}
        · See the numbers on{' '}
        <Link href="/progress" className="text-primary hover:underline">
          Progress
        </Link>
        .
      </p>
    </div>
  );
}
