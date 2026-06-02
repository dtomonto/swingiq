'use client';

import Link from 'next/link';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FileText, ChevronRight, Activity, Upload, Copy, CheckCircle, Printer } from 'lucide-react';
import { useSwingIQStore } from '@/store';
import { runDiagnosticEngine, computeSwingScores } from '@swingiq/core';
import type { Shot } from '@swingiq/core';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import { useSport } from '@/contexts/SportContext';
import { CoachSummaryCard } from '@/components/agents/CoachSummaryCard';
import { AnalysisTransparency } from '@/components/trust/AnalysisTransparency';

const REPORT_TYPES = [
  {
    title: 'Session Report',
    description:
      'Full breakdown of a single practice session: shot table, dispersion chart, diagnosis, and training plan.',
    color: 'bg-accent-secondary/10 border-accent-secondary/25',
    iconColor: 'text-accent-secondary',
    href: '/sessions',
    cta: 'View Sessions',
  },
  {
    title: 'Progress Report',
    description:
      'See how your scores and key metrics have changed across all sessions.',
    color: 'bg-primary/10 border-primary/30',
    iconColor: 'text-primary',
    href: '/progress',
    cta: 'View Progress',
  },
  {
    title: 'Swing Diagnosis',
    description:
      'Deep analysis of your primary swing faults — causes, evidence, and drills.',
    color: 'bg-accent-secondary/10 border-accent-secondary/25',
    iconColor: 'text-accent-secondary',
    href: '/diagnose',
    cta: 'Run Diagnosis',
  },
  {
    title: 'AI Coach Summary',
    description:
      'Ask your AI Coach for a plain-English summary of your game, designed to share with a coach or club fitter.',
    color: 'bg-warning/10 border-warning/30',
    iconColor: 'text-warning',
    href: '/ai-coach',
    cta: 'Ask AI Coach',
  },
] as const;

