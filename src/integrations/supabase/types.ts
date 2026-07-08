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
        Relationships: [
          {
            foreignKeyName: "ach_authorizations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_marketing_export"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "ach_authorizations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_log: {
        Row: {
          completion_tokens: number | null
          cost_usd: number
          created_at: string
          function_name: string
          id: string
          model: string | null
          prompt_tokens: number | null
        }
        Insert: {
          completion_tokens?: number | null
          cost_usd?: number
          created_at?: string
          function_name: string
          id?: string
          model?: string | null
          prompt_tokens?: number | null
        }
        Update: {
          completion_tokens?: number | null
          cost_usd?: number
          created_at?: string
          function_name?: string
          id?: string
          model?: string | null
          prompt_tokens?: number | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          assigned_technician_id: string | null
          board_column: string
          confirmation_token: string
          created_at: string
          customer_id: string
          description: string | null
          id: string
          membership_id: string | null
          priority: string
          reminder_sent_24h: boolean
          reminder_sent_2h: boolean
          repair_order_number: string | null
          requested_date: string | null
          requested_time_window: string | null
          scheduled_at: string | null
          service_address: string | null
          service_type: string
          sort_order: number
          source: string
          status: string
          technician_notes: string | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          assigned_technician_id?: string | null
          board_column?: string
          confirmation_token?: string
          created_at?: string
          customer_id: string
          description?: string | null
          id?: string
          membership_id?: string | null
          priority?: string
          reminder_sent_24h?: boolean
          reminder_sent_2h?: boolean
          repair_order_number?: string | null
          requested_date?: string | null
          requested_time_window?: string | null
          scheduled_at?: string | null
          service_address?: string | null
          service_type: string
          sort_order?: number
          source?: string
          status?: string
          technician_notes?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          assigned_technician_id?: string | null
          board_column?: string
          confirmation_token?: string
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          membership_id?: string | null
          priority?: string
          reminder_sent_24h?: boolean
          reminder_sent_2h?: boolean
          repair_order_number?: string | null
          requested_date?: string | null
          requested_time_window?: string | null
          scheduled_at?: string | null
          service_address?: string | null
          service_type?: string
          sort_order?: number
          source?: string
          status?: string
          technician_notes?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_assigned_technician_id_fkey"
            columns: ["assigned_technician_id"]
            isOneToOne: false
            referencedRelation: "customer_marketing_export"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "appointments_assigned_technician_id_fkey"
            columns: ["assigned_technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_marketing_export"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          after_data: Json | null
          before_data: Json | null
          changed_fields: string[] | null
          created_at: string
          id: string
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
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
      booking_requests: {
        Row: {
          confirmation_token: string
          converted_appointment_id: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          description: string | null
          gbraid: string | null
          gclid: string | null
          id: string
          landing_page: string | null
          notes: string | null
          requested_date: string | null
          requested_time_window: string | null
          service_address: string | null
          service_type: string
          source: string
          status: string
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          vehicle_info: string | null
          wbraid: string | null
        }
        Insert: {
          confirmation_token?: string
          converted_appointment_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          description?: string | null
          gbraid?: string | null
          gclid?: string | null
          id?: string
          landing_page?: string | null
          notes?: string | null
          requested_date?: string | null
          requested_time_window?: string | null
          service_address?: string | null
          service_type: string
          source?: string
          status?: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          vehicle_info?: string | null
          wbraid?: string | null
        }
        Update: {
          confirmation_token?: string
          converted_appointment_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          description?: string | null
          gbraid?: string | null
          gclid?: string | null
          id?: string
          landing_page?: string | null
          notes?: string | null
          requested_date?: string | null
          requested_time_window?: string | null
          service_address?: string | null
          service_type?: string
          source?: string
          status?: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          vehicle_info?: string | null
          wbraid?: string | null
        }
        Relationships: []
      }
      call_logs: {
        Row: {
          answered_at: string | null
          completed_at: string | null
          conversion_uploaded_at: string | null
          created_at: string
          customer_id: string | null
          direction: string
          duration_seconds: number | null
          from_number: string | null
          gbraid: string | null
          gclid: string | null
          id: string
          read_at: string | null
          recording_sid: string | null
          recording_url: string | null
          status: string
          to_number: string | null
          transcription: string | null
          twilio_call_sid: string | null
          updated_at: string
          utm_campaign: string | null
          utm_source: string | null
          voicemail: boolean
          wbraid: string | null
        }
        Insert: {
          answered_at?: string | null
          completed_at?: string | null
          conversion_uploaded_at?: string | null
          created_at?: string
          customer_id?: string | null
          direction?: string
          duration_seconds?: number | null
          from_number?: string | null
          gbraid?: string | null
          gclid?: string | null
          id?: string
          read_at?: string | null
          recording_sid?: string | null
          recording_url?: string | null
          status?: string
          to_number?: string | null
          transcription?: string | null
          twilio_call_sid?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_source?: string | null
          voicemail?: boolean
          wbraid?: string | null
        }
        Update: {
          answered_at?: string | null
          completed_at?: string | null
          conversion_uploaded_at?: string | null
          created_at?: string
          customer_id?: string | null
          direction?: string
          duration_seconds?: number | null
          from_number?: string | null
          gbraid?: string | null
          gclid?: string | null
          id?: string
          read_at?: string | null
          recording_sid?: string | null
          recording_url?: string | null
          status?: string
          to_number?: string | null
          transcription?: string | null
          twilio_call_sid?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_source?: string | null
          voicemail?: boolean
          wbraid?: string | null
        }
        Relationships: []
      }
      catalog_items: {
        Row: {
          category: string | null
          cost: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          labor_hours: number | null
          location: string | null
          name: string
          on_hand: number | null
          reorder_point: number | null
          sku: string | null
          track_inventory: boolean
          type: string
          unit_price: number
          updated_at: string
          vendor: string | null
        }
        Insert: {
          category?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          labor_hours?: number | null
          location?: string | null
          name: string
          on_hand?: number | null
          reorder_point?: number | null
          sku?: string | null
          track_inventory?: boolean
          type?: string
          unit_price?: number
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          category?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          labor_hours?: number | null
          location?: string | null
          name?: string
          on_hand?: number | null
          reorder_point?: number | null
          sku?: string | null
          track_inventory?: boolean
          type?: string
          unit_price?: number
          updated_at?: string
          vendor?: string | null
        }
        Relationships: []
      }
      checklist_template_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          label: string
          price_high: number | null
          price_low: number | null
          required: boolean
          sort_order: number
          template_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          label: string
          price_high?: number | null
          price_low?: number | null
          required?: boolean
          sort_order?: number
          template_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          price_high?: number | null
          price_low?: number | null
          required?: boolean
          sort_order?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          auto_attach: boolean
          category: string
          created_at: string
          customer_visible: boolean
          description: string | null
          focus_area: string | null
          id: string
          is_active: boolean
          name: string
          plan_id: string | null
          service_type_match: string[]
          updated_at: string
        }
        Insert: {
          auto_attach?: boolean
          category?: string
          created_at?: string
          customer_visible?: boolean
          description?: string | null
          focus_area?: string | null
          id?: string
          is_active?: boolean
          name: string
          plan_id?: string | null
          service_type_match?: string[]
          updated_at?: string
        }
        Update: {
          auto_attach?: boolean
          category?: string
          created_at?: string
          customer_visible?: boolean
          description?: string | null
          focus_area?: string | null
          id?: string
          is_active?: boolean
          name?: string
          plan_id?: string | null
          service_type_match?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_templates_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_shares: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string
          expires_at: string
          id: string
          revoked_at: string | null
          token: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id: string
          expires_at?: string
          id?: string
          revoked_at?: string | null
          token?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string
          expires_at?: string
          id?: string
          revoked_at?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_shares_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "customer_marketing_export"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_shares_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_shares_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_marketing_export"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_shares_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      device_tokens: {
        Row: {
          created_at: string
          id: string
          last_seen_at: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_seen_at?: string
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_seen_at?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_drafts: {
        Row: {
          author_id: string
          body: string | null
          created_at: string
          id: string
          in_reply_to_id: string | null
          recipient_email: string | null
          subject: string | null
          thread_id: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          body?: string | null
          created_at?: string
          id?: string
          in_reply_to_id?: string | null
          recipient_email?: string | null
          subject?: string | null
          thread_id?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string | null
          created_at?: string
          id?: string
          in_reply_to_id?: string | null
          recipient_email?: string | null
          subject?: string | null
          thread_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      employee_pay_defaults: {
        Row: {
          employee_type: string
          hourly_rate: number
          pay_basis: string
          salary_amount: number | null
          updated_at: string
        }
        Insert: {
          employee_type: string
          hourly_rate?: number
          pay_basis?: string
          salary_amount?: number | null
          updated_at?: string
        }
        Update: {
          employee_type?: string
          hourly_rate?: number
          pay_basis?: string
          salary_amount?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      employee_shifts: {
        Row: {
          clock_in: string
          clock_out: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string
          email: string | null
          employee_type: string
          full_name: string
          hourly_rate: number
          id: string
          is_active: boolean
          notes: string | null
          pay_basis: string
          phone: string | null
          salary_amount: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          employee_type?: string
          full_name: string
          hourly_rate?: number
          id?: string
          is_active?: boolean
          notes?: string | null
          pay_basis?: string
          phone?: string | null
          salary_amount?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          employee_type?: string
          full_name?: string
          hourly_rate?: number
          id?: string
          is_active?: boolean
          notes?: string | null
          pay_basis?: string
          phone?: string | null
          salary_amount?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      estimate_decision_logs: {
        Row: {
          actor_id: string | null
          created_at: string
          decline_reason: string | null
          estimate_id: string
          id: string
          line_items: Json
          requested_date: string | null
          requested_time_window: string | null
          signature_image: string | null
          status: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          decline_reason?: string | null
          estimate_id: string
          id?: string
          line_items?: Json
          requested_date?: string | null
          requested_time_window?: string | null
          signature_image?: string | null
          status: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          decline_reason?: string | null
          estimate_id?: string
          id?: string
          line_items?: Json
          requested_date?: string | null
          requested_time_window?: string | null
          signature_image?: string | null
          status?: string
        }
        Relationships: []
      }
      estimates: {
        Row: {
          appointment_id: string | null
          approval_token: string | null
          approved_at: string | null
          converted_to_invoice_id: string | null
          created_at: string
          customer_id: string
          customer_phone: string | null
          decline_reason: string | null
          declined_at: string | null
          estimate_number: string | null
          id: string
          line_items: Json
          notes: string | null
          review_discount_pledged: boolean
          sent_at: string | null
          shop_supplies: number
          signature_image: string | null
          signed_at: string | null
          status: string
          subtotal: number
          tax: number
          total: number
          updated_at: string
          valid_until: string | null
          vehicle_id: string | null
        }
        Insert: {
          appointment_id?: string | null
          approval_token?: string | null
          approved_at?: string | null
          converted_to_invoice_id?: string | null
          created_at?: string
          customer_id: string
          customer_phone?: string | null
          decline_reason?: string | null
          declined_at?: string | null
          estimate_number?: string | null
          id?: string
          line_items?: Json
          notes?: string | null
          review_discount_pledged?: boolean
          sent_at?: string | null
          shop_supplies?: number
          signature_image?: string | null
          signed_at?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          valid_until?: string | null
          vehicle_id?: string | null
        }
        Update: {
          appointment_id?: string | null
          approval_token?: string | null
          approved_at?: string | null
          converted_to_invoice_id?: string | null
          created_at?: string
          customer_id?: string
          customer_phone?: string | null
          decline_reason?: string | null
          declined_at?: string | null
          estimate_number?: string | null
          id?: string
          line_items?: Json
          notes?: string | null
          review_discount_pledged?: boolean
          sent_at?: string | null
          shop_supplies?: number
          signature_image?: string | null
          signed_at?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          valid_until?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimates_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_converted_to_invoice_id_fkey"
            columns: ["converted_to_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_marketing_export"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "estimates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
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
          customer_id: string | null
          down_payment: number
          estimate_id: string | null
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
          customer_id?: string | null
          down_payment: number
          estimate_id?: string | null
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
          customer_id?: string | null
          down_payment?: number
          estimate_id?: string | null
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
      inbound_messages: {
        Row: {
          archived_at: string | null
          body_html: string | null
          body_text: string | null
          created_at: string
          from_email: string
          from_name: string | null
          id: string
          in_reply_to: string | null
          message_id: string | null
          raw: Json | null
          read_at: string | null
          received_at: string
          subject: string | null
          thread_id: string | null
          to_email: string | null
        }
        Insert: {
          archived_at?: string | null
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          from_email: string
          from_name?: string | null
          id?: string
          in_reply_to?: string | null
          message_id?: string | null
          raw?: Json | null
          read_at?: string | null
          received_at?: string
          subject?: string | null
          thread_id?: string | null
          to_email?: string | null
        }
        Update: {
          archived_at?: string | null
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          from_email?: string
          from_name?: string | null
          id?: string
          in_reply_to?: string | null
          message_id?: string | null
          raw?: Json | null
          read_at?: string | null
          received_at?: string
          subject?: string | null
          thread_id?: string | null
          to_email?: string | null
        }
        Relationships: []
      }
      inspection_items: {
        Row: {
          category: string
          created_at: string
          id: string
          inspection_id: string
          item_name: string
          notes: string | null
          photo_urls: Json
          sort_order: number
          status: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          inspection_id: string
          item_name: string
          notes?: string | null
          photo_urls?: Json
          sort_order?: number
          status?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          inspection_id?: string
          item_name?: string
          notes?: string | null
          photo_urls?: Json
          sort_order?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_items_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          appointment_id: string | null
          completed_at: string | null
          created_at: string
          customer_id: string
          id: string
          mileage: number | null
          sent_at: string | null
          share_token: string | null
          status: string
          summary_notes: string | null
          technician_id: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          appointment_id?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id: string
          id?: string
          mileage?: number | null
          sent_at?: string | null
          share_token?: string | null
          status?: string
          summary_notes?: string | null
          technician_id?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          appointment_id?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          mileage?: number | null
          sent_at?: string | null
          share_token?: string | null
          status?: string
          summary_notes?: string | null
          technician_id?: string | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_marketing_export"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "inspections_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "customer_marketing_export"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "inspections_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          method: string
          notes: string | null
          paid_at: string
          recorded_by: string | null
          reference: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          method?: string
          notes?: string | null
          paid_at?: string
          recorded_by?: string | null
          reference?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          method?: string
          notes?: string | null
          paid_at?: string
          recorded_by?: string | null
          reference?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          created_at: string
          customer_id: string
          discount_amount: number
          discount_reason: string | null
          discount_type: string
          discount_value: number
          due_date: string | null
          id: string
          invoice_number: string | null
          line_items: Json
          membership_id: string | null
          paid_at: string | null
          pdf_url: string | null
          service_record_id: string | null
          shop_supplies: number
          status: string
          stripe_fee: number | null
          stripe_fee_synced_at: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          subtotal: number
          tax: number
          technician_id: string | null
          total: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          customer_id: string
          discount_amount?: number
          discount_reason?: string | null
          discount_type?: string
          discount_value?: number
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          line_items?: Json
          membership_id?: string | null
          paid_at?: string | null
          pdf_url?: string | null
          service_record_id?: string | null
          shop_supplies?: number
          status?: string
          stripe_fee?: number | null
          stripe_fee_synced_at?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal?: number
          tax?: number
          technician_id?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          customer_id?: string
          discount_amount?: number
          discount_reason?: string | null
          discount_type?: string
          discount_value?: number
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          line_items?: Json
          membership_id?: string | null
          paid_at?: string | null
          pdf_url?: string | null
          service_record_id?: string | null
          shop_supplies?: number
          status?: string
          stripe_fee?: number | null
          stripe_fee_synced_at?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal?: number
          tax?: number
          technician_id?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_marketing_export"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
      labor_rates: {
        Row: {
          created_at: string
          hourly_rate: number
          id: string
          is_active: boolean
          is_default: boolean
          name: string
        }
        Insert: {
          created_at?: string
          hourly_rate: number
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
        }
        Update: {
          created_at?: string
          hourly_rate?: number
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
        }
        Relationships: []
      }
      membership_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          customer_id: string | null
          description: string | null
          id: string
          kind: string
          membership_id: string
          paid_at: string
          period_end: string | null
          period_start: string | null
          status: string
          stripe_charge_id: string | null
          stripe_fee: number | null
          stripe_fee_synced_at: string | null
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          kind: string
          membership_id: string
          paid_at?: string
          period_end?: string | null
          period_start?: string | null
          status?: string
          stripe_charge_id?: string | null
          stripe_fee?: number | null
          stripe_fee_synced_at?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          kind?: string
          membership_id?: string
          paid_at?: string
          period_end?: string | null
          period_start?: string | null
          status?: string
          stripe_charge_id?: string | null
          stripe_fee?: number | null
          stripe_fee_synced_at?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_payments_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
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
            foreignKeyName: "memberships_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_marketing_export"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "memberships_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      message_reads: {
        Row: {
          last_read_at: string
          thread_id: string
          user_id: string
        }
        Insert: {
          last_read_at?: string
          thread_id: string
          user_id: string
        }
        Update: {
          last_read_at?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      message_threads: {
        Row: {
          created_at: string
          created_by: string
          customer_id: string | null
          id: string
          last_message_at: string
          last_message_preview: string | null
          subject: string | null
          tech_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          customer_id?: string | null
          id?: string
          last_message_at?: string
          last_message_preview?: string | null
          subject?: string | null
          tech_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          customer_id?: string | null
          id?: string
          last_message_at?: string
          last_message_preview?: string | null
          subject?: string | null
          tech_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachments: Json
          body: string
          created_at: string
          id: string
          sender_id: string
          thread_id: string
        }
        Insert: {
          attachments?: Json
          body: string
          created_at?: string
          id?: string
          sender_id: string
          thread_id: string
        }
        Update: {
          attachments?: Json
          body?: string
          created_at?: string
          id?: string
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      mileage_update_tokens: {
        Row: {
          channel: string
          created_at: string
          customer_id: string
          expires_at: string
          token: string
          used_at: string | null
          vehicle_id: string
        }
        Insert: {
          channel?: string
          created_at?: string
          customer_id: string
          expires_at?: string
          token?: string
          used_at?: string | null
          vehicle_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          customer_id?: string
          expires_at?: string
          token?: string
          used_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mileage_update_tokens_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          appointment_reminders: boolean
          created_at: string
          email_enabled: boolean
          estimate_updates: boolean
          inspection_updates: boolean
          invoice_updates: boolean
          marketing_updates: boolean
          membership_updates: boolean
          message_updates: boolean
          push_enabled: boolean
          repair_order_updates: boolean
          sms_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_reminders?: boolean
          created_at?: string
          email_enabled?: boolean
          estimate_updates?: boolean
          inspection_updates?: boolean
          invoice_updates?: boolean
          marketing_updates?: boolean
          membership_updates?: boolean
          message_updates?: boolean
          push_enabled?: boolean
          repair_order_updates?: boolean
          sms_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_reminders?: boolean
          created_at?: string
          email_enabled?: boolean
          estimate_updates?: boolean
          inspection_updates?: boolean
          invoice_updates?: boolean
          marketing_updates?: boolean
          membership_updates?: boolean
          message_updates?: boolean
          push_enabled?: boolean
          repair_order_updates?: boolean
          sms_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          category: string | null
          created_at: string
          data: Json
          id: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          category?: string | null
          created_at?: string
          data?: Json
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          category?: string | null
          created_at?: string
          data?: Json
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      phone_settings: {
        Row: {
          business_hours: Json
          forward_to_number: string | null
          id: number
          record_calls: boolean
          ring_timeout_seconds: number
          routing_enabled: boolean
          transcribe_voicemail: boolean
          unavailable_greeting: string
          updated_at: string
          voicemail_greeting: string
        }
        Insert: {
          business_hours?: Json
          forward_to_number?: string | null
          id?: number
          record_calls?: boolean
          ring_timeout_seconds?: number
          routing_enabled?: boolean
          transcribe_voicemail?: boolean
          unavailable_greeting?: string
          updated_at?: string
          voicemail_greeting?: string
        }
        Update: {
          business_hours?: Json
          forward_to_number?: string | null
          id?: number
          record_calls?: boolean
          ring_timeout_seconds?: number
          routing_enabled?: boolean
          transcribe_voicemail?: boolean
          unavailable_greeting?: string
          updated_at?: string
          voicemail_greeting?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          marketing_opt_in: boolean
          phone: string | null
          postal_code: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          marketing_opt_in?: boolean
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          marketing_opt_in?: boolean
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ro_attachments: {
        Row: {
          appointment_id: string
          category: string
          created_at: string
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          notes: string | null
          size_bytes: number | null
          uploaded_by: string | null
        }
        Insert: {
          appointment_id: string
          category?: string
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Update: {
          appointment_id?: string
          category?: string
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ro_attachments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ro_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "customer_marketing_export"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "ro_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_checklist_items: {
        Row: {
          checklist_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          description: string | null
          estimate_id: string | null
          id: string
          label: string
          notes: string | null
          price_high: number | null
          price_low: number | null
          recommended: boolean
          recommended_at: string | null
          recommended_by: string | null
          required: boolean
          severity: string | null
          sort_order: number
          source_template_item_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          checklist_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          estimate_id?: string | null
          id?: string
          label: string
          notes?: string | null
          price_high?: number | null
          price_low?: number | null
          recommended?: boolean
          recommended_at?: string | null
          recommended_by?: string | null
          required?: boolean
          severity?: string | null
          sort_order?: number
          source_template_item_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          checklist_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          estimate_id?: string | null
          id?: string
          label?: string
          notes?: string | null
          price_high?: number | null
          price_low?: number | null
          recommended?: boolean
          recommended_at?: string | null
          recommended_by?: string | null
          required?: boolean
          severity?: string | null
          sort_order?: number
          source_template_item_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "service_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_checklist_items_source_template_item_id_fkey"
            columns: ["source_template_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_template_items"
            referencedColumns: ["id"]
          },
        ]
      }
      service_checklists: {
        Row: {
          appointment_id: string | null
          assigned_technician_id: string | null
          completed_at: string | null
          created_at: string
          customer_id: string
          customer_visible: boolean
          id: string
          membership_id: string | null
          notes: string | null
          started_at: string | null
          status: string
          template_id: string | null
          title: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          appointment_id?: string | null
          assigned_technician_id?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id: string
          customer_visible?: boolean
          id?: string
          membership_id?: string | null
          notes?: string | null
          started_at?: string | null
          status?: string
          template_id?: string | null
          title: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          appointment_id?: string | null
          assigned_technician_id?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string
          customer_visible?: boolean
          id?: string
          membership_id?: string | null
          notes?: string | null
          started_at?: string | null
          status?: string
          template_id?: string | null
          title?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_checklists_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_checklists_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_checklists_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "service_recommendations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_marketing_export"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "service_recommendations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "service_records_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_marketing_export"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "service_records_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      service_reminders_sent: {
        Row: {
          customer_id: string
          error: string | null
          id: string
          message: string | null
          phone: string | null
          reference_id: string
          reminder_type: string
          sent_at: string
          status: string
        }
        Insert: {
          customer_id: string
          error?: string | null
          id?: string
          message?: string | null
          phone?: string | null
          reference_id: string
          reminder_type: string
          sent_at?: string
          status?: string
        }
        Update: {
          customer_id?: string
          error?: string | null
          id?: string
          message?: string | null
          phone?: string | null
          reference_id?: string
          reminder_type?: string
          sent_at?: string
          status?: string
        }
        Relationships: []
      }
      shop_settings: {
        Row: {
          ai_budget_usd: number
          estimate_valid_days: number
          id: number
          labor_cost_per_hour: number
          shop_supplies_max: number
          shop_supplies_pct: number
          tax_rate: number
          updated_at: string
        }
        Insert: {
          ai_budget_usd?: number
          estimate_valid_days?: number
          id?: number
          labor_cost_per_hour?: number
          shop_supplies_max?: number
          shop_supplies_pct?: number
          tax_rate?: number
          updated_at?: string
        }
        Update: {
          ai_budget_usd?: number
          estimate_valid_days?: number
          id?: number
          labor_cost_per_hour?: number
          shop_supplies_max?: number
          shop_supplies_pct?: number
          tax_rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      sms_messages: {
        Row: {
          body: string
          created_at: string
          direction: string
          id: string
          invoice_id: string | null
          media_urls: Json
          sent_by: string | null
          status: string | null
          thread_id: string
          twilio_sid: string | null
        }
        Insert: {
          body: string
          created_at?: string
          direction: string
          id?: string
          invoice_id?: string | null
          media_urls?: Json
          sent_by?: string | null
          status?: string | null
          thread_id: string
          twilio_sid?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          direction?: string
          id?: string
          invoice_id?: string | null
          media_urls?: Json
          sent_by?: string | null
          status?: string | null
          thread_id?: string
          twilio_sid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_messages_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_messages_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "customer_marketing_export"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "sms_messages_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "sms_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_threads: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          last_invoice_id: string | null
          last_message_at: string
          last_message_preview: string | null
          phone: string
          unread_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          last_invoice_id?: string | null
          last_message_at?: string
          last_message_preview?: string | null
          phone: string
          unread_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          last_invoice_id?: string | null
          last_message_at?: string
          last_message_preview?: string | null
          phone?: string
          unread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_threads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_marketing_export"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "sms_threads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_threads_last_invoice_id_fkey"
            columns: ["last_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      time_entries: {
        Row: {
          appointment_id: string
          clock_in: string
          clock_out: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          notes: string | null
          technician_id: string
          updated_at: string
        }
        Insert: {
          appointment_id: string
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          technician_id: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          technician_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "customer_marketing_export"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "time_entries_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_settings: {
        Row: {
          created_at: string
          dni_enabled: boolean
          enhanced_conversions: boolean
          google_ads_conversion_id: string | null
          id: number
          lead_label: string | null
          phone_call_label: string | null
          quote_submit_label: string | null
          text_click_label: string | null
          updated_at: string
          wcc_conversion_id: string | null
          wcc_phone_number: string | null
        }
        Insert: {
          created_at?: string
          dni_enabled?: boolean
          enhanced_conversions?: boolean
          google_ads_conversion_id?: string | null
          id?: number
          lead_label?: string | null
          phone_call_label?: string | null
          quote_submit_label?: string | null
          text_click_label?: string | null
          updated_at?: string
          wcc_conversion_id?: string | null
          wcc_phone_number?: string | null
        }
        Update: {
          created_at?: string
          dni_enabled?: boolean
          enhanced_conversions?: boolean
          google_ads_conversion_id?: string | null
          id?: number
          lead_label?: string | null
          phone_call_label?: string | null
          quote_submit_label?: string | null
          text_click_label?: string | null
          updated_at?: string
          wcc_conversion_id?: string | null
          wcc_phone_number?: string | null
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
      vehicle_master_checklist_items: {
        Row: {
          category: string
          created_at: string
          customer_id: string
          customer_note: string | null
          description: string | null
          id: string
          is_hidden: boolean
          label: string
          label_key: string | null
          last_checked_at: string | null
          last_checked_by: string | null
          last_source: string
          measurement: string | null
          price_high: number | null
          price_low: number | null
          severity_note: string | null
          sort_order: number
          source_template_id: string | null
          source_template_item_id: string | null
          status: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          customer_id: string
          customer_note?: string | null
          description?: string | null
          id?: string
          is_hidden?: boolean
          label: string
          label_key?: string | null
          last_checked_at?: string | null
          last_checked_by?: string | null
          last_source?: string
          measurement?: string | null
          price_high?: number | null
          price_low?: number | null
          severity_note?: string | null
          sort_order?: number
          source_template_id?: string | null
          source_template_item_id?: string | null
          status?: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          category?: string
          created_at?: string
          customer_id?: string
          customer_note?: string | null
          description?: string | null
          id?: string
          is_hidden?: boolean
          label?: string
          label_key?: string | null
          last_checked_at?: string | null
          last_checked_by?: string | null
          last_source?: string
          measurement?: string | null
          price_high?: number | null
          price_low?: number | null
          severity_note?: string | null
          sort_order?: number
          source_template_id?: string | null
          source_template_item_id?: string | null
          status?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_master_checklist_items_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_mileage_logs: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          mileage: number
          notes: string | null
          recorded_at: string
          source: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          mileage: number
          notes?: string | null
          recorded_at?: string
          source?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          mileage?: number
          notes?: string | null
          recorded_at?: string
          source?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_mileage_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_parts_catalog: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          invoice_id: string | null
          labor_description: string | null
          labor_hours: number | null
          part_name: string
          performed_at: string
          quantity: number
          service_record_id: string | null
          sku: string | null
          unit_cost: number
          unit_price: number
          vehicle_id: string | null
          vin: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          invoice_id?: string | null
          labor_description?: string | null
          labor_hours?: number | null
          part_name: string
          performed_at?: string
          quantity?: number
          service_record_id?: string | null
          sku?: string | null
          unit_cost?: number
          unit_price?: number
          vehicle_id?: string | null
          vin: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          invoice_id?: string | null
          labor_description?: string | null
          labor_hours?: number | null
          part_name?: string
          performed_at?: string
          quantity?: number
          service_record_id?: string | null
          sku?: string | null
          unit_cost?: number
          unit_price?: number
          vehicle_id?: string | null
          vin?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          avg_miles_per_day: number | null
          color: string | null
          created_at: string
          current_mileage: number | null
          engine: string | null
          id: string
          is_active: boolean
          last_mileage_update_at: string | null
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
          avg_miles_per_day?: number | null
          color?: string | null
          created_at?: string
          current_mileage?: number | null
          engine?: string | null
          id?: string
          is_active?: boolean
          last_mileage_update_at?: string | null
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
          avg_miles_per_day?: number | null
          color?: string | null
          created_at?: string
          current_mileage?: number | null
          engine?: string | null
          id?: string
          is_active?: boolean
          last_mileage_update_at?: string | null
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
        Relationships: [
          {
            foreignKeyName: "vehicles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "customer_marketing_export"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "vehicles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      web_push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_seen_at: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_seen_at?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_seen_at?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      customer_marketing_export: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          customer_id: string | null
          customer_since: string | null
          email: string | null
          full_name: string | null
          last_service_date: string | null
          last_service_type: string | null
          lifetime_spend: number | null
          marketing_opt_in: boolean | null
          phone: string | null
          postal_code: string | null
          service_count: number | null
          state: string | null
          vehicles: Json | null
        }
        Relationships: []
      }
    }
    Functions: {
      _send_push: {
        Args: {
          _body: string
          _category: string
          _title: string
          _url?: string
          _user_id: string
        }
        Returns: undefined
      }
      _send_push_to_staff: {
        Args: {
          _body: string
          _category: string
          _title: string
          _url?: string
        }
        Returns: undefined
      }
      _send_tech_job_assigned_email: {
        Args: { _appointment_id: string }
        Returns: undefined
      }
      admin_confirm_booking_request: {
        Args: {
          _id: string
          _notes?: string
          _requested_date?: string
          _requested_time_window?: string
        }
        Returns: Json
      }
      admin_decline_booking_request: {
        Args: { _id: string; _reason?: string }
        Returns: Json
      }
      create_checklist_from_template: {
        Args: {
          _appointment_id?: string
          _assigned_technician_id?: string
          _customer_id: string
          _membership_id?: string
          _template_id: string
          _title_override?: string
          _vehicle_id?: string
        }
        Returns: string
      }
      create_notification: {
        Args: {
          _body: string
          _category?: string
          _data?: Json
          _link?: string
          _title: string
          _user_id: string
        }
        Returns: string
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_appointment_confirmation: { Args: { _token: string }; Returns: Json }
      get_estimate_by_token: { Args: { _token: string }; Returns: Json }
      get_public_tracking_settings: { Args: never; Returns: Json }
      get_shared_customer_summary: { Args: { _token: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      recommend_checklist_item: {
        Args: {
          _item_id: string
          _labor_hours?: number
          _note?: string
          _unit_price?: number
        }
        Returns: Json
      }
      redeem_mileage_token: {
        Args: { _miles: number; _token: string }
        Returns: Json
      }
      seed_vehicle_master_checklist: {
        Args: { _vehicle_id: string }
        Returns: number
      }
      set_booking_attribution: {
        Args: { _attribution: Json; _token: string }
        Returns: undefined
      }
      submit_booking_request: {
        Args: {
          _description: string
          _email: string
          _name: string
          _phone: string
          _requested_date: string
          _requested_time_window: string
          _service_address: string
          _service_type: string
          _source: string
          _vehicle_info: string
        }
        Returns: Json
      }
      submit_estimate_decision:
        | {
            Args: {
              _decline_reason: string
              _line_items: Json
              _signature: string
              _status: string
              _token: string
            }
            Returns: Json
          }
        | {
            Args: {
              _decline_reason: string
              _line_items: Json
              _requested_date?: string
              _requested_time_window?: string
              _signature: string
              _status: string
              _token: string
            }
            Returns: Json
          }
      unread_message_count: { Args: { _user_id: string }; Returns: number }
    }
    Enums: {
      app_role:
        | "admin"
        | "user"
        | "customer"
        | "technician"
        | "service_advisor"
        | "parts"
        | "manager"
        | "owner"
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
      app_role: [
        "admin",
        "user",
        "customer",
        "technician",
        "service_advisor",
        "parts",
        "manager",
        "owner",
      ],
    },
  },
} as const
