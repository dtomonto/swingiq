// ============================================================
// SwingIQ — Workflow: Personal Practice Planner
// ------------------------------------------------------------
// Converts the latest finding into a short, concrete plan.
// Supports 10/20/30/45-minute options, home or facility, and
// youth-friendly scaling. Deterministic; concise by design.
// ============================================================

import type { SkillLevel } from '@swingiq/core';
import { getSportAgentProfile } from '../sportProfiles';
import { isYouthContext } from '../guardrails';
import type { AgentContext, PracticeDrill, PracticePlan } from '../types';

const TIME_OPTIONS = [10, 20, 30, 45];

export function buildPracticePlan(
  ctx: AgentContext,
  desiredMinutes?: number,
): PracticePlan {
  const sp = getSportAgentProfile(ctx.activeSport);
  const youth = isYouthContext(ctx);
  const difficulty: SkillLevel = ctx.profile.skillLevel ?? 'beginner';

  const focusRaw =
    ctx.latestDiagnosedSession?.primaryFocus ??
    ctx.latestSession?.primaryFocus ??
    sp.defaultFocus;
  const focus = focusRaw;

  // Youth athletes get shorter sessions by default.
  const defaultMinutes = youth ? 15 : 20;
  let minutes = desiredMinutes ?? defaultMinutes;
  if (youth) minutes = Math.min(minutes, 20);

  const mainDrills = buildDrills(ctx, focus, difficulty, minutes);

  return {
    sport: ctx.activeSport,
    practiceFocus: focus,
    estimatedTimeMinutes: minutes,
    timeOptions: youth ? [10, 15, 20] : TIME_OPTIONS,
    warmup:
      minutes <= 10
        ? '2 minutes of easy reps to get loose — no intensity yet.'
        : `${Math.max(3, Math.round(minutes * 0.2))} minutes of easy reps at half speed to find your rhythm.`,
    mainDrills,
    pressureTest:
      `Finish with 5 reps where you call your target out loud first — score how many feel like a "${sp.defaultCue.split(',')[0].toLowerCase()}".`,
    successMetric: youth
      ? 'Three good reps in a row that feel easy and repeatable.'
      : 'At least 6 of 10 reps match your intended outcome on the pressure test.',
    nextSessionPrompt:
      ctx.activeSport === 'golf'
        ? 'Next time, log a short session with the same club to compare.'
        : 'Next time, record a short video from the same angle to compare.',
    difficultyLevel: difficulty,
    equipmentNeeded: [sp.implement, ctx.activeSport === 'golf' ? 'a few balls' : 'a tee or soft toss (optional)'],
    whyThisPlan: youth
      ? 'Short and focused so a younger athlete stays engaged and keeps good form.'
      : `Built around your current priority (${focus}) so your practice time goes to the one thing that moves your game most.`,
  };
}

function buildDrills(
  ctx: AgentContext,
  focus: string,
  difficulty: SkillLevel,
  minutes: number,
): PracticeDrill[] {
  const sp = getSportAgentProfile(ctx.activeSport);
  const drills: PracticeDrill[] = [];

  // 1) Awareness — slow, exaggerated reps to feel the pattern.
  drills.push({
    name: 'Slow-motion awareness reps',
    why: `Feel ${lowerFirst(focus)} at half speed before adding power.`,
    repsOrTime: minutes <= 10 ? '8 slow reps' : '12–15 slow reps',
    successMetric: 'Each rep feels controlled and on balance.',
  });

  // 2) Integration — bring it up to speed.
  drills.push({
    name: 'Full-speed integration',
    why: `Carry the feel into a normal ${sp.motion} so it shows up under speed.`,
    repsOrTime: minutes <= 10 ? '6 reps' : '10–12 reps',
    successMetric: `Most reps match: "${sp.defaultCue}"`,
  });

  // 3) Advanced athletes get a third, sharper drill.
  if (difficulty === 'advanced' || difficulty === 'elite') {
    if (minutes >= 30) {
      drills.push({
        name: 'Variability challenge',
        why: 'Mix targets/contexts so the pattern holds when it is not grooved.',
        repsOrTime: '2 sets of 5, changing target each rep',
        successMetric: 'Pattern holds even as you change the target.',
      });
    }
  }

  return drills;
}

function lowerFirst(s: string): string {
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}
