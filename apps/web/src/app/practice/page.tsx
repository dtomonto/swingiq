'use client';

import { useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
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
import { useSwingIQStore, useLatestDiagnosedSession } from '@/store';

const INTENSITY_COLORS: Record<string, string> = {
  warmup: 'bg-blue-100 text-blue-700',
  main: 'bg-green-100 text-green-700',
  challenge: 'bg-orange-100 text-orange-700',
  cool_down: 'bg-gray-100 text-gray-600',
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
      <Card className="border-dashed border-gray-200 opacity-70">
        <CardBody className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-400 w-8">{day.day}</span>
              <Coffee size={14} className="text-gray-300" />
              <span className="text-sm text-gray-400">Rest Day</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2 ml-10 italic">{day.mental_tip}</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardBody>
        <button
          className="w-full flex items-center justify-between text-left"
          onClick={() => setOpen(!open)}
        >
          <div className="flex items-center gap-3">
            <span className="font-bold text-gray-900 w-8">{day.day}</span>
            <div>
              <p className="text-sm font-semibold text-gray-900">{day.session_label}</p>
              <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                <Clock size={10} />
                {day.total_minutes} min · {day.balls_needed} balls
              </p>
            </div>
          </div>
          <span className="text-xs text-green-600 font-medium">
            {open ? '▲ Hide' : '▼ Details'}
          </span>
        </button>

        {open && (
          <div className="mt-4 space-y-3">
            {day.blocks.map((block, i) => (
              <div
                key={i}
                className="flex gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200"
              >
                <span
                  className={cn(
                    'text-xs font-semibold px-2 py-0.5 rounded-full h-fit mt-0.5',
                    INTENSITY_COLORS[block.intensity] ?? 'bg-gray-100 text-gray-600',
                  )}
                >
                  {INTENSITY_LABELS[block.intensity] ?? block.intensity}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{block.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    {block.description}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">
                      {block.duration_minutes} min · Focus: {block.focus_metric.replace(/_/g, ' ')}
                    </span>
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(block.youtube_search_query)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-red-600 hover:underline"
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
  const { sessions, profile } = useSwingIQStore();
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
    <AppShell>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Practice Schedule</h1>
            <p className="text-gray-500 text-sm mt-1">
              {hasRealData
                ? `Personalized for: ${diagnosisName}`
                : 'Import session data for a personalized schedule'}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as PracticeFrequency)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none bg-white"
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
              <label className="text-xs text-gray-500 block mb-1">Session Length</label>
              <select
                value={sessionLength}
                onChange={(e) => setSessionLength(e.target.value as SessionLength)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none bg-white"
              >
                <option value="short">Short (20 min)</option>
                <option value="medium">Medium (45 min)</option>
                <option value="long">Long (90 min)</option>
              </select>
            </div>
          </div>
        </div>

        {/* No data banner */}
        {!hasRealData && (
          <Card className="border-amber-200 bg-amber-50">
            <CardBody className="flex items-center gap-3">
              <Zap size={18} className="text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Using a sample schedule — no diagnosis yet
                </p>
                <p className="text-xs text-amber-600">
                  Import your launch monitor data to get a schedule built specifically for your swing faults.
                </p>
                <Link
                  href="/sessions/import"
                  className="text-xs font-semibold text-green-700 hover:underline mt-1 block"
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
              <p className="text-2xl font-bold text-gray-900">{practiceCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">Sessions/week</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center py-4">
              <p className="text-2xl font-bold text-gray-900">{schedule.total_balls}</p>
              <p className="text-xs text-gray-500 mt-0.5">Balls/week</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center py-4">
              <p className="text-sm font-bold text-green-700 leading-tight">
                {schedule.key_focus.replace(/_/g, ' ').toUpperCase()}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Key Focus</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center py-4">
              <div className="flex items-center justify-center gap-1">
                <Target size={16} className="text-green-600" />
                <p className="text-xs font-bold text-green-700">Active</p>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">This Week</p>
            </CardBody>
          </Card>
        </div>

        {/* Success criteria */}
        <Card className="border-green-200 bg-green-50">
          <CardBody className="flex items-start gap-3">
            <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800 mb-0.5">Success Goal for This Week</p>
              <p className="text-sm text-green-700 leading-relaxed">{schedule.success_criteria}</p>
            </div>
          </CardBody>
        </Card>

        {/* Weekly calendar */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={18} className="text-gray-600" />
            <h2 className="text-lg font-bold text-gray-900">This Week</h2>
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
    </AppShell>
  );
}
