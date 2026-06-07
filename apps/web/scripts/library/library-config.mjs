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
};
