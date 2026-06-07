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
