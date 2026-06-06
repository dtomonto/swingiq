// ============================================================
// SwingVantage — Re-engagement OS: trigger rules + message copy
// ------------------------------------------------------------
// Each trigger knows when it applies (from an ActivitySignal) and how
// to speak. Copy is warm, specific, never guilt-based. English is the
// source of truth. Pure — no React, no DOM.
// ============================================================

import type { ActivitySignal, NudgeMessage, TriggerId, NudgeChannel } from './types';

const ALL: NudgeChannel[] = ['in_app', 'push', 'email'];

interface TriggerDef {
  id: TriggerId;
  priority: number; // higher wins
  /** Min days that must pass before this same trigger can fire again. */
  cooldownDays: number;
  applies: (s: ActivitySignal) => boolean;
  build: (s: ActivitySignal) => NudgeMessage;
}

/** Ordered high → low priority. The engine picks the first eligible. */
export const TRIGGERS: TriggerDef[] = [
  {
    id: 'comeback_14',
    priority: 100,
    cooldownDays: 10,
    applies: (s) => (s.daysSinceLastActivity ?? 0) >= 14 && s.sessionCount > 0,
    build: (s) => ({
      triggerId: 'comeback_14',
      priority: 100,
      tone: 'encouraging',
      title: 'Welcome back — let’s restart small',
      body: 'It’s been a couple of weeks. No need to catch up all at once — one quick swing check today gets your plan current again.',
      cta: { label: 'Do a quick check', href: '/diagnose' },
      emailSubject: 'Your SwingVantage plan is ready when you are',
      channels: ALL,
    }),
  },
  {
    id: 'comeback_7',
    priority: 90,
    cooldownDays: 6,
    applies: (s) => (s.daysSinceLastActivity ?? 0) >= 7 && s.sessionCount > 0,
    build: () => ({
      triggerId: 'comeback_7',
      priority: 90,
      tone: 'encouraging',
      title: 'Pick up where you left off',
      body: 'A week off is fine — your swing work is still here. One short session keeps the momentum going.',
      cta: { label: 'Continue my plan', href: '/training' },
      emailSubject: 'One short session keeps your progress going',
      channels: ALL,
    }),
  },
  {
    id: 'retest_due',
    priority: 80,
    cooldownDays: 3,
    applies: (s) => s.retestDue,
    build: () => ({
      triggerId: 'retest_due',
      priority: 80,
      tone: 'celebratory',
      title: 'Time to prove your fix worked',
      body: 'You’ve put in the reps. A quick retest shows whether the change is sticking — and what to work on next.',
      cta: { label: 'Run my retest', href: '/retest' },
      emailSubject: 'Ready to see if your fix is sticking?',
      channels: ALL,
    }),
  },
  {
    id: 'streak_at_risk',
    priority: 70,
    cooldownDays: 1,
    applies: (s) => s.streakAtRisk && s.streakDays >= 2,
    build: (s) => ({
      triggerId: 'streak_at_risk',
      priority: 70,
      tone: 'encouraging',
      title: `Keep your ${s.streakDays}-day streak alive`,
      body: 'A few minutes today keeps your streak going. Even one drill counts.',
      cta: { label: 'Do today’s drill', href: '/training' },
      emailSubject: `Don’t break your ${s.streakDays}-day streak`,
      channels: ['in_app', 'push'],
    }),
  },
  {
    id: 'comeback_3',
    priority: 60,
    cooldownDays: 3,
    applies: (s) => (s.daysSinceLastActivity ?? 0) >= 3 && s.sessionCount > 0,
    build: () => ({
      triggerId: 'comeback_3',
      priority: 60,
      tone: 'info',
      title: 'A quick rep today?',
      body: 'Short and consistent beats long and rare. Two minutes on your current fix moves the needle.',
      cta: { label: 'Open my fix', href: '/fix' },
      emailSubject: 'Two minutes on your fix today?',
      channels: ['in_app', 'push'],
    }),
  },
  {
    id: 'finish_fix',
    priority: 50,
    cooldownDays: 2,
    applies: (s) => s.hasPendingFix,
    build: () => ({
      triggerId: 'finish_fix',
      priority: 50,
      tone: 'info',
      title: 'Finish what you started',
      body: 'You have an active fix in progress. A couple more focused reps and you’ll be ready to retest.',
      cta: { label: 'Continue my fix', href: '/fix' },
      emailSubject: 'Your fix is almost there',
      channels: ['in_app'],
    }),
  },
  {
    id: 'activation',
    priority: 40,
    cooldownDays: 2,
    applies: (s) => !s.activated && s.sessionCount === 0,
    build: () => ({
      triggerId: 'activation',
      priority: 40,
      tone: 'encouraging',
      title: 'Get your first result',
      body: 'You’re one swing check away from your first personalized fix. It takes about a minute.',
      cta: { label: 'Start my first check', href: '/start' },
      emailSubject: 'Your first SwingVantage result is one step away',
      channels: ['in_app', 'email'],
    }),
  },
];

export function triggerById(id: TriggerId): TriggerDef | undefined {
  return TRIGGERS.find((t) => t.id === id);
}
