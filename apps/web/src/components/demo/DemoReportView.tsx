// Comprehensive sample report renderer for /demo (all 7 sports).
// Server component — mirrors the real in-app report chrome (the same
// header band, score ring, primary-fix banner, drills and metrics a
// registered athlete sees) so the homepage promise == what a lead gets.

import Link from 'next/link';
import {
  Target, AlertCircle, TrendingUp, Layers, Activity, ExternalLink,
  ChevronRight, CalendarDays, User, ArrowRight,
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { MetricCard } from '@/components/ui/MetricCard';
import { LiveKinematicPanel } from '@/components/demo/LiveKinematicPanel';
import type { DemoReport, PhaseStatus, IssueSeverity } from '@/lib/demo/demoReport';

const PHASE_DOT: Record<PhaseStatus, string> = {
  good: 'bg-success',
  watch: 'bg-warning',
  fix: 'bg-error',
};
const PHASE_LABEL: Record<PhaseStatus, string> = {
  good: 'On track',
  watch: 'Watch',
  fix: 'Priority',
};
const SEVERITY_BADGE: Record<IssueSeverity, 'critical' | 'high' | 'medium'> = {
  critical: 'critical',
  notable: 'high',
  minor: 'medium',
};

export function DemoReportView({ report }: { report: DemoReport }) {
  const { sport } = report;

  return (
    <div className="space-y-5">
      {/* ── Header band (echoes the homepage mockup) ─────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-theme-lg ring-glow lg:p-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.10]"
          style={{ background: `radial-gradient(110% 80% at 100% 0%, ${sport.accent}, transparent 60%)` }}
        />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-link">
              {sport.emoji} {sport.name} · {sport.tagline}
            </p>
            <h1 className="mt-1 font-heading text-2xl font-bold uppercase tracking-tight text-foreground">
              Analysis Report
            </h1>
            <p className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">
              Session ID · {report.sessionId}
            </p>
          </div>
          <div className="shrink-0 text-center">
            <ScoreRing score={report.score} size={72} strokeWidth={6} />
            <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">Swing Score</p>
          </div>
        </div>

        {/* Primary fix banner */}
        <div className="relative mt-5 rounded-xl border-l-2 border-primary bg-primary/10 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-link">Primary fix identified</p>
          <p className="mt-0.5 font-heading text-lg font-semibold uppercase tracking-tight text-foreground">
            {report.primaryFix.title}
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">{report.primaryFix.cause}</p>
          <p className="mt-2 text-sm text-foreground">{report.primaryFix.whyItMatters}</p>
        </div>
      </div>

      {/* ── Golf sub-scores ──────────────────────────────────────── */}
      {report.subScores && report.subScores.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {report.subScores.map((s) => (
            <Card key={s.label}>
              <CardBody className="py-3 text-center">
                <ScoreRing score={s.value} size={56} strokeWidth={5} />
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* ── Live kinematic capture + what to do next ─────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <LiveKinematicPanel className="aspect-video w-full rounded-none border-0" />
        </Card>
        <Card className="border-primary/30 bg-primary/5">
          <CardBody className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Activity size={16} /> What do I do next?
            </p>
            <p className="text-sm text-foreground">{report.whatToDoNext}</p>
            <Link
              href={`/demo/${sport.slug}/training`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              Open the training plan <ChevronRight size={14} />
            </Link>
          </CardBody>
        </Card>
      </div>

      {/* ── Phase-by-phase breakdown ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-accent-secondary" />
            <CardTitle>Phase-by-Phase Breakdown</CardTitle>
          </div>
        </CardHeader>
        <CardBody className="space-y-2.5">
          {report.phases.map((p) => (
            <div key={p.label} className="flex items-start gap-3 border-b border-border py-2 last:border-0">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${PHASE_DOT[p.status]}`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{p.label}</p>
                {p.cue && <p className="text-xs text-muted-foreground">{p.cue}</p>}
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  p.status === 'fix'
                    ? 'bg-error/15 text-error'
                    : p.status === 'watch'
                    ? 'bg-warning/15 text-warning'
                    : 'bg-success/15 text-success'
                }`}
              >
                {PHASE_LABEL[p.status]}
              </span>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* ── Secondary issues ─────────────────────────────────────── */}
      {report.issues.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-muted-foreground" />
              <CardTitle>Other Patterns We Spotted</CardTitle>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            {report.issues.map((iss, i) => (
              <div key={iss.label} className="flex items-start gap-3 border-b border-border py-2 last:border-0">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                  {i + 2}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{iss.label}</p>
                  <p className="text-xs text-muted-foreground">{iss.cause}</p>
                </div>
                <Badge variant={SEVERITY_BADGE[iss.severity]} className="ml-auto shrink-0 capitalize">
                  {iss.severity}
                </Badge>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {/* ── Golf dispersion metrics ──────────────────────────────── */}
      {report.metrics && report.metrics.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target size={18} className="text-primary" />
              <CardTitle>Shot Dispersion</CardTitle>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {report.metrics.map((m) => (
                <MetricCard key={m.label} label={m.label} value={m.value} status={m.status} />
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Non-golf benchmarks ──────────────────────────────────── */}
      {report.benchmarks && report.benchmarks.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-accent-secondary" />
              <CardTitle>Benchmarks For Your Level</CardTitle>
            </div>
          </CardHeader>
          <CardBody className="grid gap-3 sm:grid-cols-2">
            {report.benchmarks.map((b) => (
              <div key={b.label} className="rounded-lg border border-border bg-muted p-3">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-semibold text-foreground">{b.label}</p>
                  <p className="font-heading text-sm font-bold text-primary">{b.target}</p>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Healthy range {b.range}</p>
                <p className="mt-1 text-xs text-muted-foreground">{b.note}</p>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {/* ── Recommended drills ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-primary" />
              <CardTitle>Recommended Drills</CardTitle>
            </div>
            <Link href={`/demo/${sport.slug}/training`} className="text-xs font-semibold text-primary hover:underline">
              Full plan →
            </Link>
          </div>
        </CardHeader>
        <CardBody className="grid gap-3 sm:grid-cols-3">
          {report.drills.map((d) => (
            <div key={d.name} className="flex flex-col rounded-lg border border-border bg-muted p-3">
              <p className="text-sm font-semibold text-foreground">{d.name}</p>
              <p className="mt-1 flex-1 text-xs text-muted-foreground">{d.purpose}</p>
              {d.reps && <p className="mt-2 text-[11px] font-medium text-foreground">{d.reps}</p>}
              {d.youtube && (
                <a
                  href={d.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                >
                  <ExternalLink size={11} /> Watch examples
                </a>
              )}
            </div>
          ))}
        </CardBody>
      </Card>

      {/* ── 7-day plan ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-accent-secondary" />
            <CardTitle>Your 7-Day Practice Plan</CardTitle>
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

      {/* ── Golf shot table ──────────────────────────────────────── */}
      {report.shots && report.shots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Shot Data ({report.shots.length} sample shots)</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="px-2 py-2 text-left">#</th>
                    <th className="px-2 py-2 text-right">Carry</th>
                    <th className="px-2 py-2 text-right">Ball Spd</th>
                    <th className="px-2 py-2 text-right">Launch°</th>
                    <th className="px-2 py-2 text-right">Spin</th>
                    <th className="px-2 py-2 text-right">F2P</th>
                    <th className="px-2 py-2 text-right">Lateral</th>
                  </tr>
                </thead>
                <tbody>
                  {report.shots.map((shot) => {
                    const bd = shot.ball_data;
                    const cd = shot.club_data;
                    const lat = bd.lateral_offline ?? 0;
                    return (
                      <tr key={shot.id} className="border-b border-border last:border-0">
                        <td className="px-2 py-1.5 text-muted-foreground">{shot.shot_number}</td>
                        <td className="px-2 py-1.5 text-right">{bd.carry_distance !== null ? Math.round(bd.carry_distance) : '—'}</td>
                        <td className="px-2 py-1.5 text-right">{bd.ball_speed !== null ? Math.round(bd.ball_speed) : '—'}</td>
                        <td className="px-2 py-1.5 text-right">{bd.launch_angle_vertical !== null ? bd.launch_angle_vertical.toFixed(1) : '—'}</td>
                        <td className="px-2 py-1.5 text-right">{bd.spin_rate !== null ? Math.round(bd.spin_rate) : '—'}</td>
                        <td className={`px-2 py-1.5 text-right font-medium ${cd.face_to_path !== null && Math.abs(cd.face_to_path) > 3 ? 'text-error' : ''}`}>
                          {cd.face_to_path !== null ? `${cd.face_to_path > 0 ? '+' : ''}${cd.face_to_path.toFixed(1)}°` : '—'}
                        </td>
                        <td className={`px-2 py-1.5 text-right font-medium ${Math.abs(lat) > 15 ? 'text-error' : Math.abs(lat) > 8 ? 'text-warning' : ''}`}>
                          {lat !== 0 ? `${lat > 0 ? '+' : ''}${lat.toFixed(0)} yds` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Profile snapshot + CTA ───────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User size={18} className="text-muted-foreground" />
                <CardTitle>Athlete Profile</CardTitle>
              </div>
              <Link href={`/demo/${sport.slug}/profile`} className="text-xs font-semibold text-primary hover:underline">
                View profile →
              </Link>
            </div>
          </CardHeader>
          <CardBody className="space-y-1">
            <p className="text-sm font-semibold text-foreground">{report.profile.name}</p>
            <p className="text-xs text-muted-foreground">{report.profile.level}</p>
            <p className="mt-1 text-sm text-foreground"><span className="text-muted-foreground">Goal:</span> {report.profile.goal}</p>
            <p className="text-sm text-foreground"><span className="text-muted-foreground">Working on:</span> {report.profile.miss}</p>
          </CardBody>
        </Card>

        <Card className="flex flex-col justify-center bg-primary/5 text-center">
          <CardBody className="space-y-3">
            <p className="font-heading text-lg font-bold uppercase tracking-tight text-foreground">
              This is a free sample
            </p>
            <p className="text-sm text-muted-foreground">
              Upload your own {sport.name.toLowerCase()} swing and get a report exactly like this —
              frame-by-frame, no account required.
            </p>
            <Link
              href="/start"
              className="inline-flex items-center justify-center gap-2 self-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Analyze my swing — free <ArrowRight size={16} />
            </Link>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
