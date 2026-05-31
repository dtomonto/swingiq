'use client';

// ============================================================
// SwingIQ — Non-Golf Training Content
// Sport-specific training for tennis, baseball, and softball.
// Shows drills from the latest video analysis, a drill checklist,
// and a retest CTA. Golf uses TrainingContent.tsx (unchanged).
// ============================================================

import { useState, useMemo } from 'react';
import {
  ExternalLink, CheckCircle, Clock, Target, AlertCircle,
  ChevronDown, ChevronUp, Zap, Video, TrendingUp,
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  TENNIS_DRILLS,
  BASEBALL_DRILLS,
  SLOW_PITCH_DRILLS,
  FAST_PITCH_DRILLS,
  getSportConfig,
} from '@swingiq/core';
import type { SportId, SportDrillRecommendation } from '@swingiq/core';
import { useSwingIQStore } from '@/store';
import { useSport } from '@/contexts/SportContext';
import Link from 'next/link';
import { format } from 'date-fns';

// Map sport id → drill list
const SPORT_DRILL_MAP: Record<Exclude<SportId, 'golf'>, SportDrillRecommendation[]> = {
  tennis: TENNIS_DRILLS,
  baseball: BASEBALL_DRILLS,
  softball_slow: SLOW_PITCH_DRILLS,
  softball_fast: FAST_PITCH_DRILLS,
};

