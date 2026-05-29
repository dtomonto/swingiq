// ============================================================
// SwingIQ — Video Drill Library
// Curated drills per visual swing issue.
// YouTube URLs are SEARCH LINKS only — never hardcoded video IDs.
// ============================================================

import type { SwingPhase, SkillLevel } from '../types';
import type { VisualIssueId, VideoDrillRecommendation } from './types';

function ytSearch(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function drill(
  id: string,
  issueId: VisualIssueId | null,
  phase: SwingPhase | null,
  name: string,
  goal: string,
  steps: string[],
  repsOrDuration: string,
  skill: SkillLevel,
  searchQuery: string,
  channelHint: string,
  focusFeel: string,
): VideoDrillRecommendation {
  return {
    id,
    issue_id: issueId,
    phase,
    name,
    goal,
    steps,
    reps_or_duration: repsOrDuration,
    skill_level: skill,
    youtube_search_query: searchQuery,
    youtube_search_url: ytSearch(searchQuery),
    coach_channel_hint: channelHint,
    focus_feel: focusFeel,
  };
}

// ──────────────────────────────────────────────────────────────
// Drill definitions
// ──────────────────────────────────────────────────────────────

export const VIDEO_DRILLS: VideoDrillRecommendation[] = [
  // ── Early Extension ──────────────────────────────────────────
  drill(
    'drill_ee_wall',
    'early_extension',
    'impact',
    'Wall Drill (Anti-Early Extension)',
    'Train hip depth maintenance through the downswing',
    [
      'Stand 6 inches from a wall with your back to it',
      'Take your address position — your backside should lightly touch the wall',
      'Make a slow backswing; your trail hip should stay near the wall',
      'As you swing down, keep both hips tracing the wall through impact',
      'Your backside should still be near the wall at impact, not thrusting away',
    ],
    '20 slow swings, then 10 with a ball',
    'beginner',
    'wall drill early extension golf fix',
    'Rotary Swing',
    'Feel your backside brushing the wall through the whole swing',
  ),

  drill(
    'drill_ee_chair',
    'early_extension',
    'impact',
    'Chair / Seat Belt Drill',
    'Maintain spine angle and hip depth through impact',
    [
      'Place a chair or stool behind your backside at address',
      'Practice making swings where your backside maintains contact with the chair',
      'Focus on rotating your hips level, not thrusting them toward the ball',
    ],
    '15 swings with feedback from the chair',
    'beginner',
    'chair drill golf early extension spine angle',
    'Clay Ballard Top Speed Golf',
    'Feel like you\'re sitting back even as you rotate through impact',
  ),

  // ── Sway/Slide ───────────────────────────────────────────────
  drill(
    'drill_sway_alignment_stick',
    'sway_slide',
    'takeaway',
    'Alignment Stick Hip Guard',
    'Eliminate lateral sway in the backswing',
    [
      'Push an alignment stick into the ground just outside your trail hip at address',
      'Make your backswing without your trail hip touching the stick',
      'Focus on rotating your hips rather than sliding them away',
    ],
    '20 practice swings, then 10 with a ball',
    'beginner',
    'alignment stick sway fix golf backswing',
    'Me and My Golf',
    'Feel your trail hip rotating in place — like turning around a fixed axis',
  ),

  // ── Reverse Pivot ────────────────────────────────────────────
  drill(
    'drill_reverse_pivot_step',
    'reverse_pivot',
    'top_of_backswing',
    'Step-Through Drill',
    'Learn correct weight transfer away from the target',
    [
      'Take your address position without a ball',
      'As you make your backswing, physically step your trail foot back (away from target)',
      'This forces weight onto your trail side',
      'Gradually reduce the step until you feel the shift without moving your foot',
    ],
    '20 reps, then 10 step-reduced, then 10 normal',
    'beginner',
    'reverse pivot fix golf step drill weight transfer',
    'Rick Shiels Golf',
    'Feel the ground pushing up through your trail foot at the top of the backswing',
  ),

  // ── Casting ──────────────────────────────────────────────────
  drill(
    'drill_cast_pump',
    'casting',
    'transition',
    'Pump Drill (Lag Retention)',
    'Feel the correct transition sequence and lag in the downswing',
    [
      'Take a full backswing and pause at the top',
      'Start the downswing — move your hips toward the target and let the club drop',
      'Stop when your hands are at hip height in the downswing (P6)',
      'Check: are your wrists still hinged? Is the club behind your hands?',
      'Repeat several times, then finally swing through to impact',
    ],
    '3 pumps before each full swing, 15 reps total',
    'intermediate',
    'pump drill lag retention casting fix golf',
    'Shawn Clement',
    'Feel the club "falling" rather than being thrown — passive hands, active body',
  ),

  drill(
    'drill_cast_towel',
    'casting',
    'shaft_parallel_downswing',
    'Towel Under Trail Arm',
    'Prevent casting by keeping the trail arm connected',
    [
      'Fold a small towel and tuck it under your trail armpit',
      'Make slow swings keeping the towel in place through the downswing',
      'The towel dropping = trail elbow flying, which promotes casting',
      'When you keep it, you feel the elbow tucking and lag maintaining',
    ],
    '20 swings, focusing on keeping the towel until impact',
    'beginner',
    'towel under arm casting fix golf lag drill',
    'Golf with Michele Low',
    'Feel your trail elbow hugging your side and pointing at the ground',
  ),

  // ── Chicken Wing ─────────────────────────────────────────────
  drill(
    'drill_chicken_wing_arm',
    'chicken_winging',
    'post_impact',
    'Impact Bag / Extension Drill',
    'Build the habit of extending both arms through impact',
    [
      'Set up an impact bag (or a heavy pillow) where the ball would be',
      'Make slow swings into the bag, focusing on both arms extending at contact',
      'You should feel both arms pushing through, not folding immediately',
      'Your lead arm should stay straight through the initial contact zone',
    ],
    '30 hits into bag — focus on feel, not power',
    'beginner',
    'impact bag drill chicken wing fix extension golf',
    'Athletic Motion Golf',
    'Feel both arms "reaching together" toward the target through impact',
  ),

  // ── Over the Top ─────────────────────────────────────────────
  drill(
    'drill_ott_headcover',
    'over_the_top',
    'transition',
    'Headcover Outside Ball Drill',
    'Train an inside approach by avoiding an obstacle outside the ball',
    [
      'Place a headcover or tee just outside your ball on the target line',
      'If you come over the top, the club will contact the headcover on the way down',
      'Focus on starting the downswing with your lower body',
      'Feel the club dropping "inside" — approaching the ball from inside the target line',
    ],
    '20 slow-motion swings, then 10 full speed',
    'intermediate',
    'over the top fix golf inside approach drill headcover',
    'MeandMyGolf',
    'Feel your right shoulder (trail) dropping under and toward the ball, not toward the target',
  ),

  drill(
    'drill_ott_gate',
    'over_the_top',
    'shaft_parallel_downswing',
    'Gate Drill for Inside Path',
    'Create a physical gate that forces the correct swing path',
    [
      'Place two tees in the ground: one an inch in front of the ball, slightly outside; one behind slightly inside',
      'The "gate" channels the club on the correct inside-to-out (or neutral) path',
      'Make half swings at first, ensuring you don\'t knock over the outer tee on the downswing',
    ],
    '20 half swings, 10 full',
    'intermediate',
    'gate drill inside out swing path golf fix',
    'Golf Sidekick',
    'Feel like the club is "squeezing" through the inside of the gate, approaching from behind you',
  ),

  // ── Flying Elbow ─────────────────────────────────────────────
  drill(
    'drill_flying_elbow_glove',
    'flying_elbow',
    'top_of_backswing',
    'Trail Arm Glove Drill',
    'Keep the trail elbow connected and below shoulder level',
    [
      'Tuck a headcover or glove under your trail armpit',
      'Make a backswing — the object should stay in place at the top',
      'If it falls, your trail elbow has flown away from your body',
      'Focus on keeping your trail elbow pointing down at the top',
    ],
    '20 backswing-only reps, then 20 full swings',
    'beginner',
    'flying elbow fix golf trail arm backswing drill',
    'Rotary Swing',
    'Feel your trail elbow staying below your shoulder and pointing at the ground at the top',
  ),

  // ── Poor Spine Angle ─────────────────────────────────────────
  drill(
    'drill_spine_mirror',
    'poor_spine_angle',
    'setup_address',
    'Mirror / Video Setup Check',
    'Establish and maintain correct spine angle',
    [
      'Stand in front of a full-length mirror (or video yourself from the side)',
      'Tilt forward from your hips — not your waist — until your arms hang naturally',
      'Check: is your back straight, not rounded?',
      'Draw a mental line from your head through your spine — it should be straight',
      'Now take your grip and club in this position',
    ],
    '5 minutes of posture rehearsal before each practice session',
    'beginner',
    'spine angle setup golf posture drill mirror',
    'Danny Maude',
    'Feel like you\'re bowing toward the ball from your hips, keeping a proud chest',
  ),

  // ── Flat Backswing ───────────────────────────────────────────
  drill(
    'drill_flat_swing_plane_stick',
    'flat_backswing',
    'top_of_backswing',
    'Plane Board / Shaft Plane Drill',
    'Train a more upright on-plane swing',
    [
      'Hold a second club along your spine at address, pointing toward the ball',
      'As you take the club back, ensure it tracks along (or above) the spine-club plane',
      'A flat backswing will feel like you\'re going below this plane',
      'Focus on the club staying "up" by setting your wrists earlier',
    ],
    '20 slow-motion swings, monitoring the plane',
    'intermediate',
    'swing plane drill backswing too flat golf',
    'Chris Ryan Golf',
    'Feel the club tracking up the slope of your spine line, not below it',
  ),

  // ── Steep Backswing ──────────────────────────────────────────
  drill(
    'drill_steep_backswing_bucket',
    'steep_backswing',
    'lead_arm_parallel',
    'Bucket on Hip Drill',
    'Shallow the backswing by rotating rather than lifting',
    [
      'Imagine a bucket sitting on your trail hip as you address the ball',
      'On the takeaway, rotate your hip to "tip" the bucket',
      'This promotes a shallower, more rotational takeaway vs. a steep "pick up"',
      'Your hands should move more around your body than upward',
    ],
    '20 practice swings focusing on rotation',
    'beginner',
    'shallow backswing golf drill too steep lift',
    'Danny Maude',
    'Feel the club sweeping around you rather than lifting straight up',
  ),

  // ── Head Movement ────────────────────────────────────────────
  drill(
    'drill_head_stable',
    'head_movement_excessive',
    'impact',
    'Forehead Stick Drill',
    'Keep the head stable through impact',
    [
      'Have a friend gently hold a club against your forehead at address',
      'Make your backswing and downswing — the club should stay in contact',
      'If your head moves significantly, the club will leave your forehead',
      'Alternative: swing with your head pressed lightly against a wall',
    ],
    '20 slow swings with feedback',
    'beginner',
    'head movement golf drill stable head through impact',
    'Hank Haney',
    'Feel your eyes staying "down and steady" — watching the ground where the ball was',
  ),

  // ── Weight Forward Setup ─────────────────────────────────────
  drill(
    'drill_weight_setup_feel',
    'weight_forward_setup',
    'setup_address',
    'Weight Distribution Feel Drill',
    'Establish correct 50/50 weight distribution at setup',
    [
      'Stand without a club, feet shoulder-width apart',
      'Rock slowly forward to your toes, then back to your heels',
      'Find the middle — balls of your feet, feeling grounded and athletic',
      'Now add your club and recreate this feeling',
      'Check: equal weight in both feet, not tipping onto one side',
    ],
    '5 minutes of balance rehearsal',
    'beginner',
    'golf weight distribution at address setup drill',
    'Golf Monthly',
    'Feel like an athlete about to receive a serve — balanced, ready, but not locked',
  ),

  // ── Loss of Posture ──────────────────────────────────────────
  drill(
    'drill_loss_posture_shaft',
    'loss_of_posture',
    'impact',
    'Shaft in Back Drill',
    'Maintain spine angle through the entire swing',
    [
      'Push a shaft or alignment stick through your belt loops along your spine',
      'The stick extends above your head and below your backside',
      'As you swing, the stick should maintain its angle — not dip forward or stand up',
      'Loss of posture = the top of the stick moves away from its start position',
    ],
    '20 slow swings with feedback from the stick',
    'intermediate',
    'loss of posture fix golf shaft spine drill',
    'Athletic Motion Golf',
    'Feel like your head and backside are being pulled in opposite directions throughout the swing',
  ),
];

// ──────────────────────────────────────────────────────────────
// Lookup helpers
// ──────────────────────────────────────────────────────────────

export function getDrillsForIssue(issueId: VisualIssueId): VideoDrillRecommendation[] {
  return VIDEO_DRILLS.filter((d) => d.issue_id === issueId);
}

export function getDrillsForPhase(phase: SwingPhase): VideoDrillRecommendation[] {
  return VIDEO_DRILLS.filter((d) => d.phase === phase);
}

export function getDrillById(id: string): VideoDrillRecommendation | undefined {
  return VIDEO_DRILLS.find((d) => d.id === id);
}
