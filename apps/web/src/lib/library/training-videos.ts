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
  /**
   * Expose on the public /learn pages + sitemaps. Defaults to false so a new
   * video lands in the in-app library immediately but is rolled out to search
   * deliberately — flip to true (a few per week) to publish its /learn page.
   */
  public?: boolean;
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
    public: true, // already live on /learn
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
    public: true, // already live on /learn
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
    public: true, // rollout week 1
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
    public: true, // rollout week 1
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
    public: true, // rollout week 1
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

  // ── Drills & Technique (batch 2) ──────────────────────────────
  {
    id: 'slice-fix-drills',
    title: 'Drills to tame your slice',
    description:
      'The two or three drills that actually move a slice — matched to whether it is your path, your face, or both.',
    category: 'drills-technique',
    sport: 'golf',
    route: '/drills',
    durationHint: '2:30',
    tags: ['slice', 'drills', 'path', 'face', 'over the top', 'golf', 'fix'],
    script: [
      'A slice almost always comes from the face being open to the path at impact — so the fix starts with knowing which one is off.',
      'Open Diagnose first; if your read shows an out-to-in path, the drills below aim at the path, not just the grip.',
      'The headcover-outside drill trains you to swing more from the inside, so you stop cutting across the ball.',
      'For an open face, the split-hand release drill teaches the hands to rotate through, squaring the face sooner.',
      'Pick one — not both. Slicers who chase two fixes at once usually end up with a new miss instead of fewer.',
      'Filter the Drill Library to your sport and the path or face area so you only see drills that target your cause.',
      'Hit ten balls, then check the shape; you are looking for a straighter start and less curve, not a perfect shot.',
      'Re-diagnose after a week — if the curve is shrinking, keep going; that honest retest is how you know it is working.',
    ],
  },
  {
    id: 'contact-consistency-drills',
    title: 'Drills for more consistent contact',
    description:
      'Bat-sport drills for squaring up the ball more often — tightening your contact point and staying on plane.',
    category: 'drills-technique',
    sport: 'baseball',
    route: '/drills',
    durationHint: '2:30',
    tags: ['contact', 'drills', 'tee work', 'bat path', 'baseball', 'softball', 'consistency'],
    script: [
      'Consistent contact is less about swinging harder and more about your barrel arriving on time, on plane, again and again.',
      'Start with tee work at your real contact point — out front for a pull, deeper for the opposite field — so reps match games.',
      'The high-tee, low-tee ladder trains your barrel to stay in the zone longer instead of chopping down or uppercutting.',
      'Use the pause-at-launch drill to feel a balanced load before you fire; rushing the load is a hidden contact killer.',
      'Keep your eyes quiet and finish your turn — pulling off the ball early is the most common reason barrels miss.',
      'Filter the Drill Library to your bat sport and the contact area so the drills you see actually fit the problem.',
      'Track a simple rate — solid contacts out of ten — rather than chasing one perfect swing.',
      'Re-check after a few sessions; if your solid-contact rate climbs, the drill is doing its job.',
    ],
  },

  // ── Coaching & Parent Guides (batch 2) ────────────────────────
  {
    id: 'read-report-with-your-athlete',
    title: 'Reading a report with your young athlete',
    description:
      'How to sit down with a SwingVantage report together — leading with what went well and keeping confidence intact.',
    category: 'coach-parent',
    sport: 'all',
    route: '/reports',
    durationHint: '2:30',
    tags: ['parents', 'coach', 'report', 'feedback', 'youth', 'confidence', 'review'],
    script: [
      'A report is a conversation starter, not a verdict — how you open it matters more than any single number.',
      'Start with a genuine strength the report shows; young athletes hear the first thing you say the loudest.',
      'Point to the confidence level on each read so they learn that some findings are strong and some are just hints.',
      'Pick one thing to work on, together, and let them say it back in their own words — ownership beats instruction.',
      'Avoid comparing the report to a sibling or a teammate; the only fair comparison is to their own earlier sessions.',
      'Use the plain-language summary, not the raw metrics, when you are talking to a younger player.',
      'End by agreeing on a single small action before the next session, so the report turns into a plan, not pressure.',
      'Then revisit it next time and celebrate the trend — steady progress is the message you want to reinforce.',
    ],
  },
  {
    id: 'setting-honest-goals',
    title: 'Setting honest, process-based goals',
    description:
      'How to turn a report into goals an athlete can actually control — process over outcome, tracked over time.',
    category: 'coach-parent',
    sport: 'all',
    route: '/journey',
    durationHint: '2:30',
    tags: ['goals', 'process', 'journey', 'milestones', 'coach', 'parents', 'motivation'],
    script: [
      'The best goals are the ones an athlete can control — a better contact rate, a smoother tempo, not a score or a result.',
      'Open the Journey to see where the athlete is now; a good goal starts from an honest baseline, not a wish.',
      'Frame goals around process: "square the face more often," not "stop slicing forever." Process goals are repeatable.',
      'Make it measurable with something SwingVantage already tracks, so progress is visible without guesswork.',
      'Set a realistic horizon — a few weeks — and break it into small milestones the athlete can actually feel.',
      'Write the goal down where they will see it; a goal you revisit is a goal you keep.',
      'Review it on a steady cadence and adjust without judgement — missing a target is information, not failure.',
      'Celebrate the trend line over time; that is what keeps a young athlete coming back to the work.',
    ],
  },

  // ── Pro Swing & Film Study (batch 2) ──────────────────────────
  {
    id: 'compare-to-a-reference',
    title: 'Compare your swing to a reference',
    description:
      'Use Compare to line your swing up against a reference and spot the one difference worth working on.',
    category: 'pro-film-study',
    sport: 'all',
    route: '/compare',
    durationHint: '2:30',
    tags: ['compare', 'reference', 'film study', 'side by side', 'positions', 'motion lab'],
    script: [
      'Comparing your swing to a reference is one of the fastest ways to see what is actually different, not just what feels off.',
      'Open Compare and put your clip next to a reference swing for the same motion and sport.',
      'Line up the same moments — setup, top, and impact — so you are comparing like for like, not random frames.',
      'Look for the biggest single difference first; the small ones usually take care of themselves once the big one moves.',
      'Resist grading yourself against a tour pro frame by frame — use the reference to find a direction, not a carbon copy.',
      'Remember a visual comparison is a smart estimate; treat it as a pattern to explore, not a measurement to obsess over.',
      'Pick the one position you want to change and take that into a drill, then come back and compare again.',
      'Save both clips so next time you can see whether the gap to the reference actually narrowed.',
    ],
  },
  {
    id: 'reading-takeaway-sequence',
    title: 'Reading the takeaway and sequence',
    description:
      'Train your eye on the first move and the order things fire — the parts of the swing that quietly set up everything else.',
    category: 'pro-film-study',
    sport: 'golf',
    route: '/motion-lab',
    durationHint: '2:35',
    tags: ['takeaway', 'sequence', 'tempo', 'film study', 'motion lab', 'kinematic', 'golf'],
    script: [
      'Most of what goes right or wrong in a swing is decided early — in the takeaway and the order the body fires.',
      'Open Motion Lab and watch just the first few feet of the swing; a takeaway that is too far inside or outside sets up a chain reaction.',
      'Then watch the sequence — lower body, then torso, then arms and club. When that order holds, speed shows up for free.',
      'Step through frame by frame rather than watching at full speed; the give-aways hide in the transitions.',
      'Compare a good rep to a poor one of your own; the difference is usually in the sequence, not the positions you can see at impact.',
      'Keep in mind the 3D read is an estimate from your video, so use it to spot the pattern, not to chase exact angles.',
      'Pick one early checkpoint to work on — the takeaway or the first move down — and leave the rest alone for now.',
      'Re-film after some reps and look again; training your eye on the early move pays off across every swing you make.',
    ],
  },

  // ── Drills & Technique (sport coverage) ───────────────────────
  {
    id: 'tennis-topspin-drills',
    title: 'Drills for heavier topspin',
    description:
      'Tennis drills to brush up the back of the ball — more net clearance and a heavier, safer ball.',
    category: 'drills-technique',
    sport: 'tennis',
    route: '/drills',
    durationHint: '2:20',
    tags: ['tennis', 'topspin', 'forehand', 'low to high', 'drills', 'racquet path', 'spin'],
    script: [
      'Heavy topspin is not about swinging harder — it is about brushing up the back of the ball with a low-to-high path.',
      'Start with the shadow-swing drill: feel the racquet drop below the ball and finish high over the shoulder, with no ball at all.',
      'Add the drop-feed drill — feed yourself a ball low and brush up through it, listening for a clean, quiet contact.',
      'Keep the racquet face slightly closed through the brush; an open face turns topspin into a flat, risky ball.',
      'Aim well over the net on purpose — topspin is what brings the ball back down inside the line.',
      'Filter the Drill Library to tennis and the spin area so the drills you see match this exact goal.',
      'Track net clearance and depth, not just whether it went in; a heavier ball clears the net higher and still lands deep.',
      'Re-check after a few sessions — more margin over the net with the same depth means the topspin is doing its job.',
    ],
  },
  {
    id: 'pickleball-dink-drills',
    title: 'Drills to sharpen your dink',
    description:
      'Pickleball soft-game drills for control at the kitchen — keep the ball low and unattackable.',
    category: 'drills-technique',
    sport: 'pickleball',
    route: '/drills',
    durationHint: '2:20',
    tags: ['pickleball', 'dink', 'kitchen', 'soft game', 'control', 'drills', 'net'],
    script: [
      'The dink wins kitchen battles — the goal is a soft, low ball your opponent cannot attack, not a winner.',
      'Start with the cross-court dink drill; the longer diagonal gives you more margin and is the safest target to groove.',
      'Use a quiet push from the shoulder, not a wrist flick — a stable wrist keeps the ball low and repeatable.',
      'Keep your paddle out in front and your knees bent so you are lifting the ball gently, not slapping down at it.',
      'Aim to land the ball in the kitchen so it cannot be volleyed; height over the net is what gets you attacked.',
      'Filter the Drill Library to pickleball and the soft-game area to find drills that fit the dink.',
      'Count how many dinks in a row you keep below net-cord height rather than chasing outright winners.',
      'Re-check after a few sessions; a longer unattackable streak means your touch is getting more reliable.',
    ],
  },
  {
    id: 'padel-wall-drills',
    title: 'Drills for the back-wall rebound',
    description:
      'Padel drills for reading the back glass and turning a defensive rebound into a controlled reset.',
    category: 'drills-technique',
    sport: 'padel',
    route: '/drills',
    durationHint: '2:25',
    tags: ['padel', 'wall', 'back glass', 'rebound', 'defence', 'reset', 'drills'],
    script: [
      'In padel the wall is your friend — most points are lost by panicking off the glass, not by the shot itself.',
      'Start with the let-it-come drill: feed a ball into the back glass and just track it, learning how high and far it kicks before you swing.',
      'Wait for the ball to drop off the wall into your strike zone; the most common mistake is hitting it too early and too high.',
      'Use a compact, controlled swing to reset deep or lob, rather than trying to crush a ball that is moving away from you.',
      'Keep your body turned and your eyes on the rebound, not on your opponents — the wall changes the timing every time.',
      'Filter the Drill Library to padel and the defence area so the drills match the back-wall situation.',
      'Track how often you reset the point calmly versus going for too much off the glass.',
      'Re-check after a few sessions; staying in more rallies off the wall is the honest sign it is working.',
    ],
  },
  {
    id: 'fastpitch-timing-drills',
    title: 'Fastpitch timing drills',
    description:
      'Fast-pitch softball drills to get your load started early so the barrel is on time for rise and drop.',
    category: 'drills-technique',
    sport: 'softball_fast',
    route: '/drills',
    durationHint: '2:25',
    tags: ['softball', 'fast pitch', 'timing', 'load', 'rise ball', 'drills', 'contact'],
    script: [
      'In fast-pitch the pitch gets on you quickly, so timing — when you start your load — matters as much as the swing itself.',
      'Start with the early-load drill: begin your hands and hip load as the pitcher separates, not when the ball is already coming.',
      'Use front-toss at game speed to rehearse getting the foot down on time; late timing is what turns a rise ball into a pop-up.',
      'Stay through the middle of the field in practice so your timing is honest, not pull-happy.',
      'For the rise ball, train to lay off the high one rather than chasing it — discipline is a timing skill too.',
      'Filter the Drill Library to fast-pitch softball and the timing area to find drills built for this.',
      'Track solid contact and how often you are on time, not just hits, so practice reflects the real skill.',
      'Re-check after a few sessions; being on time more often is the sign the load is starting early enough.',
    ],
  },
  {
    id: 'slowpitch-line-drive-drills',
    title: 'Slow-pitch line-drive drills',
    description:
      'Slow-pitch softball drills for a level, slightly-up swing that turns big arcs into hard line drives.',
    category: 'drills-technique',
    sport: 'softball_slow',
    route: '/drills',
    durationHint: '2:25',
    tags: ['softball', 'slow pitch', 'line drive', 'launch angle', 'level swing', 'drills', 'contact'],
    script: [
      'Slow-pitch comes in on a high arc, so the trick is matching it with a slightly upward, level swing — not chopping down or scooping up.',
      'Start with tee work set at the height where the arc drops into your zone, so your reps match the pitch you actually see.',
      'Use the back-to-middle drill: drive the ball hard up the middle on a line before you ever think about pulling for distance.',
      'Let the ball travel and get your hands inside it; lunging at the high arc is what produces lazy pop-ups.',
      'Think line drive, not home run — solid contact on a line outproduces big swings that mostly fly out.',
      'Filter the Drill Library to slow-pitch softball and the contact area for drills that target this.',
      'Track your hard-hit line drives out of ten rather than chasing the occasional bomb.',
      'Re-check after a few sessions; more balls on a line means your swing is matching the arc.',
    ],
  },

  // ── Feature Deep-Dives (batch 2) ──────────────────────────────
  {
    id: 'progress-tracking-deepdive',
    title: 'How progress tracking actually works',
    description:
      'What the Progress trends are really telling you — and how an honest retest proves a change stuck.',
    category: 'feature-deepdive',
    sport: 'all',
    route: '/progress',
    durationHint: '2:35',
    tags: ['progress', 'trends', 'retest', 'consistency', 'baseline', 'tracking', 'improvement'],
    script: [
      'Progress is where SwingVantage answers the only question that matters: are you actually getting better?',
      'Open Progress and you will see your key metrics trend over time, not just your latest session in isolation.',
      'One session is noise; a trend is signal. SwingVantage leans on the trend so a single good or bad day does not fool you.',
      'Watch consistency, not just your best number — a tighter spread usually means more than one flushed shot.',
      'When you change something, set a baseline first, then retest after a few sessions to see if the line really moved.',
      'The honest retest is the whole point: it tells you whether a fix worked or whether you just had a good warm-up.',
      'If a trend is flat, that is information too — it means it is time to try a different fix, not to try harder at the same one.',
      'Come back to Progress on a steady cadence; improvement you can see is what keeps you practising the right things.',
    ],
  },
  {
    id: 'readiness-and-bodysync',
    title: 'Train with your readiness (BodySync)',
    description:
      'How BodySync turns sleep, energy, and soreness into a readiness read that adjusts the day’s coaching.',
    category: 'feature-deepdive',
    sport: 'all',
    route: '/bodysync',
    durationHint: '2:30',
    tags: ['bodysync', 'readiness', 'recovery', 'wellness', 'health', 'load', 'training'],
    script: [
      'How your body feels on a given day changes what a smart practice looks like — BodySync is where that gets accounted for.',
      'Open BodySync and log a few honest signals: sleep, energy, and any soreness. It takes seconds and it is private to you.',
      'SwingVantage turns those into a readiness read, so a low-energy day suggests technique and feel over max-effort reps.',
      'On a green day, that is your cue to push speed or work something demanding while your body can handle it.',
      'This is not medical advice and never a diagnosis — it is a simple, honest nudge to train in tune with your body.',
      'Pair readiness with the warm-up suggestions so you start ready instead of grinding cold.',
      'Over time you will see how rest and recovery line up with your better sessions in Progress.',
      'Used consistently, BodySync keeps you training hard on the right days and training smart on the rest.',
    ],
  },

  // ── Launch Monitor & Data (batch 2) ───────────────────────────
  {
    id: 'photo-import-deepdive',
    title: 'Import your numbers from a photo',
    description:
      'No CSV? Snap a photo of your launch monitor screen and SwingVantage reads the numbers — here’s how to do it well.',
    category: 'launch-monitor-data',
    sport: 'golf',
    route: '/sessions/import/image',
    durationHint: '2:30',
    tags: ['photo', 'import', 'launch monitor', 'ocr', 'screenshot', 'data', 'verify'],
    script: [
      'Not every launch monitor exports a file — so SwingVantage lets you snap a photo of the screen and pull the numbers from it.',
      'Open the photo import and add a clear, straight-on shot of the monitor display, with the metrics in focus.',
      'Good light and no glare make a big difference; a crisp photo reads far more accurately than a blurry, angled one.',
      'SwingVantage extracts the values and shows them back to you — always review them against the screen before you save.',
      'Fix any misread number right there; a quick check now keeps your history clean and your trends honest.',
      'This is a reading aid, not a measurement device — the truth is the monitor, the photo just saves you typing.',
      'Save it as a session and from there it powers Diagnose and Progress exactly like a CSV import would.',
      'When in doubt about a value, re-shoot rather than guess — clean data in is what makes everything downstream trustworthy.',
    ],
  },
  {
    id: 'reading-your-numbers',
    title: 'What your launch monitor numbers mean',
    description:
      'A plain-English tour of carry, ball speed, launch, spin, and smash factor — and which ones to actually act on.',
    category: 'launch-monitor-data',
    sport: 'golf',
    route: '/diagnose',
    durationHint: '2:45',
    tags: ['carry', 'ball speed', 'launch', 'spin', 'smash factor', 'data', 'metrics', 'launch monitor'],
    script: [
      'A launch monitor throws a lot of numbers at you — the skill is knowing which few actually explain your shot.',
      'Ball speed is your power; it is the single biggest driver of how far the ball can go.',
      'Smash factor is ball speed divided by club speed — it tells you how efficiently you struck it, with center contact the goal.',
      'Launch angle and spin work together to set your carry and how the ball holds or releases when it lands.',
      'Too much spin balloons the ball and costs distance; too little can make it dive — the right window depends on your speed.',
      'Carry is the honest distance number to track, because total roll depends on the ground, not your swing.',
      'In Diagnose, SwingVantage reads these patterns for you and ranks what to address first, each with a confidence level.',
      'Do not chase every number at once — fix the one that explains the most, retest, and let the rest follow.',
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
      public: v.public ?? false,
      tags: v.tags,
    };
  });
}
