// ============================================================
// SwingVantage — Mental Performance: seeded routine library (pure data)
//
// Short, athlete-usable reset / pre-performance / between-action / recovery
// routines. One routine can serve a whole sport family (`sports[]`) so shared
// content isn't triplicated. Resolvers map a mistake or detected fault to the
// best routine, with a safe family/universal fallback.
//
// Adding a routine = add an entry here. Adding a sport URL = it appears
// automatically in generateStaticParams via getAllSituationParams().
// ============================================================

import type { MentalRoutine, MentalSport } from './types';
import { MISTAKE_CATEGORIES, sportFamilyFor } from './constants';

const BAT: MentalSport[] = ['baseball', 'softball_slow', 'softball_fast'];
const RACKET: MentalSport[] = ['tennis', 'pickleball', 'padel'];

export const MENTAL_ROUTINES: MentalRoutine[] = [
  // ── Golf ───────────────────────────────────────────────────
  {
    id: 'bad-shot-reset', slug: 'bad-shot-reset', sports: ['golf'],
    title: 'Bad Shot Reset', situation: 'After a bad shot',
    durationSeconds: 20, level: 'all', routineType: 'reset',
    goal: 'Stop one bad swing from becoming three bad holes.',
    steps: [
      'Exhale fully — let the shoulders drop.',
      'Name the shot once, without judgment ("pull-hook, fine").',
      'Take one useful lesson (target, tempo, or commitment).',
      'Physically step into your next-shot routine.',
      'Say your cue and walk on.',
    ],
    breathPattern: 'One slow exhale, twice as long as the inhale.',
    selfTalkCue: 'Next best swing.',
    physicalAnchor: 'Re-grip and take a practice swing to "reset" the body.',
    reflectionPrompt: 'Did I let the last shot pick my next club, or did I?',
    whenToUse: 'Right after any poor full shot, before you reach the ball.',
    howToPractice: 'On the range, hit one bad shot on purpose and run the reset before the next ball.',
    safetyNote: null,
    appliesTo: ['bad_tee_shot', 'chunked_wedge', 'slice', 'hook', 'fat', 'thin', 'topped', 'pull', 'push'],
    tags: ['quick', 'on-course'],
  },
  {
    id: 'penalty-ball-reset', slug: 'penalty-ball-reset', sports: ['golf'],
    title: 'Penalty Ball Reset', situation: 'After a water or penalty ball',
    durationSeconds: 30, level: 'all', routineType: 'post_error',
    goal: 'Accept the penalty, protect the rest of the hole.',
    steps: [
      'Accept the stroke is gone — it is already in the past.',
      'Two slow breaths while you walk.',
      'Decide the smart play that stops the bleeding (not the hero shot).',
      'Pick a clear, conservative target.',
      'Commit fully to the next swing.',
    ],
    breathPattern: 'Two rounds of 4-second inhale, 6-second exhale.',
    selfTalkCue: 'Accept, then play smart.',
    physicalAnchor: 'Tap the club head on the ground once as a "done" signal.',
    reflectionPrompt: 'Did I compound the penalty by forcing the next shot?',
    whenToUse: 'After a ball in a hazard, OB, or any penalty.',
    howToPractice: 'Visualize a penalty before a practice round and rehearse the smart bail-out.',
    safetyNote: null,
    appliesTo: ['water_ball', 'penalty', 'ob'],
    tags: ['on-course', 'acceptance'],
  },
  {
    id: 'three-putt-recovery', slug: 'three-putt-recovery', sports: ['golf'],
    title: 'Three-Putt Recovery', situation: 'After a three-putt or missed short putt',
    durationSeconds: 25, level: 'all', routineType: 'post_error',
    goal: 'Walk to the next tee with a clean head.',
    steps: [
      'Mark the lesson (speed or read), not the frustration.',
      'One long exhale as you replace the flag.',
      'Leave the green physically — the hole is over.',
      'Set a simple intention for the tee shot.',
      'Say your cue stepping onto the next tee.',
    ],
    breathPattern: 'One 6-second exhale at the cup.',
    selfTalkCue: 'Green’s behind me.',
    physicalAnchor: 'Replacing the flag = the "let it go" trigger.',
    reflectionPrompt: 'Was that a read problem, a speed problem, or a focus problem?',
    whenToUse: 'After any three-putt or a missed short putt.',
    howToPractice: 'On the practice green, miss a short one and rehearse walking off cleanly.',
    safetyNote: null,
    appliesTo: ['three_putt', 'missed_short_putt', 'putting'],
    tags: ['on-course', 'putting'],
  },
  {
    id: 'shank-reset', slug: 'shank-reset', sports: ['golf'],
    title: 'Shank Reset', situation: 'After a shank',
    durationSeconds: 25, level: 'all', routineType: 'reset',
    goal: 'Calm the spike of panic a shank creates and find one simple thought.',
    steps: [
      'Recognize it’s one swing, not a pattern — yet.',
      'Two slow breaths to settle the startle.',
      'One simple feel: weight in the arches, hands in close.',
      'Make a slow rehearsal swing with that feel.',
      'Commit to a stock, smooth swing.',
    ],
    breathPattern: 'Two 4-in / 6-out breaths.',
    selfTalkCue: 'Hands in, smooth.',
    physicalAnchor: 'A deliberate slow practice swing as a body reset.',
    reflectionPrompt: 'Did I tighten my grip and rush after it?',
    whenToUse: 'Immediately after a shank, before the next shot.',
    howToPractice: 'Pair the "hands in, smooth" feel with the breath on the range.',
    safetyNote: null,
    appliesTo: ['shank'],
    tags: ['on-course', 'panic'],
  },
  {
    id: 'blow-up-hole-recovery', slug: 'blow-up-hole-recovery', sports: ['golf'],
    title: 'Blow-Up Hole Recovery', situation: 'After a blow-up hole',
    durationSeconds: 45, level: 'all', routineType: 'post_error',
    goal: 'Keep one bad hole from becoming a bad nine.',
    steps: [
      'Say the number out loud once, then close that scorecard mentally.',
      'Walk slower than usual to the next tee.',
      'Three slow breaths — reset the nervous system.',
      'Reset your goal to the next hole only.',
      'Pick the fairway’s widest target and commit.',
    ],
    breathPattern: 'Three rounds of 4-in / 6-out while walking.',
    selfTalkCue: 'New hole, new round.',
    physicalAnchor: 'A slower walk pace tells the body "we’re okay".',
    reflectionPrompt: 'What is the first sign I’m spiraling, and did I catch it?',
    whenToUse: 'After a double bogey or worse, especially if anger is rising.',
    howToPractice: 'Decide your "blow-up plan" before the round so it’s automatic.',
    safetyNote: null,
    appliesTo: ['blow_up_hole', 'compounding_mistakes'],
    tags: ['on-course', 'anger'],
  },
  {
    id: 'first-tee-nerves', slug: 'first-tee-nerves', sports: ['golf'],
    title: 'First-Tee Calm', situation: 'First-tee nerves',
    durationSeconds: 40, level: 'all', routineType: 'pre_performance',
    goal: 'Turn nervous energy into a committed first swing.',
    steps: [
      'Name the nerves as excitement — same energy, better label.',
      'Two slow breaths behind the ball.',
      'Pick the widest safe target.',
      'Run your normal pre-shot routine exactly.',
      'Commit — let it be a smooth, stock swing.',
    ],
    breathPattern: 'Two 4-in / 6-out breaths behind the ball.',
    selfTalkCue: 'Smooth and committed.',
    physicalAnchor: 'Your standard pre-shot routine, unchanged.',
    reflectionPrompt: 'Did I let nerves speed up my tempo?',
    whenToUse: 'On the first tee, or any tee where nerves spike.',
    howToPractice: 'Rehearse the routine at home so it’s automatic under nerves.',
    safetyNote: null,
    appliesTo: ['first_tee_nerves', 'nerves'],
    tags: ['pre-round', 'nerves'],
  },
  {
    id: 'protect-a-score', slug: 'protect-a-score', sports: ['golf'],
    title: 'Scorecard Detachment', situation: 'Protecting a good score',
    durationSeconds: 20, level: 'intermediate', routineType: 'between',
    goal: 'Keep playing shots, not scoreboard math.',
    steps: [
      'Notice you’re counting — that’s the cue.',
      'One breath, then back to this shot only.',
      'Pick a target, not a number.',
      'Run your normal routine.',
      'Stay aggressive to conservative targets.',
    ],
    breathPattern: 'One slow exhale to release the scoreboard.',
    selfTalkCue: 'This shot, this target.',
    physicalAnchor: 'Look at your target, not the scorecard.',
    reflectionPrompt: 'Did I start steering instead of swinging?',
    whenToUse: 'When you’re on track for a personal best and start protecting.',
    howToPractice: 'Practice committing to targets when the score "matters".',
    safetyNote: null,
    appliesTo: ['protecting_score', 'choking_ahead'],
    tags: ['on-course', 'pressure'],
  },
  {
    id: 'on-course-meditation', slug: 'on-course-meditation', sports: ['golf'],
    title: 'On-Course Walking Meditation', situation: 'Between shots, all round',
    durationSeconds: 60, level: 'all', routineType: 'meditation',
    goal: 'Stay present and calm between shots instead of replaying or rushing.',
    steps: [
      'Between shots, let golf go — notice your steps and breath.',
      'Feel three full breaths matched to your stride.',
      'Soften your eyes and take in the course, not the score.',
      'About 30 seconds before your shot, switch the "play" mode back on.',
      'Arrive at the ball calm and ready to commit.',
    ],
    breathPattern: 'Breathe with your stride — inhale 3 steps, exhale 4.',
    selfTalkCue: 'Walk easy, play ready.',
    physicalAnchor: 'Your walking rhythm is the anchor.',
    reflectionPrompt: 'Did I spend the walk replaying the last shot or resetting for the next?',
    whenToUse: 'During the walk between every shot.',
    howToPractice: 'Practice walking-breath on any walk, not just the course.',
    safetyNote: null,
    appliesTo: ['slow_play', 'focus', 'between_shots'],
    tags: ['on-course', 'focus', 'meditation'],
  },
  {
    id: 'between-hole-reset', slug: 'between-hole-reset', sports: ['golf'],
    title: 'Between-Hole Reset', situation: 'Walking to the next tee',
    durationSeconds: 30, level: 'all', routineType: 'between',
    goal: 'Close the last hole and open the next with a clean slate.',
    steps: [
      'At the green’s edge, "file" the last hole — good or bad, it’s done.',
      'Two breaths on the walk.',
      'Notice one thing you’re doing well today.',
      'Set one simple intention for the next hole.',
      'Step on the tee ready.',
    ],
    breathPattern: 'Two slow breaths on the walk.',
    selfTalkCue: 'Done. Next.',
    physicalAnchor: 'Crossing onto the next tee = fresh start.',
    reflectionPrompt: 'Am I carrying the last hole onto this tee?',
    whenToUse: 'Every walk between holes.',
    howToPractice: 'Make the "file it" thought a habit after every hole.',
    safetyNote: null,
    appliesTo: ['between_holes', 'bad_hole'],
    tags: ['on-course'],
  },

  // ── Baseball + Softball (bat family) ───────────────────────
  {
    id: 'error-recovery', slug: 'error-recovery', sports: BAT,
    title: 'Error Recovery Reset', situation: 'After a fielding or throwing error',
    durationSeconds: 15, level: 'all', routineType: 'post_error',
    goal: 'Be ready — and wanting — the next ball.',
    steps: [
      'Tap your glove once — the "reset" signal.',
      'One breath out.',
      'Look to the next hitter or next play.',
      'Say: "Want the next one."',
      'Reset your feet and athletic posture.',
    ],
    breathPattern: 'One sharp exhale, then a normal breath.',
    selfTalkCue: 'Want the next one.',
    physicalAnchor: 'Glove tap = the trigger to let go.',
    reflectionPrompt: 'Did I want the next ball, or hope it went somewhere else?',
    whenToUse: 'Immediately after any fielding or throwing miscue.',
    howToPractice: 'During grounders, intentionally boot one and run the reset before the next rep.',
    safetyNote: null,
    appliesTo: ['fielding_error', 'throwing_error', 'dropped_fly', 'baserunning_mistake', 'error'],
    tags: ['quick', 'in-game', 'defense'],
  },
  {
    id: 'bad-hop-recovery', slug: 'bad-hop-recovery', sports: BAT,
    title: 'Bad-Hop Reset', situation: 'After a ball you couldn’t control',
    durationSeconds: 12, level: 'all', routineType: 'post_error',
    goal: 'Separate bad luck from a real mistake so it doesn’t shake you.',
    steps: [
      'Name it: "bad hop, not on me."',
      'One breath.',
      'Reset feet, stay aggressive on the next one.',
      'Say: "Ready, attack.”',
    ],
    breathPattern: 'One quick reset breath.',
    selfTalkCue: 'Ready, attack the next.',
    physicalAnchor: 'A small hop to reset your feet.',
    reflectionPrompt: 'Did I get tentative on the next ball after the bad hop?',
    whenToUse: 'After a ball that took a bad hop or was uncatchable.',
    howToPractice: 'Talk yourself through "not on me" so it’s automatic.',
    safetyNote: null,
    appliesTo: ['bad_hop'],
    tags: ['quick', 'in-game', 'defense'],
  },
  {
    id: 'strikeout-recovery', slug: 'strikeout-recovery', sports: BAT,
    title: 'Strikeout Recovery', situation: 'After a strikeout or weak at-bat',
    durationSeconds: 30, level: 'all', routineType: 'post_error',
    goal: 'Drop the at-bat before you take the field or sit down.',
    steps: [
      'Take one useful note (pitch, timing, approach).',
      'Breathe out and physically set the bat down.',
      'Tell yourself the next at-bat is a clean sheet.',
      'Shift fully to your next job (defense or dugout focus).',
    ],
    breathPattern: 'One long exhale as you set the bat down.',
    selfTalkCue: 'Note it, leave it.',
    physicalAnchor: 'Setting the bat down = closing the at-bat.',
    reflectionPrompt: 'Did I take that at-bat onto the field with me?',
    whenToUse: 'After a strikeout or frustrating at-bat.',
    howToPractice: 'Build the "one note, then leave it" habit in batting practice.',
    safetyNote: null,
    appliesTo: ['strikeout', 'weak_at_bat'],
    tags: ['in-game', 'hitting'],
  },
  {
    id: 'next-pitch-reset', slug: 'next-pitch-reset', sports: BAT,
    title: 'Next-Pitch Reset', situation: 'After a pitching mistake',
    durationSeconds: 15, level: 'intermediate', routineType: 'between',
    goal: 'Flush the last pitch and commit to the next one.',
    steps: [
      'Step off the rubber.',
      'One breath, eyes to the target.',
      'Pick the next pitch and location with full conviction.',
      'Say: "This pitch."',
      'Back on the rubber, commit.',
    ],
    breathPattern: 'One breath off the rubber.',
    selfTalkCue: 'This pitch.',
    physicalAnchor: 'Stepping off and back on = a clean restart.',
    reflectionPrompt: 'Did I let the last pitch change my conviction on this one?',
    whenToUse: 'After a walk, hit batter, or a pitch that got hit hard.',
    howToPractice: 'Use the step-off routine in every bullpen.',
    safetyNote: null,
    appliesTo: ['pitching_mistake'],
    tags: ['in-game', 'pitching'],
  },
  {
    id: 'fielding-confidence', slug: 'fielding-confidence', sports: BAT,
    title: 'Next-Ball Confidence', situation: 'When you fear the next ball coming to you',
    durationSeconds: 30, level: 'all', routineType: 'confidence',
    goal: 'Turn "don’t hit it to me" into "hit it to me".',
    steps: [
      'Notice the fear thought — that’s the cue, not the truth.',
      'One slow breath, drop the shoulders.',
      'Picture one clean play you’ve made before.',
      'Get in an athletic ready position every pitch.',
      'Say: "Hit it here." Mean it.',
    ],
    breathPattern: 'One slow 4-in / 6-out breath between pitches.',
    selfTalkCue: 'Hit it here.',
    physicalAnchor: 'Set your ready position on every pitch.',
    reflectionPrompt: 'Am I hoping the ball avoids me, or inviting it?',
    whenToUse: 'After an error, when you dread the next ball.',
    howToPractice: 'Take extra reps so the body trusts the play; pair with the cue.',
    safetyNote: null,
    appliesTo: ['fear_next_ball'],
    tags: ['confidence', 'defense'],
  },

  // ── Tennis / Pickleball / Padel (racket family) ────────────
  {
    id: 'forced-error-recovery', slug: 'forced-error-recovery', sports: RACKET,
    title: 'Forced-Error Reset', situation: 'When your opponent forced the error',
    durationSeconds: 20, level: 'all', routineType: 'post_error',
    goal: 'Accept good pressure and make one tactical adjustment.',
    steps: [
      'Recognize the opponent created that — it’s not a "bad" miss.',
      'Breathe behind the baseline or at the back fence.',
      'Choose one tactical adjustment (more margin, better position, change the pattern).',
      'Say: "Good shot, my adjustment."',
      'Start your next-point routine.',
    ],
    breathPattern: 'One slow breath behind the line.',
    selfTalkCue: 'Good shot — my adjustment.',
    physicalAnchor: 'Turn to the back fence to reset.',
    reflectionPrompt: 'Did I treat a forced error like a careless one?',
    whenToUse: 'After a point where the opponent’s pressure caused your miss.',
    howToPractice: 'In points, label each miss forced vs unforced out loud.',
    safetyNote: null,
    appliesTo: ['forced_error', 'lost_long_rally', 'getting_targeted'],
    tags: ['between-point', 'tactical'],
  },
  {
    id: 'unforced-error-reset', slug: 'unforced-error-reset', sports: RACKET,
    title: 'Unforced-Error Reset', situation: 'When you had control and missed',
    durationSeconds: 20, level: 'all', routineType: 'post_error',
    goal: 'Calm diagnosis, one simple correction — no spiral.',
    steps: [
      'No judgment — one calm note (footwork, watch the ball, simpler target).',
      'One breath at the back of the court.',
      'Choose the single simplest fix.',
      'Say: "Simple and solid."',
      'Begin your serve/return routine.',
    ],
    breathPattern: 'One 4-in / 6-out breath.',
    selfTalkCue: 'Simple and solid.',
    physicalAnchor: 'Adjust your strings to reset focus.',
    reflectionPrompt: 'Did I add a second mistake by overthinking the first?',
    whenToUse: 'After a routine ball you missed with no real pressure.',
    howToPractice: 'Reduce to one swing thought per point in practice sets.',
    safetyNote: null,
    appliesTo: ['unforced_error', 'netted_volley', 'missed_overhead'],
    tags: ['between-point'],
  },
  {
    id: 'between-point-reset', slug: 'between-point-reset', sports: RACKET,
    title: 'Between-Point Reset', situation: 'Between any two points',
    durationSeconds: 20, level: 'all', routineType: 'between',
    goal: 'A repeatable ritual so every point starts fresh.',
    steps: [
      'Response: turn away from the net, quick acknowledgment of the last point.',
      'Relax: walk to the back, loosen the grip, one breath.',
      'Prepare: pick your pattern and target for the next point.',
      'Ritual: bounce/adjust strings, same every time.',
      'Play: step in committed.',
    ],
    breathPattern: 'One slow breath at the back fence.',
    selfTalkCue: 'New point.',
    physicalAnchor: 'Strings + a few steps to the back — the same every time.',
    reflectionPrompt: 'Is my between-point routine the same after winners and errors?',
    whenToUse: 'Between every point.',
    howToPractice: 'Run the four steps in every practice match.',
    safetyNote: null,
    appliesTo: ['missed_return', 'bad_line_call', 'between_points'],
    tags: ['between-point', 'ritual'],
  },
  {
    id: 'serve-reset', slug: 'serve-reset', sports: RACKET,
    title: 'Serve Reset', situation: 'After a double fault or shaky serve',
    durationSeconds: 20, level: 'all', routineType: 'reset',
    goal: 'Trust a rhythm serve on the next one.',
    steps: [
      'Let the double go — it’s one point.',
      'One breath, settle the shoulders.',
      'Pick a bigger target and a smooth, rhythmic intent.',
      'Run your exact serve ritual (bounce count, breath).',
      'Commit to a smooth swing, not a safe poke.',
    ],
    breathPattern: 'One slow breath before the toss.',
    selfTalkCue: 'Smooth rhythm, big target.',
    physicalAnchor: 'Your exact ball-bounce ritual.',
    reflectionPrompt: 'Did I get tentative and "guide" the next serve?',
    whenToUse: 'After a double fault or two missed serves.',
    howToPractice: 'Serve under a "one double = run the ritual" rule in practice.',
    safetyNote: null,
    appliesTo: ['double_fault', 'serve'],
    tags: ['serve', 'between-point'],
  },
  {
    id: 'one-point-reset', slug: 'one-point-reset', sports: RACKET,
    title: 'One-Point Reset', situation: 'Tight score, ahead or behind',
    durationSeconds: 15, level: 'intermediate', routineType: 'between',
    goal: 'Shrink the match to the only point you can play.',
    steps: [
      'Notice scoreboard thinking — that’s the cue.',
      'One breath, narrow to this point.',
      'Pick one clear target and pattern.',
      'Say: "One point. Clear target."',
      'Play it fully.',
    ],
    breathPattern: 'One slow exhale.',
    selfTalkCue: 'One point. Clear target.',
    physicalAnchor: 'Eyes to your target, not the score.',
    reflectionPrompt: 'Did I play the scoreboard or the ball?',
    whenToUse: 'Serving for it, facing break/game point, or closing out.',
    howToPractice: 'Play practice tiebreaks with the "one point" cue.',
    safetyNote: null,
    appliesTo: ['choking_ahead', 'rushing_behind', 'tiebreak_pressure'],
    tags: ['pressure', 'between-point'],
  },
  {
    id: 'doubles-frustration-reset', slug: 'doubles-frustration-reset', sports: RACKET,
    title: 'Doubles Partner Reset', situation: 'Frustrated with your partner',
    durationSeconds: 20, level: 'all', routineType: 'reset',
    goal: 'Protect the team’s energy and reconnect.',
    steps: [
      'Turn away briefly — don’t react in the moment.',
      'One breath; remember they want to win too.',
      'Use neutral, forward language ("next ball, middle solves most").',
      'Tap paddles/rackets or a quick "let’s go".',
      'Reconnect on a simple shared plan.',
    ],
    breathPattern: 'One slow breath facing away.',
    selfTalkCue: 'Next ball, we’re a team.',
    physicalAnchor: 'A paddle/racket tap to reconnect.',
    reflectionPrompt: 'Did my body language lift my partner or sink them?',
    whenToUse: 'When frustration with a partner is rising in doubles.',
    howToPractice: 'Agree on one shared cue with your partner before matches.',
    safetyNote: null,
    appliesTo: ['partner_frustration'],
    tags: ['doubles', 'communication'],
  },
  {
    id: 'match-focus', slug: 'match-focus', sports: RACKET,
    title: 'Match Focus Settle', situation: 'Before or during a match',
    durationSeconds: 60, level: 'all', routineType: 'meditation',
    goal: 'Find a calm, alert baseline you can return to all match.',
    steps: [
      'Stand tall, feel your feet on the court.',
      'Five slow breaths, longer on the exhale.',
      'Pick your one identity word for today (e.g. "steady", "aggressive").',
      'Picture your first two patterns succeeding.',
      'Open your eyes calm and alert.',
    ],
    breathPattern: 'Five rounds of 4-in / 6-out.',
    selfTalkCue: 'Calm and alert.',
    physicalAnchor: 'Feet on the court as your anchor.',
    reflectionPrompt: 'Could I find this calm baseline again mid-match?',
    whenToUse: 'In the warm-up, on changeovers, or any time the match speeds up.',
    howToPractice: 'Do the 60-second settle daily so it’s instant on court.',
    safetyNote: null,
    appliesTo: ['match_nerves', 'focus', 'momentum_swing'],
    tags: ['pre-match', 'focus', 'meditation'],
  },

  // ── Universal ──────────────────────────────────────────────
  {
    id: 'universal-reset', slug: 'universal-reset', sports: ['universal'],
    title: 'Universal Mistake Reset', situation: 'Any mistake, any sport',
    durationSeconds: 20, level: 'all', routineType: 'reset',
    goal: 'A simple reset you can use in any sport, any moment.',
    steps: [
      'Exhale fully and let it go.',
      'Name the mistake once, without judgment.',
      'Take one useful lesson.',
      'Reset your body (feet, posture, grip).',
      'Say your cue and play the next moment.',
    ],
    breathPattern: 'One slow exhale, twice as long as the inhale.',
    selfTalkCue: 'Next one.',
    physicalAnchor: 'A small physical reset (feet or breath).',
    reflectionPrompt: 'Did I reset, or carry it into the next play?',
    whenToUse: 'After any mistake, in any sport.',
    howToPractice: 'Use the same five steps everywhere so it becomes automatic.',
    safetyNote: null,
    appliesTo: ['general_mistake', 'mistake'],
    tags: ['quick', 'universal'],
  },
  {
    id: 'pre-game-routine', slug: 'pre-game-routine', sports: ['universal'],
    title: 'Pre-Game Settle & Focus', situation: 'Before you compete',
    durationSeconds: 90, level: 'all', routineType: 'pre_performance',
    goal: 'Arrive calm, clear, and ready to commit.',
    steps: [
      'Five slow breaths to settle the body.',
      'Name your one focus word for today.',
      'Picture two things going well early.',
      'Set a process goal you control (effort, routine, target).',
      'Finish with your cue and step in.',
    ],
    breathPattern: 'Five rounds of 4-in / 6-out.',
    selfTalkCue: 'Calm, clear, committed.',
    physicalAnchor: 'Feet on the ground, tall posture.',
    reflectionPrompt: 'Did I start the way I planned, or react to nerves?',
    whenToUse: 'In the 10 minutes before competing.',
    howToPractice: 'Run the same routine before every practice and game.',
    safetyNote: null,
    appliesTo: ['pre_game_nerves', 'nerves', 'pre_performance'],
    tags: ['pre-game', 'nerves'],
  },
  {
    id: 'post-error-recovery', slug: 'post-error-recovery', sports: ['universal'],
    title: 'Post-Error Recovery', situation: 'After a mistake that stuck with you',
    durationSeconds: 30, level: 'all', routineType: 'post_error',
    goal: 'Process a mistake cleanly instead of replaying it.',
    steps: [
      'Acknowledge the feeling — it’s normal.',
      'Two slow breaths to settle.',
      'Pull one specific, useful lesson.',
      'Decide the exact cue for next time.',
      'Choose to move on, on purpose.',
    ],
    breathPattern: 'Two 4-in / 6-out breaths.',
    selfTalkCue: 'Learn it, leave it.',
    physicalAnchor: 'A deliberate "set it down" gesture.',
    reflectionPrompt: 'What’s the one lesson, and what’s just replay?',
    whenToUse: 'After a mistake you keep replaying.',
    howToPractice: 'Separate "lesson" from "replay" every time you reflect.',
    safetyNote: null,
    appliesTo: ['general_mistake', 'replay'],
    tags: ['recovery', 'universal'],
  },
  {
    id: 'confidence-rebuilding', slug: 'confidence-rebuilding', sports: ['universal'],
    title: 'Confidence Rebuild', situation: 'When confidence is low',
    durationSeconds: 60, level: 'all', routineType: 'confidence',
    goal: 'Rebuild belief from evidence, not hype.',
    steps: [
      'Recall three real things you do well (be specific).',
      'Two slow breaths, stand tall.',
      'Pick one small, winnable focus for right now.',
      'Commit to effort you control, not outcome.',
      'Say your cue and take the next rep.',
    ],
    breathPattern: 'Two slow breaths with tall posture.',
    selfTalkCue: 'I’ve done this before.',
    physicalAnchor: 'Tall, strong posture resets confidence chemistry.',
    reflectionPrompt: 'Am I judging myself on outcome or effort?',
    whenToUse: 'After a rough stretch, or before a tough matchup.',
    howToPractice: 'Keep a short "evidence list" of things you do well.',
    safetyNote: null,
    appliesTo: ['lost_confidence', 'defeated'],
    tags: ['confidence', 'universal'],
  },
  {
    id: 'pressure-breathing', slug: 'pressure-breathing', sports: ['universal'],
    title: 'Pressure Breathing', situation: 'When the moment feels big',
    durationSeconds: 30, level: 'all', routineType: 'reset',
    goal: 'Down-regulate a racing system so you can execute.',
    steps: [
      'Notice the speed/tension — that’s the cue.',
      'Inhale 4 seconds through the nose.',
      'Exhale slowly for 6 seconds.',
      'Repeat three times; feel the shoulders drop.',
      'Return to your normal routine.',
    ],
    breathPattern: 'Three rounds of 4-in / 6-out (longer exhale).',
    selfTalkCue: 'Slow the breath, slow the moment.',
    physicalAnchor: 'The long exhale is the anchor.',
    reflectionPrompt: 'Did slowing my breath slow my decisions down too?',
    whenToUse: 'Any high-pressure moment in any sport.',
    howToPractice: 'Practice the 4-6 breath daily so it’s automatic under pressure.',
    safetyNote: 'Breathe gently and never hold your breath to the point of discomfort. If you feel light-headed, return to normal breathing.',
    appliesTo: ['pressure', 'too_excited', 'rushed', 'nervous'],
    tags: ['breathing', 'pressure', 'universal'],
  },
];

