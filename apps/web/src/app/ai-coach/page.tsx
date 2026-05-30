'use client';

import { useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AICoachChat } from './AICoachChat';
import { useSwingIQStore, useLatestDiagnosedSession } from '@/store';
import { runDiagnosticEngine, buildSessionInsight } from '@swingiq/core';
import type { Shot } from '@swingiq/core';
import type { CoachContext } from '@/lib/ai-coach-prompts';

export default function AICoachPage() {
  const { profile, sessions } = useSwingIQStore();
  const latestDiagnosed = useLatestDiagnosedSession();

  // Pick the most recent session with shots for context
  const latestWithShots = useMemo(() => {
    return [...sessions]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .find((s) => s.shots.length > 0) ?? null;
  }, [sessions]);

  // Build coaching context from real data
  const coachContext = useMemo((): Partial<CoachContext> => {
    if (!latestWithShots) return {};

    let stats = undefined;
    let primaryDiagnosisId: string | undefined;
    let primaryDiagnosisName: string | undefined;
    let primaryConfidence: number | undefined;
    let engineSummary: string | undefined;

    try {
      const result = runDiagnosticEngine(
        latestWithShots.shots as Shot[],
        latestWithShots.club_category || 'mid_iron',
        latestWithShots.id,
        'local',
      );
      stats = result.stats;

      const top = result.diagnoses[0];
      if (top) {
        primaryDiagnosisId = top.rule.id;
        primaryDiagnosisName = top.rule.name;
        primaryConfidence = top.confidence;
      }

      const insight = buildSessionInsight(result);
      engineSummary = insight.what_do_i_do_next;
    } catch {
      // Couldn't run engine — still pass profile info
    }

    const ctx: Partial<CoachContext> = {};

    // Use first word of full name as first name for personalisation
    if (profile?.name) ctx.golfer_first_name = profile.name.split(' ')[0];
    if (profile?.skill_level) ctx.skill_level = profile.skill_level as CoachContext['skill_level'];
    if (profile?.current_miss) ctx.typical_miss = profile.current_miss;
    if (stats) ctx.current_session_stats = stats;
    if (primaryDiagnosisId) ctx.primary_diagnosis_id = primaryDiagnosisId;
    if (primaryDiagnosisName) ctx.primary_diagnosis_name = primaryDiagnosisName;
    if (primaryConfidence !== undefined) ctx.primary_diagnosis_confidence = primaryConfidence;
    if (engineSummary) ctx.engine_summary = engineSummary;

    return ctx;
  }, [latestWithShots, profile]);

  return (
    <AppShell>
      <AICoachChat coachContext={coachContext} />
    </AppShell>
  );
}
