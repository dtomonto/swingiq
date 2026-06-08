// ============================================================
// SwingVantage — Athlete Timeline builder (Phase 5)
// ------------------------------------------------------------
// Merges every DATED event across the athlete's record into one
// chronological stream the user can scan + filter, and the AI can
// reason over (not just the latest session). Pure + framework-free.
//
// Honest scope: only events that carry a real timestamp are included
// (sessions, the issues found in them, video analyses, daily notes,
// equipment changes, setup completion). Undated counters (e.g. raw
// milestone flags) are intentionally left out rather than faked.
// ============================================================

import type { SportId } from '@swingiq/core';
import type { LocalSession, LocalVideoAnalysis, LocalClub } from '@/store';
import type { DailyNote } from '@/lib/dailyNotes/types';
import type { TimelineEvent, TimelineEventType, TimelineSummary } from './types';

export interface TimelineInput {
  sessions: LocalSession[];
  videoAnalyses: LocalVideoAnalysis[];
  dailyNotes: DailyNote[];
  clubs: LocalClub[];
  onboardingCompletedAt: string | null;
  onboardingRole: string | null;
}

/** Coerce to a valid ISO string, or '' when unparseable. */
function iso(d: string | undefined | null): string {
  if (!d) return '';
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
}

function snippet(text: string, max = 90): string {
  const t = text.trim().replace(/\s+/g, ' ');
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/**
 * Build the full chronological athlete timeline (newest first).
 */
export function buildTimeline(input: TimelineInput): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Sessions (+ the top issue found in each).
  for (const s of input.sessions) {
    const date = iso(s.date) || iso(s.created_at);
    if (!date) continue;
    const sport = (s.sport ?? null) as SportId | null;
    const imported = s.launch_monitor && s.launch_monitor !== 'manual';
    events.push({
      id: `session-${s.id}`,
      date,
      type: 'session',
      sport,
      title: imported
        ? `Imported ${s.shot_count} shot${s.shot_count === 1 ? '' : 's'}`
        : `Logged a session${s.shot_count ? ` (${s.shot_count} shots)` : ''}`,
      detail: [s.name, s.launch_monitor && s.launch_monitor !== 'manual' ? s.launch_monitor : null]
        .filter(Boolean)
        .join(' · ') || undefined,
      club: s.club_name || null,
    });

    const top = s.diagnoses?.[0] as { rule?: { name?: string; likely_cause?: string } } | undefined;
    if (top?.rule?.name) {
      events.push({
        id: `diag-${s.id}`,
        date,
        type: 'diagnosis',
        sport,
        title: `Top focus: ${top.rule.name}`,
        detail: top.rule.likely_cause ? snippet(top.rule.likely_cause) : undefined,
        club: s.club_name || null,
      });
    }
  }

  // Video analyses.
  for (const v of input.videoAnalyses) {
    const date = iso(v.created_at);
    if (!date) continue;
    events.push({
      id: `video-${v.id}`,
      date,
      type: 'video',
      sport: (v.sport ?? null) as SportId | null,
      title: v.primary_issue ? `Video analysis: ${v.primary_issue}` : 'Video analysis',
      detail: typeof v.overall_score === 'number' ? `Score ${v.overall_score}` : undefined,
    });
  }

  // Daily notes.
  for (const n of input.dailyNotes) {
    const date = iso(n.created_at) || iso(n.date);
    if (!date) continue;
    events.push({
      id: `note-${n.id}`,
      date,
      type: 'note',
      sport: (n.sport ?? null) as SportId | null,
      title: `Daily note · felt ${String(n.feel)}`,
      detail: n.text ? snippet(n.text) : n.context || undefined,
    });
  }

  // Equipment changes (club added).
  for (const c of input.clubs) {
    const date = iso(c.created_at);
    if (!date) continue;
    const carry = c.typical_carry != null ? ` · ${c.typical_carry} yds` : '';
    events.push({
      id: `club-${c.id}`,
      date,
      type: 'equipment',
      sport: 'golf',
      title: `Added ${c.name} to the bag`,
      detail: `${c.category}${carry}${c.source_of_truth === 'imported' ? ' · from imports' : ''}`,
      club: c.name,
    });
  }

  // Onboarding / setup completion.
  const onboardDate = iso(input.onboardingCompletedAt);
  if (onboardDate) {
    events.push({
      id: 'onboarding-complete',
      date: onboardDate,
      type: 'onboarding',
      sport: null,
      title: 'Completed setup',
      detail: input.onboardingRole ? `Role: ${input.onboardingRole}` : undefined,
    });
  }

  // Newest first; stable tiebreak on id.
  return events.sort((a, b) => {
    const d = b.date.localeCompare(a.date);
    return d !== 0 ? d : a.id.localeCompare(b.id);
  });
}

const EMPTY_BY_TYPE: Record<TimelineEventType, number> = {
  session: 0, video: 0, note: 0, diagnosis: 0, equipment: 0, onboarding: 0,
};

/** Roll up counts, date range, and sports present for the header. */
export function summarizeTimeline(events: TimelineEvent[]): TimelineSummary {
  const byType: Record<TimelineEventType, number> = { ...EMPTY_BY_TYPE };
  const sports = new Set<SportId>();
  for (const e of events) {
    byType[e.type]++;
    if (e.sport) sports.add(e.sport);
  }
  // events are sorted newest-first.
  return {
    total: events.length,
    byType,
    firstDate: events.length ? events[events.length - 1]!.date : null,
    lastDate: events.length ? events[0]!.date : null,
    sports: [...sports],
  };
}

/** Apply type + sport filters (used by the timeline view). */
export function filterTimeline(
  events: TimelineEvent[],
  filters: { type?: TimelineEventType | 'all'; sport?: SportId | 'all' },
): TimelineEvent[] {
  return events.filter((e) => {
    if (filters.type && filters.type !== 'all' && e.type !== filters.type) return false;
    if (filters.sport && filters.sport !== 'all' && e.sport !== filters.sport) return false;
    return true;
  });
}
