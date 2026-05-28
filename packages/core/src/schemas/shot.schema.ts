import { z } from 'zod';

// ============================================================
// Zod Schemas for Shot Data Validation
// ============================================================

export const BallDataSchema = z.object({
  carry_distance: z.number().nullable().optional(),
  total_distance: z.number().nullable().optional(),
  roll_distance: z.number().nullable().optional(),
  ball_speed: z.number().min(0).max(250).nullable().optional(),
  launch_angle_vertical: z.number().min(-5).max(50).nullable().optional(),
  launch_direction_horizontal: z.number().min(-30).max(30).nullable().optional(),
  spin_rate: z.number().min(0).max(20000).nullable().optional(),
  spin_axis: z.number().min(-90).max(90).nullable().optional(),
  apex_height: z.number().min(0).max(200).nullable().optional(),
  descent_angle: z.number().min(0).max(90).nullable().optional(),
  side_carry: z.number().nullable().optional(),
  lateral_offline: z.number().nullable().optional(),
  curve: z.number().nullable().optional(),
  flight_time: z.number().min(0).max(20).nullable().optional(),
  shot_shape: z.enum([
    'straight', 'draw', 'fade', 'hook', 'slice', 'push', 'pull', 'push_draw', 'pull_fade'
  ]).nullable().optional(),
  smash_factor: z.number().min(0.5).max(2.0).nullable().optional(),
});

export const ClubDeliveryDataSchema = z.object({
  club_speed: z.number().min(0).max(200).nullable().optional(),
  attack_angle: z.number().min(-20).max(20).nullable().optional(),
  club_path: z.number().min(-30).max(30).nullable().optional(),
  face_angle_to_target: z.number().min(-30).max(30).nullable().optional(),
  face_to_path: z.number().min(-30).max(30).nullable().optional(),
  dynamic_loft: z.number().min(-5).max(60).nullable().optional(),
  spin_loft: z.number().min(0).max(60).nullable().optional(),
  swing_plane_horizontal: z.number().nullable().optional(),
  swing_plane_vertical: z.number().nullable().optional(),
  low_point_position: z.number().nullable().optional(), // inches from ball, negative=behind
  low_point_height: z.number().nullable().optional(),
  closure_rate: z.number().nullable().optional(),
  swing_direction: z.number().nullable().optional(),
  lie_angle_dynamic: z.number().nullable().optional(),
});

export const StrikeDataSchema = z.object({
  impact_location_lateral: z.number().min(-1).max(1).nullable().optional(),
  impact_location_vertical: z.number().min(-1).max(1).nullable().optional(),
});

export const ShotImportRowSchema = z.object({
  club: z.string().min(1),
  carry_distance: z.coerce.number().nullable().optional(),
  total_distance: z.coerce.number().nullable().optional(),
  ball_speed: z.coerce.number().nullable().optional(),
  club_speed: z.coerce.number().nullable().optional(),
  launch_angle: z.coerce.number().nullable().optional(),
  launch_direction: z.coerce.number().nullable().optional(),
  spin_rate: z.coerce.number().nullable().optional(),
  spin_axis: z.coerce.number().nullable().optional(),
  apex_height: z.coerce.number().nullable().optional(),
  smash_factor: z.coerce.number().nullable().optional(),
  attack_angle: z.coerce.number().nullable().optional(),
  club_path: z.coerce.number().nullable().optional(),
  face_angle: z.coerce.number().nullable().optional(),
  face_to_path: z.coerce.number().nullable().optional(),
  dynamic_loft: z.coerce.number().nullable().optional(),
  spin_loft: z.coerce.number().nullable().optional(),
  side_carry: z.coerce.number().nullable().optional(),
  low_point: z.coerce.number().nullable().optional(),
  impact_location_lateral: z.coerce.number().nullable().optional(),
  impact_location_vertical: z.coerce.number().nullable().optional(),
}).passthrough();

export type ShotImportRow = z.infer<typeof ShotImportRowSchema>;
export type BallDataInput = z.infer<typeof BallDataSchema>;
export type ClubDeliveryDataInput = z.infer<typeof ClubDeliveryDataSchema>;
