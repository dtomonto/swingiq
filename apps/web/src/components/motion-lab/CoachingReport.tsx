'use client';

// ============================================================
// SwingVantage — Motion Lab: Coaching Report
// ============================================================

import { useState } from 'react';
import { Sparkles, Target, ShieldCheck, CalendarDays, AlertCircle, ListChecks } from 'lucide-react';
import type { CoachingReport as Report, CoachingTone } from '@/lib/motion-lab';
import { Card, CardBody } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const TONES: Array<{ id: CoachingTone; label: string }> = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'athlete', label: 'Athlete' },
  { id: 'coach', label: 'Coach' },
  { id: 'youth', label: 'Youth / Parent' },
  { id: 'data', label: 'Data' },
];

export function CoachingReport({ report }: { report: Report }) {
  const [tone, setTone] = useState<CoachingTone>('beginner');

  return (
    <div className="space-y-4">
      {/* Tone switcher */}
      <div className="flex flex-wrap gap-1.5">
        {TONES.map((t) => (
          <button
            key={t.id}
            onClick={() => setTone(t.id)}
            className={cn(
              'text-xs font-medium rounded-full px-3 py-1 transition-colors',
              tone === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Headline for the active tone */}
      <Card className="border-primary/30 bg-primary/5">
        <CardBody className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Your takeaway</p>
            <p className="text-sm text-foreground leading-relaxed">{report.tones[tone]}</p>
          </div>
        </CardBody>
      </Card>

      {/* Executive summary + diagnosis */}
      <Card>
        <CardBody className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Executive summary</p>
            <p className="text-sm text-foreground leading-relaxed">{report.executiveSummary}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Main diagnosis</p>
            <p className="text-sm text-foreground leading-relaxed">{report.diagnosis}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Root-cause hypothesis</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{report.rootCause}</p>
          </div>
        </CardBody>
      </Card>

      {/* Top fixes */}
      <Card>
        <CardBody>
          <p className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-primary" /> Top {report.topFixes.length} fixes (in priority order)
          </p>
          <ol className="space-y-3">
            {report.topFixes.map((f) => (
              <li key={f.rank} className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">{f.rank}</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{f.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.problem}</p>
                  <p className="text-xs text-foreground mt-1"><span className="font-semibold text-primary">Fix: </span>{f.fix}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>

      {/* What not to change */}
      <Card className="border-success/30">
        <CardBody>
          <p className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-success" /> What NOT to change
          </p>
          <ul className="space-y-1">
            {report.whatNotToChange.map((w, i) => (
              <li key={i} className="text-xs text-muted-foreground flex gap-2"><span className="text-success">✓</span>{w}</li>
            ))}
          </ul>
        </CardBody>
      </Card>

      {/* Practice plan */}
      <Card>
        <CardBody>
          <p className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
            <CalendarDays className="w-4 h-4 text-primary" /> Practice prescription
          </p>
          <ul className="space-y-1.5">
            {report.practicePlan.map((p, i) => (
              <li key={i} className="text-xs text-muted-foreground flex gap-2"><ListChecks className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />{p}</li>
            ))}
          </ul>
        </CardBody>
      </Card>

      {/* Phase breakdown */}
      <Card>
        <CardBody>
          <p className="text-sm font-semibold text-foreground mb-2">Phase-by-phase</p>
          <div className="space-y-1.5">
            {report.phaseBreakdown.map((p) => (
              <div key={p.phase} className="flex items-start gap-2 text-xs">
                <span className="font-semibold text-foreground min-w-[92px] shrink-0">{p.label}</span>
                <span className="text-muted-foreground flex-1">{p.note}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">{Math.round(p.confidence * 100)}%</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Limitations */}
      <Card className="border-warning/30 bg-warning/5">
        <CardBody>
          <p className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-warning" /> Confidence &amp; limitations
          </p>
          <ul className="space-y-1">
            {report.limitations.map((l, i) => (
              <li key={i} className="text-xs text-muted-foreground">• {l}</li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
