export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bag_clubs: {
        Row: {
          bag_id: string
          club_id: string
          id: string
          in_bag_position: number | null
        }
        Insert: {
          bag_id: string
          club_id: string
          id?: string
          in_bag_position?: number | null
        }
        Update: {
          bag_id?: string
          club_id?: string
          id?: string
          in_bag_position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bag_clubs_bag_id_bags_id_fk"
            columns: ["bag_id"]
            isOneToOne: false
            referencedRelation: "bags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bag_clubs_club_id_clubs_id_fk"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      bags: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bags_user_id_users_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          brand: string
          flex: string | null
          id: string
          loft: number | null
          model: string
          notes: string | null
          shaft: string | null
          type: string
          user_id: string
        }
        Insert: {
          brand: string
          flex?: string | null
          id?: string
          loft?: number | null
          model: string
          notes?: string | null
          shaft?: string | null
          type: string
          user_id: string
        }
        Update: {
          brand?: string
          flex?: string | null
          id?: string
          loft?: number | null
          model?: string
          notes?: string | null
          shaft?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clubs_user_id_users_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches: {
        Row: {
          availability: string
          credentials: string
          experience: number
          hourly_rate: number
          id: string
          specialties: string
          user_id: string
        }
        Insert: {
          availability: string
          credentials: string
          experience: number
          hourly_rate: number
          id?: string
          specialties: string
          user_id: string
        }
        Update: {
          availability?: string
          credentials?: string
          experience?: number
          hourly_rate?: number
          id?: string
          specialties?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaches_user_id_users_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_participants: {
        Row: {
          competition_id: string
          id: string
          user_id: string
        }
        Insert: {
          competition_id: string
          id?: string
          user_id: string
        }
        Update: {
          competition_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_participants_competition_id_competitions_id_fk"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_participants_user_id_users_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          description: string
          end_date: string
          format: string
          id: string
          name: string
          prizes: string | null
          start_date: string
          status: string
          type: string
        }
        Insert: {
          description: string
          end_date: string
          format: string
          id?: string
          name: string
          prizes?: string | null
          start_date: string
          status: string
          type: string
        }
        Update: {
          description?: string
          end_date?: string
          format?: string
          id?: string
          name?: string
          prizes?: string | null
          start_date?: string
          status?: string
          type?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          amenities: string | null
          holes: number
          id: string
          location: string
          name: string
          par: number
          phone_number: string | null
          website: string | null
        }
        Insert: {
          amenities?: string | null
          holes: number
          id?: string
          location: string
          name: string
          par: number
          phone_number?: string | null
          website?: string | null
        }
        Update: {
          amenities?: string | null
          holes?: number
          id?: string
          location?: string
          name?: string
          par?: number
          phone_number?: string | null
          website?: string | null
        }
        Relationships: []
      }
      drills: {
        Row: {
          category: string
          description: string
          difficulty: string
          duration: number
          equipment: string | null
          id: string
          instructions: string
          name: string
        }
        Insert: {
          category: string
          description: string
          difficulty: string
          duration: number
          equipment?: string | null
          id?: string
          instructions: string
          name: string
        }
        Update: {
          category?: string
          description?: string
          difficulty?: string
          duration?: number
          equipment?: string | null
          id?: string
          instructions?: string
          name?: string
        }
        Relationships: []
      }
      event_participants: {
        Row: {
          event_id: string
          group_number: number | null
          handicap_index: number | null
          id: string
          registration_date: string | null
          starting_hole: number | null
          status: string
          tee_time: string | null
          user_id: string
        }
        Insert: {
          event_id: string
          group_number?: number | null
          handicap_index?: number | null
          id?: string
          registration_date?: string | null
          starting_hole?: number | null
          status?: string
          tee_time?: string | null
          user_id: string
        }
        Update: {
          event_id?: string
          group_number?: number | null
          handicap_index?: number | null
          id?: string
          registration_date?: string | null
          starting_hole?: number | null
          status?: string
          tee_time?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_results: {
        Row: {
          created_at: string | null
          event_id: string
          gross_score: number | null
          id: string
          net_score: number | null
          points: number | null
          position: number | null
          scorecard: Json | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          gross_score?: number | null
          id?: string
          net_score?: number | null
          points?: number | null
          position?: number | null
          scorecard?: Json | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          gross_score?: number | null
          id?: string
          net_score?: number | null
          points?: number | null
          position?: number | null
          scorecard?: Json | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_results_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          course_id: string
          created_at: string | null
          created_by: string
          description: string | null
          event_date: string
          event_format: string
          id: string
          is_active: boolean | null
          is_standalone: boolean | null
          max_participants: number | null
          name: string
          registration_close_date: string | null
          scoring_type: string
          status: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          event_date: string
          event_format: string
          id?: string
          is_active?: boolean | null
          is_standalone?: boolean | null
          max_participants?: number | null
          name: string
          registration_close_date?: string | null
          scoring_type?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          event_date?: string
          event_format?: string
          id?: string
          is_active?: boolean | null
          is_standalone?: boolean | null
          max_participants?: number | null
          name?: string
          registration_close_date?: string | null
          scoring_type?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      hole_scores: {
        Row: {
          fairway_hit: boolean | null
          green_in_regulation: boolean | null
          hole_number: number
          id: string
          par: number
          penalty_strokes: number | null
          putts: number | null
          round_id: string
          score: number
        }
        Insert: {
          fairway_hit?: boolean | null
          green_in_regulation?: boolean | null
          hole_number: number
          id?: string
          par: number
          penalty_strokes?: number | null
          putts?: number | null
          round_id: string
          score: number
        }
        Update: {
          fairway_hit?: boolean | null
          green_in_regulation?: boolean | null
          hole_number?: number
          id?: string
          par?: number
          penalty_strokes?: number | null
          putts?: number | null
          round_id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "hole_scores_round_id_rounds_id_fk"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      holes: {
        Row: {
          course_id: string
          description: string | null
          handicap_index: number | null
          hole_number: number
          id: string
          length: number | null
          par: number
        }
        Insert: {
          course_id: string
          description?: string | null
          handicap_index?: number | null
          hole_number: number
          id?: string
          length?: number | null
          par: number
        }
        Update: {
          course_id?: string
          description?: string | null
          handicap_index?: number | null
          hole_number?: number
          id?: string
          length?: number | null
          par?: number
        }
        Relationships: [
          {
            foreignKeyName: "holes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          coach_id: string
          date: string
          duration: number
          focus: string
          follow_up_actions: string | null
          id: string
          notes: string | null
          student_id: string
        }
        Insert: {
          coach_id: string
          date: string
          duration: number
          focus: string
          follow_up_actions?: string | null
          id?: string
          notes?: string | null
          student_id: string
        }
        Update: {
          coach_id?: string
          date?: string
          duration?: number
          focus?: string
          follow_up_actions?: string | null
          id?: string
          notes?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_coach_id_coaches_id_fk"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_student_id_users_id_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_plan_drills: {
        Row: {
          drill_id: string
          id: string
          practice_plan_id: string
        }
        Insert: {
          drill_id: string
          id?: string
          practice_plan_id: string
        }
        Update: {
          drill_id?: string
          id?: string
          practice_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_plan_drills_drill_id_drills_id_fk"
            columns: ["drill_id"]
            isOneToOne: false
            referencedRelation: "drills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_plan_drills_practice_plan_id_practice_plans_id_fk"
            columns: ["practice_plan_id"]
            isOneToOne: false
            referencedRelation: "practice_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_plans: {
        Row: {
          duration: number
          focus_areas: string
          frequency: string
          id: string
          name: string
          notes: string | null
          user_id: string
        }
        Insert: {
          duration: number
          focus_areas: string
          frequency: string
          id?: string
          name: string
          notes?: string | null
          user_id: string
        }
        Update: {
          duration?: number
          focus_areas?: string
          frequency?: string
          id?: string
          name?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_plans_user_id_users_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          first_name: string | null
          handicap: number | null
          id: string
          is_admin: boolean | null
          last_name: string | null
          multiple_clubs_sets: boolean | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          first_name?: string | null
          handicap?: number | null
          id: string
          is_admin?: boolean | null
          last_name?: string | null
          multiple_clubs_sets?: boolean | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          first_name?: string | null
          handicap?: number | null
          id?: string
          is_admin?: boolean | null
          last_name?: string | null
          multiple_clubs_sets?: boolean | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      rounds: {
        Row: {
          competition_id: string | null
          course_id: string
          date: string
          id: string
          notes: string | null
          tee_set_id: string
          total_score: number
          user_id: string
        }
        Insert: {
          competition_id?: string | null
          course_id: string
          date: string
          id?: string
          notes?: string | null
          tee_set_id: string
          total_score: number
          user_id: string
        }
        Update: {
          competition_id?: string | null
          course_id?: string
          date?: string
          id?: string
          notes?: string | null
          tee_set_id?: string
          total_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rounds_competition_id_competitions_id_fk"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rounds_course_id_courses_id_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rounds_tee_set_id_tee_sets_id_fk"
            columns: ["tee_set_id"]
            isOneToOne: false
            referencedRelation: "tee_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rounds_user_id_users_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      series: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          end_date: string
          id: string
          is_active: boolean | null
          name: string
          scoring_system: Json | null
          series_type: string
          start_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          name: string
          scoring_system?: Json | null
          series_type: string
          start_date: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          name?: string
          scoring_system?: Json | null
          series_type?: string
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      series_events: {
        Row: {
          event_id: string
          event_order: number
          id: string
          points_multiplier: number | null
          series_id: string
        }
        Insert: {
          event_id: string
          event_order: number
          id?: string
          points_multiplier?: number | null
          series_id: string
        }
        Update: {
          event_id?: string
          event_order?: number
          id?: string
          points_multiplier?: number | null
          series_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "series_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "series_events_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      series_participants: {
        Row: {
          id: string
          joined_at: string | null
          role: string
          series_id: string
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          role?: string
          series_id: string
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          role?: string
          series_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "series_participants_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      series_points: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          points: number
          position: number | null
          series_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          points?: number
          position?: number | null
          series_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          points?: number
          position?: number | null
          series_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "series_points_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "series_points_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      tee_set_distances: {
        Row: {
          distance: number
          hole_id: string
          id: string
          tee_set_id: string
        }
        Insert: {
          distance: number
          hole_id: string
          id?: string
          tee_set_id: string
        }
        Update: {
          distance?: number
          hole_id?: string
          id?: string
          tee_set_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tee_set_distances_hole_id_fkey"
            columns: ["hole_id"]
            isOneToOne: false
            referencedRelation: "holes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tee_set_distances_tee_set_id_fkey"
            columns: ["tee_set_id"]
            isOneToOne: false
            referencedRelation: "tee_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      tee_sets: {
        Row: {
          color: string
          course_id: string
          distance: number
          id: string
          name: string
          par: number
          rating: number
          slope: number
        }
        Insert: {
          color: string
          course_id: string
          distance: number
          id?: string
          name: string
          par: number
          rating: number
          slope: number
        }
        Update: {
          color?: string
          course_id?: string
          distance?: number
          id?: string
          name?: string
          par?: number
          rating?: number
          slope?: number
        }
        Relationships: [
          {
            foreignKeyName: "tee_sets_course_id_courses_id_fk"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          email: string
          handicap: number | null
          id: string
          member_since: string
          name: string
          password: string
          profile_image: string | null
        }
        Insert: {
          email: string
          handicap?: number | null
          id?: string
          member_since?: string
          name: string
          password: string
          profile_image?: string | null
        }
        Update: {
          email?: string
          handicap?: number | null
          id?: string
          member_since?: string
          name?: string
          password?: string
          profile_image?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
