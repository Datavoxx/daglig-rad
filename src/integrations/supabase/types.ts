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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      daily_reports: {
        Row: {
          ata: Json | null
          confidence_overall: number | null
          created_at: string | null
          deviations: Json | null
          extra_work: string[] | null
          headcount: number | null
          hours_per_person: number | null
          id: string
          low_confidence_fields: string[] | null
          materials_delivered: string[] | null
          materials_missing: string[] | null
          notes: string | null
          original_transcript: string | null
          project_id: string
          report_date: string
          roles: string[] | null
          total_hours: number | null
          updated_at: string | null
          user_id: string | null
          work_items: string[] | null
        }
        Insert: {
          ata?: Json | null
          confidence_overall?: number | null
          created_at?: string | null
          deviations?: Json | null
          extra_work?: string[] | null
          headcount?: number | null
          hours_per_person?: number | null
          id?: string
          low_confidence_fields?: string[] | null
          materials_delivered?: string[] | null
          materials_missing?: string[] | null
          notes?: string | null
          original_transcript?: string | null
          project_id: string
          report_date?: string
          roles?: string[] | null
          total_hours?: number | null
          updated_at?: string | null
          user_id?: string | null
          work_items?: string[] | null
        }
        Update: {
          ata?: Json | null
          confidence_overall?: number | null
          created_at?: string | null
          deviations?: Json | null
          extra_work?: string[] | null
          headcount?: number | null
          hours_per_person?: number | null
          id?: string
          low_confidence_fields?: string[] | null
          materials_delivered?: string[] | null
          materials_missing?: string[] | null
          notes?: string | null
          original_transcript?: string | null
          project_id?: string
          report_date?: string
          roles?: string[] | null
          total_hours?: number | null
          updated_at?: string | null
          user_id?: string | null
          work_items?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_files: {
        Row: {
          checkpoint_index: number | null
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          inspection_id: string
          storage_path: string
        }
        Insert: {
          checkpoint_index?: number | null
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          inspection_id: string
          storage_path: string
        }
        Update: {
          checkpoint_index?: number | null
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          inspection_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_files_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_share_links: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          inspection_id: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          inspection_id: string
          token?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          inspection_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_share_links_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_templates: {
        Row: {
          category: string
          checkpoints: Json
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          category: string
          checkpoints?: Json
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          checkpoints?: Json
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      inspections: {
        Row: {
          checkpoints: Json
          created_at: string
          id: string
          inspection_date: string
          inspector_company: string | null
          inspector_name: string | null
          notes: string | null
          original_transcript: string | null
          project_id: string
          signature_data: string | null
          status: string
          template_category: string
          template_id: string | null
          template_name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          checkpoints?: Json
          created_at?: string
          id?: string
          inspection_date?: string
          inspector_company?: string | null
          inspector_name?: string | null
          notes?: string | null
          original_transcript?: string | null
          project_id: string
          signature_data?: string | null
          status?: string
          template_category: string
          template_id?: string | null
          template_name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          checkpoints?: Json
          created_at?: string
          id?: string
          inspection_date?: string
          inspector_company?: string | null
          inspector_name?: string | null
          notes?: string | null
          original_transcript?: string | null
          project_id?: string
          signature_data?: string | null
          status?: string
          template_category?: string
          template_id?: string | null
          template_name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "inspection_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_share_links: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          project_id: string
          token: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          project_id: string
          token?: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          project_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_share_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      project_plans: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          original_transcript: string | null
          phases: Json
          project_id: string
          start_date: string | null
          total_weeks: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          original_transcript?: string | null
          phases?: Json
          project_id: string
          start_date?: string | null
          total_weeks?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          original_transcript?: string | null
          phases?: Json
          project_id?: string
          start_date?: string | null
          total_weeks?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      project_share_links: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          project_id: string
          token: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          project_id: string
          token?: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          project_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_share_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string | null
          client_name: string | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          client_name?: string | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          client_name?: string | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      report_pdfs: {
        Row: {
          created_at: string | null
          daily_report_id: string
          file_name: string
          file_size: number | null
          id: string
          storage_path: string
        }
        Insert: {
          created_at?: string | null
          daily_report_id: string
          file_name: string
          file_size?: number | null
          id?: string
          storage_path: string
        }
        Update: {
          created_at?: string | null
          daily_report_id?: string
          file_name?: string
          file_size?: number | null
          id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_pdfs_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      share_links: {
        Row: {
          created_at: string | null
          daily_report_id: string
          expires_at: string | null
          id: string
          pdf_id: string | null
          token: string
        }
        Insert: {
          created_at?: string | null
          daily_report_id: string
          expires_at?: string | null
          id?: string
          pdf_id?: string | null
          token?: string
        }
        Update: {
          created_at?: string | null
          daily_report_id?: string
          expires_at?: string | null
          id?: string
          pdf_id?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_links_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_links_pdf_id_fkey"
            columns: ["pdf_id"]
            isOneToOne: false
            referencedRelation: "report_pdfs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
