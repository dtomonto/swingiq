// ============================================================
// SwingVantage — Workflow: Report Generation
// ------------------------------------------------------------
// Turns local data into a lightweight, structured report:
// session, 30-day progress, coach, or equipment. Uses templates
// and reuses other workflow outputs. Deterministic.
// ============================================================

import { getSportAgentProfile } from '../sport-profiles';
import { computeProgressTrend } from './progress-memory';
import { buildDiagnosisConfidence } from './diagnosis-confidence';
import { buildPracticePlan } from './practice-planner';
import { buildEquipmentFit } from './equipment-fit';
import type { AgentContext, ReportSection, ReportSummary } from '../types';

export type ReportKind = ReportSummary['kind'];

export function buildReport(ctx: AgentContext, kind: ReportKind = 'session'): ReportSummary {
  const sp = getSportAgentProfile(ctx.activeSport);
  const dx = buildDiagnosisConfidence(ctx);
  const trend = computeProgressTrend(ctx);
  const plan = buildPracticePlan(ctx);

  const sections: ReportSection[] = [];

  sections.push({
    heading: 'Summary',
    body:
      `${sp.label} report for ${ctx.profile.firstName ?? 'athlete'}. ` +
      `Goal: ${ctx.profile.goal ?? 'general improvement'}. ` +
      `Sessions logged: ${ctx.sessionCount}.`,
  });

  sections.push({
    heading: 'Latest focus',
    body: dx.plainEnglishSummary,
    bullets: dx.evidence,
  });

  if (kind === '30_day' || ctx.sessionCount >= 2) {
    sections.push({
      heading: 'Progress trend',
      body: trend.trendSummary,
      bullets: [
        ...trend.improvedAreas.map((a) => `Improved: ${a}`),
        ...trend.stalledAreas.map((a) => `Watch: ${a}`),
      ],
    });
  }

  sections.push({
    heading: 'Recommended practice',
    body: plan.whyThisPlan,
    bullets: plan.mainDrills.map((d) => `${d.name} — ${d.repsOrTime}`),
  });

  if (kind === 'equipment') {
    const fit = buildEquipmentFit(ctx);
    sections.push({
      heading: 'Equipment notes',
      body:
        fit.noChangeNeededReason ??
        (fit.testSuggestions[0] ?? 'Add equipment details for fit guidance.'),
      bullets: [...fit.equipmentStrengths, ...fit.equipmentConcerns],
    });
  }

  sections.push({
    heading: 'Next session goal',
    body: plan.nextSessionPrompt,
  });

  return {
    sport: ctx.activeSport,
    generatedAt: ctx.now,
    kind,
    title:
      kind === '30_day'
        ? `${sp.label}: 30-Day Progress`
        : kind === 'coach'
          ? `${sp.label}: Coach Summary`
          : kind === 'equipment'
            ? `${sp.label}: Equipment Notes`
            : `${sp.label}: Session Report`,
    sections,
  };
}
