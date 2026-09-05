export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      body_logs: {
        Row: {
          body_fat_percentage: number | null
          calculated_bmi: number | null
          created_at: string | null
          height_cm: number | null
          id: string
          log_date: string
          notes: string | null
          source: string | null
          updated_at: string | null
          user_id: string
          waist_cm: number | null
          weight_kg: number
        }
        Insert: {
          body_fat_percentage?: number | null
          calculated_bmi?: number | null
          created_at?: string | null
          height_cm?: number | null
          id: string
          log_date: string
          notes?: string | null
          source?: string | null
          updated_at?: string | null
          user_id: string
          waist_cm?: number | null
          weight_kg: number
        }
        Update: {
          body_fat_percentage?: number | null
          calculated_bmi?: number | null
          created_at?: string | null
          height_cm?: number | null
          id?: string
          log_date?: string
          notes?: string | null
          source?: string | null
          updated_at?: string | null
          user_id?: string
          waist_cm?: number | null
          weight_kg?: number
        }
        Relationships: []
      }
      dietary_log_entries: {
        Row: {
          amount_grams: number
          brand: string | null
          calculated_carbs: number | null
          calculated_fat: number | null
          calculated_fiber: number | null
          calculated_kcal: number | null
          calculated_protein: number | null
          calculated_sugar: number | null
          carbs_per_100g: number | null
          created_at: string | null
          dietary_log_id: string | null
          fat_per_100g: number | null
          fiber_per_100g: number | null
          food_item_id: string | null
          id: string
          kcal_per_100g: number | null
          logged_at: string | null
          name: string
          protein_per_100g: number | null
          sugar_per_100g: number | null
          user_id: string
        }
        Insert: {
          amount_grams: number
          brand?: string | null
          calculated_carbs?: number | null
          calculated_fat?: number | null
          calculated_fiber?: number | null
          calculated_kcal?: number | null
          calculated_protein?: number | null
          calculated_sugar?: number | null
          carbs_per_100g?: number | null
          created_at?: string | null
          dietary_log_id?: string | null
          fat_per_100g?: number | null
          fiber_per_100g?: number | null
          food_item_id?: string | null
          id: string
          kcal_per_100g?: number | null
          logged_at?: string | null
          name: string
          protein_per_100g?: number | null
          sugar_per_100g?: number | null
          user_id: string
        }
        Update: {
          amount_grams?: number
          brand?: string | null
          calculated_carbs?: number | null
          calculated_fat?: number | null
          calculated_fiber?: number | null
          calculated_kcal?: number | null
          calculated_protein?: number | null
          calculated_sugar?: number | null
          carbs_per_100g?: number | null
          created_at?: string | null
          dietary_log_id?: string | null
          fat_per_100g?: number | null
          fiber_per_100g?: number | null
          food_item_id?: string | null
          id?: string
          kcal_per_100g?: number | null
          logged_at?: string | null
          name?: string
          protein_per_100g?: number | null
          sugar_per_100g?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_dietary_log_entries_dietary_log"
            columns: ["dietary_log_id"]
            isOneToOne: false
            referencedRelation: "dietary_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_dietary_log_entries_food_item"
            columns: ["food_item_id"]
            isOneToOne: false
            referencedRelation: "food_items"
            referencedColumns: ["id"]
          },
        ]
      }
      dietary_logs: {
        Row: {
          created_at: string | null
          entries_json: Json | null
          id: string
          log_date: string
          total_carbs: number | null
          total_fat: number | null
          total_fiber: number | null
          total_kcal: number | null
          total_protein: number | null
          total_sugar: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entries_json?: Json | null
          id: string
          log_date: string
          total_carbs?: number | null
          total_fat?: number | null
          total_fiber?: number | null
          total_kcal?: number | null
          total_protein?: number | null
          total_sugar?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          entries_json?: Json | null
          id?: string
          log_date?: string
          total_carbs?: number | null
          total_fat?: number | null
          total_fiber?: number | null
          total_kcal?: number | null
          total_protein?: number | null
          total_sugar?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          created_at: string | null
          id: string
          is_custom: boolean | null
          name: string
          target_rep_max: number
          target_rep_min: number
          target_sets: number
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_custom?: boolean | null
          name: string
          target_rep_max?: number
          target_rep_min?: number
          target_sets?: number
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_custom?: boolean | null
          name?: string
          target_rep_max?: number
          target_rep_min?: number
          target_sets?: number
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      food_items: {
        Row: {
          brand: string | null
          carbs_per_100g: number | null
          created_at: string | null
          created_by: string | null
          fat_per_100g: number | null
          fiber_per_100g: number | null
          id: string
          is_custom: boolean | null
          kcal_per_100g: number | null
          name: string
          package_weight_grams: number | null
          piece_count: number | null
          protein_per_100g: number | null
          serving_unit: string | null
          source_url: string | null
          sugar_per_100g: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          brand?: string | null
          carbs_per_100g?: number | null
          created_at?: string | null
          created_by?: string | null
          fat_per_100g?: number | null
          fiber_per_100g?: number | null
          id: string
          is_custom?: boolean | null
          kcal_per_100g?: number | null
          name: string
          package_weight_grams?: number | null
          piece_count?: number | null
          protein_per_100g?: number | null
          serving_unit?: string | null
          source_url?: string | null
          sugar_per_100g?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          brand?: string | null
          carbs_per_100g?: number | null
          created_at?: string | null
          created_by?: string | null
          fat_per_100g?: number | null
          fiber_per_100g?: number | null
          id?: string
          is_custom?: boolean | null
          kcal_per_100g?: number | null
          name?: string
          package_weight_grams?: number | null
          piece_count?: number | null
          protein_per_100g?: number | null
          serving_unit?: string | null
          source_url?: string | null
          sugar_per_100g?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          completed_at: string | null
          energy_score: number | null
          id: string
          notes: string | null
          photos: Json | null
          sleep_hours: number | null
          started_at: string | null
          status: string
          user_id: string
          workout_id: string
        }
        Insert: {
          completed_at?: string | null
          energy_score?: number | null
          id?: string
          notes?: string | null
          photos?: Json | null
          sleep_hours?: number | null
          started_at?: string | null
          status?: string
          user_id: string
          workout_id: string
        }
        Update: {
          completed_at?: string | null
          energy_score?: number | null
          id?: string
          notes?: string | null
          photos?: Json | null
          sleep_hours?: number | null
          started_at?: string | null
          status?: string
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sessions_workout"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      sets: {
        Row: {
          duration_seconds: number | null
          exercise_id: string
          id: string
          logged_at: string | null
          pain_score: number | null
          reps: number | null
          rest_seconds: number | null
          rir: number | null
          session_id: string
          set_number: number
          started_at: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          duration_seconds?: number | null
          exercise_id: string
          id?: string
          logged_at?: string | null
          pain_score?: number | null
          reps?: number | null
          rest_seconds?: number | null
          rir?: number | null
          session_id: string
          set_number: number
          started_at?: string | null
          user_id: string
          weight?: number | null
        }
        Update: {
          duration_seconds?: number | null
          exercise_id?: string
          id?: string
          logged_at?: string | null
          pain_score?: number | null
          reps?: number | null
          rest_seconds?: number | null
          rir?: number | null
          session_id?: string
          set_number?: number
          started_at?: string | null
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sets_exercise"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sets_session"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      system: {
        Row: {
          id: string
          seed_version: string
          updated_at: string | null
        }
        Insert: {
          id: string
          seed_version: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          seed_version?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          date_of_birth: string | null
          email: string
          fitness_level: string | null
          gender: string | null
          height_cm: number | null
          id: string
          last_completed_workout_order: number | null
          last_set_summary_per_exercise: Json | null
          max_workout_order: number | null
          metrics: Json | null
          name: string | null
          training_location: string | null
          updated_at: string | null
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          fitness_level?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          last_completed_workout_order?: number | null
          last_set_summary_per_exercise?: Json | null
          max_workout_order?: number | null
          metrics?: Json | null
          name?: string | null
          training_location?: string | null
          updated_at?: string | null
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          fitness_level?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          last_completed_workout_order?: number | null
          last_set_summary_per_exercise?: Json | null
          max_workout_order?: number | null
          metrics?: Json | null
          name?: string | null
          training_location?: string | null
          updated_at?: string | null
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      workout_drafts: {
        Row: {
          energy_score: number | null
          id: string
          inputs: Json
          notes: string | null
          session_date: string | null
          sleep_hours: number | null
          updated_at: string | null
          user_id: string
          workout_id: string
        }
        Insert: {
          energy_score?: number | null
          id?: string
          inputs?: Json
          notes?: string | null
          session_date?: string | null
          sleep_hours?: number | null
          updated_at?: string | null
          user_id: string
          workout_id: string
        }
        Update: {
          energy_score?: number | null
          id?: string
          inputs?: Json
          notes?: string | null
          session_date?: string | null
          sleep_hours?: number | null
          updated_at?: string | null
          user_id?: string
          workout_id?: string
        }
        Relationships: []
      }
      workout_exercises: {
        Row: {
          created_at: string | null
          exercise_id: string
          id: string
          position: number | null
          sort_order: number
          user_id: string
          workout_id: string
        }
        Insert: {
          created_at?: string | null
          exercise_id: string
          id?: string
          position?: number | null
          sort_order?: number
          user_id: string
          workout_id: string
        }
        Update: {
          created_at?: string | null
          exercise_id?: string
          id?: string
          position?: number | null
          sort_order?: number
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_workout_exercises_exercise"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_workout_exercises_workout"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string | null
          exercise_ids: string[] | null
          id: string
          name: string
          order: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          exercise_ids?: string[] | null
          id?: string
          name: string
          order?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          exercise_ids?: string[] | null
          id?: string
          name?: string
          order?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      exercise_type: "strength" | "timed"
      session_status: "in_progress" | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      exercise_type: ["strength", "timed"],
      session_status: ["in_progress", "completed"],
    },
  },
} as const

// ============================================================================
// Explicit Database Table Row Types for Zero-Any Service Layer
// ============================================================================

export interface DbSessionRow {
  id: string | number;
  user_id: string;
  workout_id: string;
  status?: string | null;
  is_completed?: boolean | null;
  started_at?: string | null;
  completed_at?: string | null;
  sleep_hours?: number | null;
  energy_score?: number | null;
  notes?: string | null;
  coach_notes?: string | null;
  coach_name?: string | null;
  reviewed_at?: string | null;
  reviewed_by_coach_id?: string | null;
  reviewed_by_coach_name?: string | null;
  photos?: string[] | string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DbSetRow {
  id: string;
  session_id: string;
  user_id: string;
  exercise_id: string;
  set_number: number;
  weight?: number | null;
  reps?: number | null;
  duration_seconds?: number | null;
  started_at?: string | null;
  completed_at?: string | null;
  rest_seconds?: number | null;
  logged_at?: string | null;
  pain_score?: number | null;
  rir?: number | null;
  created_at?: string | null;
}

export interface DbWorkoutRow {
  id: string;
  user_id?: string;
  name: string;
  order?: number | null;
  day_number?: number | null;
  exercise_ids?: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DbExerciseRow {
  id: string;
  user_id?: string;
  name: string;
  type?: string | null;
  target_sets?: number | null;
  target_rep_min?: number | null;
  target_rep_max?: number | null;
  is_custom?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DbWorkoutExerciseRow {
  id?: string;
  workout_id: string;
  exercise_id: string;
  position?: number | null;
  sort_order?: number | null;
  user_id?: string;
}

export interface DbUserRow {
  id?: string;
  user_id: string;
  email?: string | null;
  name?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  fitness_level?: string | null;
  training_location?: string | null;
  last_completed_workout_order?: number | null;
  max_workout_order?: number | null;
  last_set_summary_per_exercise?: Json | null;
  metrics?: {
    weight?: number;
    height?: number;
    goals?: string[];
    dateOfBirth?: string;
    gender?: string;
    fitnessLevel?: string;
    trainingLocation?: string;
    updatedAt?: string;
  } | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DbBodyLogRow {
  id: string;
  user_id: string;
  log_date: string;
  weight_kg: number;
  height_cm?: number | null;
  calculated_bmi?: number | null;
  waist_cm?: number | null;
  body_fat_percentage?: number | null;
  source?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DbFoodItemRow {
  id: string;
  user_id?: string | null;
  name: string;
  brand?: string | null;
  barcode?: string | null;
  serving_unit?: string | null;
  kcal_per_100g?: number | null;
  protein_per_100g?: number | null;
  carbs_per_100g?: number | null;
  sugar_per_100g?: number | null;
  fat_per_100g?: number | null;
  fiber_per_100g?: number | null;
  package_weight_grams?: number | null;
  piece_count?: number | null;
  source_url?: string | null;
  is_custom?: boolean | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DbUserRoleRow {
  user_id: string;
  role: string;
  specialty?: string | null;
  is_approved?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DbCoachAthleteLinkRow {
  id: string;
  coach_id: string;
  athlete_id: string;
  specialty: string;
  status: string;
  invite_code?: string | null;
  notes?: string | null;
  coach_name?: string | null;
  coach_email?: string | null;
  athlete_name?: string | null;
  athlete_email?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DbUserPeerShareRow {
  id: string;
  owner_id: string;
  grantee_id: string;
  grantee_name?: string | null;
  grantee_email?: string | null;
  share_workouts?: boolean | null;
  share_biometrics?: boolean | null;
  share_dietary?: boolean | null;
  created_at?: string | null;
}

export interface DbSavedRoutineProgramRow {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  is_active?: boolean | null;
  source_coach_id?: string | null;
  source_coach_name?: string | null;
  program_data: {
    workouts: unknown[];
  };
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DbRoutineProposalRow {
  id: string;
  coach_id: string;
  athlete_id: string;
  coach_name?: string | null;
  coach_specialty?: string | null;
  title: string;
  description?: string | null;
  status: string;
  program_payload: {
    workouts: unknown[];
  };
  applied_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DbCoachMacroPrescriptionRow {
  id: string;
  coach_id: string;
  athlete_id: string;
  coach_name?: string | null;
  target_daily_kcal: number;
  target_protein_grams: number;
  target_carbs_grams: number;
  target_fat_grams: number;
  notes?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DbWorkoutSetCoachFeedbackRow {
  id: string;
  set_id: string;
  session_id: string;
  coach_id: string;
  athlete_id: string;
  coach_name?: string | null;
  cue_text: string;
  timestamp_marker?: string | null;
  video_cue_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

