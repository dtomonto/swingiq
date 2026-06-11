// Sample training plan for /demo — the drills + 7-day plan a registered athlete
// gets, driven by the primary fix. Reuses the real per-sport drill library.

import Link from 'next/link';
import { Target, CalendarDays, ExternalLink, Flame, ChevronRight, ArrowRight } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import type { DemoReport } from '@/lib/demo/demo-report';

export function DemoTrainingView({ report }: { report: DemoReport }) {
  const { sport } = report;
  return (
    <div className="space-y-5">
      {/* Focus header */}
      <Card className="border-l-4 border-l-primary">
        <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-link">
              <Flame size={12} /> This week&apos;s focus
            </p>
            <h1 className="mt-0.5 font-heading text-xl font-bold text-foreground">{report.primaryFix.title}</h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">{report.whatToDoNext}</p>
          </div>
          <Link
            href={`/demo/${sport.slug}`}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:border-primary/60"
          >
            Back to report <ChevronRight size={14} />
          </Link>
        </CardBody>
      </Card>

      {/* Drills */}
      <div id="drills">
        <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-bold text-foreground">
          <Target size={18} className="text-primary" /> Priority Drills
        </h2>
        <div className="space-y-4">
          {report.drills.map((d, i) => (
            <Card key={d.name} id={i === 0 ? 'wall-drill' : i === 1 ? 'tempo' : undefined}>
              <CardBody className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-heading text-base font-bold text-foreground">{d.name}</p>
                    <p className="text-sm text-muted-foreground">{d.purpose}</p>
                  </div>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                    {i + 1}
                  </span>
                </div>
                {d.steps && d.steps.length > 0 && (
                  <ol className="space-y-1.5">
                    {d.steps.map((s, si) => (
                      <li key={si} className="flex gap-2 text-sm text-foreground">
                        <span className="font-bold text-primary">{si + 1}.</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                )}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {d.reps && (
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground">{d.reps}</span>
                  )}
                  {d.feel && <span className="text-xs italic text-muted-foreground">Feel: {d.feel}</span>}
                  {d.youtube && (
                    <a
                      href={d.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <ExternalLink size={12} /> Watch examples
                    </a>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* 7-day plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-accent-secondary" />
            <CardTitle>Your 7-Day Plan</CardTitle>
          </div>
        </CardHeader>
        <CardBody className="space-y-2">
          {report.plan.map((day) => (
            <div key={day.day} className="flex gap-3 border-b border-border py-2 last:border-0">
              <span className="w-14 shrink-0 text-xs font-bold uppercase tracking-wide text-primary">{day.day}</span>
              <span className="text-sm text-foreground">{day.focus}</span>
            </div>
          ))}
        </CardBody>
      </Card>

      <Card className="bg-primary/5 text-center">
        <CardBody className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Train every fix with guided drills, streaks, and retests — free.
          </p>
          <Link
            href="/start"
            className="inline-flex items-center justify-center gap-2 self-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
          >
            Start with my swing <ArrowRight size={16} />
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}
