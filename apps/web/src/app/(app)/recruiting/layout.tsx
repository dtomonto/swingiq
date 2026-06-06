'use client';

import { Trophy } from 'lucide-react';
import { RecruitingNav } from '@/components/recruiting';

export default function RecruitingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Trophy size={22} className="text-primary" aria-hidden="true" /> Player Recruiting Hub
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Turn your verified film and data into a polished, shareable recruiting profile — honest by design.
        </p>
      </header>
      <RecruitingNav />
      {children}
    </div>
  );
}