export default function ReportsPage() {
  const { sessions, profile, clubs, training, sportProfiles, video_analyses } = useSwingIQStore();
  const { activeSport, isGolf, sportName, sportEmoji } = useSport();
  const [copied, setCopied] = useState(false);

  // Sessions for active sport
  const sorted = [...sessions]
    .filter((s) => isGolf ? s.sport === 'golf' || !s.sport : s.sport === activeSport)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Video analyses for active sport
  const sportAnalyses = [...video_analyses]
    .filter((v) => v.sport === activeSport)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Build coach report text from live data — adapts to active sport
  const coachReport = useMemo(() => {
    const lines: string[] = [];
    lines.push('=== SwingIQ Player Report ===');
    lines.push(`Sport: ${sportName}`);
    lines.push(`Generated: ${format(new Date(), 'MMMM d, yyyy')}`);
    lines.push('');

    // ── Profile section ──────────────────────────────────────
    if (isGolf && profile) {
      lines.push('--- Player Profile ---');
      lines.push(`Name: ${profile.name}`);
      lines.push(`Skill Level: ${profile.skill_level}`);
      lines.push(`Typical Miss: ${profile.current_miss ?? 'Not specified'}`);
      if (profile.handicap !== null && profile.handicap !== undefined) lines.push(`Current Handicap: ${profile.handicap}`);
      lines.push(`Primary Goal: ${profile.primary_goal ?? 'Not specified'}`);
      lines.push('');
    }

    if (!isGolf) {
      const sp = (sportProfiles as Record<string, Record<string, unknown> | undefined>)[activeSport];
      if (sp) {
        lines.push(`--- ${sportName} Player Profile ---`);
        if (sp.primary_goal) lines.push(`Goal: ${sp.primary_goal}`);
        if (sp.skill_level) lines.push(`Skill Level: ${sp.skill_level}`);
        if (sp.common_miss) lines.push(`Common Miss: ${sp.common_miss}`);
        if (sp.batting_side) lines.push(`Batting Side: ${sp.batting_side}`);
        if (sp.dominant_hand) lines.push(`Dominant Hand: ${sp.dominant_hand}`);
        if (sp.competition_level) lines.push(`Competition Level: ${sp.competition_level}`);
        if (sp.bat_brand && sp.bat_model) lines.push(`Bat: ${sp.bat_brand} ${sp.bat_model}`);
        if (sp.racquet_brand && sp.racquet_model) lines.push(`Racquet: ${sp.racquet_brand} ${sp.racquet_model}`);
        lines.push('');
      }
    }

    // ── Equipment section ────────────────────────────────────
    if (isGolf && clubs.length > 0) {
      lines.push('--- Bag ---');
      clubs.filter((c) => c.typical_carry).forEach((c) => {
        lines.push(`  ${c.name}: ~${c.typical_carry} yds carry`);
      });
      lines.push('');
    }

    // ── Golf session / launch-monitor stats ──────────────────
    if (isGolf) {
      const latestWithShots = sorted.find((s) => s.shots.length > 0);
      if (latestWithShots) {
        lines.push(`--- Latest Golf Session: ${latestWithShots.name} ---`);
        lines.push(`Date: ${format(new Date(latestWithShots.created_at), 'MMMM d, yyyy')}`);
        lines.push(`Club: ${latestWithShots.club_name} | Shots: ${latestWithShots.shots.length}`);
        lines.push(`Launch Monitor: ${latestWithShots.launch_monitor}`);

        try {
          const result = runDiagnosticEngine(
            latestWithShots.shots as Shot[],
            latestWithShots.club_category || 'mid_iron',
            latestWithShots.id,
            'local',
          );
          const scores = computeSwingScores(result.stats);
          const s = result.stats;

          lines.push('');
          lines.push('Swing Scores:');
          lines.push(`  Overall: ${scores.overall}`);
          lines.push(`  Face Control: ${scores.face_control}`);
          lines.push(`  Path Control: ${scores.path_control}`);
          lines.push(`  Strike Quality: ${scores.strike_quality}`);
          lines.push(`  Consistency: ${scores.consistency}`);

          lines.push('');
          lines.push('Key Metrics:');
          if (s.avg_carry !== undefined) lines.push(`  Avg Carry: ${Math.round(s.avg_carry)} yds`);
          if (s.avg_ball_speed !== undefined) lines.push(`  Avg Ball Speed: ${Math.round(s.avg_ball_speed)} mph`);
          if (s.avg_smash_factor !== undefined) lines.push(`  Avg Smash Factor: ${s.avg_smash_factor.toFixed(2)}`);
          if (s.avg_spin_rate !== undefined) lines.push(`  Avg Spin Rate: ${Math.round(s.avg_spin_rate)} rpm`);
          if (s.avg_face_to_path !== undefined) lines.push(`  Avg Face-to-Path: ${s.avg_face_to_path.toFixed(1)}°`);
          if (s.avg_club_path !== undefined) lines.push(`  Avg Club Path: ${s.avg_club_path.toFixed(1)}°`);
          if (s.avg_attack_angle !== undefined) lines.push(`  Avg Attack Angle: ${s.avg_attack_angle.toFixed(1)}°`);
          if (s.avg_lateral_offline !== undefined) lines.push(`  Avg Lateral Miss: ${s.avg_lateral_offline.toFixed(0)} yds`);

          if (result.diagnoses.length > 0) {
            lines.push('');
            lines.push('Diagnoses:');
            result.diagnoses.forEach((d, i) => {
              lines.push(`  ${i + 1}. ${d.rule.name} (${d.rule.priority}, ${d.confidence}% confidence)`);
              lines.push(`     Likely cause: ${d.rule.likely_cause}`);
            });
          }
        } catch {
          lines.push('  (Stats unavailable for this session)');
        }
      }
    }

    // ── Non-golf: video analysis summary ─────────────────────
    if (!isGolf && sportAnalyses.length > 0) {
      const latest = sportAnalyses[0]!;
      lines.push(`--- Latest ${sportName} Video Analysis ---`);
      lines.push(`Date: ${format(new Date(latest.created_at), 'MMMM d, yyyy')}`);
      lines.push(`File: ${latest.file_name}`);
      lines.push(`Analysis Score: ${latest.overall_score}/100`);
      if (latest.primary_issue) lines.push(`Primary Issue: ${latest.primary_issue}`);
      lines.push(`Videos Analyzed: ${sportAnalyses.length}`);
      lines.push('');
      lines.push('Note: Video analysis scores are pose-based estimates. Use as relative trend indicators.');
    }

    // ── Training progress ─────────────────────────────────────
    lines.push('');
    lines.push('--- Training Progress ---');
    lines.push(`Practice streak: ${training.streak_days} days`);
    lines.push(`Drills completed: ${Object.keys(training.drills_completed).length}`);
    lines.push(`Total ${sportName} sessions: ${sorted.length}`);
    if (training.active_diagnosis_id) {
      lines.push(`Currently working on: ${training.active_diagnosis_id.replace(/_/g, ' ')}`);
    }

    lines.push('');
    lines.push('Generated by SwingIQ — swingiq.app');

    return lines.join('\n');
  }, [sorted, profile, clubs, training, sessions, activeSport, isGolf, sportAnalyses, sportName, sportProfiles]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coachReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea');
      el.value = coachReport;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <>
      <style>{`
        @media print {
          nav, aside, [data-sidebar], button { display: none !important; }
          .print\\:hidden { display: none !important; }
          body { font-size: 12px; }
          pre { white-space: pre-wrap; word-break: break-all; }
        }
      `}</style>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {sportEmoji} {sportName} Reports
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Detailed views of your {sportName.toLowerCase()} data — share with your coach or training partner.
          </p>
        </div>

        {/* Report types */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden">
          {REPORT_TYPES.map((report) => (
            <Card key={report.title} className={`border-2 ${report.color}`}>
              <CardBody className="space-y-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${report.color}`}
                >
                  <FileText size={22} className={report.iconColor} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{report.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {report.description}
                  </p>
                </div>
                <Link href={report.href}>
                  <Button size="sm" variant="outline" className="mt-1">
                    {report.cta} <ChevronRight size={14} />
                  </Button>
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Recent sessions as "reports" */}
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
          </CardHeader>
          <CardBody>
            {sorted.length === 0 ? (
              <div className="text-center py-8">
                <Activity size={32} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm mb-4">
                  No sessions yet. Import a CSV to generate your first report.
                </p>
                <Link href="/sessions/import">
                  <Button size="sm">
                    <Upload size={14} /> Import Session
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {sorted.slice(0, 8).map((s) => (
                  <Link
                    key={s.id}
                    href={`/sessions/${s.id}`}
                    className="flex items-center justify-between py-2.5 px-2 border-b last:border-0 hover:bg-muted rounded-sm transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {s.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(s.created_at), 'MMM d, yyyy')} · {s.shot_count} shots
                        </p>
                        <Badge variant="default" className="text-xs">
                          {s.club_name}
                        </Badge>
                        {s.diagnoses.length > 0 && (
                          <Badge variant="warning" className="text-xs">
                            ⚠ {s.diagnoses[0]?.rule?.name ?? 'Diagnosed'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      {s.swing_score !== null && (
                        <div className="text-right">
                          <p className="text-lg font-bold text-foreground">{s.swing_score}</p>
                          <p className="text-xs text-muted-foreground">Score</p>
                        </div>
                      )}
                      <ChevronRight
                        size={16}
                        className="text-muted-foreground group-hover:text-muted-foreground transition-colors"
                      />
                    </div>
                  </Link>
                ))}
                {sorted.length > 8 && (
                  <div className="pt-2 text-center">
                    <Link href="/sessions">
                      <Button variant="ghost" size="sm">
                        View all {sorted.length} sessions
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Plain-English coach prep + questions (agent layer) */}
        <CoachSummaryCard />

        {/* What this report is based on */}
        <div className="print:hidden">
          <AnalysisTransparency
            resultNoun="report"
            basedOn={[
              `${sorted.length} ${sportName} session${sorted.length === 1 ? '' : 's'}`,
              isGolf
                ? (profile ? 'Your golf profile' : 'No golf profile added yet')
                : ((sportProfiles as Record<string, unknown>)[activeSport] ? `Your ${sportName} profile` : `No ${sportName} profile added yet`),
              ...(!isGolf && sportAnalyses.length > 0
                ? [`${sportAnalyses.length} video analysis record${sportAnalyses.length === 1 ? '' : 's'} (pose-based estimates)`]
                : []),
              'Your training progress (streak, drills completed)',
            ]}
            videoAnalyzed={false}
            confidence={{
              level: sorted.length >= 3 ? 'medium' : 'low',
              score: Math.min(70, 25 + sorted.length * 8),
              reason: `summary built from ${sorted.length} session${sorted.length === 1 ? '' : 's'}`,
            }}
            whatImproves={[
              'Log more sessions for a fuller picture',
              isGolf ? 'Import launch-monitor data for measured numbers' : 'Add more video analyses',
              'Complete your player profile',
              'Have a qualified coach review this summary',
            ]}
          />
        </div>

        {/* Coach Report Generator */}
        <Card className="border-primary/30 bg-primary/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-primary" />
                <CardTitle className="text-primary">Share with Your Coach</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.print()}
                >
                  <Printer size={14} /> Print / PDF
                </Button>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <><CheckCircle size={14} /> Copied!</>
                  ) : (
                    <><Copy size={14} /> Copy Report</>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-xs text-primary mb-3">
              Copy a formatted text summary to share with your golf coach, club fitter, or training partner.
              Includes scores, ball data, diagnoses, and training progress.
            </p>
            <pre className="bg-card rounded-lg border border-primary/30 p-3 text-xs text-foreground font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
              {coachReport}
            </pre>
          </CardBody>
        </Card>

        {/* Export note */}
        <Card className="border-dashed border-border print:hidden">
          <CardBody className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">PDF export & share links</span>{' '}
              — coming in a future update. For now, use your browser&apos;s Print → Save as PDF
              on any session detail page.
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
