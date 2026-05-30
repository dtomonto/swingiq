'use client';

// ============================================================
// SwingIQ — Multi-Sport Video Analyzer
// Used for tennis, baseball, slow-pitch, and fast-pitch softball.
// Mirrors the golf VideoAnalyzerContent structure but dispatches
// to sport-specific phases, drills, and coaching content.
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, Loader2, AlertCircle, Zap, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { VideoUpload, VideoPreviewCard } from '@/components/video/VideoUpload';
import { SwingVideoPlayer } from '@/components/video/SwingVideoPlayer';
import { FeedbackPanel } from '@/components/video/FeedbackPanel';
import { SportCardGrid } from '@/components/sport/SportSelector';
import { useSport } from '@/contexts/SportContext';
import {
  getSportConfig,
  runSportAnalysis,
  ALL_SPORTS_INCLUDING_GOLF,
  SPORT_CAMERA_ANGLES,
} from '@swingiq/core';
import type {
  SportId,
  SportSwingAnalysis,
  SportPhaseSegment,
  SportDetectedIssue,
  SportDrillRecommendation,
} from '@swingiq/core';
import type { SwingVideoMetadata, FeedbackRating } from '@swingiq/core';
import { validateVideoFile, extractVideoMetadata } from '@/lib/video-metadata';

type AnalysisStep = 'upload' | 'configure' | 'analyzing' | 'results';

// ──────────────────────────────────────────────────────────────
// Phase Timeline (sport-agnostic)
// ──────────────────────────────────────────────────────────────

