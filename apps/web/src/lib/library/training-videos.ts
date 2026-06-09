// ============================================================
// SwingVantage — Video Library: Training & Instruction catalogue
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   These are the deeper "how-to / training" videos that live alongside
//   the quick feature walkthroughs. Add an entry here and it shows up in
//   the Library under its category — with the written walkthrough usable
//   immediately, and the video lighting up automatically once a recording
//   lands (same honest pattern as the Tutorial Center).
//
//   Recordings are produced by scripts/library/record-library.mjs, which
//   writes /public/library/<id>.mp4 (+ -poster.jpg + .vtt) and appends the
//   id to recordings.generated.json. Paths are resolved BY CONVENTION, so
//   adding a recording never means hand-editing the entry below.
//
//   HOW TO ADD A TRAINING VIDEO:
//     1. Add an entry here (id, title, category, sport, script).
//     2. Add matching narration + scenes to scripts/library/library-config.mjs.
//     3. Run: npm run library:record <id>   (see docs/VIDEO_LIBRARY.md)
// ============================================================

import RECORDINGS from './recordings.generated.json';
import type { LibraryItem, LibraryCategory, LibrarySport } from './types';

/** Authoring shape (no media paths — those resolve by convention). */
interface TrainingVideoSeed {
  id: string;
  title: string;
  description: string;
  /** Any training category (not the tutorial-backed feature-walkthroughs). */
  category: Exclude<LibraryCategory, 'feature-walkthroughs'>;
  sport: LibrarySport;
  route?: string;
  /** Shown before a recording exists, e.g. "2:30". */
  durationHint: string;
  /** Narration + written walkthrough + transcript + recording script. */
  script: string[];
  tags: string[];
}

