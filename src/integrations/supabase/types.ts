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
      company_settings: {
        Row: {
          address: string | null
          bankgiro: string | null
          city: string | null
          company_name: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string | null
          email: string | null
          f_skatt: boolean | null
          id: string
          logo_url: string | null
          momsregnr: string | null
          org_number: string | null
          phone: string | null
          postal_code: string | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          bankgiro?: string | null
          city?: string | null
          company_name?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          email?: string | null
          f_skatt?: boolean | null
          id?: string
          logo_url?: string | null
          momsregnr?: string | null
          org_number?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          bankgiro?: string | null
          city?: string | null
          company_name?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          email?: string | null
          f_skatt?: boolean | null
          id?: string
          logo_url?: string | null
          momsregnr?: string | null
          org_number?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          customer_number: string | null
          customer_type: string | null
          email: string | null
          id: string
          invoice_address: string | null
          latitude: number | null
          longitude: number | null
          mobile: string | null
          name: string
          notes: string | null
          org_number: string | null
          phone: string | null
          postal_code: string | null
          updated_at: string | null
          user_id: string
          visit_address: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          customer_number?: string | null
          customer_type?: string | null
          email?: string | null
          id?: string
          invoice_address?: string | null
          latitude?: number | null
          longitude?: number | null
          mobile?: string | null
          name: string
          notes?: string | null
          org_number?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string | null
          user_id: string
          visit_address?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          customer_number?: string | null
          customer_type?: string | null
          email?: string | null
          id?: string
          invoice_address?: string | null
          latitude?: number | null
          longitude?: number | null
          mobile?: string | null
          name?: string
          notes?: string | null
          org_number?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string | null
          user_id?: string
          visit_address?: string | null
          website?: string | null
        }
        Relationships: []
      }
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
      employees: {
        Row: {
          created_at: string
          email: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      estimate_addons: {
        Row: {
          created_at: string | null
          description: string | null
          estimate_id: string
          id: string
          is_selected: boolean | null
          name: string
          price: number
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          estimate_id: string
          id?: string
          is_selected?: boolean | null
          name: string
          price?: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          estimate_id?: string
          id?: string
          is_selected?: boolean | null
          name?: string
          price?: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimate_addons_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "project_estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_items: {
        Row: {
          article: string | null
          comment: string | null
          created_at: string | null
          description: string | null
          estimate_id: string
          hours: number | null
          id: string
          moment: string
          quantity: number | null
          rot_eligible: boolean | null
          show_only_total: boolean | null
          sort_order: number
          subtotal: number | null
          type: string
          uncertainty: string | null
          unit: string | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          article?: string | null
          comment?: string | null
          created_at?: string | null
          description?: string | null
          estimate_id: string
          hours?: number | null
          id?: string
          moment: string
          quantity?: number | null
          rot_eligible?: boolean | null
          show_only_total?: boolean | null
          sort_order?: number
          subtotal?: number | null
          type: string
          uncertainty?: string | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          article?: string | null
          comment?: string | null
          created_at?: string | null
          description?: string | null
          estimate_id?: string
          hours?: number | null
          id?: string
          moment?: string
          quantity?: number | null
          rot_eligible?: boolean | null
          show_only_total?: boolean | null
          sort_order?: number
          subtotal?: number | null
          type?: string
          uncertainty?: string | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimate_items_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "project_estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_share_links: {
        Row: {
          created_at: string | null
          estimate_id: string
          expires_at: string | null
          id: string
          token: string
        }
        Insert: {
          created_at?: string | null
          estimate_id: string
          expires_at?: string | null
          id?: string
          token?: string
        }
        Update: {
          created_at?: string | null
          estimate_id?: string
          expires_at?: string | null
          id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimate_share_links_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "project_estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_templates: {
        Row: {
          cost_library: Json | null
          created_at: string | null
          description: string | null
          establishment_cost: number | null
          hourly_rates: Json | null
          id: string
          material_spill_percent: number | null
          name: string
          overhead_percent: number | null
          profit_percent: number | null
          risk_percent: number | null
          updated_at: string | null
          user_id: string
          vat_percent: number | null
          work_items: Json | null
        }
        Insert: {
          cost_library?: Json | null
          created_at?: string | null
          description?: string | null
          establishment_cost?: number | null
          hourly_rates?: Json | null
          id?: string
          material_spill_percent?: number | null
          name: string
          overhead_percent?: number | null
          profit_percent?: number | null
          risk_percent?: number | null
          updated_at?: string | null
          user_id: string
          vat_percent?: number | null
          work_items?: Json | null
        }
        Update: {
          cost_library?: Json | null
          created_at?: string | null
          description?: string | null
          establishment_cost?: number | null
          hourly_rates?: Json | null
          id?: string
          material_spill_percent?: number | null
          name?: string
          overhead_percent?: number | null
          profit_percent?: number | null
          risk_percent?: number | null
          updated_at?: string | null
          user_id?: string
          vat_percent?: number | null
          work_items?: Json | null
        }
        Relationships: []
      }
      estimate_text_templates: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      guide_leads: {
        Row: {
          created_at: string | null
          downloaded_at: string | null
          email: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          downloaded_at?: string | null
          email: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          downloaded_at?: string | null
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
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
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_ata: {
        Row: {
          article: string | null
          ata_number: string | null
          created_at: string | null
          description: string
          estimated_cost: number | null
          estimated_hours: number | null
          id: string
          project_id: string
          quantity: number | null
          reason: string | null
          rot_eligible: boolean | null
          show_only_total: boolean | null
          sort_order: number | null
          status: string | null
          subtotal: number | null
          unit: string | null
          unit_price: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          article?: string | null
          ata_number?: string | null
          created_at?: string | null
          description: string
          estimated_cost?: number | null
          estimated_hours?: number | null
          id?: string
          project_id: string
          quantity?: number | null
          reason?: string | null
          rot_eligible?: boolean | null
          show_only_total?: boolean | null
          sort_order?: number | null
          status?: string | null
          subtotal?: number | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          article?: string | null
          ata_number?: string | null
          created_at?: string | null
          description?: string
          estimated_cost?: number | null
          estimated_hours?: number | null
          id?: string
          project_id?: string
          quantity?: number | null
          reason?: string | null
          rot_eligible?: boolean | null
          show_only_total?: boolean | null
          sort_order?: number | null
          status?: string | null
          subtotal?: number | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_ata_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_estimates: {
        Row: {
          assumptions: Json | null
          closing_text: string | null
          conditions: Json | null
          created_at: string | null
          id: string
          introduction_text: string | null
          labor_cost: number | null
          manual_address: string | null
          manual_city: string | null
          manual_client_name: string | null
          manual_latitude: number | null
          manual_longitude: number | null
          manual_postal_code: string | null
          manual_project_name: string | null
          markup_percent: number | null
          material_cost: number | null
          notes: string | null
          offer_number: string | null
          original_transcript: string | null
          payment_terms: string | null
          project_id: string | null
          rot_enabled: boolean | null
          rot_percent: number | null
          scope: string | null
          status: string
          subcontractor_cost: number | null
          template_id: string | null
          total_excl_vat: number | null
          total_incl_vat: number | null
          uncertainties: Json | null
          updated_at: string | null
          user_id: string | null
          valid_days: number | null
          version: number
        }
        Insert: {
          assumptions?: Json | null
          closing_text?: string | null
          conditions?: Json | null
          created_at?: string | null
          id?: string
          introduction_text?: string | null
          labor_cost?: number | null
          manual_address?: string | null
          manual_city?: string | null
          manual_client_name?: string | null
          manual_latitude?: number | null
          manual_longitude?: number | null
          manual_postal_code?: string | null
          manual_project_name?: string | null
          markup_percent?: number | null
          material_cost?: number | null
          notes?: string | null
          offer_number?: string | null
          original_transcript?: string | null
          payment_terms?: string | null
          project_id?: string | null
          rot_enabled?: boolean | null
          rot_percent?: number | null
          scope?: string | null
          status?: string
          subcontractor_cost?: number | null
          template_id?: string | null
          total_excl_vat?: number | null
          total_incl_vat?: number | null
          uncertainties?: Json | null
          updated_at?: string | null
          user_id?: string | null
          valid_days?: number | null
          version?: number
        }
        Update: {
          assumptions?: Json | null
          closing_text?: string | null
          conditions?: Json | null
          created_at?: string | null
          id?: string
          introduction_text?: string | null
          labor_cost?: number | null
          manual_address?: string | null
          manual_city?: string | null
          manual_client_name?: string | null
          manual_latitude?: number | null
          manual_longitude?: number | null
          manual_postal_code?: string | null
          manual_project_name?: string | null
          markup_percent?: number | null
          material_cost?: number | null
          notes?: string | null
          offer_number?: string | null
          original_transcript?: string | null
          payment_terms?: string | null
          project_id?: string | null
          rot_enabled?: boolean | null
          rot_percent?: number | null
          scope?: string | null
          status?: string
          subcontractor_cost?: number | null
          template_id?: string | null
          total_excl_vat?: number | null
          total_incl_vat?: number | null
          uncertainties?: Json | null
          updated_at?: string | null
          user_id?: string | null
          valid_days?: number | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_estimates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_estimates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "estimate_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      project_files: {
        Row: {
          category: string | null
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          project_id: string
          storage_path: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          project_id: string
          storage_path: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          project_id?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "project_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_pricing_settings: {
        Row: {
          created_at: string | null
          default_estimate_markup: number | null
          hourly_rate_carpenter: number | null
          hourly_rate_general: number | null
          hourly_rate_painter: number | null
          hourly_rate_tiler: number | null
          id: string
          material_markup_percent: number | null
          project_id: string
          updated_at: string | null
          vat_percent: number | null
        }
        Insert: {
          created_at?: string | null
          default_estimate_markup?: number | null
          hourly_rate_carpenter?: number | null
          hourly_rate_general?: number | null
          hourly_rate_painter?: number | null
          hourly_rate_tiler?: number | null
          id?: string
          material_markup_percent?: number | null
          project_id: string
          updated_at?: string | null
          vat_percent?: number | null
        }
        Update: {
          created_at?: string | null
          default_estimate_markup?: number | null
          hourly_rate_carpenter?: number | null
          hourly_rate_general?: number | null
          hourly_rate_painter?: number | null
          hourly_rate_tiler?: number | null
          id?: string
          material_markup_percent?: number | null
          project_id?: string
          updated_at?: string | null
          vat_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_pricing_settings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
      project_work_orders: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          estimate_id: string | null
          id: string
          order_number: string | null
          project_id: string
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          estimate_id?: string | null
          id?: string
          order_number?: string | null
          project_id: string
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          estimate_id?: string | null
          id?: string
          order_number?: string | null
          project_id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_work_orders_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "project_estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_work_orders_project_id_fkey"
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
          budget: number | null
          city: string | null
          client_name: string | null
          created_at: string | null
          estimate_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          postal_code: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          budget?: number | null
          city?: string | null
          client_name?: string | null
          created_at?: string | null
          estimate_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          postal_code?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          budget?: number | null
          city?: string | null
          client_name?: string | null
          created_at?: string | null
          estimate_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          postal_code?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "project_estimates"
            referencedColumns: ["id"]
          },
        ]
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
      user_permissions: {
        Row: {
          created_at: string | null
          id: string
          modules: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          modules?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          modules?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_pricing_settings: {
        Row: {
          created_at: string | null
          default_estimate_markup: number | null
          hourly_rate_carpenter: number | null
          hourly_rate_general: number | null
          hourly_rate_painter: number | null
          hourly_rate_tiler: number | null
          id: string
          material_markup_percent: number | null
          updated_at: string | null
          user_id: string
          vat_percent: number | null
        }
        Insert: {
          created_at?: string | null
          default_estimate_markup?: number | null
          hourly_rate_carpenter?: number | null
          hourly_rate_general?: number | null
          hourly_rate_painter?: number | null
          hourly_rate_tiler?: number | null
          id?: string
          material_markup_percent?: number | null
          updated_at?: string | null
          user_id: string
          vat_percent?: number | null
        }
        Update: {
          created_at?: string | null
          default_estimate_markup?: number | null
          hourly_rate_carpenter?: number | null
          hourly_rate_general?: number | null
          hourly_rate_painter?: number | null
          hourly_rate_tiler?: number | null
          id?: string
          material_markup_percent?: number | null
          updated_at?: string | null
          user_id?: string
          vat_percent?: number | null
        }
        Relationships: []
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
