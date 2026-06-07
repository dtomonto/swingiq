'use client';

import Link from 'next/link';
import { Sparkles, ChevronRight, Video } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// ============================================================
// SwingVantage — FirstSwingJourneyCard
// ------------------------------------------------------------
// The dashboard "hero" for a brand-new athlete (no sessions yet).
// Instead of the generic next-best-action, it surfaces the rich
// guided journey that lives at /start: pick sport → answer two
// quick questions → get a first priority + plan. Honest framing
// (free, no video required to start) and a clear single path.
// ============================================================

const STEPS = [
  'Pick your sport',
  'Answer 2 quick questions',
  'Get your #1 fix + a 7-day plan',
];

export function FirstSwingJourneyCard({
  firstName,
}: {
  firstName?: string | null;
}) {
  return (
    <div
      className="bg-golf-dark text-white rounded-xl p-5 sm:p-6"
      role="region"
      aria-label="Start your first swing analysis"
    >
      <div className="flex items-start gap-3">
        <span className="shrink-0 mt-0.5">
          <Sparkles size={22} className="text-white/80" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-white/80 text-sm">
            New here? Start in about 2 minutes
          </p>
          <h2 className="font-bold text-lg sm:text-xl mt-0.5">
            Let&apos;s find your first fix{firstName ? `, ${firstName}` : ''}.
          </h2>
          <p className="text-white/90 text-sm leading-relaxed mt-1">
            Answer two quick questions and SwingVantage gives you your top priority and a
            simple plan — free, and you don&apos;t need a video to start.
          </p>
        </div>
      </div>

      {/* Three steps */}
      <ol className="mt-4 grid gap-2 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <li
            key={i}
            className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2"
          >
            <span className="shrink-0 grid place-items-center w-5 h-5 rounded-full bg-primary text-white text-xs font-bold">
              {i + 1}
            </span>
            <span className="text-sm text-white/90 leading-tight">{step}</span>
          </li>
        ))}
      </ol>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link href="/start">
          <Button size="sm" className="bg-primary hover:bg-primary text-white whitespace-nowrap">
            Start Here — Free
            <ChevronRight size={14} />
          </Button>
        </Link>
        <Link href="/video">
          <Button
            size="sm"
            variant="outline"
            className="bg-transparent text-white border-white/30 hover:bg-white/10 whitespace-nowrap"
          >
            <Video size={14} />
            Or upload a swing video
          </Button>
        </Link>
      </div>
    </div>
  );
}
