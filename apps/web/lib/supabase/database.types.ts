/**
 * Supabase database types.
 *
 * INTERIM: hand-authored to match supabase/migrations/20261023000001_schema.sql.
 * Verify (and prefer) the generated version once a linked project or the
 * local stack is available:
 *
 *   supabase gen types typescript --local > lib/supabase/database.types.ts
 *
 * Do not hand-edit table shapes here for features: change the migration,
 * regenerate, and keep this file as the single source of truth.
 */
export type ExerciseCategory = "strength" | "endurance" | "agility" | "focus";
export type ExerciseUnit = "reps" | "seconds" | "minutes" | "kilometers";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      exercises: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string;
          category: ExerciseCategory;
          unit: ExerciseUnit;
          default_value: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string;
          category: ExerciseCategory;
          unit: ExerciseUnit;
          default_value?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string;
          category?: ExerciseCategory;
          unit?: ExerciseUnit;
          default_value?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          started_at: string;
          completed_at: string | null;
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          started_at?: string;
          completed_at?: string | null;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          started_at?: string;
          completed_at?: string | null;
          notes?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      workout_entries: {
        Row: {
          id: string;
          session_id: string;
          exercise_id: string;
          quantity: number;
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          exercise_id: string;
          quantity: number;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          exercise_id?: string;
          quantity?: number;
          notes?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      player_stats: {
        Row: {
          user_id: string;
          strength_xp: number;
          endurance_xp: number;
          agility_xp: number;
          focus_xp: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          strength_xp?: number;
          endurance_xp?: number;
          agility_xp?: number;
          focus_xp?: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          strength_xp?: number;
          endurance_xp?: number;
          agility_xp?: number;
          focus_xp?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      xp_events: {
        Row: {
          id: string;
          user_id: string;
          source: string;
          amount: number;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source: string;
          amount: number;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source?: string;
          amount?: number;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Relationships: [];
      };
      character_state: {
        Row: {
          user_id: string;
          level: number;
          stage: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          level?: number;
          stage?: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          level?: number;
          stage?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      exercise_category: ExerciseCategory;
      exercise_unit: ExerciseUnit;
    };
    CompositeTypes: Record<string, never>;
  };
};
