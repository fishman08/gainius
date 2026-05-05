/**
 * Hand-authored stand-in for `supabase gen types typescript`.
 * Once the Supabase project is provisioned, regenerate via:
 *   supabase gen types typescript --project-id <id> > packages/db/src/types.gen.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          primary_goal:
            | "lose_fat"
            | "build_muscle"
            | "get_stronger"
            | "improve_endurance"
            | "general_fitness"
            | "mobility"
            | null;
          experience_level:
            | "beginner"
            | "intermediate"
            | "advanced"
            | null;
          preferred_style:
            | "strength"
            | "hypertrophy"
            | "hiit"
            | "calisthenics"
            | "yoga_mobility"
            | "mix"
            | null;
          days_per_week: number | null;
          session_minutes:
            | "20-30"
            | "30-45"
            | "45-60"
            | "60+"
            | null;
          training_location:
            | "home_no_equipment"
            | "home_with_equipment"
            | "gym"
            | "mix"
            | null;
          available_equipment: string[];
          injuries: string[];
          injury_notes: string | null;
          date_of_birth: string | null;
          sex_at_birth: "male" | "female" | null;
          height_cm: number | null;
          weight_kg: number | null;
          activity_level:
            | "sedentary"
            | "light"
            | "moderate"
            | "very_active"
            | null;
          units_preference: "metric" | "imperial";
          onboarding_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          primary_goal?: Database["public"]["Tables"]["profiles"]["Row"]["primary_goal"];
          experience_level?: Database["public"]["Tables"]["profiles"]["Row"]["experience_level"];
          preferred_style?: Database["public"]["Tables"]["profiles"]["Row"]["preferred_style"];
          days_per_week?: number | null;
          session_minutes?: Database["public"]["Tables"]["profiles"]["Row"]["session_minutes"];
          training_location?: Database["public"]["Tables"]["profiles"]["Row"]["training_location"];
          available_equipment?: string[];
          injuries?: string[];
          injury_notes?: string | null;
          date_of_birth?: string | null;
          sex_at_birth?: "male" | "female" | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          activity_level?: Database["public"]["Tables"]["profiles"]["Row"]["activity_level"];
          units_preference?: "metric" | "imperial";
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
