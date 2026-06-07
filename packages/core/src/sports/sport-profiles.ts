// ============================================================
// SwingVantage — Sport-Specific Profile Schemas
// Each sport has its own profile fields. Shared athlete fields
// (name, handedness) live in the base GolferProfileInput.
// ============================================================

import { z } from 'zod';

// ── Tennis Profile ────────────────────────────────────────────

export const TennisProfileSchema = z.object({
  dominant_hand: z.enum(['right', 'left']).default('right'),
  backhand_style: z.enum(['one_handed', 'two_handed']).default('two_handed'),
  playing_level: z.enum(['recreational', 'club', 'competitive', 'tournament', 'professional']).default('recreational'),
  primary_strokes: z.string().default(''),
  common_miss: z.string().default(''),
  racquet_brand: z.string().default(''),
  racquet_model: z.string().default(''),
  string_setup: z.string().default(''),
  grip_size: z.string().default(''),
  court_surface: z.enum(['hard', 'clay', 'grass', 'indoor_hard', 'mixed']).default('hard'),
  match_frequency: z.enum(['daily', '4-6x/week', '2-3x/week', 'weekly', 'occasional']).default('weekly'),
  practice_frequency: z.enum(['daily', '4-6x/week', '2-3x/week', 'weekly', 'occasional']).default('2-3x/week'),
  primary_goal: z.string().default(''),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced', 'elite']).default('intermediate'),
  injury_notes: z.string().default(''),
  coaching_style: z.enum(['data_first', 'feel_first', 'balanced']).default('balanced'),
});

export type TennisProfileInput = z.infer<typeof TennisProfileSchema>;

// ── Pickleball Profile ────────────────────────────────────────
// Pickleball is its own sport, not small-court tennis: paddle-face
// control, the kitchen (non-volley zone), and the third-shot drop
// drive the profile fields.

export const PickleballProfileSchema = z.object({
  dominant_hand: z.enum(['right', 'left']).default('right'),
  paddle_hand: z.enum(['right', 'left', 'two_handed_backhand']).default('right'),
  /** Optional DUPR rating (1.0–8.0 scale; left blank if unknown). */
  dupr_rating: z.number().nullable().default(null),
  /** Optional self-rated level on the common 2.0–5.0+ ladder. */
  self_rating: z
    .enum(['2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0+'])
    .nullable()
    .default(null),
  format_preference: z.enum(['singles', 'doubles', 'both']).default('doubles'),
  doubles_court_side: z.enum(['left', 'right', 'flexible']).default('flexible'),
  preferred_style: z
    .enum(['control', 'power', 'counterpuncher', 'all_court', 'dinker_reset', 'aggressive_net'])
    .default('all_court'),
  common_miss: z
    .enum([
      'popping_up_dinks',
      'netting_third_drops',
      'driving_long',
      'missing_returns',
      'late_volleys',
      'poor_resets',
      'speed_up_errors',
      'kitchen_foot_faults',
      'other',
    ])
    .default('other'),
  paddle_brand: z.string().default(''),
  paddle_model: z.string().default(''),
  primary_goal: z.string().default(''),
  play_frequency: z.enum(['daily', '4-6x/week', '2-3x/week', 'weekly', 'occasional']).default('2-3x/week'),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced', 'elite']).default('intermediate'),
  injury_notes: z.string().default(''),
  coaching_style: z.enum(['data_first', 'feel_first', 'balanced']).default('balanced'),
});

export type PickleballProfileInput = z.infer<typeof PickleballProfileSchema>;

// ── Padel Profile ─────────────────────────────────────────────
// Padel is its own sport, not tennis with walls: glass play, the
// bandeja/víbora overhead family, and doubles positioning drive
// the profile fields.

export const PadelProfileSchema = z.object({
  dominant_hand: z.enum(['right', 'left']).default('right'),
  racket_hand: z.enum(['right', 'left']).default('right'),
  /** Optional local/club/federation rating (free text — scales vary by country). */
  club_rating: z.string().default(''),
  playing_level: z.enum(['beginner', 'intermediate', 'advanced', 'competitive']).default('intermediate'),
  court_side: z.enum(['right_deuce', 'left_advantage', 'flexible']).default('flexible'),
  preferred_style: z
    .enum(['defensive_wall', 'net_attacker', 'lob_strategist', 'power_smasher', 'bandeja_specialist', 'all_court'])
    .default('all_court'),
  common_miss: z
    .enum([
      'poor_wall_read',
      'late_after_glass',
      'weak_bandeja',
      'overhitting_smashes',
      'poor_lob_depth',
      'volley_errors',
      'poor_net_transition',
      'bad_court_position',
      'partner_spacing',
      'other',
    ])
    .default('other'),
  racket_brand: z.string().default(''),
  racket_model: z.string().default(''),
  primary_goal: z.string().default(''),
  play_frequency: z.enum(['daily', '4-6x/week', '2-3x/week', 'weekly', 'occasional']).default('2-3x/week'),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced', 'elite']).default('intermediate'),
  injury_notes: z.string().default(''),
  coaching_style: z.enum(['data_first', 'feel_first', 'balanced']).default('balanced'),
});

