'use client';

import { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { VideoDrillRecommendation, DrillOutcome } from '@swingiq/core';

interface DrillCardProps {
  drill: VideoDrillRecommendation;
  onInteraction?: (drillId: string, outcome: DrillOutcome) => void;
  className?: string;
}

const SKILL_LABEL: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  elite: 'Elite',
};

export function DrillCard({ drill, onInteraction, className }: DrillCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [interacted, setInteracted] = useState<DrillOutcome | null>(null);

  const handleInteraction = (outcome: DrillOutcome) => {
    setInteracted(outcome);
    onInteraction?.(drill.id, outcome);
  };

  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white overflow-hidden', className)}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-gray-900">{drill.name}</h3>
              <Badge variant="default" className="text-xs">
                {SKILL_LABEL[drill.skill_level] ?? drill.skill_level}
              </Badge>
            </div>
            <p className="text-xs text-gray-600 mt-1">{drill.goal}</p>
          </div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-0.5"
            aria-label={expanded ? 'Collapse drill' : 'Expand drill'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Reps / duration badge */}
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
          <span className="bg-gray-100 px-2 py-0.5 rounded-full">{drill.reps_or_duration}</span>
          {drill.coach_channel_hint && (
            <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
              💡 {drill.coach_channel_hint}
            </span>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          {/* Steps */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">How to do it</p>
            <ol className="space-y-1.5">
              {drill.steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Feel cue */}
          {drill.focus_feel && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs font-semibold text-amber-800 mb-0.5">Feel cue</p>
              <p className="text-xs text-amber-700 italic">"{drill.focus_feel}"</p>
            </div>
          )}

          {/* YouTube link */}
          <a
            href={drill.youtube_search_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 hover:bg-red-100 transition-colors"
            onClick={() => handleInteraction('felt_helpful')}
          >
            <Youtube className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 font-medium">Search YouTube: {drill.youtube_search_query}</span>
            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
          </a>

          {/* Feedback buttons */}
          {!interacted ? (
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Was this drill relevant to your swing?</p>
              <div className="flex gap-2 flex-wrap">
                {(
                  [
                    { outcome: 'felt_helpful', label: '✓ Helpful' },
                    { outcome: 'too_hard', label: 'Too hard' },
                    { outcome: 'too_easy', label: 'Too easy' },
                    { outcome: 'irrelevant', label: 'Not relevant' },
                  ] as { outcome: DrillOutcome; label: string }[]
                ).map(({ outcome, label }) => (
                  <button
                    key={outcome}
                    onClick={() => handleInteraction(outcome)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-green-600 font-medium">
              ✓ Feedback recorded — your preferences will be used to personalise future recommendations.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
