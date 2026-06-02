'use client';

import { useMemo, useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Calendar,
  Clock,
  Target,
  ExternalLink,
  Coffee,
  Zap,
  CheckCircle,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  generateWeeklySchedule,
  type WeeklySchedule,
  type PracticeFrequency,
  type SessionLength,
  type WeekDay,
} from '@swingiq/core';
import { useLatestDiagnosedSession } from '@/store';
import { FixStackPanel } from '@/components/drillmatch';

const INTENSITY_COLORS: Record<string, string> = {
  warmup: 'bg-accent-secondary/15 text-accent-secondary',
  main: 'bg-primary/15 text-primary',
  challenge: 'bg-warning/15 text-warning',
  cool_down: 'bg-muted text-muted-foreground',
};

const INTENSITY_LABELS: Record<string, string> = {
  warmup: 'Warm-Up',
  main: 'Main Work',
  challenge: 'Retest',
  cool_down: 'Cool-Down',
};

function PracticeDayCard({ day }: { day: WeekDay }) {
  const [open, setOpen] = useState(false);

  if (day.rest) {
    return (
      <Card className="border-dashed border-border opacity-70">
        <CardBody className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-muted-foreground w-8">{day.day}</span>
              <Coffee size={14} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Rest Day</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 ml-10 italic">{day.mental_tip}</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-primary">
      <CardBody>
        <button
          className="w-full flex items-center justify-between text-left"
          onClick={() => setOpen(!open)}
        >
          <div className="flex items-center gap-3">
            <span className="font-bold text-foreground w-8">{day.day}</span>
            <div>
              <p className="text-sm font-semibold text-foreground">{day.session_label}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <Clock size={10} />
                {day.total_minutes} min · {day.balls_needed} balls
              </p>
            </div>
          </div>
          <span className="text-xs text-primary font-medium">
            {open ? '▲ Hide' : '▼ Details'}
          </span>
        </button>

        {open && (
          <div className="mt-4 space-y-3">
            {day.blocks.map((block, i) => (
              <div
                key={i}
                className="flex gap-3 p-3 rounded-lg bg-muted border border-border"
              >
                <span
                  className={cn(
                    'text-xs font-semibold px-2 py-0.5 rounded-full h-fit mt-0.5',
                    INTENSITY_COLORS[block.intensity] ?? 'bg-muted text-muted-foreground',
                  )}
                >
                  {INTENSITY_LABELS[block.intensity] ?? block.intensity}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{block.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {block.description}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {block.duration_minutes} min · Focus: {block.focus_metric.replace(/_/g, ' ')}
                    </span>
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(block.youtube_search_query)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-error hover:underline"
                    >
                      <ExternalLink size={10} />
                      YouTube
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export default function PracticePage() {
  const latestDiagnosed = useLatestDiagnosedSession();

  const [frequency, setFrequency] = useState<PracticeFrequency>('3x');
  const [sessionLength, setSessionLength] = useState<SessionLength>('medium');

  const diagnosisId =
    latestDiagnosed?.diagnoses[0]?.rule?.id ?? 'slice_weak_fade';
  const diagnosisName =
    latestDiagnosed?.diagnoses[0]?.rule?.name ?? 'General Swing Practice';

  const successCriteria =
    latestDiagnosed?.diagnoses[0]?.rule?.retest?.success_criteria ??
    'Improve primary metric by 20% vs. baseline.';

  const schedule = useMemo<WeeklySchedule>(
    () => generateWeeklySchedule(diagnosisId, diagnosisName, frequency, sessionLength, successCriteria),
    [diagnosisId, diagnosisName, frequency, sessionLength, successCriteria],
  );

  const practiceCount = schedule.days.filter((d) => !d.rest).length;
  const hasRealData = !!latestDiagnosed;

  return (
    <>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Practice Schedule</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {hasRealData
                ? `Personalized for: ${diagnosisName}`
                : 'Import session data for a personalized schedule'}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <label htmlFor="practice-frequency" className="text-xs text-muted-foreground block mb-1">Frequency</label>
              <select
                id="practice-frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as PracticeFrequency)}
                className="text-sm border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-ring outline-hidden bg-card"
              >
                <option value="1x">1×/week</option>
                <option value="2x">2×/week</option>
                <option value="3x">3×/week</option>
                <option value="4x">4×/week</option>
                <option value="5x">5×/week</option>
                <option value="daily">Daily</option>
              </select>
            </div>
            <div>
              <label htmlFor="practice-session-length" className="text-xs text-muted-foreground block mb-1">Session Length</label>
              <select
                id="practice-session-length"
                value={sessionLength}
                onChange={(e) => setSessionLength(e.target.value as SessionLength)}
                className="text-sm border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-ring outline-hidden bg-card"
              >
                <option value="short">Short (20 min)</option>
                <option value="medium">Medium (45 min)</option>
                <option value="long">Long (90 min)</option>
              </select>
            </div>
          </div>
        </div>

        {/* One Fix First — the highest-leverage fix, before the full week */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Start with one fix</h2>
            <Link href="/fix" className="text-xs text-primary hover:underline">
              Open Fix Stack →
            </Link>
          </div>
          <FixStackPanel />
        </div>

        {/* No data banner */}
        {!hasRealData && (
          <Card className="border-warning/30 bg-warning/10">
            <CardBody className="flex items-center gap-3">
              <Zap size={18} className="text-warning shrink-0" />
              <div>
                <p className="text-sm font-medium text-warning">
                  Using a sample schedule — no diagnosis yet
                </p>
                <p className="text-xs text-warning">
                  Import your launch monitor data to get a schedule built specifically for your swing faults.
                </p>
                <Link
                  href="/sessions/import"
                  className="text-xs font-semibold text-primary hover:underline mt-1 block"
                >
                  Import your first session →
                </Link>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Summary strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardBody className="text-center py-4">
              <p className="text-2xl font-bold text-foreground">{practiceCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Sessions/week</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center py-4">
              <p className="text-2xl font-bold text-foreground">{schedule.total_balls}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Balls/week</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center py-4">
              <p className="text-sm font-bold text-primary leading-tight">
                {schedule.key_focus.replace(/_/g, ' ').toUpperCase()}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Key Focus</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center py-4">
              <div className="flex items-center justify-center gap-1">
                <Target size={16} className="text-primary" />
                <p className="text-xs font-bold text-primary">Active</p>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">This Week</p>
            </CardBody>
          </Card>
        </div>

        {/* Success criteria */}
        <Card className="border-primary/30 bg-primary/10">
          <CardBody className="flex items-start gap-3">
            <CheckCircle size={18} className="text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-primary mb-0.5">Success Goal for This Week</p>
              <p className="text-sm text-primary leading-relaxed">{schedule.success_criteria}</p>
            </div>
          </CardBody>
        </Card>

        {/* Weekly calendar */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={18} className="text-muted-foreground" />
            <h2 className="text-lg font-bold text-foreground">This Week</h2>
          </div>
          {schedule.days.map((day) => (
            <PracticeDayCard key={day.day} day={day} />
          ))}
        </div>

        {/* CTA */}
        <div className="flex gap-3">
          <Link href="/sessions/import" className="flex-1">
            <Button variant="outline" className="w-full">
              <Upload size={14} /> Import Retest Session
            </Button>
          </Link>
          <Link href="/diagnose" className="flex-1">
            <Button className="w-full">
              <Target size={14} /> Run New Diagnosis
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
