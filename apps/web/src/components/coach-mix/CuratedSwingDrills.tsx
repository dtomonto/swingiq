'use client';

// ============================================================
// Curated Swing Drills for Your Current Game (user-facing)
// ------------------------------------------------------------
// The user surface of the Coach Mix engine. Reads the admin's ACTIVE
// mix, resolves its coaching strategy, and turns the user's current
// issue into a focused, coach-influenced drill plan.
//
// GATED OFF by default: renders nothing unless the owner enables
// NEXT_PUBLIC_COACH_MIX_USER_MODULE. Coach NAMES never appear unless
// the active mix's label mode opts in — the default shows only a
// neutral style tag (e.g. "Athletic Rotation").
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Bookmark, CheckCircle2, XCircle, RefreshCw, Sparkles } from 'lucide-react';
import type { SportId } from '@swingiq/core';
import { ANALYTICS_EVENTS } from '@swingiq/core';
import { track } from '@/lib/analytics';
import { rankDrills, localDrillFeedbackRepo } from '@/lib/drillmatch';
import { drillFeedbackWeights } from '@/lib/agi/adapters/feedback-map';
import { useAgentContext } from '@/hooks/useAgentContext';
import {
  isCoachMixUserModuleEnabled,
  resolveCoachMix,
  buildCuratedRecommendation,
  type CoachMix,
} from '@/lib/central-intelligence/coach-mix';
import { useCoachMixData, mergeProfiles } from '@/lib/central-intelligence/coach-mix/store';

export interface CuratedSwingDrillsProps {
  /** Override the active sport (else: the athlete's active sport). */
  sport?: SportId;
  /** Override the issue id (else: the athlete's latest diagnosed focus). */
  faultId?: string;
  /** Override the plain-language issue label. */
  faultLabel?: string;
  /** Optional plain-language "why it matters". */
  whyItMatters?: string;
}

type DrillAction = 'saved' | 'completed' | 'dismissed';

export function CuratedSwingDrills(props: CuratedSwingDrillsProps) {
  // Hard gate — invisible until the owner turns the module on.
  if (!isCoachMixUserModuleEnabled()) return null;
  return <CuratedSwingDrillsInner {...props} />;
}

