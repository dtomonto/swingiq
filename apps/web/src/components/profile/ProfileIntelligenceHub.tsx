'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Target, TrendingUp, ChevronDown } from 'lucide-react';
import type { SportId } from '@swingiq/core';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';
import { usePlayerProfileIntelligence } from '@/lib/player-profile/usePlayerProfileIntelligence';
import { SkillTreeGrid } from '@/components/skill-tree/SkillTreeGrid';

const severityVariant = (s: string): 'critical' | 'high' | 'medium' | 'default' =>
  s === 'critical' ? 'critical' : s === 'high' ? 'high' : s === 'medium' ? 'medium' : 'default';

export function ProfileIntelligenceHub({ sport }: { sport: SportId }) {
  const intel = usePlayerProfileIntelligence(sport);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    track(ANALYTICS_EVENTS.PLAYER_PROFILE_INTELLIGENCE_UPDATED, {
      sport,
      skill_level: '',
      archetype: intel.archetype?.label ?? 'none',
      confidence_score: intel.confidenceScore ?? 0,
    });
  }, [sport, intel.archetype?.label, intel.confidenceScore]);

  if (intel.dataCoverage === 'none') {
    return (
      <Card className="mb-5">
        <CardBody>
          <EmptyState
            icon={Sparkles}
            title="Your intelligence hub is almost ready"
            description="Complete your profile and log your first session to unlock your archetype, strengths, and a personalized focus."
            action={{ label: 'Upload your first swing', href: '/motion-lab' }}
            compact
          />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="mb-5">
      <CardBody className="space-y-4">
        {/* Archetype */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[var(--primary)]" aria-hidden="true" />
              <h2 className="text-lg font-bold text-foreground">
                {intel.archetype ? intel.archetype.label : 'Building your profile'}
              </h2>
            </div>
            {intel.archetype ? (
              <p className="mt-1 text-sm text-muted-foreground">{intel.archetype.description}</p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                Keep logging sessions to sharpen your athlete archetype.
              </p>
            )}
          </div>
          {intel.stage && (
            <Badge variant="info">
              {intel.stage.name}
            </Badge>
          )}
        </div>

        {/* Strengths + current focus */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <TrendingUp size={13} aria-hidden="true" /> Top strengths
            </p>
            {intel.topStrengths.length > 0 ? (
              <ul className="space-y-1">
                {intel.topStrengths.map((s, i) => (
                  <li key={i} className="text-sm text-foreground">
                    {s.label}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Not enough data yet.</p>
            )}
          </div>

          <div className="rounded-lg border border-border p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Target size={13} aria-hidden="true" /> Current focus
            </p>
            {intel.currentFocus ? (
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{intel.currentFocus.label}</span>
                  <Badge variant={severityVariant(intel.currentFocus.severity)}>
                    {intel.currentFocus.severity}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{intel.currentFocus.summary}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No clear focus yet.</p>
            )}
          </div>
        </div>

        {/* Confidence note */}
        <p className="text-xs text-muted-foreground">{intel.confidenceNote}</p>

        {/* CTA + expand */}
        <div className="flex flex-wrap items-center gap-2">
          {intel.recommendedNextStep && (
            <a href={intel.recommendedNextStep.href}>
              <Button size="sm">{intel.recommendedNextStep.label}</Button>
            </a>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowDetail((v) => !v)}
            aria-expanded={showDetail}
          >
            <ChevronDown
              size={14}
              className={`transition-transform ${showDetail ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
            {showDetail ? 'Hide details' : 'Skill tree & why this'}
          </Button>
        </div>

        {/* Progressive-disclosure detail */}
        {showDetail && (
          <div className="space-y-3 border-t border-border pt-3">
            {intel.archetype && intel.archetype.evidence.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Why this archetype</p>
                <ul className="list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
                  {intel.archetype.evidence.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            {intel.recurringPatterns.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Recurring patterns</p>
                <ul className="space-y-0.5 text-xs text-muted-foreground">
                  {intel.recurringPatterns.map((p, i) => (
                    <li key={i}>
                      <span className="text-foreground">{p.label}</span> — {p.detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Skill tree</p>
              <SkillTreeGrid sport={sport} />
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