export type PadelProfileInput = z.infer<typeof PadelProfileSchema>;

// ── Baseball Profile ──────────────────────────────────────────

export const BaseballProfileSchema = z.object({
  batting_side: z.enum(['right', 'left', 'switch']).default('right'),
  throwing_hand: z.enum(['right', 'left']).default('right'),
  position: z.string().default(''),
  competition_level: z.enum(['youth', 'high_school', 'college', 'adult_rec', 'semi_pro', 'professional']).default('adult_rec'),
  bat_brand: z.string().default(''),
  bat_model: z.string().default(''),
  bat_length_inches: z.number().nullable().default(null),
  bat_weight_oz: z.number().nullable().default(null),
  common_hitting_result: z.string().default(''),
  common_miss: z.string().default(''),
  timing_tendency: z.enum(['early', 'on_time', 'late', 'inconsistent']).default('inconsistent'),
  training_frequency: z.enum(['daily', '4-6x/week', '2-3x/week', 'weekly', 'occasional']).default('weekly'),
  primary_goal: z.string().default(''),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced', 'elite']).default('intermediate'),
  injury_notes: z.string().default(''),
  coaching_style: z.enum(['data_first', 'feel_first', 'balanced']).default('balanced'),
  exit_velocity_avg: z.number().nullable().default(null),
  launch_angle_avg: z.number().nullable().default(null),
  bat_speed_avg: z.number().nullable().default(null),
});

export type BaseballProfileInput = z.infer<typeof BaseballProfileSchema>;

// ── Slow Pitch Softball Profile ───────────────────────────────

export const SlowPitchProfileSchema = z.object({
  batting_side: z.enum(['right', 'left', 'switch']).default('right'),
  throwing_hand: z.enum(['right', 'left']).default('right'),
  position: z.string().default(''),
  league_type: z.enum(['recreational', 'church', 'corporate', 'competitive', 'tournament']).default('recreational'),
  bat_brand: z.string().default(''),
  bat_model: z.string().default(''),
  bat_certification: z.string().default(''),
  typical_hitting_result: z.string().default(''),
  desired_hitting_style: z.enum(['power', 'contact', 'gap_to_gap', 'mixed']).default('mixed'),
  common_miss: z.string().default(''),
  timing_tendency: z.enum(['early', 'on_time', 'late', 'inconsistent']).default('inconsistent'),
  training_frequency: z.enum(['daily', '4-6x/week', '2-3x/week', 'weekly', 'occasional']).default('weekly'),
  primary_goal: z.string().default(''),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced', 'elite']).default('intermediate'),
  injury_notes: z.string().default(''),
  coaching_style: z.enum(['data_first', 'feel_first', 'balanced']).default('balanced'),
  exit_velocity_avg: z.number().nullable().default(null),
  bat_speed_avg: z.number().nullable().default(null),
});

export type SlowPitchProfileInput = z.infer<typeof SlowPitchProfileSchema>;

// ── Fast Pitch Softball Profile ───────────────────────────────

export const FastPitchProfileSchema = z.object({
  batting_side: z.enum(['right', 'left', 'switch']).default('right'),
  throwing_hand: z.enum(['right', 'left']).default('right'),
  position: z.string().default(''),
  competition_level: z.enum(['youth', 'high_school', 'college', 'adult_rec', 'semi_pro', 'professional']).default('high_school'),
  bat_brand: z.string().default(''),
  bat_model: z.string().default(''),
  bat_length_inches: z.number().nullable().default(null),
  pitch_speed_range_mph: z.string().default(''),
  common_hitting_result: z.string().default(''),
  timing_tendency: z.enum(['early', 'on_time', 'late', 'inconsistent']).default('inconsistent'),
  contact_point_tendency: z.enum(['out_front', 'ideal', 'too_deep', 'inconsistent']).default('inconsistent'),
  training_frequency: z.enum(['daily', '4-6x/week', '2-3x/week', 'weekly', 'occasional']).default('weekly'),
  primary_goal: z.string().default(''),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced', 'elite']).default('intermediate'),
  injury_notes: z.string().default(''),
  coaching_style: z.enum(['data_first', 'feel_first', 'balanced']).default('balanced'),
  exit_velocity_avg: z.number().nullable().default(null),
  bat_speed_avg: z.number().nullable().default(null),
  launch_angle_avg: z.number().nullable().default(null),
});