function CuratedSwingDrillsInner({ sport: sportProp, faultId, faultLabel, whyItMatters }: CuratedSwingDrillsProps) {
  const data = useCoachMixData();
  const { ctx } = useAgentContext();
  const [actions, setActions] = useState<Record<string, DrillAction>>({});

  // Live by default: the athlete's active sport + most-recent diagnosed focus,
  // with explicit props as overrides. No diagnosis → no fabricated fix (null).
  const sport: SportId = sportProp ?? ctx?.activeSport ?? 'golf';
  const faultName =
    faultLabel ?? ctx?.latestDiagnosedSession?.primaryFocus ?? ctx?.latestSession?.primaryFocus ?? undefined;
  const topIssue = faultName ?? (faultId ? faultId.replace(/_/g, ' ') : null);
  const skillLevel = ctx?.profile.skillLevel ?? undefined;

  const strategy = useMemo(() => {
    const profiles = mergeProfiles(data.customProfiles, data.profileOverrides);
    const active = data.mixes.find((m) => m.id === data.activeMixId);
    const mix: CoachMix =
      active ?? {
        id: 'house',
        name: 'SwingVantage',
        description: '',
        sport,
        entries: [],
        visibility: 'user_visible',
        userLabelMode: 'style_only',
        createdAt: '',
      };
    return resolveCoachMix({ ...mix, sport }, profiles);
  }, [data, sport]);

  // The athlete's own drill verdicts re-weight ranking (helped ↑, hurt ↓).
  const feedbackWeights = useMemo(() => drillFeedbackWeights(localDrillFeedbackRepo.all()), []);

  const rec = useMemo(() => {
    if (!topIssue) return null;
    const ranked = rankDrills({ sport, faultId, faultName, skillLevel });
    return buildCuratedRecommendation({ topIssue, whyItMatters }, strategy, ranked, feedbackWeights);
  }, [sport, faultId, faultName, topIssue, skillLevel, whyItMatters, strategy, feedbackWeights]);

  // Feed the First-Party Intelligence OS: report each curated drill recommendation
  // so recurring ones become reusable first-party patterns/knowledge. Fire-and-
  // forget, deduped per (sport, issue, drill), and fully error-swallowed — it
  // never blocks or affects what the athlete sees.
  const observedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!rec?.firstDrill) return;
    const sig = `${sport}|${rec.topIssue}|${rec.firstDrill.drill.id}`;
    if (observedRef.current === sig) return;
    observedRef.current = sig;
    void fetch('/api/intelligence-os/observe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        kind: 'drill',
        intent: `${sport}: ${rec.topIssue}`,
        recommendation: `${rec.firstDrill.drill.name} — ${rec.howItConnectsToYourGame}`,
        sport,
        feature: 'curated-drills',
      }),
      keepalive: true,
    }).catch(() => {});
  }, [rec, sport]);

  // Honest: with no diagnosis yet, show nothing rather than a placeholder fix.
  if (!rec || !rec.firstDrill) return null;

  const setAction = (id: string, action: DrillAction) => {
    const isSelecting = actions[id] !== action;
    setActions((a) => ({ ...a, [id]: a[id] === action ? undefined : action } as Record<string, DrillAction>));
    // "Do our fixes work?" — acceptance/dismissal signal (no PII: ids only).
    if (isSelecting) {
      if (action === 'dismissed') track(ANALYTICS_EVENTS.RECOMMENDATION_DISMISSED, { sport, fault_id: faultId });
      else track(ANALYTICS_EVENTS.RECOMMENDATION_ACCEPTED, { sport, fault_id: faultId, action });
    }
  };

  const drills = [rec.firstDrill, ...rec.alternatives];

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-gray-100">
          <Sparkles className="h-5 w-5 text-violet-500" />
          Curated Swing Drills for Your Current Game
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {rec.influenceTags.slice(0, 2).map((t) => (
            <span key={t} className="rounded-full border border-violet-300 bg-violet-50 px-2 py-0.5 text-2xs font-medium text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300">
              {t}
            </span>
          ))}
        </div>
      </header>

      {/* Top issue + why */}
      <div className="mb-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Your #1 fix right now</p>
        <p className="font-semibold text-gray-900 dark:text-gray-100">{rec.topIssue}</p>
        <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{rec.whyItMatters}</p>
      </div>

      {/* Drills (top issue first, then alternatives — capped by the engine) */}
      <ul className="space-y-3">
        {drills.map((d, i) => {
          const action = actions[d.drill.id];
          return (
            <li key={d.drill.id} className={`rounded-xl border p-3 ${i === 0 ? 'border-violet-300 bg-violet-50/60 dark:border-violet-500/30 dark:bg-violet-500/5' : 'border-gray-200 dark:border-gray-800'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{d.drill.name}</p>
                  <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{d.why}</p>
                </div>
                {i === 0 && <span className="shrink-0 rounded-full bg-violet-600 px-2 py-0.5 text-2xs font-semibold text-white">Do first</span>}
              </div>
              {i === 0 && (
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 sm:grid-cols-4">
                  <span><span className="text-gray-400">Feel:</span> {rec.whatToFeel}</span>
                  <span><span className="text-gray-400">Time:</span> ~{d.drill.estimatedMinutes} min</span>
                  <span><span className="text-gray-400">Level:</span> {d.drill.difficulty}</span>
                  <span><span className="text-gray-400">Gear:</span> {d.drill.equipment.length ? d.drill.equipment.join(', ') : 'none'}</span>
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <a href={d.drill.youtubeSearchUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-violet-700">
                  <Play className="h-3.5 w-3.5" /> Start drill
                </a>
                <button onClick={() => setAction(d.drill.id, 'saved')} className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium ${action === 'saved' ? 'border-violet-400 text-violet-600 dark:text-violet-300' : 'border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400'}`}>
                  <Bookmark className="h-3.5 w-3.5" /> {action === 'saved' ? 'Saved' : 'Save'}
                </button>
                <button onClick={() => setAction(d.drill.id, 'completed')} className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium ${action === 'completed' ? 'border-emerald-400 text-emerald-600 dark:text-emerald-300' : 'border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400'}`}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> {action === 'completed' ? 'Completed' : 'Mark complete'}
                </button>
                <button onClick={() => setAction(d.drill.id, 'dismissed')} className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium ${action === 'dismissed' ? 'border-gray-400 text-gray-500' : 'border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400'}`}>
                  <XCircle className="h-3.5 w-3.5" /> Not relevant
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Retest + honest influence note */}
      <div className="mt-3 flex items-start gap-2 rounded-xl bg-gray-50 p-3 text-sm dark:bg-gray-800/50">
        <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
        <div>
          <p className="text-gray-700 dark:text-gray-300">{rec.howToRetest}</p>
          <p className="mt-1 text-xs text-gray-500">{rec.influenceSummary}</p>
        </div>
      </div>
    </section>
  );
}
