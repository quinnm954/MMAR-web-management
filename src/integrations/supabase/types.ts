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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ach_authorizations: {
        Row: {
          account_holder_name: string
          account_last4: string | null
          authorization_text: string
          authorized_amount: number | null
          bank_name: string | null
          created_at: string
          customer_id: string
          id: string
          ip_address: string | null
          revoked_at: string | null
          routing_last4: string | null
          signature_image: string | null
          signed_at: string
          status: string
          user_agent: string | null
        }
        Insert: {
          account_holder_name: string
          account_last4?: string | null
          authorization_text: string
          authorized_amount?: number | null
          bank_name?: string | null
          created_at?: string
          customer_id: string
          id?: string
          ip_address?: string | null
          revoked_at?: string | null
          routing_last4?: string | null
          signature_image?: string | null
          signed_at?: string
          status?: string
          user_agent?: string | null
        }
        Update: {
          account_holder_name?: string
          account_last4?: string | null
          authorization_text?: string
          authorized_amount?: number | null
          bank_name?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          ip_address?: string | null
          revoked_at?: string | null
          routing_last4?: string | null
          signature_image?: string | null
          signed_at?: string
          status?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          created_at: string
          customer_id: string
          description: string | null
          id: string
          membership_id: string | null
          requested_date: string | null
          requested_time_window: string | null
          scheduled_at: string | null
          service_address: string | null
          service_type: string
          status: string
          technician_notes: string | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          description?: string | null
          id?: string
          membership_id?: string | null
          requested_date?: string | null
          requested_time_window?: string | null
          scheduled_at?: string | null
          service_address?: string | null
          service_type: string
          status?: string
          technician_notes?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          membership_id?: string | null
          requested_date?: string | null
          requested_time_window?: string | null
          scheduled_at?: string | null
          service_address?: string | null
          service_type?: string
          status?: string
          technician_notes?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_comments: {
        Row: {
          author_email: string
          author_name: string
          content: string
          created_at: string
          id: string
          is_approved: boolean
          post_slug: string
        }
        Insert: {
          author_email: string
          author_name: string
          content: string
          created_at?: string
          id?: string
          is_approved?: boolean
          post_slug: string
        }
        Update: {
          author_email?: string
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          post_slug?: string
        }
        Relationships: []
      }
      financing_contracts: {
        Row: {
          agreement_date: string
          client_address: string
          client_contact: string
          client_name: string
          client_signature_url: string | null
          client_signed_at: string | null
          created_at: string
          down_payment: number
          first_payment_date: string
          id: string
          initial_default_consequences: string | null
          initial_info_accuracy: string | null
          initial_received_copy: string | null
          initial_security_interest: string | null
          initial_terms: string | null
          interest: number
          ip_address: string | null
          monthly_payment: number
          principal: number
          provider_signature_url: string | null
          provider_signed_at: string | null
          service_description: string | null
          status: string
          total_financed: number
          total_service_price: number
          updated_at: string
          user_agent: string | null
          vehicle_info: string | null
        }
        Insert: {
          agreement_date: string
          client_address: string
          client_contact: string
          client_name: string
          client_signature_url?: string | null
          client_signed_at?: string | null
          created_at?: string
          down_payment: number
          first_payment_date: string
          id?: string
          initial_default_consequences?: string | null
          initial_info_accuracy?: string | null
          initial_received_copy?: string | null
          initial_security_interest?: string | null
          initial_terms?: string | null
          interest: number
          ip_address?: string | null
          monthly_payment: number
          principal: number
          provider_signature_url?: string | null
          provider_signed_at?: string | null
          service_description?: string | null
          status?: string
          total_financed: number
          total_service_price: number
          updated_at?: string
          user_agent?: string | null
          vehicle_info?: string | null
        }
        Update: {
          agreement_date?: string
          client_address?: string
          client_contact?: string
          client_name?: string
          client_signature_url?: string | null
          client_signed_at?: string | null
          created_at?: string
          down_payment?: number
          first_payment_date?: string
          id?: string
          initial_default_consequences?: string | null
          initial_info_accuracy?: string | null
          initial_received_copy?: string | null
          initial_security_interest?: string | null
          initial_terms?: string | null
          interest?: number
          ip_address?: string | null
          monthly_payment?: number
          principal?: number
          provider_signature_url?: string | null
          provider_signed_at?: string | null
          service_description?: string | null
          status?: string
          total_financed?: number
          total_service_price?: number
          updated_at?: string
          user_agent?: string | null
          vehicle_info?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_paid: number
          created_at: string
          customer_id: string
          due_date: string | null
          id: string
          invoice_number: string | null
          line_items: Json
          membership_id: string | null
          paid_at: string | null
          pdf_url: string | null
          service_record_id: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          customer_id: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          line_items?: Json
          membership_id?: string | null
          paid_at?: string | null
          pdf_url?: string | null
          service_record_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          customer_id?: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          line_items?: Json
          membership_id?: string | null
          paid_at?: string | null
          pdf_url?: string | null
          service_record_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_service_record_id_fkey"
            columns: ["service_record_id"]
            isOneToOne: false
            referencedRelation: "service_records"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_plans: {
        Row: {
          badge: string | null
          created_at: string
          deposit_amount: number
          features: Json
          id: string
          included_oil_changes_yearly: number | null
          included_oil_quarts: number | null
          is_active: boolean
          labor_discount_pct: number | null
          monthly_price: number
          name: string
          slug: string
          sort_order: number
          stripe_price_id: string | null
          tagline: string | null
          total_at_signup: number
          updated_at: string
        }
        Insert: {
          badge?: string | null
          created_at?: string
          deposit_amount: number
          features?: Json
          id?: string
          included_oil_changes_yearly?: number | null
          included_oil_quarts?: number | null
          is_active?: boolean
          labor_discount_pct?: number | null
          monthly_price: number
          name: string
          slug: string
          sort_order?: number
          stripe_price_id?: string | null
          tagline?: string | null
          total_at_signup: number
          updated_at?: string
        }
        Update: {
          badge?: string | null
          created_at?: string
          deposit_amount?: number
          features?: Json
          id?: string
          included_oil_changes_yearly?: number | null
          included_oil_quarts?: number | null
          is_active?: boolean
          labor_discount_pct?: number | null
          monthly_price?: number
          name?: string
          slug?: string
          sort_order?: number
          stripe_price_id?: string | null
          tagline?: string | null
          total_at_signup?: number
          updated_at?: string
        }
        Relationships: []
      }
      memberships: {
        Row: {
          ach_authorization_id: string | null
          agreement_pdf_url: string | null
          agreement_signed_at: string | null
          cancellation_requested_at: string | null
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          customer_id: string
          deposit_paid: boolean
          deposit_paid_at: string | null
          id: string
          ip_address: string | null
          next_billing_date: string | null
          notes: string | null
          oil_changes_used: number
          plan_id: string
          signature_image: string | null
          start_date: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_agent: string | null
          vehicle_id: string
        }
        Insert: {
          ach_authorization_id?: string | null
          agreement_pdf_url?: string | null
          agreement_signed_at?: string | null
          cancellation_requested_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          customer_id: string
          deposit_paid?: boolean
          deposit_paid_at?: string | null
          id?: string
          ip_address?: string | null
          next_billing_date?: string | null
          notes?: string | null
          oil_changes_used?: number
          plan_id: string
          signature_image?: string | null
          start_date?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_agent?: string | null
          vehicle_id: string
        }
        Update: {
          ach_authorization_id?: string | null
          agreement_pdf_url?: string | null
          agreement_signed_at?: string | null
          cancellation_requested_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          customer_id?: string
          deposit_paid?: boolean
          deposit_paid_at?: string | null
          id?: string
          ip_address?: string | null
          next_billing_date?: string | null
          notes?: string | null
          oil_changes_used?: number
          plan_id?: string
          signature_image?: string | null
          start_date?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_agent?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_ach_authorization_id_fkey"
            columns: ["ach_authorization_id"]
            isOneToOne: false
            referencedRelation: "ach_authorizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_recommendations: {
        Row: {
          created_at: string
          customer_id: string
          due_date: string | null
          due_mileage: number | null
          estimated_cost: number | null
          id: string
          priority: string
          recommendation: string
          service_record_id: string | null
          status: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          due_date?: string | null
          due_mileage?: number | null
          estimated_cost?: number | null
          id?: string
          priority?: string
          recommendation: string
          service_record_id?: string | null
          status?: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          due_date?: string | null
          due_mileage?: number | null
          estimated_cost?: number | null
          id?: string
          priority?: string
          recommendation?: string
          service_record_id?: string | null
          status?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_recommendations_service_record_id_fkey"
            columns: ["service_record_id"]
            isOneToOne: false
            referencedRelation: "service_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_recommendations_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_records: {
        Row: {
          appointment_id: string | null
          created_at: string
          customer_id: string
          id: string
          invoice_total: number | null
          labor_performed: string | null
          mileage_at_service: number | null
          parts_used: Json | null
          photo_urls: Json | null
          service_date: string
          service_type: string
          technician_notes: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          customer_id: string
          id?: string
          invoice_total?: number | null
          labor_performed?: string | null
          mileage_at_service?: number | null
          parts_used?: Json | null
          photo_urls?: Json | null
          service_date: string
          service_type: string
          technician_notes?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          invoice_total?: number | null
          labor_performed?: string | null
          mileage_at_service?: number | null
          parts_used?: Json | null
          photo_urls?: Json | null
          service_date?: string
          service_type?: string
          technician_notes?: string | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_cache: {
        Row: {
          fetched_at: string
          payload: Json
          source: string
        }
        Insert: {
          fetched_at?: string
          payload: Json
          source: string
        }
        Update: {
          fetched_at?: string
          payload?: Json
          source?: string
        }
        Relationships: []
      }
      tiktok_videos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          is_published: boolean
          posted_at: string
          sort_order: number
          thumbnail_url: string | null
          updated_at: string
          video_id: string
          video_url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          posted_at?: string
          sort_order?: number
          thumbnail_url?: string | null
          updated_at?: string
          video_id: string
          video_url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          posted_at?: string
          sort_order?: number
          thumbnail_url?: string | null
          updated_at?: string
          video_id?: string
          video_url?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          color: string | null
          created_at: string
          current_mileage: number | null
          engine: string | null
          id: string
          is_active: boolean
          license_plate: string | null
          make: string | null
          model: string | null
          notes: string | null
          oil_capacity_qts: number | null
          oil_filter_part: string | null
          oil_viscosity: string | null
          owner_id: string
          trim: string | null
          updated_at: string
          vin: string | null
          year: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          current_mileage?: number | null
          engine?: string | null
          id?: string
          is_active?: boolean
          license_plate?: string | null
          make?: string | null
          model?: string | null
          notes?: string | null
          oil_capacity_qts?: number | null
          oil_filter_part?: string | null
          oil_viscosity?: string | null
          owner_id: string
          trim?: string | null
          updated_at?: string
          vin?: string | null
          year?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          current_mileage?: number | null
          engine?: string | null
          id?: string
          is_active?: boolean
          license_plate?: string | null
          make?: string | null
          model?: string | null
          notes?: string | null
          oil_capacity_qts?: number | null
          oil_filter_part?: string | null
          oil_viscosity?: string | null
          owner_id?: string
          trim?: string | null
          updated_at?: string
          vin?: string | null
          year?: number | null
        }
        Relationships: []
      }
      warranty_acknowledgments: {
        Row: {
          created_at: string
          customer_name: string
          id: string
          ip_address: string | null
          signature_image: string
          signed_at: string
          user_agent: string | null
          vehicle_info: string
          vin_last6: string | null
          work_order_number: string | null
        }
        Insert: {
          created_at?: string
          customer_name: string
          id?: string
          ip_address?: string | null
          signature_image: string
          signed_at?: string
          user_agent?: string | null
          vehicle_info: string
          vin_last6?: string | null
          work_order_number?: string | null
        }
        Update: {
          created_at?: string
          customer_name?: string
          id?: string
          ip_address?: string | null
          signature_image?: string
          signed_at?: string
          user_agent?: string | null
          vehicle_info?: string
          vin_last6?: string | null
          work_order_number?: string | null
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
      app_role: "admin" | "user" | "customer"
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
      app_role: ["admin", "user", "customer"],
    },
  },
} as const
