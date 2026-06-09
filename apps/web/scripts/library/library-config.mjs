// ============================================================
// SwingVantage — Library training-video config
// ------------------------------------------------------------
// One entry per training video id: `lines` (spoken/caption track,
// mirrors src/lib/library/training-videos.ts) + `scenes` (what to show).
// Scenes use the same best-effort helper API as the tutorial recorder
// (go / dwell / gentleScroll / scrollTop / clickText / tryClick).
//
// Recorded by scripts/library/record-library.mjs →
//   public/library/<id>.mp4 (+ -poster.jpg + .vtt) and
//   src/lib/library/recordings.generated.json.
// ============================================================

export const LIBRARY_CONFIG = {
  // Feature deep-dive — Swing Path (Diagnose + Motion Lab).
  'swing-path': {
    lines: [
      'Swing path is the direction your club or bat is travelling through impact — and it is one of the biggest reasons the ball curves.',
      'In SwingVantage you will see your path described as in-to-out, out-to-in, or down-the-line.',
      'Out-to-in tends to start the ball left or produce a slice; in-to-out tends to go right or draw. Your path together with the face direction explains the shape.',
      'Open Diagnose to see your path read for a session, with a confidence level so you know how much to trust it.',
      'For a visual, Motion Lab traces your body and club through the swing in 3D, so you can actually see the path, not just read it.',
      'Remember: a visual path read is a smart estimate, not a launch-monitor measurement — use it to spot the pattern.',
      'Once you know your path, the Drill Library filters to path-focused drills that nudge it back toward neutral.',
      'Re-check after a few sessions to confirm the change is sticking — that is the honest way to know it worked.',
    ],
    async scenes(h) {
      await h.go('/diagnose');
      await h.dwell(3000);
      await h.gentleScroll(6000, 0.6);
      await h.dwell(2200);
      await h.gentleScroll(5000, 0.95);
      await h.dwell(1600);
      await h.scrollTop(1200);
      await h.dwell(900);
      await h.go('/motion-lab');
      await h.dwell(3000);
      await h.gentleScroll(5200, 0.7);
      await h.dwell(2200);
      await h.scrollTop(1200);
      await h.dwell(1200);
    },
  },

  // Launch monitor & data — full workflow (Import → Diagnose → Progress).
  'launch-monitor-workflow': {
    lines: [
      'Here is the full workflow for using SwingVantage with your launch monitor — from raw numbers to a practice plan.',
      'Start on the Import screen. If your monitor exports a CSV — FlightScope, Trackman, SkyTrak and more — drag the file in.',
      'SwingVantage maps the columns to the right metrics: carry, ball speed, launch, spin, and more. Review the preview and fix any mismatches.',
      'No file? Snap a clear photo of the monitor screen and SwingVantage reads the numbers for you — always double-check them before saving.',
      'Save it as a session. From here, your data powers everything else.',
      'Open Diagnose to see the patterns in your numbers, ranked by what to fix first, each with a confidence level.',
      'Head to Progress to watch carry, spin, and consistency trend over time as you add more sessions.',
      'Then turn the top issue into focused drills, and retest later to prove the change actually moved the numbers.',
    ],
    async scenes(h) {
      await h.go('/sessions/import');
      await h.dwell(3500);
      await h.gentleScroll(5200, 0.6);
      await h.dwell(2200);
      await h.scrollTop(1000);
      await h.dwell(800);
      await h.go('/sessions/import/image');
      await h.dwell(2600);
      await h.gentleScroll(3500, 0.5);
      await h.dwell(1400);
      await h.go('/diagnose');
      await h.dwell(3000);
      await h.gentleScroll(5500, 0.8);
      await h.dwell(1600);
      await h.scrollTop(1000);
      await h.go('/progress');
      await h.dwell(3000);
      await h.gentleScroll(5500, 0.85);
      await h.dwell(1600);
      await h.scrollTop(1000);
      await h.dwell(900);
    },
  },

  // Drills & Technique — fault → matched drills → practice plan.
  'drill-library-tour': {
    lines: [
      'Knowing your fault is only half the job — the part that changes your swing is practising the right drill for it.',
      'Open Fix and SwingVantage starts from your top diagnosed fault, not a generic list, so the work is aimed at what matters most.',
      'Each drill is matched to that fault and ranked, with a short reason for why it fits — no guessing which video to copy.',
      'Every drill shows what good looks like and a simple cue, so you know the feel you are chasing before you start.',
      'Browse the full Drill Library any time to filter by sport and skill area when you want to work on something specific.',
      'Add a drill to your practice plan so it is waiting for you next time instead of being forgotten.',
      'Keep reps honest — a few focused minutes on the right drill beats a long unfocused session.',
      'Then re-diagnose after a week or two; if the fault score drops, the drill is working — that is how you know it stuck.',
    ],
    async scenes(h) {
      await h.go('/fix');
      await h.dwell(3200);
      await h.gentleScroll(6000, 0.7);
      await h.dwell(2000);
      await h.scrollTop(1200);
      await h.dwell(800);
      await h.go('/drills');
      await h.dwell(3000);
      await h.gentleScroll(5500, 0.85);
      await h.dwell(1800);
      await h.scrollTop(1000);
      await h.go('/practice');
      await h.dwell(2800);
      await h.gentleScroll(4500, 0.7);
      await h.dwell(1400);
      await h.scrollTop(1000);
      await h.dwell(900);
    },
  },

  // Coaching & Parent Guides — Coach view, Team space, Parents guide.
  'coaching-and-parents': {
    lines: [
      'Whether you are a coach with a roster or a parent supporting one player, SwingVantage is built to keep your feedback honest.',
      'The Coach view gives you each athlete read in plain language, with a confidence level so you can say how sure the read is.',
      'Use the Team space to keep players organised and see progress side by side without comparing kids unfairly.',
      'For parents, the Parents guide focuses on encouragement first — what to praise, what to leave to the coach, and when to back off.',
      'Lean on the data to settle debates calmly: the numbers describe the swing, they do not judge the player.',
      'Share progress over time rather than single sessions, so a young athlete sees a trend, not one bad day.',
      'Keep goals process-based — better contact, a smoother tempo — instead of only outcomes like distance or score.',
      'Above all, let the player own it; SwingVantage gives you the read, your job is the confidence around it.',
    ],
    async scenes(h) {
      await h.go('/coach');
      await h.dwell(3200);
      await h.gentleScroll(5500, 0.7);
      await h.dwell(1800);
      await h.scrollTop(1000);
      await h.go('/team');
      await h.dwell(3000);
      await h.gentleScroll(5000, 0.8);
      await h.dwell(1600);
      await h.scrollTop(1000);
      await h.go('/parents');
      await h.dwell(3000);
      await h.gentleScroll(5500, 0.8);
      await h.dwell(1600);
      await h.scrollTop(1000);
      await h.dwell(900);
    },
  },

  // Pro Swing & Film Study — Motion Lab, Compare, Video library.
  'film-study-motion-lab': {
    lines: [
      'Film study is how you learn to see a swing — and SwingVantage gives you the tools to do it without a coach in the room.',
      'Open Motion Lab to trace the body and club through the swing in 3D, so you can watch the sequence, not just guess at it.',
      'Step through the key moments — setup, top, and impact — and notice the order things move in. Sequence is what separates levels.',
      'Use Compare to put your swing next to a reference and line up the same positions side by side.',
      'Look for one difference at a time; trying to fix five things at once is how film study turns into confusion.',
      'Remember a visual read is a smart estimate, not a launch-monitor measurement — use it to spot patterns, not to chase decimals.',
      'Save the clip in your video library so you can come back and see whether the change actually shows up later.',
      'Train your eye on good swings often, and the patterns start to jump out at you on your own — that is the real goal.',
    ],
    async scenes(h) {
      await h.go('/motion-lab');
      await h.dwell(3200);
      await h.gentleScroll(5500, 0.7);
      await h.dwell(2000);
      await h.scrollTop(1200);
      await h.go('/compare');
      await h.dwell(3000);
      await h.gentleScroll(5000, 0.8);
      await h.dwell(1600);
      await h.scrollTop(1000);
      await h.go('/video');
      await h.dwell(2800);
      await h.gentleScroll(4500, 0.75);
      await h.dwell(1400);
      await h.scrollTop(1000);
      await h.dwell(900);
    },
  },
};
