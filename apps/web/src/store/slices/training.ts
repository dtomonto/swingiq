import type { SwingVantageSlice, SwingVantageStore } from '../types';
import { DEFAULT_TRAINING } from '../types';

export const createTrainingSlice: SwingVantageSlice<
  Pick<
    SwingVantageStore,
    | 'training'
    | 'setActiveDiagnosis'
    | 'toggleDrillStep'
    | 'markDrillDone'
    | 'recordPractice'
    | 'earnMilestone'
  >
> = (set) => ({
  training: DEFAULT_TRAINING,

  setActiveDiagnosis: (diagnosisId, sessionId) =>
    set((s) => ({
      training: {
        ...s.training,
        active_diagnosis_id: diagnosisId,
        active_session_id: sessionId,
        completed_steps: [],
        started_at: new Date().toISOString(),
      },
    })),

  toggleDrillStep: (stepIndex) =>
    set((s) => {
      const steps = s.training.completed_steps;
      const next = steps.includes(stepIndex)
        ? steps.filter((i) => i !== stepIndex)
        : [...steps, stepIndex];
      return { training: { ...s.training, completed_steps: next } };
    }),

  markDrillDone: (drillId) =>
    set((s) => {
      const existing = s.training.drills_completed[drillId];
      return {
        training: {
          ...s.training,
          drills_completed: {
            ...s.training.drills_completed,
            [drillId]: {
              count: (existing?.count ?? 0) + 1,
              last_done: new Date().toISOString(),
            },
          },
        },
      };
    }),

  recordPractice: () =>
    set((s) => {
      const today = new Date().toDateString();
      const lastDate = s.training.last_practice_date
        ? new Date(s.training.last_practice_date).toDateString()
        : null;
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const newStreak =
        lastDate === today
          ? s.training.streak_days
          : lastDate === yesterday
          ? s.training.streak_days + 1
          : 1;
      return {
        training: {
          ...s.training,
          streak_days: newStreak,
          last_practice_date: new Date().toISOString(),
        },
      };
    }),

  earnMilestone: (milestoneId) =>
    set((s) => {
      if (s.training.milestones_earned.includes(milestoneId)) return s;
      return {
        training: {
          ...s.training,
          milestones_earned: [...s.training.milestones_earned, milestoneId],
        },
      };
    }),
});
