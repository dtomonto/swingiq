'use client';

// ============================================================
// SwingVantage — Dashboard "How did you play today?" prompt
// ------------------------------------------------------------
// A one-tap daily check-in surfaced on both dashboards. Tapping a
// feel carries it into the full /notes form (via a one-shot local
// handoff, so /notes stays a static route). Once a note is logged
// today it switches to a quiet confirmation instead of nagging.
// Works for every sport — the question is universal.
// ============================================================

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NotebookPen, CheckCircle2 } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { useSwingVantageStore } from '@/store';
import {
  feelEmoji,
  setPendingFeel,
  todayISODate,
  FEEL_LABELS,
  type PlayFeel,
} from '@/lib/dailyNotes';

const FEELS: PlayFeel[] = [1, 2, 3, 4, 5];

export function DailyNotePrompt() {
  const router = useRouter();
  const dailyNotes = useSwingVantageStore((s) => s.dailyNotes);

  const today = todayISODate();
  const todaysNotes = dailyNotes.filter((n) => n.date === today);
  const loggedToday = todaysNotes.length > 0;

  const pick = (feel: PlayFeel) => {
    setPendingFeel(feel);
    router.push('/notes');
  };

  if (loggedToday) {
    return (
      <Card className="bg-success/5 border-success/20">
        <CardBody className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <CheckCircle2 size={18} className="text-success shrink-0" aria-hidden="true" />
            <span className="text-foreground font-medium truncate">
              Logged today {feelEmoji(todaysNotes[0].feel)} — nice work.
            </span>
            <span className="text-muted-foreground hidden sm:inline">Add another?</span>
          </div>
          <Link href="/notes" className="text-sm font-medium text-primary hover:underline shrink-0">
            Daily Notes →
          </Link>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <NotebookPen size={18} className="text-primary" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm">How did you play today?</p>
            <p className="text-xs text-muted-foreground">One tap adds it to your AI player profile.</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
          {FEELS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => pick(f)}
              aria-label={FEEL_LABELS[f]}
              title={FEEL_LABELS[f]}
              className="text-2xl rounded-lg px-1.5 py-1 hover:bg-muted transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring"
            >
              <span aria-hidden="true">{feelEmoji(f)}</span>
            </button>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