function SportDrillCard({
  drill,
  completed,
  onToggle,
}: {
  drill: SportDrillRecommendation;
  completed: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-colors ${
        completed ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        <button
          onClick={onToggle}
          className="flex-shrink-0 mt-0.5"
          aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
              completed ? 'bg-green-500' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {completed && <CheckCircle size={14} className="text-white" />}
          </div>
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-semibold text-sm ${completed ? 'text-green-700 line-through' : 'text-gray-900'}`}>
              {drill.name}
            </p>
            <Badge variant="default" className="text-xs capitalize">{drill.difficulty}</Badge>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{drill.goal}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
            {drill.reps_or_duration && <span className="flex items-center gap-1"><Clock size={10} />{drill.reps_or_duration}</span>}
            {drill.equipment_needed && <span>🎯 {drill.equipment_needed}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <a
            href={drill.youtube_search_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1.5 bg-red-600 text-white rounded text-xs hover:bg-red-700"
          >
            <ExternalLink size={10} /> YT
          </a>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
          {drill.safety_note && (
            <div className="rounded bg-yellow-50 border border-yellow-200 px-3 py-2">
              <p className="text-xs text-yellow-800">⚠ {drill.safety_note}</p>
            </div>
          )}
          <ol className="space-y-1.5">
            {drill.steps.map((step, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="font-bold text-green-600 flex-shrink-0 w-4">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
          {drill.focus_feel && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3">
              <p className="text-xs font-semibold text-green-700 mb-0.5">Focus feel</p>
              <p className="text-sm text-gray-700 italic">&ldquo;{drill.focus_feel}&rdquo;</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function NonGolfTrainingContent() {
  const { activeSport, isGolf, sportEmoji, sportName, sportLabels } = useSport();
  const { video_analyses, training, recordPractice } = useSwingIQStore();
  const [completedDrills, setCompletedDrills] = useState<Set<string>>(new Set());

  // Derive sport before hooks that depend on it — default to 'tennis' when isGolf to
  // satisfy hook rules (all hooks must run unconditionally before any early return).
  const sport = (isGolf ? 'tennis' : activeSport) as Exclude<SportId, 'golf'>;
  const sportConfig = getSportConfig(sport);
  const allDrills = SPORT_DRILL_MAP[sport] ?? [];

  // Latest video analysis for this sport
  const latestAnalysis = useMemo(
    () =>
      video_analyses
        .filter((v) => v.sport === activeSport && v.primary_issue)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] ?? null,
    [video_analyses, activeSport],
  );

  // Drills for the primary issue from the latest video
  const recommendedDrills = useMemo(() => {
    if (!latestAnalysis?.primary_issue) return allDrills.slice(0, 4);
    // Filter to drills matching the primary issue ID
    const issueDrills = allDrills.filter(
      (d) => d.issue_id && latestAnalysis.primary_issue &&
             latestAnalysis.primary_issue.toLowerCase().includes(d.issue_id.replace(/_/g, ' ').split(' ')[0] ?? '')
    );
    return issueDrills.length > 0 ? issueDrills.slice(0, 5) : allDrills.slice(0, 4);
  }, [allDrills, latestAnalysis]);

  const toggle = (drillId: string) => {
    setCompletedDrills((prev) => {
      const next = new Set(prev);
      if (next.has(drillId)) {
        next.delete(drillId);
      } else {
        next.add(drillId);
        recordPractice();
      }
      return next;
    });
  };

  // Golf is handled by TrainingContent — safe to return after all hooks have run
  if (isGolf) return null;

  const completedCount = completedDrills.size;
  const totalCount = recommendedDrills.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const hasNoAnalysis = !latestAnalysis && video_analyses.filter((v) => v.sport === activeSport).length === 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {sportEmoji} {sportName} Training
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {latestAnalysis
              ? `Based on: ${latestAnalysis.primary_issue ?? 'Latest video analysis'}`
              : `Sample ${sportName} drills — upload a video for personalized recommendations`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {training.streak_days > 0 && (
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">🔥 {training.streak_days}</p>
              <p className="text-xs text-gray-500">day streak</p>
            </div>
          )}
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">{progress}%</p>
            <p className="text-xs text-gray-500">Complete</p>
          </div>
        </div>
      </div>

      {/* No data banner */}
      {hasNoAnalysis && (
        <Card className="border-amber-200 bg-amber-50">
          <CardBody className="flex items-center gap-3">
            <Zap size={18} className="text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">No {sportName} analysis yet</p>
              <p className="text-xs text-amber-600">
                Upload a video to get drills matched to your specific issue.
              </p>
              <Link href="/video" className="text-xs font-semibold text-green-700 hover:underline mt-1 block">
                Analyze your first video →
              </Link>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Latest analysis context */}
      {latestAnalysis && (
        <Card className="border-l-4 border-l-red-500">
          <CardBody className="flex items-start gap-3">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-0.5">Training focus from latest analysis</p>
              <p className="font-bold text-gray-900">{latestAnalysis.primary_issue}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {format(new Date(latestAnalysis.created_at), 'MMM d, yyyy')} · Score: {latestAnalysis.overall_score}/100
              </p>
            </div>
            <Link href="/video">
              <Button variant="outline" size="sm">Re-Analyze</Button>
            </Link>
          </CardBody>
        </Card>
      )}

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Drill checklist */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Drill Plan
              <span className="text-sm font-normal text-gray-500 ml-2">
                {completedCount}/{totalCount} done
              </span>
            </CardTitle>
            {progress === 100 && (
              <Badge variant="success" className="text-xs">✓ Session Complete!</Badge>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Check off each drill as you complete it. Your streak updates automatically.
          </p>
        </CardHeader>
        <CardBody className="space-y-3">
          {recommendedDrills.map((drill) => (
            <SportDrillCard
              key={drill.id}
              drill={drill}
              completed={completedDrills.has(drill.id)}
              onToggle={() => toggle(drill.id)}
            />
          ))}
        </CardBody>
      </Card>

      {/* Phase reference */}
      {sportConfig && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target size={16} className="text-gray-500" />
              <CardTitle>Swing Phase Reference</CardTitle>
            </div>
          </CardHeader>
          <CardBody>
            <div className="flex flex-wrap gap-2">
              {sportConfig.phase_sequence.map((phase, i) => {
                const def = sportConfig.phases[phase];
                return (
                  <div
                    key={phase}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg"
                    title={def?.coaching_cue ?? ''}
                  >
                    <span className="text-xs font-bold text-gray-500">{i + 1}</span>
                    <span className="text-xs font-medium text-gray-700">{def?.label ?? phase}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Hover any phase to see the coaching cue. These are the movement phases your video analysis evaluates.
            </p>
          </CardBody>
        </Card>
      )}

      {/* Evidence note */}
      {sportConfig?.evidence_note && (
        <Card className="border-dashed border-gray-200 bg-gray-50">
          <CardBody>
            <p className="text-xs text-gray-500 leading-relaxed">
              <span className="font-semibold text-gray-600">About these benchmarks: </span>
              {sportConfig.evidence_note}
            </p>
          </CardBody>
        </Card>
      )}

      {/* CTAs */}
      <div className="flex gap-3">
        <Link href="/video" className="flex-1">
          <Button variant="outline" className="w-full">
            <Video size={14} /> Upload New Video
          </Button>
        </Link>
        <Link href="/drills" className="flex-1">
          <Button className="w-full">
            <TrendingUp size={14} /> Full Drill Library
          </Button>
        </Link>
      </div>
    </div>
  );
}
