import type { LeadSource } from '@/lib/email/capture';

export interface ChallengeDay {
  day: number;
  focus: string;
  detail: string;
}

export interface Challenge {
  slug: string;
  sport: string;
  leadSource: LeadSource;
  title: string;
  metaDescription: string;
  intro: string;
  promise: string;
  days: ChallengeDay[];
  safetyNote: string;
}

export const CHALLENGES: Record<string, Challenge> = {
  '7-day-golf-slice': {
    slug: '7-day-golf-slice',
    sport: 'Golf',
    leadSource: 'golf_slice',
    title: '7-Day Golf Slice Challenge',
    metaDescription:
      'A free 7-day plan to straighten your slice: path-first drills, daily focus, and a retest. Beginner-safe, no account required.',
    intro:
      'Most slices come from an out-to-in path with an open face. This 7-day challenge fixes the path first, then the face, with short daily reps you can do at the range or at home.',
    promise: 'By day 7 you should see a straighter, shorter curve on video — and know exactly what to keep working on.',
    days: [
      { day: 1, focus: 'Baseline', detail: 'Film a face-on and a down-the-line swing. Note where the ball starts and which way it curves.' },
      { day: 2, focus: 'Transition drop', detail: 'Rehearse dropping hands and trail elbow toward your trail pocket before turning. 3 sets of 10 at quarter speed.' },
      { day: 3, focus: 'Path gate', detail: 'Headcover gate drill — place a headcover just outside and ahead of the ball; make 20 slow swings that miss it.' },
      { day: 4, focus: 'Square the face', detail: 'Split-hand release drill, half swings, feeling the toe point up after impact. 2 sets of 10.' },
      { day: 5, focus: 'Combine', detail: 'Blend path + face feels at half speed. 20 balls or rehearsals. No full speed yet.' },
      { day: 6, focus: 'Add speed', detail: 'Build to three-quarter speed, keeping the new feel. Film a few swings to check.' },
      { day: 7, focus: 'Retest', detail: 'Film again from the same angles and compare to day 1. Re-run your analysis to confirm.' },
    ],
    safetyNote: 'Drills are low-intensity. Warm up, clear your space, and stop if anything hurts. Junior golfers should practice with adult supervision.',
  },
  '7-day-slow-pitch-line-drive': {
    slug: '7-day-slow-pitch-line-drive',
    sport: 'Slow-Pitch Softball',
    leadSource: 'slow_pitch_softball',
    title: '7-Day Slow-Pitch Line-Drive Challenge',
    metaDescription:
      'A free 7-day plan to turn pop-ups and grounders into line drives in slow-pitch softball. Path and timing drills with a retest.',
    intro:
      'Pop-ups and grounders in slow-pitch are usually a swing-path and timing mismatch with the high arc. This challenge grooves a slightly upward, on-time path that drives line drives.',
    promise: 'By day 7 you should be squaring up more line drives and topping fewer balls.',
    days: [
      { day: 1, focus: 'Baseline', detail: 'Film 10 swings off a tee and live. Chart how many are pop-ups, grounders, or line drives.' },
      { day: 2, focus: 'Contact-height tee', detail: 'Set a tee at contact height; groove a slightly upward path into a net. 3 sets of 10.' },
      { day: 3, focus: 'Stay through', detail: 'Two-ball drill — drive the front ball into a second ball to feel a path that stays through. 3 sets of 8.' },
      { day: 4, focus: 'Timing', detail: 'Counted soft toss matched to the arc; load and fire on the same count. 2 sets of 10.' },
      { day: 5, focus: 'Combine', detail: 'Alternate tee and live reps, keeping the upward, on-time path. 20 swings.' },
      { day: 6, focus: 'Live focus', detail: 'Game-speed reps; track line-drive rate vs. day 1.' },
      { day: 7, focus: 'Retest', detail: 'Re-chart 10 swings and compare your line-drive rate to day 1.' },
    ],
    safetyNote: 'Warm up first and use an age-appropriate bat. Youth players should practice with adult supervision.',
  },
  '30-day-swingiq': {
    slug: '30-day-swingiq',
    sport: 'Any sport',
    leadSource: 'general',
    title: '30-Day SwingIQ Challenge',
    metaDescription:
      'A free 30-day plan to build one real, lasting swing improvement — week by week, with retests. Works for golf, tennis, baseball, and softball.',
    intro:
      'Real change takes more than a week. This 30-day challenge builds one priority into a habit, adds game speed and pressure, then locks it in — for any sport SwingIQ supports.',
    promise: 'By day 30 you should have one priority genuinely improved and measured against your starting baseline.',
    days: [
      { day: 1, focus: 'Week 1 — Groove', detail: 'Establish a baseline and groove your single highest-priority change at slow/half speed.' },
      { day: 8, focus: 'Week 2 — Speed', detail: 'Add game speed while keeping the new pattern. Introduce target work and re-film.' },
      { day: 15, focus: 'Week 3 — Pressure', detail: 'Simulate game situations and track results, not just feel.' },
      { day: 22, focus: 'Week 4 — Consolidate', detail: 'Reduce drill volume, keep the feel, and prepare for the final retest.' },
      { day: 30, focus: 'Final retest', detail: 'Retest against your week-1 baseline, confirm the improvement, and choose your next priority.' },
    ],
    safetyNote: 'Build intensity gradually, warm up, and stop if anything hurts. Youth athletes should participate with parent or guardian supervision.',
  },
};

export const CHALLENGE_SLUGS = Object.keys(CHALLENGES);
