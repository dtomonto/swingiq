'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, ChevronDown, ChevronUp, Info, Target } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { DrillCard } from './DrillCard';
import { cn } from '@/lib/utils';
import type { SwingVideoAnalysis, DetectedSwingIssue, DrillOutcome, SwingPhaseSegment } from '@swingiq/core';
import { SWING_PHASE_DEFINITIONS } from '@swingiq/core';

interface CoachingPanelProps {
  analysis: SwingVideoAnalysis;
  activePhase: SwingPhaseSegment | null;
  onDrillInteraction?: (drillId: string, outcome: DrillOutcome) => void;
  className?: string;
}

const SEVERITY_CONFIG = {
  critical: { variant: 'critical' as const, icon: AlertCircle, label: 'Critical', color: 'text-red-600' },
  notable:  { variant: 'warning' as const,  icon: AlertCircle, label: 'Notable',  color: 'text-amber-600' },
  minor:    { variant: 'info' as const,      icon: Info,        label: 'Minor',    color: 'text-blue-600' },
  watch:    { variant: 'default' as const,   icon: Info,        label: 'Watch',    color: 'text-gray-600' },
};

function IssueCard({ issue }: { issue: DetectedSwingIssue }) {
  const [expanded, setExpanded] = useState(false);
  const config = SEVERITY_CONFIG[issue.severity];
  const Icon = config.icon;

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900">{issue.label}</span>
            <Badge variant={config.variant} className="text-xs">{config.label}</Badge>
            {issue.is_estimated && (
              <span className="text-xs text-amber-600">⚠ Estimated</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{issue.description}</p>
        </div>
        <div className="flex-shrink-0 text-gray-400">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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
          {issue.is_estimated && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-700">
                <strong>Note:</strong> This detection is based on heuristic estimation,
                not measured from your video pixels. Use this as a starting point for
                your own observation.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CoachingPanel({
  analysis,
  activePhase,
  onDrillInteraction,
  className,
}: CoachingPanelProps) {
  const [activeTab, setActiveTab] = useState<'issues' | 'phase' | 'drills' | 'ai'>('issues');

  const phaseDef = activePhase ? SWING_PHASE_DEFINITIONS[activePhase.phase] : null;

  const tabs = [
    { id: 'issues' as const,  label: 'Issues',   count: analysis.detected_issues.length },
    { id: 'phase' as const,   label: 'Phase tips',count: null },
    { id: 'drills' as const,  label: 'Drills',   count: analysis.drill_recommendations.length },
    { id: 'ai' as const,      label: 'AI Coach', count: null },
  ];

  return (
    <div className={cn('flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden', className)}>
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500',
              activeTab === tab.id
                ? 'text-green-700 border-b-2 border-green-600 bg-green-50/50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
            )}
          >
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className={cn(
                'ml-1.5 text-xs px-1.5 py-0.5 rounded-full',
                activeTab === tab.id ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">

        {/* Issues tab */}
        {activeTab === 'issues' && (
          <>
            {analysis.detected_issues.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center gap-3">
                <CheckCircle className="w-10 h-10 text-green-400" />
                <p className="text-sm font-semibold text-gray-700">No issues detected</p>
                <p className="text-xs text-gray-500 max-w-xs">
                  No patterns were detected with the available heuristic analysis. Add a camera
                  angle and review more phases to improve detection accuracy.
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
                  <strong>⚠ Estimated analysis:</strong> These detections are based on geometric
                  heuristics, not real pose measurement from your video. Use them as prompts for
                  your own observation, not definitive diagnoses.
                </div>
                {analysis.detected_issues.map((issue) => (
                  <IssueCard key={issue.id} issue={issue} />
                ))}
              </>
            )}
          </>
        )}

        {/* Phase coaching tab */}
        {activeTab === 'phase' && (
          <>
            {!phaseDef ? (
              <p className="text-sm text-gray-500 text-center py-8">
                Play the video to see phase-specific coaching tips.
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">{phaseDef.label}</h3>
                  <p className="text-sm text-gray-600 mt-1">{phaseDef.description}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">Key checkpoints</p>
                  <ul className="space-y-1.5">
                    {phaseDef.key_checkpoints.map((cp, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {cp}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                  <p className="text-xs font-semibold text-green-800 mb-1">Feel cue</p>
                  <p className="text-sm text-green-700 italic">&ldquo;{phaseDef.coaching_cue}&rdquo;</p>
                </div>

                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <p className="text-xs font-semibold text-blue-800 mb-1">Technical cue</p>
                  <p className="text-sm text-blue-700">{phaseDef.technical_cue}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">Common errors</p>
                  <ul className="space-y-1.5">
                    {phaseDef.common_errors.map((err, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </>
        )}

        {/* Drills tab */}
        {activeTab === 'drills' && (
          <>
            {analysis.drill_recommendations.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No drills available for the detected issues.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  Drills are matched to the detected issues above. Click each to expand and see steps.
                </p>
                {analysis.drill_recommendations.map((drill) => (
                  <DrillCard
                    key={drill.id}
                    drill={drill}
                    onInteraction={onDrillInteraction}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* AI Coach tab */}
        {activeTab === 'ai' && (
          <div className="space-y-3">
            {analysis.ai_narrative ? (
              <div className="prose prose-sm max-w-none text-gray-700">
                <p>{analysis.ai_narrative}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center space-y-3">
                <Target className="w-8 h-8 text-gray-400 mx-auto" />
                <p className="text-sm font-semibold text-gray-700">AI narrative not generated</p>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  AI coaching is generated server-side when enabled. Configure{' '}
                  <code className="bg-gray-100 px-1 rounded">AI_PROVIDER</code> in your environment
                  variables to activate it.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
