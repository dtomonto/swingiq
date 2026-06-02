'use client';

import { useMemo } from 'react';
import { AICoachChat } from './AICoachChat';
import { useSwingIQStore } from '@/store';
import { runDiagnosticEngine, buildSessionInsight } from '@swingiq/core';
import type { Shot } from '@swingiq/core';
import type { CoachContext } from '@/lib/ai-coach-prompts';
import { useSport } from '@/contexts/SportContext';
import { getTone } from '@/lib/coaching/tones';

export default function AICoachPage() {
  const { profile, sessions, sportProfiles, video_analyses, settings } = useSwingIQStore();
  const { activeSport, isGolf, sportName } = useSport();
  // Pick the most recent golf session with shots for context
  const latestWithShots = useMemo(() => {
    return [...sessions]
      .filter((s) => s.sport === 'golf')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .find((s) => s.shots.length > 0) ?? null;
  }, [sessions]);

  // Latest video analysis for non-golf sports
  const latestVideoAnalysis = useMemo(() => {
    if (isGolf) return null;
    return video_analyses
      .filter((v) => v.sport === activeSport)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] ?? null;
  }, [video_analyses, activeSport, isGolf]);

  // Build coaching context from real data
  const coachContext = useMemo((): Partial<CoachContext> => {
    const ctx: Partial<CoachContext> = {
      active_sport: activeSport,
      // Audience tone (Beginner/Parent/Competitive/Coach) shapes how answers are written.
      coaching_tone_hint: getTone(settings.coaching_tone).promptHint,
    };

    // ── Golf context: launch monitor stats ──
    if (isGolf && latestWithShots) {
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

      if (profile?.name) ctx.golfer_first_name = profile.name.split(' ')[0];
      if (profile?.skill_level) ctx.skill_level = profile.skill_level as CoachContext['skill_level'];
      if (profile?.current_miss) ctx.typical_miss = profile.current_miss;
      if (stats) ctx.current_session_stats = stats;
      if (primaryDiagnosisId) ctx.primary_diagnosis_id = primaryDiagnosisId;
      if (primaryDiagnosisName) ctx.primary_diagnosis_name = primaryDiagnosisName;
      if (primaryConfidence !== undefined) ctx.primary_diagnosis_confidence = primaryConfidence;
      if (engineSummary) ctx.engine_summary = engineSummary;
    }

    // ── Non-golf context: video analysis + sport profile ──
    if (!isGolf) {
      // Get name from golf profile or sport profile
      const anyProfile = profile ?? (sportProfiles as Record<string, unknown>)[activeSport] as Record<string, unknown> | undefined;
      const name = (anyProfile as { name?: string })?.name ?? (anyProfile as { first_name?: string })?.first_name;
      if (name) ctx.golfer_first_name = String(name).split(' ')[0];

      // Skill level from sport profile
      const sportProfile = (sportProfiles as Record<string, Record<string, unknown> | undefined>)[activeSport];
      if (sportProfile?.skill_level) ctx.skill_level = sportProfile.skill_level as CoachContext['skill_level'];
      if (sportProfile?.common_miss) ctx.typical_miss = String(sportProfile.common_miss);

      // Build sport profile summary string
      const profileLines: string[] = [];
      if (sportProfile?.primary_goal) profileLines.push(`Goal: ${sportProfile.primary_goal}`);
      if (sportProfile?.batting_side) profileLines.push(`Batting: ${sportProfile.batting_side}`);
      if (sportProfile?.dominant_hand) profileLines.push(`Dominant hand: ${sportProfile.dominant_hand}`);
      if (sportProfile?.competition_level) profileLines.push(`Level: ${sportProfile.competition_level}`);
      if (sportProfile?.league_type) profileLines.push(`League: ${sportProfile.league_type}`);
      if (profileLines.length > 0) ctx.sport_profile_summary = profileLines.join(', ');

      // Video analysis context
      if (latestVideoAnalysis) {
        if (latestVideoAnalysis.primary_issue) {
          ctx.primary_video_issue = latestVideoAnalysis.primary_issue;
          ctx.primary_video_issue_confidence = 0.45; // heuristic estimate
        }
        ctx.engine_summary = latestVideoAnalysis.primary_issue
          ? `Latest video analysis identified: ${latestVideoAnalysis.primary_issue}. Score: ${latestVideoAnalysis.overall_score}/100.`
          : `Latest video analysis score: ${latestVideoAnalysis.overall_score}/100. No primary issue detected.`;
      }
    }

    return ctx;
  }, [latestWithShots, latestVideoAnalysis, profile, sportProfiles, activeSport, isGolf, settings.coaching_tone]);

  return (
    <>
      <AICoachChat coachContext={coachContext} sport={activeSport} sportName={sportName} />
    </>
  );
}
