import { z } from 'zod';

export const GolferProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  handedness: z.enum(['right', 'left']),
  handicap: z.number().min(-10).max(54).nullable().optional(),
  // GHIN (Golf Handicap & Information Network) integration. The GHIN number is
  // the golfer's identity in the USGA system; `handicap_source` records whether
  // the stored `handicap` was typed by the user or pulled from GHIN, and
  // `handicap_verified_at` stamps the last successful GHIN sync (ISO 8601).
  ghin_number: z.string().regex(/^\d{6,10}$/, 'GHIN number is 6–10 digits').nullable().optional(),
  handicap_source: z.enum(['self_reported', 'ghin_verified']).default('self_reported'),
  handicap_verified_at: z.string().datetime().nullable().optional(),
  scoring_average: z.number().min(50).max(150).nullable().optional(),
  low_round: z.number().min(50).max(150).nullable().optional(),
  primary_goal: z.string().min(1).max(500),
  current_miss: z.string().max(200),
  desired_shot_shape: z.enum([
    'straight', 'draw', 'fade', 'hook', 'slice', 'push', 'pull', 'push_draw', 'pull_fade'
  ]),
  practice_frequency: z.string(),
  practice_environment: z.string(),
  launch_monitor_owned: z.enum([
    'flightscope', 'trackman', 'foresight', 'skytrak', 'uneekor',
    'garmin', 'rapsodo', 'full_swing', 'golfzon', 'bushnell', 'manual', 'other'
  ]).nullable().optional(),
  home_simulator: z.boolean().default(false),
  indoor_outdoor: z.enum(['indoor', 'outdoor']),
  ball_used: z.string().max(100),
  mat_or_grass: z.enum(['mat', 'grass']),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced', 'elite']),
  coaching_style: z.enum(['data_first', 'feel_first', 'balanced']).default('balanced'),
  data_sophistication: z.enum(['beginner', 'intermediate', 'advanced', 'elite']).default('beginner'),
  injury_notes: z.string().max(500).default(''),
});

export const ClubSchema = z.object({
  club_name: z.string().min(1).max(100),
  club_category: z.enum([
    'driver', 'fairway_wood', 'hybrid', 'long_iron', 'mid_iron', 'short_iron', 'wedge', 'putter'
  ]),
  brand: z.string().max(100).default(''),
  model: z.string().max(100).default(''),
  loft: z.number().min(0).max(70).nullable().optional(),
  lie_angle: z.number().min(40).max(80).nullable().optional(),
  length: z.number().min(25).max(50).nullable().optional(),
  shaft: z.string().max(100).default(''),
  shaft_flex: z.enum(['ladies', 'senior', 'regular', 'stiff', 'x_stiff', 'tour_x']).nullable().optional(),
  shaft_weight: z.number().min(30).max(160).nullable().optional(),
  grip: z.string().max(100).default(''),
  typical_carry: z.number().min(0).max(400).nullable().optional(),
  typical_total: z.number().min(0).max(450).nullable().optional(),
  sort_order: z.number().int().default(0),
});

export type GolferProfileInput = z.infer<typeof GolferProfileSchema>;
export type ClubInput = z.infer<typeof ClubSchema>;
