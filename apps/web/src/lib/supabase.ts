import { createBrowserClient } from '@supabase/ssr';
import { isSupabaseConfigured } from './capabilities';

export { isSupabaseConfigured };

/**
 * Browser Supabase client, or `null` when Supabase env vars are not
 * configured. Callers MUST handle the null case — SwingIQ runs fully
 * on a local device-only profile when this is null (see lib/auth).
 */
export const supabase = isSupabaseConfigured
  ? createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  : null;

export type Database = {
  public: {
    Tables: {
      golfer_profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          handedness: string;
          handicap: number | null;
          scoring_average: number | null;
          low_round: number | null;
          primary_goal: string;
          current_miss: string;
          desired_shot_shape: string;
          practice_frequency: string;
          practice_environment: string;
          launch_monitor_owned: string | null;
          home_simulator: boolean;
          indoor_outdoor: string;
          ball_used: string;
          mat_or_grass: string;
          skill_level: string;
          coaching_style: string;
          data_sophistication: string;
          injury_notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['golfer_profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['golfer_profiles']['Insert']>;
      };
      clubs: {
        Row: {
          id: string;
          bag_id: string;
          user_id: string;
          club_name: string;
          club_category: string;
          brand: string;
          model: string;
          loft: number | null;
          lie_angle: number | null;
          length: number | null;
          shaft: string;
          shaft_flex: string | null;
          shaft_weight: number | null;
          grip: string;
          typical_carry: number | null;
          typical_total: number | null;
          confidence_score: number;
          dispersion_score: number;
          current_primary_miss: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['clubs']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['clubs']['Insert']>;
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          date_time: string;
          launch_monitor_brand: string;
          launch_monitor_model: string;
          software_source: string;
          indoor_outdoor: string;
          mat_or_grass: string;
          ball_type: string;
          weather_condition: string;
          altitude: number | null;
          temperature: number | null;
          wind_speed: number | null;
          wind_direction: string;
          notes: string;
          shot_count: number;
          clubs_used: string[];
          primary_diagnosis_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['sessions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['sessions']['Insert']>;
      };
      shots: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          club_id: string | null;
          club_name: string;
          club_category: string;
          shot_number: number;
          date_time: string;
          swing_type: string;
          intended_shot_shape: string | null;
          actual_shot_shape: string | null;
          is_outlier: boolean;
          user_notes: string;
          ball_data: Record<string, unknown>;
          club_data: Record<string, unknown>;
          strike_data: Record<string, unknown>;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['shots']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['shots']['Insert']>;
      };
      golf_bags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['golf_bags']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['golf_bags']['Insert']>;
      };
    };
  };
};