export const TRAINING_VIDEOS: TrainingVideoSeed[] = [
  // ── Feature deep-dive: Swing Path (the named request) ─────────
  {
    id: 'swing-path',
    title: 'Understanding swing path',
    description:
      'How to read your swing path — in-to-out vs. out-to-in — and use it to fix your ball flight.',
    category: 'feature-deepdive',
    sport: 'all',
    route: '/diagnose',
    durationHint: '2:30',
    tags: ['swing path', 'path', 'slice', 'hook', 'draw', 'fade', 'diagnose', 'motion lab', 'ball flight'],
    script: [
      'Swing path is the direction your club or bat is travelling through impact — and it is one of the biggest reasons the ball curves.',
      'In SwingVantage you will see your path described as in-to-out, out-to-in, or down-the-line.',
      'Out-to-in tends to start the ball left or produce a slice; in-to-out tends to go right or draw. Your path together with the face direction explains the shape.',
      'Open Diagnose to see your path read for a session, with a confidence level so you know how much to trust it.',
      'For a visual, Motion Lab traces your body and club through the swing in 3D, so you can actually see the path, not just read it.',
      'Remember: a visual path read is a smart estimate, not a launch-monitor measurement — use it to spot the pattern.',
      'Once you know your path, the Drill Library filters to path-focused drills that nudge it back toward neutral.',
      'Re-check after a few sessions to confirm the change is sticking — that is the honest way to know it worked.',
    ],
  },

  // ── Launch monitor & data: full workflow (the named request) ──
  {
    id: 'launch-monitor-workflow',
    title: 'Using SwingVantage with your launch monitor',
    description:
      'The full workflow: import your numbers (CSV or photo), review the read, diagnose, and turn it into practice.',
    category: 'launch-monitor-data',
    sport: 'golf',
    route: '/sessions/import',
    durationHint: '3:00',
    tags: ['launch monitor', 'trackman', 'flightscope', 'skytrak', 'csv', 'import', 'data', 'carry', 'spin'],
    script: [
      'Here is the full workflow for using SwingVantage with your launch monitor — from raw numbers to a practice plan.',
      'Start on the Import screen. If your monitor exports a CSV — FlightScope, Trackman, SkyTrak and more — drag the file in.',
      'SwingVantage maps the columns to the right metrics: carry, ball speed, launch, spin, and more. Review the preview and fix any mismatches.',
      'No file? Snap a clear photo of the monitor screen and SwingVantage reads the numbers for you — always double-check them before saving.',
      'Save it as a session. From here, your data powers everything else.',
      'Open Diagnose to see the patterns in your numbers, ranked by what to fix first, each with a confidence level.',
      'Head to Progress to watch carry, spin, and consistency trend over time as you add more sessions.',
      'Then turn the top issue into focused drills, and retest later to prove the change actually moved the numbers.',
    ],
  },

  // ── Drills & Technique ────────────────────────────────────────
  {
    id: 'drill-library-tour',
    title: 'Turn your top fault into the right drills',
    description:
      'How SwingVantage takes your number-one fault and matches it to focused, ranked drills you can actually practice.',
    category: 'drills-technique',
    sport: 'all',
    route: '/fix',
    durationHint: '2:40',
    tags: ['drills', 'drillmatch', 'fix', 'practice', 'technique', 'fault', 'routine'],
    script: [
      'Knowing your fault is only half the job — the part that changes your swing is practising the right drill for it.',
      'Open Fix and SwingVantage starts from your top diagnosed fault, not a generic list, so the work is aimed at what matters most.',
      'Each drill is matched to that fault and ranked, with a short reason for why it fits — no guessing which video to copy.',
      'Every drill shows what good looks like and a simple cue, so you know the feel you are chasing before you start.',
      'Browse the full Drill Library any time to filter by sport and skill area when you want to work on something specific.',
      'Add a drill to your practice plan so it is waiting for you next time instead of being forgotten.',
      'Keep reps honest — a few focused minutes on the right drill beats a long unfocused session.',
      'Then re-diagnose after a week or two; if the fault score drops, the drill is working — that is how you know it stuck.',
    ],
  },

  // ── Coaching & Parent Guides ──────────────────────────────────
  {
    id: 'coaching-and-parents',
    title: 'Coaching and guiding young athletes',
    description:
      'How to use SwingVantage as a coach or parent — honest reads, shared progress, and age-appropriate guidance.',
    category: 'coach-parent',
    sport: 'all',
    route: '/coach',
    durationHint: '2:50',
    tags: ['coach', 'coaching', 'parents', 'team', 'youth', 'junior', 'guide', 'progress'],
    script: [
      'Whether you are a coach with a roster or a parent supporting one player, SwingVantage is built to keep your feedback honest.',
      'The Coach view gives you each athlete read in plain language, with a confidence level so you can say how sure the read is.',
      'Use the Team space to keep players organised and see progress side by side without comparing kids unfairly.',
      'For parents, the Parents guide focuses on encouragement first — what to praise, what to leave to the coach, and when to back off.',
      'Lean on the data to settle debates calmly: the numbers describe the swing, they do not judge the player.',
      'Share progress over time rather than single sessions, so a young athlete sees a trend, not one bad day.',
      'Keep goals process-based — better contact, a smoother tempo — instead of only outcomes like distance or score.',
      'Above all, let the player own it; SwingVantage gives you the read, your job is the confidence around it.',
    ],
  },

  // ── Pro Swing & Film Study ────────────────────────────────────
  {
    id: 'film-study-motion-lab',
    title: 'Film study: train your eye in Motion Lab',
    description:
      'Break a swing down frame by frame in Motion Lab and compare it against a reference to train your eye.',
    category: 'pro-film-study',
    sport: 'all',
    route: '/motion-lab',
    durationHint: '2:45',
    tags: ['film study', 'motion lab', 'compare', 'video', 'pro swing', 'breakdown', 'frame'],
    script: [
      'Film study is how you learn to see a swing — and SwingVantage gives you the tools to do it without a coach in the room.',
      'Open Motion Lab to trace the body and club through the swing in 3D, so you can watch the sequence, not just guess at it.',
      'Step through the key moments — setup, top, and impact — and notice the order things move in. Sequence is what separates levels.',
      'Use Compare to put your swing next to a reference and line up the same positions side by side.',
      'Look for one difference at a time; trying to fix five things at once is how film study turns into confusion.',
      'Remember a visual read is a smart estimate, not a launch-monitor measurement — use it to spot patterns, not to chase decimals.',
      'Save the clip in your video library so you can come back and see whether the change actually shows up later.',
      'Train your eye on good swings often, and the patterns start to jump out at you on your own — that is the real goal.',
    ],
  },
];

function fmtDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = Math.round(totalSec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Resolve the training catalogue into LibraryItems, merging any generated
 * recordings by convention. Ids present in recordings.generated.json get
 * their media paths + real duration; ids without fall back to the honest
 * "coming soon" + written walkthrough (script).
 */
export function getTrainingItems(): LibraryItem[] {
  const rec = RECORDINGS as Record<string, { durationSec: number }>;
  return TRAINING_VIDEOS.map((v) => {
    const r = rec[v.id];
    const base = `/library/${v.id}`;
    return {
      id: v.id,
      title: v.title,
      description: v.description,
      group: 'training',
      category: v.category,
      sport: v.sport,
      durationLabel: r ? fmtDuration(r.durationSec) : v.durationHint,
      durationSec: r?.durationSec,
      mp4Src: r ? `${base}.mp4` : undefined,
      poster: r ? `${base}-poster.jpg` : undefined,
      captionsSrc: r ? `${base}.vtt` : undefined,
      script: v.script,
      route: v.route,
      hasRecording: Boolean(r),
      source: 'training',
      tags: v.tags,
    };
  });
}