export type FastPitchProfileInput = z.infer<typeof FastPitchProfileSchema>;

// ── Sport Profile Union ───────────────────────────────────────

export type SportSpecificProfile =
  | { sport: 'tennis'; data: TennisProfileInput }
  | { sport: 'pickleball'; data: PickleballProfileInput }
  | { sport: 'padel'; data: PadelProfileInput }
  | { sport: 'baseball'; data: BaseballProfileInput }
  | { sport: 'softball_slow'; data: SlowPitchProfileInput }
  | { sport: 'softball_fast'; data: FastPitchProfileInput };

// ── Shared Athlete Profile (cross-sport) ─────────────────────

export const SharedAthleteProfileSchema = z.object({
  /** Display name — shared across all sports */
  name: z.string().min(1, 'Name is required'),
  /** Primary sport for onboarding flow */
  primary_sport: z
    .enum(['golf', 'tennis', 'pickleball', 'padel', 'baseball', 'softball_slow', 'softball_fast'])
    .default('golf'),
  /** Practice availability (shared) */
  practice_days_per_week: z.number().min(0).max(7).default(3),
  /** General mobility notes — optional and voluntary */
  general_injury_notes: z.string().default(''),
});

export type SharedAthleteProfileInput = z.infer<typeof SharedAthleteProfileSchema>;

// ── Sport-Specific Camera Angle Options ──────────────────────

export const SPORT_CAMERA_ANGLES: Record<string, Array<{ value: string; label: string; description: string }>> = {
  golf: [
    { value: 'down_the_line', label: 'Down the Line', description: 'Behind player looking toward target — best for swing path analysis' },
    { value: 'face_on', label: 'Face-On', description: 'Camera facing player directly — best for posture and rotation' },
    { value: 'rear', label: 'From Behind (Rear)', description: 'Behind the player — good for takeaway and finish' },
    { value: 'unknown', label: 'Unknown / Other', description: 'Camera angle not specified' },
  ],
  tennis: [
    { value: 'face_on', label: 'Side View (Open)', description: 'Best for groundstroke phase analysis — captures hip rotation and follow-through' },
    { value: 'down_the_line', label: 'Behind Player', description: 'Useful for tracking racquet plane and contact point depth' },
    { value: 'rear', label: 'Court-Level / Front', description: 'Good for seeing shoulder turn and contact height' },
    { value: 'unknown', label: 'Unknown / Other', description: 'Camera angle not specified' },
  ],
  pickleball: [
    { value: 'face_on', label: 'Side View', description: 'Best for paddle-face angle, contact height, and dink/drop arc' },
    { value: 'down_the_line', label: 'Behind Player', description: 'Best for backswing compactness and contact point' },
    { value: 'rear', label: 'Court-Level / Front', description: 'Good for kitchen footwork and split-step timing' },
    { value: 'unknown', label: 'Unknown / Other', description: 'Camera angle not specified' },
  ],
  padel: [
    { value: 'face_on', label: 'Side View', description: 'Best for overhead (bandeja/víbora) mechanics and contact height' },
    { value: 'down_the_line', label: 'Behind Player', description: 'Best for the wall read and contact off the back glass' },
    { value: 'rear', label: 'Court-Level / Front', description: 'Good for partner spacing and net transition' },
    { value: 'unknown', label: 'Unknown / Other', description: 'Camera angle not specified' },
  ],
  baseball: [
    { value: 'face_on', label: 'Open Side', description: 'Camera on open side of hitter — best for hip rotation and stride' },
    { value: 'down_the_line', label: 'Catcher View', description: 'Behind the catcher — ideal for bat path and casting' },
    { value: 'rear', label: 'Pitcher View', description: 'From pitcher side — good for contact point and extension' },
    { value: 'overhead', label: 'Behind Hitter', description: 'Behind hitter — good for hand path and load' },
    { value: 'unknown', label: 'Unknown / Other', description: 'Camera angle not specified' },
  ],
  softball_slow: [
    { value: 'face_on', label: 'Open Side', description: 'Camera on open side — best for hip rotation, arc timing' },
    { value: 'down_the_line', label: 'Pitcher View', description: 'From pitcher side — good for contact point and bat path' },
    { value: 'rear', label: 'Behind Hitter', description: 'Behind hitter — good for hand path and finish' },
    { value: 'overhead', label: 'Front View', description: 'Camera facing hitter — good for extension and follow-through' },
    { value: 'unknown', label: 'Unknown / Other', description: 'Camera angle not specified' },
  ],
  softball_fast: [
    { value: 'face_on', label: 'Open Side', description: 'Best for stride, hip rotation, and contact point' },
    { value: 'down_the_line', label: 'Pitcher View', description: 'Good for bat path against the rising pitch' },
    { value: 'rear', label: 'Catcher View', description: 'Behind catcher — ideal for extension' },
    { value: 'overhead', label: 'Behind Hitter', description: 'Good for load position and hand path' },
    { value: 'unknown', label: 'Unknown / Other', description: 'Camera angle not specified' },
  ],
};

