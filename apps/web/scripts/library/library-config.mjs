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

  // Drills & Technique (batch 2) — slice fix (Diagnose → Drill Library).
  'slice-fix-drills': {
    lines: [
      'A slice almost always comes from the face being open to the path at impact — so the fix starts with knowing which one is off.',
      'Open Diagnose first; if your read shows an out-to-in path, the drills below aim at the path, not just the grip.',
      'The headcover-outside drill trains you to swing more from the inside, so you stop cutting across the ball.',
      'For an open face, the split-hand release drill teaches the hands to rotate through, squaring the face sooner.',
      'Pick one — not both. Slicers who chase two fixes at once usually end up with a new miss instead of fewer.',
      'Filter the Drill Library to your sport and the path or face area so you only see drills that target your cause.',
      'Hit ten balls, then check the shape; you are looking for a straighter start and less curve, not a perfect shot.',
      'Re-diagnose after a week — if the curve is shrinking, keep going; that honest retest is how you know it is working.',
    ],
    async scenes(h) {
      await h.go('/diagnose');
      await h.dwell(3000);
      await h.gentleScroll(5200, 0.6);
      await h.dwell(1800);
      await h.scrollTop(1000);
      await h.go('/drills');
      await h.dwell(3000);
      await h.gentleScroll(5500, 0.85);
      await h.dwell(1800);
      await h.scrollTop(1000);
      await h.dwell(900);
    },
  },

  // Drills & Technique (batch 2) — contact consistency (bat sports).
  'contact-consistency-drills': {
    lines: [
      'Consistent contact is less about swinging harder and more about your barrel arriving on time, on plane, again and again.',
      'Start with tee work at your real contact point — out front for a pull, deeper for the opposite field — so reps match games.',
      'The high-tee, low-tee ladder trains your barrel to stay in the zone longer instead of chopping down or uppercutting.',
      'Use the pause-at-launch drill to feel a balanced load before you fire; rushing the load is a hidden contact killer.',
      'Keep your eyes quiet and finish your turn — pulling off the ball early is the most common reason barrels miss.',
      'Filter the Drill Library to your bat sport and the contact area so the drills you see actually fit the problem.',
      'Track a simple rate — solid contacts out of ten — rather than chasing one perfect swing.',
      'Re-check after a few sessions; if your solid-contact rate climbs, the drill is doing its job.',
    ],
    async scenes(h) {
      await h.go('/drills');
      await h.dwell(3000);
      await h.gentleScroll(5500, 0.8);
      await h.dwell(1800);
      await h.scrollTop(1000);
      await h.go('/fix');
      await h.dwell(2800);
      await h.gentleScroll(4800, 0.7);
      await h.dwell(1600);
      await h.scrollTop(1000);
      await h.dwell(900);
    },
  },

  // Coaching & Parent Guides (batch 2) — reading a report together.
  'read-report-with-your-athlete': {
    lines: [
      'A report is a conversation starter, not a verdict — how you open it matters more than any single number.',
      'Start with a genuine strength the report shows; young athletes hear the first thing you say the loudest.',
      'Point to the confidence level on each read so they learn that some findings are strong and some are just hints.',
      'Pick one thing to work on, together, and let them say it back in their own words — ownership beats instruction.',
      'Avoid comparing the report to a sibling or a teammate; the only fair comparison is to their own earlier sessions.',
      'Use the plain-language summary, not the raw metrics, when you are talking to a younger player.',
      'End by agreeing on a single small action before the next session, so the report turns into a plan, not pressure.',
      'Then revisit it next time and celebrate the trend — steady progress is the message you want to reinforce.',
    ],
    async scenes(h) {
      await h.go('/reports');
      await h.dwell(3200);
      await h.gentleScroll(5500, 0.75);
      await h.dwell(1800);
      await h.scrollTop(1000);
      await h.go('/diagnose');
      await h.dwell(3000);
      await h.gentleScroll(5200, 0.8);
      await h.dwell(1600);
      await h.scrollTop(1000);
      await h.dwell(900);
    },
  },

  // Coaching & Parent Guides (batch 2) — honest, process-based goals.
  'setting-honest-goals': {
    lines: [
      'The best goals are the ones an athlete can control — a better contact rate, a smoother tempo, not a score or a result.',
      'Open the Journey to see where the athlete is now; a good goal starts from an honest baseline, not a wish.',
      'Frame goals around process: "square the face more often," not "stop slicing forever." Process goals are repeatable.',
      'Make it measurable with something SwingVantage already tracks, so progress is visible without guesswork.',
      'Set a realistic horizon — a few weeks — and break it into small milestones the athlete can actually feel.',
      'Write the goal down where they will see it; a goal you revisit is a goal you keep.',
      'Review it on a steady cadence and adjust without judgement — missing a target is information, not failure.',
      'Celebrate the trend line over time; that is what keeps a young athlete coming back to the work.',
    ],
    async scenes(h) {
      await h.go('/journey');
      await h.dwell(3200);
      await h.gentleScroll(5500, 0.8);
      await h.dwell(1800);
      await h.scrollTop(1000);
      await h.go('/milestones');
      await h.dwell(3000);
      await h.gentleScroll(5000, 0.8);
      await h.dwell(1600);
      await h.scrollTop(1000);
      await h.dwell(900);
    },
  },

  // Pro Swing & Film Study (batch 2) — compare to a reference.
  'compare-to-a-reference': {
    lines: [
      'Comparing your swing to a reference is one of the fastest ways to see what is actually different, not just what feels off.',
      'Open Compare and put your clip next to a reference swing for the same motion and sport.',
      'Line up the same moments — setup, top, and impact — so you are comparing like for like, not random frames.',
      'Look for the biggest single difference first; the small ones usually take care of themselves once the big one moves.',
      'Resist grading yourself against a tour pro frame by frame — use the reference to find a direction, not a carbon copy.',
      'Remember a visual comparison is a smart estimate; treat it as a pattern to explore, not a measurement to obsess over.',
      'Pick the one position you want to change and take that into a drill, then come back and compare again.',
      'Save both clips so next time you can see whether the gap to the reference actually narrowed.',
    ],
    async scenes(h) {
      await h.go('/compare');
      await h.dwell(3200);
      await h.gentleScroll(5200, 0.8);
      await h.dwell(1800);
      await h.scrollTop(1000);
      await h.go('/motion-lab');
      await h.dwell(3000);
      await h.gentleScroll(5200, 0.7);
      await h.dwell(1600);
      await h.scrollTop(1000);
      await h.dwell(900);
    },
  },

  // Pro Swing & Film Study (batch 2) — takeaway + sequence.
  'reading-takeaway-sequence': {
    lines: [
      'Most of what goes right or wrong in a swing is decided early — in the takeaway and the order the body fires.',
      'Open Motion Lab and watch just the first few feet of the swing; a takeaway that is too far inside or outside sets up a chain reaction.',
      'Then watch the sequence — lower body, then torso, then arms and club. When that order holds, speed shows up for free.',
      'Step through frame by frame rather than watching at full speed; the give-aways hide in the transitions.',
      'Compare a good rep to a poor one of your own; the difference is usually in the sequence, not the positions you can see at impact.',
      'Keep in mind the 3D read is an estimate from your video, so use it to spot the pattern, not to chase exact angles.',
      'Pick one early checkpoint to work on — the takeaway or the first move down — and leave the rest alone for now.',
      'Re-film after some reps and look again; training your eye on the early move pays off across every swing you make.',
    ],
    async scenes(h) {
      await h.go('/motion-lab');
      await h.dwell(3200);
      await h.gentleScroll(5200, 0.7);
      await h.dwell(2000);
      await h.scrollTop(1200);
      await h.go('/compare');
      await h.dwell(3000);
      await h.gentleScroll(5000, 0.8);
      await h.dwell(1600);
      await h.scrollTop(1000);
      await h.dwell(900);
    },
  },
};
