'use client';

// ============================================================
// DashboardCuratedDrills — the Coach Mix user module on the dashboard
// ------------------------------------------------------------
// A dashboard-owned surface that pairs the "Preferred Coaching Style"
// selector with a curated, style-influenced drill plan for the user's
// CURRENT diagnosis. It reuses the shared Coach Mix engine end-to-end
// (resolveUserStyleStrategy → rankDrills → buildCuratedRecommendation)
// and is deliberately INDEPENDENT of the /fix widget so the two never
// fight over one file.
//
// Visibility: only when the module is launched (NEXT_PUBLIC_COACH_MIX_
// USER_MODULE) OR the viewer is an admin previewing it — see
// useCoachMixPreviewAccess. An honest "Admin preview" badge shows while
// it is not yet live for athletes.
// ============================================================

import { useMemo, useState } from 'react';
import { Sparkles, Eye, Play, Bookmark, RefreshCw, CheckCircle2, XCircle, Target } from 'lucide-react';
import type { SportId } from '@swingiq/core';
import { rankDrills, localDrillFeedbackRepo } from '@/lib/drillmatch';
import { drillFeedbackWeights } from '@/lib/agi/adapters/feedback-map';
import { buildCuratedRecommendation } from '@/lib/central-intelligence/coach-mix';
import { resolveUserStyleStrategy } from '@/lib/central-intelligence/coach-mix/user-styles';
import { useUserCoachingStyle } from '@/lib/central-intelligence/coach-mix/user-preferences';
import { useCoachMixPreviewAccess } from './useCoachMixPreviewAccess';
import { CoachingStylePreference } from './CoachingStylePreference';

export interface DashboardCuratedDrillsProps {
  sport?: SportId;
  /** The user's current diagnosed issue id (fault ontology / core issue id). */
  faultId?: string;
  /** Plain-language label for the issue. */
  faultLabel?: string;
  /** Optional "why it matters" line. */
  whyItMatters?: string;
}

type DrillAction = 'saved' | 'tried' | 'dismissed';

export function DashboardCuratedDrills(props: DashboardCuratedDrillsProps) {
  const { show, adminPreview } = useCoachMixPreviewAccess();
  if (!show) return null;
  return <DashboardCuratedDrillsInner {...props} adminPreview={adminPreview} />;
}

function DashboardCuratedDrillsInner({
  sport = 'golf',
  faultId,
  faultLabel,
  whyItMatters,
  adminPreview,
}: DashboardCuratedDrillsProps & { adminPreview: boolean }) {
  const { styleId } = useUserCoachingStyle();
  const [actions, setActions] = useState<Record<string, DrillAction>>({});

  const strategy = useMemo(() => resolveUserStyleStrategy(styleId, sport), [styleId, sport]);

  const topIssue = faultLabel ?? (faultId ? faultId.replace(/_/g, ' ') : null);
  // The athlete's own drill verdicts re-weight ranking (helped ↑, hurt ↓).
  const feedbackWeights = useMemo(() => drillFeedbackWeights(localDrillFeedbackRepo.all()), []);
  const rec = useMemo(() => {
    if (!topIssue) return null;
    const ranked = rankDrills({ sport, faultId, faultName: faultLabel });
    return buildCuratedRecommendation({ topIssue, whyItMatters }, strategy, ranked, feedbackWeights);
  }, [sport, faultId, faultLabel, topIssue, whyItMatters, strategy, feedbackWeights]);

  const setAction = (id: string, action: DrillAction) =>
    setActions((a) => ({ ...a, [id]: a[id] === action ? undefined : action } as Record<string, DrillAction>));

  return (
    <section className="space-y-3">
      {adminPreview && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-400/40 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <Eye className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <span className="font-semibold">Admin preview.</span> This module is visible only to you
            right now. To launch it to every athlete, set{' '}
            <code className="rounded bg-amber-500/15 px-1">NEXT_PUBLIC_COACH_MIX_USER_MODULE</code>{' '}
            (or the <code className="rounded bg-amber-500/15 px-1">curated_drills_widget_enabled</code> flag).
          </p>
        </div>
      )}

      {/* Preferred Coaching Style selector */}
      <CoachingStylePreference />

      {/* Curated drills for the current diagnosis */}
      {rec && rec.firstDrill ? (
        <div className="rounded-2xl border border-border bg-card p-5">
          <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Sparkles className="h-5 w-5 text-violet-500" />
              Curated Swing Drills for Your Current Game
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {rec.influenceTags.slice(0, 2).map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-violet-300 bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300"
                >
                  {t}
                </span>
              ))}
            </div>
          </header>

          <div className="mb-3 rounded-xl bg-background p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Your #1 fix right now</p>
            <p className="font-semibold capitalize text-foreground">{rec.topIssue}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{rec.whyItMatters}</p>
          </div>

          <ul className="space-y-3">
            {[rec.firstDrill, ...rec.alternatives].map((d, i) => {
              const action = actions[d.drill.id];
              return (
                <li
                  key={d.drill.id}
                  className={`rounded-xl border p-3 ${i === 0 ? 'border-violet-300 bg-violet-50/60 dark:border-violet-500/30 dark:bg-violet-500/5' : 'border-border'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground">{d.drill.name}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{d.why}</p>
                    </div>
                    {i === 0 && (
                      <span className="shrink-0 rounded-full bg-violet-600 px-2 py-0.5 text-[11px] font-semibold text-white">Do first</span>
                    )}
                  </div>
                  {i === 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                      <span><span className="opacity-70">Feel:</span> {rec.whatToFeel}</span>
                      <span><span className="opacity-70">Time:</span> ~{d.drill.estimatedMinutes} min</span>
                      <span><span className="opacity-70">Level:</span> {d.drill.difficulty}</span>
                      <span><span className="opacity-70">Gear:</span> {d.drill.equipment.length ? d.drill.equipment.join(', ') : 'none'}</span>
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <a
                      href={d.drill.youtubeSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-violet-700"
                    >
                      <Play className="h-3.5 w-3.5" /> Start drill
                    </a>
                    <button
                      onClick={() => setAction(d.drill.id, 'saved')}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium ${action === 'saved' ? 'border-violet-400 text-violet-600 dark:text-violet-300' : 'border-border text-muted-foreground'}`}
                    >
                      <Bookmark className="h-3.5 w-3.5" /> {action === 'saved' ? 'Saved' : 'Save for later'}
                    </button>
                    <button
                      onClick={() => setAction(d.drill.id, 'tried')}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium ${action === 'tried' ? 'border-emerald-400 text-emerald-600 dark:text-emerald-300' : 'border-border text-muted-foreground'}`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> {action === 'tried' ? 'Tried it' : 'I tried this'}
                    </button>
                    <button
                      onClick={() => setAction(d.drill.id, 'dismissed')}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium ${action === 'dismissed' ? 'border-muted-foreground text-muted-foreground' : 'border-border text-muted-foreground'}`}
                    >
                      <XCircle className="h-3.5 w-3.5" /> Not relevant
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-3 flex items-start gap-2 rounded-xl bg-background p-3 text-sm">
            <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-foreground">{rec.howToRetest}</p>
              <p className="mt-1 text-xs text-muted-foreground">{rec.influenceSummary}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card p-5 text-center">
          <Target className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">No diagnosis yet — so no fabricated fix.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Import a session or analyze a swing and your curated, style-matched drills will appear here.
          </p>
        </div>
      )}
    </section>
  );
}