// ── Sport-Aware Navigation Labels ────────────────────────────

export const SPORT_NAV_LABELS: Record<string, {
  equipment: string;
  equipment_short: string;
  profile: string;
  profile_short: string;
  sessions: string;
  import: string;
  pre_round: string;
  diagnose: string;
  tagline: string;
  empty_sessions: string;
}> = {
  golf: {
    equipment: 'My Golf Bag',
    equipment_short: 'Bag',
    profile: 'My Golfer Profile',
    profile_short: 'Profile',
    sessions: 'Sessions',
    import: 'Import Launch Monitor Data',
    pre_round: 'Pre-Round Warm-Up',
    diagnose: 'Swing Diagnosis',
    tagline: 'Golf Performance',
    empty_sessions: 'Import your first CSV from your launch monitor to start building your swing profile.',
  },
  tennis: {
    equipment: 'My Racquets',
    equipment_short: 'Racquets',
    profile: 'My Tennis Profile',
    profile_short: 'Profile',
    sessions: 'Training Sessions',
    import: 'Log Training Session',
    pre_round: 'Pre-Match Warm-Up',
    diagnose: 'Stroke Analysis',
    tagline: 'Tennis Performance',
    empty_sessions: 'Upload a video of your strokes or log a training session to start building your development profile.',
  },
  pickleball: {
    equipment: 'My Paddles',
    equipment_short: 'Paddles',
    profile: 'My Pickleball Profile',
    profile_short: 'Profile',
    sessions: 'Training Sessions',
    import: 'Log Training Session',
    pre_round: 'Pre-Match Warm-Up',
    diagnose: 'Stroke Analysis',
    tagline: 'Pickleball Performance',
    empty_sessions: 'Upload a video of your dinks, drops, or drives to start building your development profile.',
  },
  padel: {
    equipment: 'My Rackets',
    equipment_short: 'Rackets',
    profile: 'My Padel Profile',
    profile_short: 'Profile',
    sessions: 'Training Sessions',
    import: 'Log Training Session',
    pre_round: 'Pre-Match Warm-Up',
    diagnose: 'Stroke Analysis',
    tagline: 'Padel Performance',
    empty_sessions: 'Upload a video of your bandeja, volleys, or glass play to start building your development profile.',
  },
  baseball: {
    equipment: 'My Bats',
    equipment_short: 'Bats',
    profile: 'My Hitter Profile',
    profile_short: 'Profile',
    sessions: 'Hitting Sessions',
    import: 'Log Hitting Session',
    pre_round: 'Pre-Game Warm-Up',
    diagnose: 'Swing Analysis',
    tagline: 'Baseball Performance',
    empty_sessions: 'Upload a video of your swing or log a hitting session to start building your development profile.',
  },
  softball_slow: {
    equipment: 'My Bats',
    equipment_short: 'Bats',
    profile: 'My Hitter Profile',
    profile_short: 'Profile',
    sessions: 'Hitting Sessions',
    import: 'Log Hitting Session',
    pre_round: 'Pre-Game Warm-Up',
    diagnose: 'Swing Analysis',
    tagline: 'Slow Pitch Performance',
    empty_sessions: 'Upload a video of your swing or log a hitting session to start building your development profile.',
  },
  softball_fast: {
    equipment: 'My Bats',
    equipment_short: 'Bats',
    profile: 'My Hitter Profile',
    profile_short: 'Profile',
    sessions: 'Hitting Sessions',
    import: 'Log Hitting Session',
    pre_round: 'Pre-Game Warm-Up',
    diagnose: 'Swing Analysis',
    tagline: 'Fast Pitch Performance',
    empty_sessions: 'Upload a video of your swing or log a hitting session to start building your development profile.',
  },
};