// ── Resolvers ────────────────────────────────────────────────

const byId = new Map(MENTAL_ROUTINES.map((r) => [r.id, r]));

export function getRoutine(slug: string): MentalRoutine | undefined {
  return byId.get(slug);
}

/** Routines that serve a sport (exact match; universal handled separately). */
export function getRoutinesForSport(sport: MentalSport): MentalRoutine[] {
  if (sport === 'universal') return MENTAL_ROUTINES.filter((r) => r.sports.includes('universal'));
  return MENTAL_ROUTINES.filter((r) => r.sports.includes(sport));
}

/** Universal routines (apply to every sport). */
export function getUniversalRoutines(): MentalRoutine[] {
  return MENTAL_ROUTINES.filter((r) => r.sports.includes('universal'));
}

export interface RoutineQuery {
  sport?: MentalSport;
  routineType?: MentalRoutine['routineType'];
  maxDurationSeconds?: number;
}

export function getRoutines(q: RoutineQuery = {}): MentalRoutine[] {
  return MENTAL_ROUTINES.filter((r) => {
    if (q.sport && !(r.sports.includes(q.sport) || r.sports.includes('universal'))) return false;
    if (q.routineType && r.routineType !== q.routineType) return false;
    if (q.maxDurationSeconds && r.durationSeconds > q.maxDurationSeconds) return false;
    return true;
  });
}

