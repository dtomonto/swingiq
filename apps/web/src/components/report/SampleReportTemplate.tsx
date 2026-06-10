'use client';

// ============================================================
// SwingVantage — Sample Report Template
//
// Renders a content/sampleReports.ts entry as a full worked example:
// profile → input → issue → top fix → evidence → confidence (+ what
// we can't know) → why it matters → drills → 7-day plan → retest →
// metrics → coach/parent summary → shareable card → trust disclaimer.
//
// Honest by design: every report is illustrative (never a real
// athlete's data) and carries an explicit confidence label + limits.
// See docs/FIVE_PERSONA_MASTER_PLAN.md §7 + §9.
// ============================================================

import { useEffect } from 'react';
import Link from 'next/link';
import {
  Target,
  Dumbbell,
  CalendarDays,
  RotateCcw,
  LineChart,
  Users,
  ShieldQuestion,
  Info,
  ArrowRight,
} from 'lucide-react';
import type { SampleReport } from '@/content/sampleReports';
import { ShareableReportCard } from '@/components/report/ShareableReportCard';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';

export function SampleReportTemplate({ report }: { report: SampleReport }) {
  useEffect(() => {
    track(ANALYTICS_EVENTS.SAMPLE_REPORT_VIEWED, { sport: report.slug });
  }, [report.slug]);

  return (
    <div className="space-y-6">
      {/* Profile + input */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Player profile</p>
          <p className="mt-1 text-sm text-foreground">{report.userProfile}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Input data</p>
          <ul className="mt-1 space-y-1">
            {report.inputData.map((d) => (
              <li key={d} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Issue + top fix */}
      <section className="rounded-2xl border border-warning/30 bg-warning/10 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-warning">Highest-priority issue</p>
        <p className="mt-1 font-bold text-foreground">{report.issueDetected}</p>
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-primary">The #1 fix</p>
        <p className="mt-1 text-foreground">{report.highestPriorityFix}</p>
      </section>

      {/* Evidence + confidence */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-muted p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Target size={16} className="text-primary" aria-hidden="true" /> Evidence used
          </h2>
          <ul className="mt-2 space-y-1.5">
            {report.evidenceUsed.map((e) => (
              <li key={e} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-muted p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Info size={16} className="text-primary" aria-hidden="true" /> Confidence
          </h2>
          <p className="mt-2 inline-block rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {report.confidenceLevel}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{report.confidenceNote}</p>
        </div>
      </section>

      {/* Why it matters */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-bold text-foreground">Why this matters</h2>
        <p className="mt-1 text-foreground">{report.whyItMatters}</p>
      </section>

      {/* Drills */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-foreground">
          <Dumbbell size={18} className="text-primary" aria-hidden="true" /> Three drills tied to this fix
        </h2>
        <div className="space-y-3">
          {report.drills.map((d, i) => (
            <div key={d.name} className="rounded-xl border border-border p-4">
              <p className="font-semibold text-foreground">{i + 1}. {d.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{d.how}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7-day plan */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-foreground">
          <CalendarDays size={18} className="text-primary" aria-hidden="true" /> 7-day practice plan
        </h2>
        <ol className="space-y-2">
          {report.practicePlan7Day.map((p) => (
            <li key={p.day} className="flex gap-3 rounded-xl border border-border p-3">
              <span className="shrink-0 text-sm font-bold text-primary">{p.day}</span>
              <span className="text-sm text-foreground">{p.focus}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Retest + metrics */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-muted p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <RotateCcw size={16} className="text-primary" aria-hidden="true" /> How to retest
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{report.retestInstructions}</p>
        </div>
        <div className="rounded-2xl bg-muted p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <LineChart size={16} className="text-primary" aria-hidden="true" /> Progress metrics
          </h2>
          <ul className="mt-2 space-y-1.5">
            {report.progressMetrics.map((m) => (
              <li key={m} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Coach / parent summary */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Users size={16} className="text-primary" aria-hidden="true" /> Coach &amp; parent summary
        </h2>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">For a coach</p>
        <p className="mt-1 text-sm text-foreground">{report.coachSummary}</p>
        {report.parentSummary && (
          <>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">For a parent</p>
            <p className="mt-1 text-sm text-foreground">{report.parentSummary}</p>
          </>
        )}
      </section>

      {/* What we can't know */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <ShieldQuestion size={16} className="text-warning" aria-hidden="true" /> What this report can&apos;t know
        </h2>
        <ul className="mt-2 space-y-1.5">
          {report.whatWeCannotKnow.map((w) => (
            <li key={w} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-1 text-warning" aria-hidden="true">–</span>
              <span>{w}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Shareable / printable card */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-foreground">Share or print this report</h2>
        <ShareableReportCard
          data={{
            sport: report.sportLabel,
            topIssue: report.card.topIssue,
            confidence: report.confidenceLevel,
            drills: report.card.drills,
            planSummary: report.card.planSummary,
          }}
        />
      </section>

      {/* Trust disclaimer */}
      <p className="text-xs italic text-muted-foreground">{report.trustDisclaimer}</p>

      {/* CTA — single sport, or slow/fast chooser */}
      {report.modeChooser ? (
        <section className="rounded-2xl bg-primary p-6 text-center text-primary-foreground print:hidden">
          <p className="mb-4 text-lg font-bold">Pick your softball path to get a real report</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={report.modeChooser.slowHref}
              className="rounded-xl bg-background px-6 py-3 font-bold text-foreground transition-opacity hover:opacity-90"
            >
              Slow Pitch →
            </Link>
            <Link
              href={report.modeChooser.fastHref}
              className="rounded-xl border border-primary-foreground/40 px-6 py-3 font-bold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
            >
              Fast Pitch →
            </Link>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl bg-primary p-6 text-center text-primary-foreground print:hidden">
          <p className="mb-4 text-lg font-bold">Get your own {report.sportLabel} report free</p>
          <Link
            href={report.startSport ? `/start?sport=${report.startSport}` : '/start'}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-background px-8 py-3 font-bold text-foreground transition-opacity hover:opacity-90"
          >
            Analyze My Swing Free
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <p className="mt-3 text-xs text-primary-foreground/80">No account required · Free · Private by default</p>
        </section>
      )}
    </div>
  );
}