// ── Sport-Aware Quick Actions ─────────────────────────────────

export interface SportQuickAction {
  id: string;
  label: string;
  href: string;
  color: string;
  icon_name: string;
  primary?: boolean;
}

export const SPORT_QUICK_ACTIONS: Record<string, SportQuickAction[]> = {
  golf: [
    { id: 'import', label: 'Import CSV', href: '/sessions/import', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100', icon_name: 'Upload', primary: true },
    { id: 'diagnose', label: 'Diagnose', href: '/diagnose', color: 'bg-green-50 text-green-700 hover:bg-green-100', icon_name: 'Target' },
    { id: 'schedule', label: 'Schedule', href: '/practice', color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100', icon_name: 'CalendarDays' },
    { id: 'bag', label: 'Add Club', href: '/bag', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100', icon_name: 'Plus' },
    { id: 'video', label: 'Upload Video', href: '/video', color: 'bg-orange-50 text-orange-700 hover:bg-orange-100', icon_name: 'Video' },
    { id: 'pre_round', label: 'Pre-Round', href: '/pre-round', color: 'bg-pink-50 text-pink-700 hover:bg-pink-100', icon_name: 'Sun' },
    { id: 'training', label: 'Training', href: '/training', color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100', icon_name: 'Dumbbell' },
    { id: 'drills', label: 'Drills', href: '/drills', color: 'bg-teal-50 text-teal-700 hover:bg-teal-100', icon_name: 'BookOpen' },
  ],
  tennis: [
    { id: 'video', label: 'Analyze Video', href: '/video', color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100', icon_name: 'Video', primary: true },
    { id: 'drills', label: 'Stroke Drills', href: '/drills', color: 'bg-teal-50 text-teal-700 hover:bg-teal-100', icon_name: 'BookOpen' },
    { id: 'training', label: 'Training', href: '/training', color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100', icon_name: 'Dumbbell' },
    { id: 'pre_round', label: 'Pre-Match', href: '/pre-round', color: 'bg-pink-50 text-pink-700 hover:bg-pink-100', icon_name: 'Sun' },
    { id: 'schedule', label: 'Schedule', href: '/practice', color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100', icon_name: 'CalendarDays' },
    { id: 'progress', label: 'Progress', href: '/progress', color: 'bg-green-50 text-green-700 hover:bg-green-100', icon_name: 'TrendingUp' },
    { id: 'ai_coach', label: 'AI Coach', href: '/ai-coach', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100', icon_name: 'MessageSquare' },
    { id: 'profile', label: 'My Profile', href: '/profile', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100', icon_name: 'User' },
  ],
  pickleball: [
    { id: 'video', label: 'Analyze Video', href: '/video', color: 'bg-lime-50 text-lime-700 hover:bg-lime-100', icon_name: 'Video', primary: true },
    { id: 'drills', label: 'Paddle Drills', href: '/drills', color: 'bg-teal-50 text-teal-700 hover:bg-teal-100', icon_name: 'BookOpen' },
    { id: 'training', label: 'Training', href: '/training', color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100', icon_name: 'Dumbbell' },
    { id: 'pre_round', label: 'Pre-Match', href: '/pre-round', color: 'bg-pink-50 text-pink-700 hover:bg-pink-100', icon_name: 'Sun' },
    { id: 'schedule', label: 'Schedule', href: '/practice', color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100', icon_name: 'CalendarDays' },
    { id: 'progress', label: 'Progress', href: '/progress', color: 'bg-green-50 text-green-700 hover:bg-green-100', icon_name: 'TrendingUp' },
    { id: 'ai_coach', label: 'AI Coach', href: '/ai-coach', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100', icon_name: 'MessageSquare' },
    { id: 'profile', label: 'My Profile', href: '/profile', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100', icon_name: 'User' },
  ],
  padel: [
    { id: 'video', label: 'Analyze Video', href: '/video', color: 'bg-sky-50 text-sky-700 hover:bg-sky-100', icon_name: 'Video', primary: true },
    { id: 'drills', label: 'Padel Drills', href: '/drills', color: 'bg-teal-50 text-teal-700 hover:bg-teal-100', icon_name: 'BookOpen' },
    { id: 'training', label: 'Training', href: '/training', color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100', icon_name: 'Dumbbell' },
    { id: 'pre_round', label: 'Pre-Match', href: '/pre-round', color: 'bg-pink-50 text-pink-700 hover:bg-pink-100', icon_name: 'Sun' },
    { id: 'schedule', label: 'Schedule', href: '/practice', color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100', icon_name: 'CalendarDays' },
    { id: 'progress', label: 'Progress', href: '/progress', color: 'bg-green-50 text-green-700 hover:bg-green-100', icon_name: 'TrendingUp' },
    { id: 'ai_coach', label: 'AI Coach', href: '/ai-coach', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100', icon_name: 'MessageSquare' },
    { id: 'profile', label: 'My Profile', href: '/profile', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100', icon_name: 'User' },
  ],
  baseball: [
    { id: 'video', label: 'Analyze Swing', href: '/video', color: 'bg-red-50 text-red-700 hover:bg-red-100', icon_name: 'Video', primary: true },
    { id: 'drills', label: 'Hitting Drills', href: '/drills', color: 'bg-teal-50 text-teal-700 hover:bg-teal-100', icon_name: 'BookOpen' },
    { id: 'training', label: 'Training', href: '/training', color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100', icon_name: 'Dumbbell' },
    { id: 'pre_round', label: 'Pre-Game', href: '/pre-round', color: 'bg-pink-50 text-pink-700 hover:bg-pink-100', icon_name: 'Sun' },
    { id: 'schedule', label: 'Schedule', href: '/practice', color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100', icon_name: 'CalendarDays' },
    { id: 'progress', label: 'Progress', href: '/progress', color: 'bg-green-50 text-green-700 hover:bg-green-100', icon_name: 'TrendingUp' },
    { id: 'ai_coach', label: 'AI Coach', href: '/ai-coach', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100', icon_name: 'MessageSquare' },
    { id: 'compare', label: 'Compare', href: '/compare', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100', icon_name: 'GitCompareArrows' },
  ],
  softball_slow: [
    { id: 'video', label: 'Analyze Swing', href: '/video', color: 'bg-orange-50 text-orange-700 hover:bg-orange-100', icon_name: 'Video', primary: true },
    { id: 'drills', label: 'Hitting Drills', href: '/drills', color: 'bg-teal-50 text-teal-700 hover:bg-teal-100', icon_name: 'BookOpen' },
    { id: 'training', label: 'Training', href: '/training', color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100', icon_name: 'Dumbbell' },
    { id: 'pre_round', label: 'Pre-Game', href: '/pre-round', color: 'bg-pink-50 text-pink-700 hover:bg-pink-100', icon_name: 'Sun' },
    { id: 'schedule', label: 'Schedule', href: '/practice', color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100', icon_name: 'CalendarDays' },
    { id: 'progress', label: 'Progress', href: '/progress', color: 'bg-green-50 text-green-700 hover:bg-green-100', icon_name: 'TrendingUp' },
    { id: 'ai_coach', label: 'AI Coach', href: '/ai-coach', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100', icon_name: 'MessageSquare' },
    { id: 'compare', label: 'Compare', href: '/compare', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100', icon_name: 'GitCompareArrows' },
  ],
  softball_fast: [
    { id: 'video', label: 'Analyze Swing', href: '/video', color: 'bg-pink-50 text-pink-700 hover:bg-pink-100', icon_name: 'Video', primary: true },
    { id: 'drills', label: 'Hitting Drills', href: '/drills', color: 'bg-teal-50 text-teal-700 hover:bg-teal-100', icon_name: 'BookOpen' },
    { id: 'training', label: 'Training', href: '/training', color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100', icon_name: 'Dumbbell' },
    { id: 'pre_round', label: 'Pre-Game', href: '/pre-round', color: 'bg-pink-50 text-pink-700 hover:bg-pink-100', icon_name: 'Sun' },
    { id: 'schedule', label: 'Schedule', href: '/practice', color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100', icon_name: 'CalendarDays' },
    { id: 'progress', label: 'Progress', href: '/progress', color: 'bg-green-50 text-green-700 hover:bg-green-100', icon_name: 'TrendingUp' },
    { id: 'ai_coach', label: 'AI Coach', href: '/ai-coach', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100', icon_name: 'MessageSquare' },
    { id: 'compare', label: 'Compare', href: '/compare', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100', icon_name: 'GitCompareArrows' },
  ],
};