/** Default reset for a sport family when nothing more specific matches. */
function familyDefaultSlug(sport: MentalSport): string {
  const fam = sportFamilyFor(sport);
  if (fam === 'golf') return 'bad-shot-reset';
  if (fam === 'bat') return 'error-recovery';
  if (fam === 'racket') return 'unforced-error-reset';
  return 'universal-reset';
}

/**
 * Best routine for a context: a mistake-category id OR a free fault/keyword.
 * Resolution: mistake-catalog routineSlug → keyword match within the sport →
 * family default → universal-reset. Always returns a routine.
 */
export function routineForContext(sport: MentalSport, mistakeOrFault?: string | null): MentalRoutine {
  if (mistakeOrFault) {
    const cat = MISTAKE_CATEGORIES.find((m) => m.id === mistakeOrFault);
    if (cat) {
      const r = getRoutine(cat.routineSlug);
      if (r) return r;
    }
    // Keyword match against appliesTo, preferring routines that serve this sport.
    const kw = mistakeOrFault.toLowerCase();
    const candidates = MENTAL_ROUTINES.filter((r) =>
      r.appliesTo.some((a) => a.toLowerCase() === kw || kw.includes(a.toLowerCase())),
    );
    const sportMatch = candidates.find((r) => r.sports.includes(sport));
    if (sportMatch) return sportMatch;
    if (candidates[0]) return candidates[0];
  }
  return getRoutine(familyDefaultSlug(sport)) ?? getRoutine('universal-reset')!;
}

/** All {sport, situation} pairs for generateStaticParams on the deep route. */
export function getAllSituationParams(): Array<{ sport: string; situation: string }> {
  const out: Array<{ sport: string; situation: string }> = [];
  for (const r of MENTAL_ROUTINES) {
    for (const s of r.sports) out.push({ sport: s, situation: r.slug });
  }
  return out;
}
