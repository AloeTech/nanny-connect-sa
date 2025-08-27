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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      academy_videos: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          order_index: number
          title: string
          updated_at: string
          video_url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          order_index: number
          title: string
          updated_at?: string
          video_url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          order_index?: number
          title?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          created_at: string
          description: string | null
          id: string
          preferred_accommodation_type:
            | Database["public"]["Enums"]["accommodation_type"]
            | null
          preferred_employment_type:
            | Database["public"]["Enums"]["employment_type"]
            | null
          preferred_experience_type:
            | Database["public"]["Enums"]["experience_type"]
            | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          preferred_accommodation_type?:
            | Database["public"]["Enums"]["accommodation_type"]
            | null
          preferred_employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          preferred_experience_type?:
            | Database["public"]["Enums"]["experience_type"]
            | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          preferred_accommodation_type?:
            | Database["public"]["Enums"]["accommodation_type"]
            | null
          preferred_employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          preferred_experience_type?:
            | Database["public"]["Enums"]["experience_type"]
            | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interests: {
        Row: {
          admin_approved: boolean | null
          client_id: string
          created_at: string
          id: string
          message: string | null
          nanny_id: string
          nanny_response: string | null
          payment_status: string | null
          status: string | null
          client_first_name: string | null  // Added
          client_last_name: string | null   // Added
          client_email: string | null       // Added
          nanny_first_name: string | null   // Added
          nanny_last_name: string | null    // Added
          nanny_email: string | null        // Added
        }
        Insert: {
          admin_approved?: boolean | null
          client_id: string
          created_at?: string
          id?: string
          message?: string | null
          nanny_id: string
          nanny_response?: string | null
          payment_status?: string | null
          status?: string | null
          client_first_name?: string | null  // Added
          client_last_name?: string | null   // Added
          client_email?: string | null       // Added
          nanny_first_name?: string | null   // Added
          nanny_last_name?: string | null    // Added
          nanny_email?: string | null        // Added
        }
        Update: {
          admin_approved?: boolean | null
          client_id?: string
          created_at?: string
          id?: string
          message?: string | null
          nanny_id?: string
          nanny_response?: string | null
          payment_status?: string | null
          status?: string | null
          client_first_name?: string | null  // Added
          client_last_name?: string | null   // Added
          client_email?: string | null       // Added
          nanny_first_name?: string | null   // Added
          nanny_last_name?: string | null    // Added
          nanny_email?: string | null        // Added
        }
        Relationships: [
          {
            foreignKeyName: "interests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interests_nanny_id_fkey"
            columns: ["nanny_id"]
            isOneToOne: false
            referencedRelation: "nannies"
            referencedColumns: ["id"]
          },
        ]
      }
      nannies: {
        Row: {
          academy_completed: boolean | null
          accommodation_preference: string | null
          bio: string | null
          created_at: string
          credit_check_status:
            | Database["public"]["Enums"]["document_status"]
            | null
          credit_check_url: string | null
          criminal_check_status:
            | Database["public"]["Enums"]["document_status"]
            | null
          criminal_check_url: string | null
          date_of_birth: string | null
          education_level: Database["public"]["Enums"]["education_level"] | null
          employment_type: string | null
          experience_duration: number | null
          experience_type: Database["public"]["Enums"]["experience_type"]
          hourly_rate: number | null
          id: string
          interview_video_url: string | null
          languages: string[] | null
          profile_approved: boolean | null
          proof_of_residence_url: string | null
          training_child_development: boolean | null
          training_cpr: boolean | null
          training_first_aid: boolean | null
          training_nanny: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          academy_completed?: boolean | null
          accommodation_preference?: string | null
          bio?: string | null
          created_at?: string
          credit_check_status?:
            | Database["public"]["Enums"]["document_status"]
            | null
          credit_check_url?: string | null
          criminal_check_status?:
            | Database["public"]["Enums"]["document_status"]
            | null
          criminal_check_url?: string | null
          date_of_birth?: string | null
          education_level?:
            | Database["public"]["Enums"]["education_level"]
            | null
          employment_type?: string | null
          experience_duration?: number | null
          experience_type: Database["public"]["Enums"]["experience_type"]
          hourly_rate?: number | null
          id?: string
          interview_video_url?: string | null
          languages?: string[] | null
          profile_approved?: boolean | null
          proof_of_residence_url?: string | null
          training_child_development?: boolean | null
          training_cpr?: boolean | null
          training_first_aid?: boolean | null
          training_nanny?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          academy_completed?: boolean | null
          accommodation_preference?: string | null
          bio?: string | null
          created_at?: string
          credit_check_status?:
            | Database["public"]["Enums"]["document_status"]
            | null
          credit_check_url?: string | null
          criminal_check_status?:
            | Database["public"]["Enums"]["document_status"]
            | null
          criminal_check_url?: string | null
          date_of_birth?: string | null
          education_level?:
            | Database["public"]["Enums"]["education_level"]
            | null
          employment_type?: string | null
          experience_duration?: number | null
          experience_type?: Database["public"]["Enums"]["experience_type"]
          hourly_rate?: number | null
          id?: string
          interview_video_url?: string | null
          languages?: string[] | null
          profile_approved?: boolean | null
          proof_of_residence_url?: string | null
          training_child_development?: boolean | null
          training_cpr?: boolean | null
          training_first_aid?: boolean | null
          training_nanny?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nannies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nanny_academy_progress: {
        Row: {
          completed_at: string
          id: string
          nanny_id: string
          video_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          nanny_id: string
          video_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          nanny_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nanny_academy_progress_nanny_id_fkey"
            columns: ["nanny_id"]
            isOneToOne: false
            referencedRelation: "nannies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nanny_academy_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "academy_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          id: string
          interest_id: string | null
          nanny_id: string
          payment_method: string | null
          status: string | null
          transaction_id: string | null
        }
        Insert: {
          amount?: number
          client_id: string
          created_at?: string
          id?: string
          interest_id?: string | null
          nanny_id: string
          payment_method?: string | null
          status?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          id?: string
          interest_id?: string | null
          nanny_id?: string
          payment_method?: string | null
          status?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "interests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_nanny_id_fkey"
            columns: ["nanny_id"]
            isOneToOne: false
            referencedRelation: "nannies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          city: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          profile_picture_url: string | null
          suburb: string | null
          town: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          suburb?: string | null
          town?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          suburb?: string | null
          town?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_nanny_profile: {
        Args: { nanny_user_id: string }
        Returns: boolean
      }
      assign_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      can_express_interest: {
        Args: { p_client_id: string; p_nanny_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      accommodation_type: "live_in" | "stay_out"
      document_status: "pending" | "approved" | "rejected"
      education_level: "high school no matric" | "matric" | "certificate" | "diploma" | "degree"
      employment_type: "full_time" | "part_time"
      experience_type: "nanny" | "cleaning" | "both"
      user_role: "admin" | "nanny" | "client"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      accommodation_type: ["live_in", "stay_out"],
      document_status: ["pending", "approved", "rejected"],
      education_level: ["high school no matric","matric", "certificate", "diploma", "degree"],
      employment_type: ["full_time", "part_time"],
      experience_type: ["nanny", "cleaning", "both"],
      user_role: ["admin", "nanny", "client"],
    },
  },
} as const