function SportPhaseTimeline({
  segments,
  currentTime,
}: {
  segments: SportPhaseSegment[];
  currentTime: number;
}) {
  const qualifying = segments.filter((p) => currentTime >= p.start_time);
  const activePhase = qualifying.length > 0 ? qualifying[qualifying.length - 1] : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Swing Phases</p>
        <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
          ⚠ Estimated timing
        </span>
      </div>
      <div className="flex gap-1 flex-wrap">
        {segments.map((seg) => {
          const isActive = activePhase?.phase === seg.phase;
          return (
            <span
              key={seg.phase}
              className={cn(
                'px-2 py-1 rounded text-xs font-medium border',
                isActive
                  ? 'bg-golf-fairway text-white border-golf-fairway shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200',
              )}
            >
              {seg.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Issue Card
// ──────────────────────────────────────────────────────────────

function SportIssueCard({ issue }: { issue: SportDetectedIssue }) {
  const [expanded, setExpanded] = useState(false);
  const SEVERITY_CONFIG = {
    critical: { color: 'text-red-600', bg: 'bg-red-50 border-red-200', badge: 'Critical' },
    notable:  { color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', badge: 'Notable' },
    minor:    { color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', badge: 'Minor' },
    watch:    { color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', badge: 'Watch' },
  };
  const cfg = SEVERITY_CONFIG[issue.severity];

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <AlertCircle className={cn('w-4 h-4 flex-shrink-0 mt-0.5', cfg.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900">{issue.label}</span>
            <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded border', cfg.bg, cfg.color)}>
              {cfg.badge}
            </span>
            <span className="text-xs text-amber-600">⚠ Estimated</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{issue.description}</p>
        </div>
      </button>
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">Likely cause</p>
            <p className="text-sm text-gray-700">{issue.likely_cause}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">What to look for</p>
            <p className="text-sm text-gray-700">{issue.visual_indicator}</p>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs text-amber-700">
              <strong>Note:</strong> This detection is based on heuristic estimation, not measured
              from your video pixels. Use this as a starting point for your own observation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Drill Card (sport)
// ──────────────────────────────────────────────────────────────

function SportDrillCard({ drill }: { drill: SportDrillRecommendation }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-lg">🎯</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{drill.name}</p>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{drill.goal}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-400 capitalize">{drill.difficulty}</span>
            <span className="text-gray-300">•</span>
            <span className="text-xs text-gray-400">{drill.reps_or_duration}</span>
          </div>
        </div>
      </button>
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
          {drill.equipment_needed && (
            <p className="text-xs text-gray-500">
              <strong>Equipment:</strong> {drill.equipment_needed}
            </p>
          )}
          {drill.safety_note && (
            <div className="rounded bg-yellow-50 border border-yellow-200 px-3 py-2">
              <p className="text-xs text-yellow-800">⚠ {drill.safety_note}</p>
            </div>
          )}
          <ol className="space-y-1.5">
            {drill.steps.map((step, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="font-bold text-golf-fairway flex-shrink-0">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="rounded-lg bg-golf-fairway/5 border border-golf-fairway/20 p-3">
            <p className="text-xs font-semibold text-golf-fairway mb-0.5">Focus feel</p>
            <p className="text-sm text-gray-700 italic">{drill.focus_feel}</p>
          </div>
          <a
            href={drill.youtube_search_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-red-600 hover:text-red-700 font-medium"
          >
            <span>▶</span>
            Search YouTube: {drill.youtube_search_query}
          </a>
          {drill.coach_channel_hint && (
            <p className="text-xs text-gray-400">Suggested channels: {drill.coach_channel_hint}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Phase Coaching Panel (sport-aware)
// ──────────────────────────────────────────────────────────────

function SportCoachingPanel({
  analysis,
  activePhase,
  sportId,
}: {
  analysis: SportSwingAnalysis;
  activePhase: SportPhaseSegment | null;
  sportId: Exclude<SportId, 'golf'>;
}) {
  const config = getSportConfig(sportId);
  const [tab, setTab] = useState<'issues' | 'phase' | 'drills'>('issues');

  const phaseDef = activePhase ? config?.phases[activePhase.phase] : null;

  const tabs = [
    { id: 'issues' as const, label: 'Issues', count: analysis.detected_issues.length },
    { id: 'phase' as const, label: 'Phase Tips', count: null },
    { id: 'drills' as const, label: 'Drills', count: analysis.drill_recommendations.length },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-gray-100">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 px-3 py-3 text-xs font-semibold transition-colors',
              tab === t.id
                ? 'text-golf-fairway border-b-2 border-golf-fairway -mb-px bg-golf-fairway/5'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {t.label}
            {t.count !== null && t.count > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-xs rounded-full bg-golf-fairway text-white">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {/* Issues tab */}
        {tab === 'issues' && (
          <>
            {analysis.detected_issues.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <p className="text-sm font-semibold text-gray-700">No major issues detected</p>
                <p className="text-xs text-gray-500">
                  Keep in mind these are heuristic estimates — use phase tips and drills
                  to continue improving.
                </p>
              </div>
            ) : (
              analysis.detected_issues.map((issue) => (
                <SportIssueCard key={issue.id} issue={issue} />
              ))
            )}
          </>
        )}

        {/* Phase tips tab */}
        {tab === 'phase' && (
          <>
            {phaseDef ? (
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{phaseDef.label}</h3>
                  <p className="text-xs text-gray-600 mt-1">{phaseDef.description}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1.5">Key checkpoints</p>
                  <ul className="space-y-1">
                    {phaseDef.key_checkpoints.map((c, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-700">
                        <span className="text-golf-fairway font-bold flex-shrink-0">✓</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                    <p className="text-xs font-bold text-blue-700 mb-1">Feel cue</p>
                    <p className="text-xs text-blue-800 italic">{phaseDef.coaching_cue}</p>
                  </div>
                  <div className="rounded-lg bg-purple-50 border border-purple-100 p-3">
                    <p className="text-xs font-bold text-purple-700 mb-1">Technical cue</p>
                    <p className="text-xs text-purple-800">{phaseDef.technical_cue}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1.5">Common errors</p>
                  <ul className="space-y-1">
                    {phaseDef.common_errors.map((e, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-700">
                        <span className="text-red-400 flex-shrink-0">✗</span>
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-sm text-gray-500">
                  Play the video or click a phase above to see coaching tips for that phase.
                </p>
              </div>
            )}
          </>
        )}

        {/* Drills tab */}
        {tab === 'drills' && (
          <>
            {analysis.drill_recommendations.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">
                No drill recommendations generated. Address detected issues above for targeted drills.
              </p>
            ) : (
              analysis.drill_recommendations.map((drill) => (
                <SportDrillCard key={drill.id} drill={drill} />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────

export function SportVideoAnalyzerContent() {
  const { activeSport, setActiveSport } = useSport();
  const [step, setStep] = useState<AnalysisStep>('upload');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<SwingVideoMetadata | null>(null);
  const [selectedSport, setSelectedSport] = useState<SportId>(activeSport);
  const [analysis, setAnalysis] = useState<SportSwingAnalysis | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [activePhase, setActivePhase] = useState<SportPhaseSegment | null>(null);

  useEffect(() => {
    return () => {
      if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
    };
  }, [videoObjectUrl]);

  // Sync active phase from currentTime
  useEffect(() => {
    if (!analysis) return;
    const qualifying = analysis.phase_segments.filter((p) => currentTime >= p.start_time);
    setActivePhase(qualifying.length > 0 ? qualifying[qualifying.length - 1] : null);
  }, [currentTime, analysis]);

  const handleTimeUpdate = useCallback((ct: number, dur: number) => {
    setCurrentTime(ct);
    setDuration(dur);
  }, []);

  const handleVideoReady = useCallback(
    (file: File, metadata: SwingVideoMetadata, objectUrl: string) => {
      setVideoFile(file);
      setVideoMetadata({ ...metadata, camera_angle: 'unknown' });
      setVideoObjectUrl(objectUrl);
      setStep('configure');
    },
    [],
  );

  const handleRemoveVideo = () => {
    if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
    setVideoFile(null);
    setVideoObjectUrl(null);
    setVideoMetadata(null);
    setStep('upload');
  };

  const handleAnalyze = async () => {
    if (!videoFile || !videoMetadata) return;
    setStep('analyzing');
    setAnalyzeError(null);
    try {
      // Run client-side heuristic analysis
      const result = runSportAnalysis({
        sport_id: selectedSport,
        user_id: 'local_user',
        metadata: {
          file_name: videoMetadata.file_name,
          file_size_bytes: videoMetadata.file_size_bytes,
          mime_type: videoMetadata.mime_type,
          duration_seconds: videoMetadata.duration_seconds,
          width: videoMetadata.width,
          height: videoMetadata.height,
          frame_rate_estimated: videoMetadata.frame_rate_estimated,
          camera_angle: videoMetadata.camera_angle,
        },
      });
      setAnalysis(result);
      setActiveSport(selectedSport);
      setStep('results');
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Analysis failed.');
      setStep('configure');
    }
  };

  const config = selectedSport !== 'golf' ? getSportConfig(selectedSport) : null;

  // ── Render ──────────────────────────────────────────────────

  // Step 1: Upload
  if (step === 'upload') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Swing Video Analyzer</h1>
          <p className="text-sm text-gray-500">
            Upload a video of your swing for phase-by-phase coaching across golf, tennis,
            baseball, and softball.
          </p>
        </div>

        {/* Sport picker inline */}
        <Card>
          <CardBody className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">Which sport are you analyzing?</p>
            <SportCardGrid selectedSport={selectedSport} onSelect={setSelectedSport} />
          </CardBody>
        </Card>

        <VideoUpload onVideoReady={handleVideoReady} />

        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              <strong>Evidence-informed coaching.</strong> SwingIQ benchmarks are periodically
              reviewed and updated based on current sports performance research. All detections are
              heuristic estimates — labeled ⚠ Estimated throughout.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Configure
  if (step === 'configure') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRemoveVideo}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Configure Analysis</h1>
        </div>

        {videoFile && videoMetadata && (
          <VideoPreviewCard
            file={videoFile}
            metadata={videoMetadata}
            onRemove={handleRemoveVideo}
          />
        )}

        <Card>
          <CardBody className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">Sport</p>
            <SportCardGrid selectedSport={selectedSport} onSelect={setSelectedSport} />
          </CardBody>
        </Card>

        {/* Sport-specific camera angle selector */}
        {config && (
          <Card>
            <CardBody className="space-y-3">
              <p className="text-sm font-semibold text-gray-700">
                Camera Angle <span className="text-xs font-normal text-gray-400">(helps improve phase timing estimates)</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(SPORT_CAMERA_ANGLES[selectedSport] ?? SPORT_CAMERA_ANGLES['golf']).map((opt) => {
                  const isSelected = (videoMetadata?.camera_angle ?? 'unknown') === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setVideoMetadata((prev) =>
                          prev ? { ...prev, camera_angle: opt.value } as typeof prev : prev,
                        )
                      }
                      className={`flex items-start gap-2 p-3 rounded-lg border text-left transition-colors ${
                        isSelected
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full border-2 mt-0.5 flex-shrink-0 ${isSelected ? 'border-green-500 bg-green-500' : 'border-gray-300'}`} />
                      <div>
                        <p className={`text-xs font-semibold ${isSelected ? 'text-green-700' : 'text-gray-700'}`}>{opt.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{opt.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        )}

        {analyzeError && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{analyzeError}</p>
          </div>
        )}

        <Button
          onClick={handleAnalyze}
          disabled={!videoFile || selectedSport === 'golf'}
          className="w-full"
          size="lg"
        >
          {selectedSport === 'golf'
            ? 'Select a non-golf sport above'
            : `Analyze ${config?.name ?? 'Swing'} Video`}
        </Button>
      </div>
    );
  }

  // Step 3: Analyzing
  if (step === 'analyzing') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-golf-fairway mx-auto" />
        <p className="text-lg font-semibold text-gray-800">Analyzing your swing…</p>
        <p className="text-sm text-gray-500">
          Estimating phase timing and identifying visual patterns.
        </p>
      </div>
    );
  }

  // Step 4: Results
  if (!analysis || !config) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => { setStep('configure'); setAnalysis(null); }}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>{config.emoji}</span>
              {config.name} Swing Analysis
            </h1>
            <p className="text-xs text-gray-500">
              Benchmark v{config.benchmark_version} — all detections are ⚠ estimated
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-golf-fairway">
            {analysis.overall_visual_score}
          </div>
          <div className="text-xs text-gray-400">Visual Score</div>
        </div>
      </div>

      {/* Evidence note */}
      <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 flex gap-2">
        <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">{config.evidence_note}</p>
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Video + phase timeline */}
        <div className="space-y-4">
          {videoObjectUrl && (
            <div className="relative rounded-2xl overflow-hidden bg-black">
              <SwingVideoPlayer
                objectUrl={videoObjectUrl}
                onTimeUpdate={handleTimeUpdate}
              />
            </div>
          )}
          {analysis.phase_segments.length > 0 && (
            <SportPhaseTimeline
              segments={analysis.phase_segments}
              currentTime={currentTime}
            />
          )}
        </div>

        {/* Right: Coaching panel */}
        <SportCoachingPanel
          analysis={analysis}
          activePhase={activePhase}
          sportId={selectedSport as Exclude<SportId, 'golf'>}
        />
      </div>

      {/* Feedback */}
      <FeedbackPanel
        analysisId={analysis.id}
        onSubmit={async (_data) => { /* TODO: persist via API */ }}
      />
    </div>
  );
}
