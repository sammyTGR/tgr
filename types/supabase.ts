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
      Auditlists: {
        Row: {
          audit_type: string | null
          error_details: string | null
          error_location: string | null
          list_id: number
          salesreps: string | null
          user_id: string | null
        }
        Insert: {
          audit_type?: string | null
          error_details?: string | null
          error_location?: string | null
          list_id?: number
          salesreps?: string | null
          user_id?: string | null
        }
        Update: {
          audit_type?: string | null
          error_details?: string | null
          error_location?: string | null
          list_id?: number
          salesreps?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      Auditsinput: {
        Row: {
          audit_date: string | null
          audit_type: string | null
          audits_id: string
          dros_cancel: string | null
          dros_number: string | null
          employee_lanid: string | null
          error_details: string | null
          error_location: string | null
          error_notes: string | null
          salesreps: string | null
          trans_date: string | null
          user_id: string | null
          user_uuid: string | null
        }
        Insert: {
          audit_date?: string | null
          audit_type?: string | null
          audits_id?: string
          dros_cancel?: string | null
          dros_number?: string | null
          employee_lanid?: string | null
          error_details?: string | null
          error_location?: string | null
          error_notes?: string | null
          salesreps?: string | null
          trans_date?: string | null
          user_id?: string | null
          user_uuid?: string | null
        }
        Update: {
          audit_date?: string | null
          audit_type?: string | null
          audits_id?: string
          dros_cancel?: string | null
          dros_number?: string | null
          employee_lanid?: string | null
          error_details?: string | null
          error_location?: string | null
          error_notes?: string | null
          salesreps?: string | null
          trans_date?: string | null
          user_id?: string | null
          user_uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Auditsinput_user_uuid_fkey"
            columns: ["user_uuid"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["user_uuid"]
          },
        ]
      }
      blocked_emails: {
        Row: {
          created_at: string | null
          email: string
          id: string
          reason: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          reason?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      break_room_duty: {
        Row: {
          actual_duty_date: string | null
          duty_date: string
          employee_id: number
          id: number
          week_start: string
        }
        Insert: {
          actual_duty_date?: string | null
          duty_date: string
          employee_id: number
          id?: number
          week_start: string
        }
        Update: {
          actual_duty_date?: string | null
          duty_date?: string
          employee_id?: number
          id?: number
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "break_room_duty_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      calendar: {
        Row: {
          calendar_id: string | null
          calendar_name: string | null
          employee: string | null
          id: string
          request_replies: string | null
          time_off_reasons: string | null
        }
        Insert: {
          calendar_id?: string | null
          calendar_name?: string | null
          employee?: string | null
          id?: string
          request_replies?: string | null
          time_off_reasons?: string | null
        }
        Update: {
          calendar_id?: string | null
          calendar_name?: string | null
          employee?: string | null
          id?: string
          request_replies?: string | null
          time_off_reasons?: string | null
        }
        Relationships: []
      }
      certifications: {
        Row: {
          action_status: string | null
          certificate: string | null
          expiration: string | null
          id: string
          name: string | null
          number: number | null
          status: string | null
        }
        Insert: {
          action_status?: string | null
          certificate?: string | null
          expiration?: string | null
          id?: string
          name?: string | null
          number?: number | null
          status?: string | null
        }
        Update: {
          action_status?: string | null
          certificate?: string | null
          expiration?: string | null
          id?: string
          name?: string | null
          number?: number | null
          status?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          id: number
          is_read: boolean | null
          message: string
          read_by: string[] | null
          receiver_id: string | null
          sender_id: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          created_at?: string
          id?: number
          is_read?: boolean | null
          message: string
          read_by?: string[] | null
          receiver_id?: string | null
          sender_id?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          created_at?: string
          id?: number
          is_read?: boolean | null
          message?: string
          read_by?: string[] | null
          receiver_id?: string | null
          sender_id?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      chat_participants: {
        Row: {
          chat_id: string | null
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          chat_id?: string | null
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          chat_id?: string | null
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      checklist_submissions: {
        Row: {
          checklist_notes: string | null
          firearm_name: string | null
          id: number
          shift: string
          submission_date: string
          submitted_by: string
          submitted_by_name: string
        }
        Insert: {
          checklist_notes?: string | null
          firearm_name?: string | null
          id?: number
          shift: string
          submission_date: string
          submitted_by: string
          submitted_by_name: string
        }
        Update: {
          checklist_notes?: string | null
          firearm_name?: string | null
          id?: number
          shift?: string
          submission_date?: string
          submitted_by?: string
          submitted_by_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_submissions_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["user_uuid"]
          },
        ]
      }
      class_enrollments: {
        Row: {
          class_id: number | null
          created_at: string
          id: number
          payment_status: string
          stripe_session_id: string | null
          updated_at: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          class_id?: number | null
          created_at?: string
          id?: number
          payment_status: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          class_id?: number | null
          created_at?: string
          id?: number
          payment_status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      class_schedules: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_time: string
          id: number
          price: number | null
          start_time: string
          stripe_price_id: string | null
          stripe_product_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time: string
          id?: number
          price?: number | null
          start_time: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string
          id?: number
          price?: number | null
          start_time?: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["user_uuid"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string | null
          customer_id: number
          email: string
          first_name: string | null
          is_subscribed: boolean
          last_name: string | null
          last_payment_date: string | null
          payment_status: string | null
          role: string
          stripe_customer_id: string | null
          subscription_end_date: string | null
          subscription_start_date: string | null
          subscription_tier: string | null
          updated_at: string | null
          user_uuid: string
        }
        Insert: {
          created_at?: string | null
          customer_id?: number
          email: string
          first_name?: string | null
          is_subscribed?: boolean
          last_name?: string | null
          last_payment_date?: string | null
          payment_status?: string | null
          role?: string
          stripe_customer_id?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_uuid: string
        }
        Update: {
          created_at?: string | null
          customer_id?: number
          email?: string
          first_name?: string | null
          is_subscribed?: boolean
          last_name?: string | null
          last_payment_date?: string | null
          payment_status?: string | null
          role?: string
          stripe_customer_id?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_uuid?: string
        }
        Relationships: []
      }
      daily_deposits: {
        Row: {
          aim_generated_total: number | null
          created_at: string | null
          dimes: number | null
          discrepancy_message: string | null
          employee_name: string
          explain_discrepancies: string | null
          fifties: number | null
          fives: number | null
          hundreds: number | null
          id: number
          nickels: number | null
          ones: number | null
          pennies: number | null
          quarters: number | null
          register: string
          roll_of_dimes: number | null
          roll_of_nickels: number | null
          roll_of_pennies: number | null
          roll_of_quarters: number | null
          tens: number | null
          total_in_drawer: number | null
          total_to_deposit: number | null
          twenties: number | null
          user_uuid: string | null
        }
        Insert: {
          aim_generated_total?: number | null
          created_at?: string | null
          dimes?: number | null
          discrepancy_message?: string | null
          employee_name: string
          explain_discrepancies?: string | null
          fifties?: number | null
          fives?: number | null
          hundreds?: number | null
          id?: number
          nickels?: number | null
          ones?: number | null
          pennies?: number | null
          quarters?: number | null
          register: string
          roll_of_dimes?: number | null
          roll_of_nickels?: number | null
          roll_of_pennies?: number | null
          roll_of_quarters?: number | null
          tens?: number | null
          total_in_drawer?: number | null
          total_to_deposit?: number | null
          twenties?: number | null
          user_uuid?: string | null
        }
        Update: {
          aim_generated_total?: number | null
          created_at?: string | null
          dimes?: number | null
          discrepancy_message?: string | null
          employee_name?: string
          explain_discrepancies?: string | null
          fifties?: number | null
          fives?: number | null
          hundreds?: number | null
          id?: number
          nickels?: number | null
          ones?: number | null
          pennies?: number | null
          quarters?: number | null
          register?: string
          roll_of_dimes?: number | null
          roll_of_nickels?: number | null
          roll_of_pennies?: number | null
          roll_of_quarters?: number | null
          tens?: number | null
          total_in_drawer?: number | null
          total_to_deposit?: number | null
          twenties?: number | null
          user_uuid?: string | null
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          created_at: string | null
          id: number
          is_read: boolean | null
          message: string
          read_by: string[] | null
          receiver_id: string
          sender_id: string
          user_name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          message: string
          read_by?: string[] | null
          receiver_id: string
          sender_id: string
          user_name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          message?: string
          read_by?: string[] | null
          receiver_id?: string
          sender_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      discussed_notes: {
        Row: {
          created_at: string
          employee_name: string
          id: number
          meeting_date: string
          note_content: string
          topic: string
        }
        Insert: {
          created_at?: string
          employee_name: string
          id?: number
          meeting_date: string
          note_content: string
          topic: string
        }
        Update: {
          created_at?: string
          employee_name?: string
          id?: number
          meeting_date?: string
          note_content?: string
          topic?: string
        }
        Relationships: []
      }
      Drops: {
        Row: {
          address: string | null
          availability: string | null
          blank: string | null
          document: string | null
          dropdown_id: number
          product: string | null
          requirements: string | null
          residency: string | null
          type: string | null
          user_id: string | null
          validity: string | null
        }
        Insert: {
          address?: string | null
          availability?: string | null
          blank?: string | null
          document?: string | null
          dropdown_id: number
          product?: string | null
          requirements?: string | null
          residency?: string | null
          type?: string | null
          user_id?: string | null
          validity?: string | null
        }
        Update: {
          address?: string | null
          availability?: string | null
          blank?: string | null
          document?: string | null
          dropdown_id?: number
          product?: string | null
          requirements?: string | null
          residency?: string | null
          type?: string | null
          user_id?: string | null
          validity?: string | null
        }
        Relationships: []
      }
      employee_absences: {
        Row: {
          created_at: string | null
          created_by: string
          employee_id: number
          id: number
          schedule_date: string
          status: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          employee_id: number
          id?: number
          schedule_date: string
          status: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          employee_id?: number
          id?: number
          schedule_date?: string
          status?: string
        }
        Relationships: []
      }
      employee_clock_events: {
        Row: {
          created_at: string | null
          employee_id: number
          employee_name: string | null
          end_time: string | null
          event_date: string | null
          id: number
          lunch_end: string | null
          lunch_start: string | null
          start_time: string
          total_hours: unknown | null
        }
        Insert: {
          created_at?: string | null
          employee_id: number
          employee_name?: string | null
          end_time?: string | null
          event_date?: string | null
          id?: number
          lunch_end?: string | null
          lunch_start?: string | null
          start_time: string
          total_hours?: unknown | null
        }
        Update: {
          created_at?: string | null
          employee_id?: number
          employee_name?: string | null
          end_time?: string | null
          event_date?: string | null
          id?: number
          lunch_end?: string | null
          lunch_start?: string | null
          start_time?: string
          total_hours?: unknown | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_clock_events_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      employee_domains: {
        Row: {
          created_at: string
          domain: string | null
          id: number
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: number
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: number
        }
        Relationships: []
      }
      employee_notes: {
        Row: {
          created_at: string | null
          employee_id: string
          id: number
          note: string
          type: string
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          id?: number
          note: string
          type: string
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          id?: number
          note?: string
          type?: string
        }
        Relationships: []
      }
      employee_profile_notes: {
        Row: {
          completed: string | null
          created_at: string | null
          created_by: string | null
          employee_id: number | null
          id: number
          note: string
          profile_employee_id: number | null
          reviewed: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
          type: string
        }
        Insert: {
          completed?: string | null
          created_at?: string | null
          created_by?: string | null
          employee_id?: number | null
          id?: number
          note: string
          profile_employee_id?: number | null
          reviewed?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          type: string
        }
        Update: {
          completed?: string | null
          created_at?: string | null
          created_by?: string | null
          employee_id?: number | null
          id?: number
          note?: string
          profile_employee_id?: number | null
          reviewed?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_profile_notes_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "employee_profile_notes_profile_employee_id_fkey"
            columns: ["profile_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      employee_quarterly_reviews: {
        Row: {
          achievements_contributions: string[] | null
          areas_growth: string[] | null
          attendance_reliability: string[] | null
          communication_collaboration: string[] | null
          created_at: string | null
          created_by: string
          employee_id: number
          id: number
          overview_performance: string | null
          published: boolean | null
          quality_work: string[] | null
          recognition: string[] | null
          review_quarter: string
          review_year: number
          strengths_accomplishments: string[] | null
        }
        Insert: {
          achievements_contributions?: string[] | null
          areas_growth?: string[] | null
          attendance_reliability?: string[] | null
          communication_collaboration?: string[] | null
          created_at?: string | null
          created_by: string
          employee_id: number
          id?: number
          overview_performance?: string | null
          published?: boolean | null
          quality_work?: string[] | null
          recognition?: string[] | null
          review_quarter: string
          review_year: number
          strengths_accomplishments?: string[] | null
        }
        Update: {
          achievements_contributions?: string[] | null
          areas_growth?: string[] | null
          attendance_reliability?: string[] | null
          communication_collaboration?: string[] | null
          created_at?: string | null
          created_by?: string
          employee_id?: number
          id?: number
          overview_performance?: string | null
          published?: boolean | null
          quality_work?: string[] | null
          recognition?: string[] | null
          review_quarter?: string
          review_year?: number
          strengths_accomplishments?: string[] | null
        }
        Relationships: []
      }
      employee_suggestions: {
        Row: {
          created_at: string | null
          created_by: string
          email: string | null
          id: number
          is_read: boolean | null
          replied_at: string | null
          replied_by: string | null
          reply: string | null
          suggestion: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          email?: string | null
          id?: number
          is_read?: boolean | null
          replied_at?: string | null
          replied_by?: string | null
          reply?: string | null
          suggestion: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          email?: string | null
          id?: number
          is_read?: boolean | null
          replied_at?: string | null
          replied_by?: string | null
          reply?: string | null
          suggestion?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          avatar_url: string | null
          birthday: string | null
          city: string | null
          contact_info: string | null
          department: string | null
          employee_id: number
          extension: number | null
          hire_date: string | null
          is_online: boolean | null
          lanid: string | null
          last_name: string | null
          name: string | null
          pay_rate: number | null
          pay_type: string | null
          phone_number: string | null
          promotion_date: string | null
          rank: number | null
          role: string | null
          sick_time_used: number
          state: string | null
          status: string | null
          street_address: string | null
          term_date: string | null
          user_uuid: string | null
          vacation_time: number | null
          zip: string | null
        }
        Insert: {
          avatar_url?: string | null
          birthday?: string | null
          city?: string | null
          contact_info?: string | null
          department?: string | null
          employee_id?: number
          extension?: number | null
          hire_date?: string | null
          is_online?: boolean | null
          lanid?: string | null
          last_name?: string | null
          name?: string | null
          pay_rate?: number | null
          pay_type?: string | null
          phone_number?: string | null
          promotion_date?: string | null
          rank?: number | null
          role?: string | null
          sick_time_used?: number
          state?: string | null
          status?: string | null
          street_address?: string | null
          term_date?: string | null
          user_uuid?: string | null
          vacation_time?: number | null
          zip?: string | null
        }
        Update: {
          avatar_url?: string | null
          birthday?: string | null
          city?: string | null
          contact_info?: string | null
          department?: string | null
          employee_id?: number
          extension?: number | null
          hire_date?: string | null
          is_online?: boolean | null
          lanid?: string | null
          last_name?: string | null
          name?: string | null
          pay_rate?: number | null
          pay_type?: string | null
          phone_number?: string | null
          promotion_date?: string | null
          rank?: number | null
          role?: string | null
          sick_time_used?: number
          state?: string | null
          status?: string | null
          street_address?: string | null
          term_date?: string | null
          user_uuid?: string | null
          vacation_time?: number | null
          zip?: string | null
        }
        Relationships: []
      }
      firearm_verifications: {
        Row: {
          condition_verified: boolean
          created_at: string | null
          firearm_id: number
          id: number
          magazine_attached: boolean
          notes: string | null
          serial_verified: boolean
          verification_date: string
          verification_time: string
          verified_by: string
        }
        Insert: {
          condition_verified: boolean
          created_at?: string | null
          firearm_id: number
          id?: number
          magazine_attached: boolean
          notes?: string | null
          serial_verified: boolean
          verification_date: string
          verification_time: string
          verified_by: string
        }
        Update: {
          condition_verified?: boolean
          created_at?: string | null
          firearm_id?: number
          id?: number
          magazine_attached?: boolean
          notes?: string | null
          serial_verified?: boolean
          verification_date?: string
          verification_time?: string
          verified_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "firearm_verifications_firearm_id_fkey"
            columns: ["firearm_id"]
            isOneToOne: false
            referencedRelation: "firearms_maintenance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "firearm_verifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["user_uuid"]
          },
        ]
      }
      firearms_maintenance: {
        Row: {
          admin_name: string | null
          admin_request: string | null
          admin_uuid: string | null
          assigned_to: string | null
          firearm_name: string
          firearm_type: string
          gunsmith_response: string | null
          has_new_request: boolean | null
          id: number
          last_maintenance_date: string | null
          maintenance_frequency: number | null
          maintenance_notes: string | null
          rental_notes: string | null
          status: string | null
          verified_status: string | null
        }
        Insert: {
          admin_name?: string | null
          admin_request?: string | null
          admin_uuid?: string | null
          assigned_to?: string | null
          firearm_name: string
          firearm_type: string
          gunsmith_response?: string | null
          has_new_request?: boolean | null
          id?: number
          last_maintenance_date?: string | null
          maintenance_frequency?: number | null
          maintenance_notes?: string | null
          rental_notes?: string | null
          status?: string | null
          verified_status?: string | null
        }
        Update: {
          admin_name?: string | null
          admin_request?: string | null
          admin_uuid?: string | null
          assigned_to?: string | null
          firearm_name?: string
          firearm_type?: string
          gunsmith_response?: string | null
          has_new_request?: boolean | null
          id?: number
          last_maintenance_date?: string | null
          maintenance_frequency?: number | null
          maintenance_notes?: string | null
          rental_notes?: string | null
          status?: string | null
          verified_status?: string | null
        }
        Relationships: []
      }
      future_vacation_requests: {
        Row: {
          employee_id: number
          employee_name: string | null
          hours_deducted: number | null
          year: number
        }
        Insert: {
          employee_id: number
          employee_name?: string | null
          hours_deducted?: number | null
          year: number
        }
        Update: {
          employee_id?: number
          employee_name?: string | null
          hours_deducted?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      group_chat_messages: {
        Row: {
          created_at: string | null
          group_chat_id: number
          id: number
          is_read: boolean | null
          message: string
          read_by: string[] | null
          receiver_id: string | null
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          group_chat_id: number
          id?: number
          is_read?: boolean | null
          message: string
          read_by?: string[] | null
          receiver_id?: string | null
          sender_id: string
        }
        Update: {
          created_at?: string | null
          group_chat_id?: number
          id?: number
          is_read?: boolean | null
          message?: string
          read_by?: string[] | null
          receiver_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_chat_messages_group_chat_id_fkey"
            columns: ["group_chat_id"]
            isOneToOne: false
            referencedRelation: "group_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      group_chats: {
        Row: {
          created_at: string | null
          created_by: string
          id: number
          last_message: string | null
          name: string
          users: string[]
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: number
          last_message?: string | null
          name: string
          users: string[]
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: number
          last_message?: string | null
          name?: string
          users?: string[]
        }
        Relationships: []
      }
      holidays: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          id: number
          is_full_day: boolean
          name: string
          repeat_yearly: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          id?: number
          is_full_day?: boolean
          name: string
          repeat_yearly?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          id?: number
          is_full_day?: boolean
          name?: string
          repeat_yearly?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          amount: number
          currency: string
          description: string | null
          id: string
          invoice_id: string | null
          price_id: string | null
          quantity: number
        }
        Insert: {
          amount: number
          currency: string
          description?: string | null
          id: string
          invoice_id?: string | null
          price_id?: string | null
          quantity: number
        }
        Update: {
          amount?: number
          currency?: string
          description?: string | null
          id?: string
          invoice_id?: string | null
          price_id?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created: string
          currency: string
          customer_id: string | null
          id: string
          paid: boolean
          payment_intent_id: string | null
          period_end: string
          period_start: string
          status: string
          subscription_id: string | null
          total: number
        }
        Insert: {
          created: string
          currency: string
          customer_id?: string | null
          id: string
          paid: boolean
          payment_intent_id?: string | null
          period_end: string
          period_start: string
          status: string
          subscription_id?: string | null
          total: number
        }
        Update: {
          created?: string
          currency?: string
          customer_id?: string | null
          id?: string
          paid?: boolean
          payment_intent_id?: string | null
          period_end?: string
          period_start?: string
          status?: string
          subscription_id?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          completed: string | null
          id: number
          list_id: string | null
          name: string
          order: number
          user_id: string
          user_name: string
        }
        Insert: {
          completed?: string | null
          id?: number
          list_id?: string | null
          name: string
          order: number
          user_id: string
          user_name: string
        }
        Update: {
          completed?: string | null
          id?: number
          list_id?: string | null
          name?: string
          order?: number
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_list"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      lists: {
        Row: {
          id: string
          order: number
          title: string
        }
        Insert: {
          id?: string
          order: number
          title: string
        }
        Update: {
          id?: string
          order?: number
          title?: string
        }
        Relationships: []
      }
      message_reads: {
        Row: {
          id: string
          message_id: string | null
          read_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          message_id?: string | null
          read_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string | null
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_id: string | null
          content: string
          created_at: string
          id: string
          is_agent: boolean | null
          user_id: string
        }
        Insert: {
          chat_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_agent?: boolean | null
          user_id: string
        }
        Update: {
          chat_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_agent?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      Navmenuoptions: {
        Row: {
          card_names: string | null
          menu_id: number
          menu_item: string | null
          subitem_label: string | null
          user_id: string | null
        }
        Insert: {
          card_names?: string | null
          menu_id: number
          menu_item?: string | null
          subitem_label?: string | null
          user_id?: string | null
        }
        Update: {
          card_names?: string | null
          menu_id?: number
          menu_item?: string | null
          subitem_label?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          chat_id: string | null
          content: string
          created_at: string | null
          id: string
          read: boolean | null
          type: string
          user_id: string | null
        }
        Insert: {
          chat_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          type: string
          user_id?: string | null
        }
        Update: {
          chat_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_references: {
        Row: {
          display_order: number
          field_name: string
          id: number
          option_value: string
        }
        Insert: {
          display_order: number
          field_name: string
          id?: never
          option_value: string
        }
        Update: {
          display_order?: number
          field_name?: string
          id?: never
          option_value?: string
        }
        Relationships: []
      }
      orderlist: {
        Row: {
          customer_type: string | null
          id: number
          inquiry_type: string | null
        }
        Insert: {
          customer_type?: string | null
          id?: number
          inquiry_type?: string | null
        }
        Update: {
          customer_type?: string | null
          id?: number
          inquiry_type?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          contacted: boolean | null
          created_at: string | null
          customer_name: string
          customer_type: string
          details: string | null
          email: string
          employee: string
          employee_email: string | null
          id: number
          inquiry_type: string
          is_read: boolean | null
          item: string
          manufacturer: string
          phone: string
          status: string | null
          user_uuid: string | null
        }
        Insert: {
          contacted?: boolean | null
          created_at?: string | null
          customer_name: string
          customer_type: string
          details?: string | null
          email: string
          employee: string
          employee_email?: string | null
          id?: number
          inquiry_type: string
          is_read?: boolean | null
          item: string
          manufacturer: string
          phone: string
          status?: string | null
          user_uuid?: string | null
        }
        Update: {
          contacted?: boolean | null
          created_at?: string | null
          customer_name?: string
          customer_type?: string
          details?: string | null
          email?: string
          employee?: string
          employee_email?: string | null
          id?: number
          inquiry_type?: string
          is_read?: boolean | null
          item?: string
          manufacturer?: string
          phone?: string
          status?: string | null
          user_uuid?: string | null
        }
        Relationships: []
      }
      persisted_firearms_list: {
        Row: {
          created_at: string | null
          firearms_list: Json
          id: number
          user_uuid: string
        }
        Insert: {
          created_at?: string | null
          firearms_list: Json
          id?: number
          user_uuid: string
        }
        Update: {
          created_at?: string | null
          firearms_list?: Json
          id?: number
          user_uuid?: string
        }
        Relationships: []
      }
      points: {
        Row: {
          created_at: string | null
          details: string | null
          dros_number: string
          dros_status: string
          employee: string
          id: number
          invoice_number: string
          serial_number: string
          start_trans: string
          user_uuid: string
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          dros_number: string
          dros_status: string
          employee: string
          id?: number
          invoice_number: string
          serial_number: string
          start_trans: string
          user_uuid: string
        }
        Update: {
          created_at?: string | null
          details?: string | null
          dros_number?: string
          dros_status?: string
          employee?: string
          id?: number
          invoice_number?: string
          serial_number?: string
          start_trans?: string
          user_uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_user_uuid_fkey"
            columns: ["user_uuid"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["user_uuid"]
          },
        ]
      }
      points_calculation: {
        Row: {
          category: string
          error_location: string
          id: number
          points_deducted: number
        }
        Insert: {
          category: string
          error_location: string
          id?: number
          points_deducted: number
        }
        Update: {
          category?: string
          error_location?: string
          id?: number
          points_deducted?: number
        }
        Relationships: []
      }
      pointslist: {
        Row: {
          dros_status: string | null
          id: number
          start_trans: string | null
        }
        Insert: {
          dros_status?: string | null
          id?: number
          start_trans?: string | null
        }
        Update: {
          dros_status?: string | null
          id?: number
          start_trans?: string | null
        }
        Relationships: []
      }
      prices: {
        Row: {
          active: boolean | null
          currency: string | null
          description: string | null
          id: string
          interval: string | null
          interval_count: number | null
          metadata: Json | null
          product_id: string | null
          trial_period_days: number | null
          type: string | null
          unit_amount: number | null
        }
        Insert: {
          active?: boolean | null
          currency?: string | null
          description?: string | null
          id: string
          interval?: string | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: string | null
          unit_amount?: number | null
        }
        Update: {
          active?: boolean | null
          currency?: string | null
          description?: string | null
          id?: string
          interval?: string | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: string | null
          unit_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          description: string | null
          id: string
          image: string | null
          metadata: Json | null
          name: string | null
          product_type: string | null
        }
        Insert: {
          active?: boolean | null
          description?: string | null
          id: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
          product_type?: string | null
        }
        Update: {
          active?: boolean | null
          description?: string | null
          id?: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
          product_type?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          email: string | null
          full_name: string | null
          id: string
          role: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
        }
        Relationships: []
      }
      public_customers: {
        Row: {
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          payment_intent_id: string | null
          product_id: string | null
          product_name: string | null
          quantity: number
          status: string | null
          stripe_session_id: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          payment_intent_id?: string | null
          product_id?: string | null
          product_name?: string | null
          quantity?: number
          status?: string | null
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          payment_intent_id?: string | null
          product_id?: string | null
          product_name?: string | null
          quantity?: number
          status?: string | null
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      range_repair_reports: {
        Row: {
          created_at: string
          date_of_repair: string | null
          description: string | null
          id: number
          lanes_repaired: string | null
          role: string | null
          user_name: string | null
          user_uuid: string
        }
        Insert: {
          created_at?: string
          date_of_repair?: string | null
          description?: string | null
          id?: number
          lanes_repaired?: string | null
          role?: string | null
          user_name?: string | null
          user_uuid: string
        }
        Update: {
          created_at?: string
          date_of_repair?: string | null
          description?: string | null
          id?: number
          lanes_repaired?: string | null
          role?: string | null
          user_name?: string | null
          user_uuid?: string
        }
        Relationships: []
      }
      range_walk_reports: {
        Row: {
          created_at: string | null
          date_of_walk: string
          description: string | null
          id: number
          lanes: string
          lanes_with_problems: string | null
          repair_notes: string | null
          repair_notes_user: string | null
          role: string | null
          status: string | null
          user_name: string | null
          user_uuid: string | null
        }
        Insert: {
          created_at?: string | null
          date_of_walk: string
          description?: string | null
          id?: number
          lanes: string
          lanes_with_problems?: string | null
          repair_notes?: string | null
          repair_notes_user?: string | null
          role?: string | null
          status?: string | null
          user_name?: string | null
          user_uuid?: string | null
        }
        Update: {
          created_at?: string | null
          date_of_walk?: string
          description?: string | null
          id?: number
          lanes?: string
          lanes_with_problems?: string | null
          repair_notes?: string | null
          repair_notes_user?: string | null
          role?: string | null
          status?: string | null
          user_name?: string | null
          user_uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "range_walk_reports_user_uuid_fkey"
            columns: ["user_uuid"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["user_uuid"]
          },
        ]
      }
      reconciled_hours: {
        Row: {
          created_at: string | null
          employee_id: number
          event_date: string
          hours_to_reconcile: number
          id: number
          name: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id: number
          event_date: string
          hours_to_reconcile: number
          id?: number
          name?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: number
          event_date?: string
          hours_to_reconcile?: number
          id?: number
          name?: string | null
        }
        Relationships: []
      }
      reference_schedules: {
        Row: {
          day_of_week: string
          employee_id: number | null
          end_time: string | null
          id: number
          name: string | null
          start_time: string | null
          user_uuid: string | null
        }
        Insert: {
          day_of_week: string
          employee_id?: number | null
          end_time?: string | null
          id?: number
          name?: string | null
          start_time?: string | null
          user_uuid?: string | null
        }
        Update: {
          day_of_week?: string
          employee_id?: number | null
          end_time?: string | null
          id?: number
          name?: string | null
          start_time?: string | null
          user_uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reference_schedules_user_uuid_fkey"
            columns: ["user_uuid"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["user_uuid"]
          },
        ]
      }
      sales_data: {
        Row: {
          Acct: number | null
          Cat: number | null
          category_label: string | null
          Cost: number | null
          CustType: string | null
          Date: string | null
          Desc: string | null
          Disc: number | null
          id: number
          Invoice: number | null
          Lanid: string | null
          Last: string | null
          LastName: string | null
          Legacy: string | null
          Mfg: string | null
          "Primary Email": string | null
          Sku: string | null
          SoldPrice: number | null
          SoldQty: number | null
          Spiff: number | null
          status: string | null
          Stloc: number | null
          Sub: number | null
          subcategory_label: string | null
          total_gross: number | null
          total_net: number | null
          Type: string | null
        }
        Insert: {
          Acct?: number | null
          Cat?: number | null
          category_label?: string | null
          Cost?: number | null
          CustType?: string | null
          Date?: string | null
          Desc?: string | null
          Disc?: number | null
          id?: number
          Invoice?: number | null
          Lanid?: string | null
          Last?: string | null
          LastName?: string | null
          Legacy?: string | null
          Mfg?: string | null
          "Primary Email"?: string | null
          Sku?: string | null
          SoldPrice?: number | null
          SoldQty?: number | null
          Spiff?: number | null
          status?: string | null
          Stloc?: number | null
          Sub?: number | null
          subcategory_label?: string | null
          total_gross?: number | null
          total_net?: number | null
          Type?: string | null
        }
        Update: {
          Acct?: number | null
          Cat?: number | null
          category_label?: string | null
          Cost?: number | null
          CustType?: string | null
          Date?: string | null
          Desc?: string | null
          Disc?: number | null
          id?: number
          Invoice?: number | null
          Lanid?: string | null
          Last?: string | null
          LastName?: string | null
          Legacy?: string | null
          Mfg?: string | null
          "Primary Email"?: string | null
          Sku?: string | null
          SoldPrice?: number | null
          SoldQty?: number | null
          Spiff?: number | null
          status?: string | null
          Stloc?: number | null
          Sub?: number | null
          subcategory_label?: string | null
          total_gross?: number | null
          total_net?: number | null
          Type?: string | null
        }
        Relationships: []
      }
      schedules: {
        Row: {
          day_of_week: string
          employee_id: number | null
          end_time: string | null
          holiday_id: number | null
          name: string | null
          notes: string | null
          schedule_date: string | null
          schedule_id: number
          start_time: string | null
          status: string | null
          user_uuid: string | null
        }
        Insert: {
          day_of_week: string
          employee_id?: number | null
          end_time?: string | null
          holiday_id?: number | null
          name?: string | null
          notes?: string | null
          schedule_date?: string | null
          schedule_id?: number
          start_time?: string | null
          status?: string | null
          user_uuid?: string | null
        }
        Update: {
          day_of_week?: string
          employee_id?: number | null
          end_time?: string | null
          holiday_id?: number | null
          name?: string | null
          notes?: string | null
          schedule_date?: string | null
          schedule_id?: number
          start_time?: string | null
          status?: string | null
          user_uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "schedules_name_fkey"
            columns: ["name"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "schedules_user_uuid_fkey"
            columns: ["user_uuid"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["user_uuid"]
          },
        ]
      }
      stripe_sync_info: {
        Row: {
          id: number
          last_sync_time: number | null
        }
        Insert: {
          id: number
          last_sync_time?: number | null
        }
        Update: {
          id?: number
          last_sync_time?: number | null
        }
        Relationships: []
      }
      subscription_schedules: {
        Row: {
          customer_id: string | null
          end_date: string | null
          id: string
          metadata: Json | null
          start_date: string | null
          status: string
          subscription_id: string | null
        }
        Insert: {
          customer_id?: string | null
          end_date?: string | null
          id: string
          metadata?: Json | null
          start_date?: string | null
          status: string
          subscription_id?: string | null
        }
        Update: {
          customer_id?: string | null
          end_date?: string | null
          id?: string
          metadata?: Json | null
          start_date?: string | null
          status?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_schedules_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created: string
          current_period_end: string | null
          current_period_start: string | null
          email: string | null
          ended_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          metadata: Json | null
          price_id: string | null
          quantity: number | null
          status: string | null
          trial_end: string | null
          trial_start: string | null
          user_id: string
        }
        Insert: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string
          current_period_end?: string | null
          current_period_start?: string | null
          email?: string | null
          ended_at?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: string | null
          trial_end?: string | null
          trial_start?: string | null
          user_id: string
        }
        Update: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string
          current_period_end?: string | null
          current_period_start?: string | null
          email?: string | null
          ended_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: string | null
          trial_end?: string | null
          trial_start?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
        ]
      }
      team_weekly_notes: {
        Row: {
          created_at: string | null
          employee_id: number
          employees_notes: Json | null
          general_notes: Json | null
          inventory_notes: Json | null
          note_id: number
          range_notes: Json | null
          safety_notes: Json | null
          store_notes: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id: number
          employees_notes?: Json | null
          general_notes?: Json | null
          inventory_notes?: Json | null
          note_id?: number
          range_notes?: Json | null
          safety_notes?: Json | null
          store_notes?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: number
          employees_notes?: Json | null
          general_notes?: Json | null
          inventory_notes?: Json | null
          note_id?: number
          range_notes?: Json | null
          safety_notes?: Json | null
          store_notes?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_weekly_notes_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      time_off_reasons: {
        Row: {
          id: number
          reason: string
        }
        Insert: {
          id?: number
          reason: string
        }
        Update: {
          id?: number
          reason?: string
        }
        Relationships: []
      }
      time_off_requests: {
        Row: {
          created_at: string
          email: string | null
          employee_id: number | null
          end_date: string
          hours_deducted: number | null
          is_read: boolean | null
          name: string
          other_reason: string | null
          reason: string | null
          request_id: number
          sick_time_year: number | null
          start_date: string
          status: string | null
          use_sick_time: boolean | null
          use_vacation_time: boolean | null
          user_uuid: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          employee_id?: number | null
          end_date: string
          hours_deducted?: number | null
          is_read?: boolean | null
          name: string
          other_reason?: string | null
          reason?: string | null
          request_id?: number
          sick_time_year?: number | null
          start_date: string
          status?: string | null
          use_sick_time?: boolean | null
          use_vacation_time?: boolean | null
          user_uuid?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          employee_id?: number | null
          end_date?: string
          hours_deducted?: number | null
          is_read?: boolean | null
          name?: string
          other_reason?: string | null
          reason?: string | null
          request_id?: number
          sick_time_year?: number | null
          start_date?: string
          status?: string | null
          use_sick_time?: boolean | null
          use_vacation_time?: boolean | null
          user_uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_off_requests_user_uuid_fkey"
            columns: ["user_uuid"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["user_uuid"]
          },
        ]
      }
      todos: {
        Row: {
          completed_at: string | null
          id: number
          inserted_at: string
          is_complete: boolean | null
          task: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: number
          inserted_at?: string
          is_complete?: boolean | null
          task?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: number
          inserted_at?: string
          is_complete?: boolean | null
          task?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user: {
        Row: {
          email: string
          emailVerified: string | null
          id: string
          image: string | null
          name: string | null
        }
        Insert: {
          email: string
          emailVerified?: string | null
          id: string
          image?: string | null
          name?: string | null
        }
        Update: {
          email?: string
          emailVerified?: string | null
          id?: string
          image?: string | null
          name?: string | null
        }
        Relationships: []
      }
      waiver: {
        Row: {
          alcohol_abuse: string | null
          city: string
          company: string | null
          created_at: string | null
          email: string
          felony: string | null
          first_name: string
          handgun_experience: string | null
          id: number
          information_accurate: boolean
          last_name: string
          mental_illness: string | null
          misdemeanor: string | null
          narcotics: string | null
          occupation: string | null
          phone: string
          rifle_experience: string | null
          safety_rules: boolean
          shotgun_experience: string | null
          signature: string
          special_offers: boolean | null
          state: string
          status: string | null
          street: string
          work_phone: string | null
          zip: string
        }
        Insert: {
          alcohol_abuse?: string | null
          city: string
          company?: string | null
          created_at?: string | null
          email: string
          felony?: string | null
          first_name: string
          handgun_experience?: string | null
          id?: number
          information_accurate: boolean
          last_name: string
          mental_illness?: string | null
          misdemeanor?: string | null
          narcotics?: string | null
          occupation?: string | null
          phone: string
          rifle_experience?: string | null
          safety_rules: boolean
          shotgun_experience?: string | null
          signature: string
          special_offers?: boolean | null
          state: string
          status?: string | null
          street: string
          work_phone?: string | null
          zip: string
        }
        Update: {
          alcohol_abuse?: string | null
          city?: string
          company?: string | null
          created_at?: string | null
          email?: string
          felony?: string | null
          first_name?: string
          handgun_experience?: string | null
          id?: number
          information_accurate?: boolean
          last_name?: string
          mental_illness?: string | null
          misdemeanor?: string | null
          narcotics?: string | null
          occupation?: string | null
          phone?: string
          rifle_experience?: string | null
          safety_rules?: boolean
          shotgun_experience?: string | null
          signature?: string
          special_offers?: boolean | null
          state?: string
          status?: string | null
          street?: string
          work_phone?: string | null
          zip?: string
        }
        Relationships: []
      }
      weekly_agenda: {
        Row: {
          column_name: string
          created_at: string | null
          created_by: string | null
          id: number
          title: string
          updated_at: string | null
        }
        Insert: {
          column_name: string
          created_at?: string | null
          created_by?: string | null
          id?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          column_name?: string
          created_at?: string | null
          created_by?: string | null
          id?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      weekly_agenda_columns: {
        Row: {
          created_at: string | null
          id: number
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_bi_weekly_vacation_time: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      append_user_to_read_by: {
        Args: {
          p_group_chat_id: number
          p_user_id: string
        }
        Returns: undefined
      }
      array_append_unique: {
        Args: {
          arr: string[]
          elem: string
        }
        Returns: string[]
      }
      array_append_unique_text: {
        Args: {
          arr: string[]
          elem: string
        }
        Returns: string[]
      }
      calculate_available_sick_time: {
        Args: {
          p_emp_id: number
        }
        Returns: number
      }
      calculate_available_vacation_time: {
        Args: {
          p_emp_id: number
        }
        Returns: number
      }
      calculate_future_bookings: {
        Args: {
          p_emp_id: number
          p_year: number
        }
        Returns: number
      }
      calculate_monthly_revenue: {
        Args: {
          start_date: string
          end_date: string
        }
        Returns: {
          month: string
          gross_revenue: number
          net_revenue: number
        }[]
      }
      calculate_schedule_hours: {
        Args: {
          p_emp_id: number
          p_start_date: string
          p_end_date: string
        }
        Returns: number
      }
      calculate_total_dros: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_dros: number
        }[]
      }
      count_unread_direct_messages: {
        Args: {
          user_id: string
        }
        Returns: {
          receiver_id: string
          unread_count: number
        }[]
      }
      deduct_sick_time: {
        Args: {
          p_emp_id: number
          p_start_date: string
          p_end_date: string
        }
        Returns: undefined
      }
      deduct_vacation_time: {
        Args: {
          p_emp_id: number
          p_start_date: string
          p_end_date: string
          p_use_vacation_time: boolean
        }
        Returns: undefined
      }
      fetch_aggregated_sales_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          category_label: string
          total_sales: number
        }[]
      }
      fetch_sales_data: {
        Args: {
          page_index: number
          page_size: number
          filters: Json
          sorting: Json
        }
        Returns: {
          id: number
          Lanid: string
          Invoice: number
          Sku: string
          Desc: string
          SoldPrice: number
          SoldQty: number
          Cost: number
          Acct: number
          Date: string
          Disc: number
          Type: string
          Spiff: number
          Last: string
          LastName: string
          Legacy: string
          Stloc: number
          Cat: number
          Sub: number
          Mfg: string
          CustType: string
          category_label: string
          subcategory_label: string
          status: string
          total_count: number
        }[]
      }
      generate_all_schedules: {
        Args: {
          weeks: number
        }
        Returns: {
          schedules_created: number
          employees_processed: number
        }[]
      }
      generate_schedules_for_all_employees:
        | {
            Args: Record<PropertyKey, never>
            Returns: undefined
          }
        | {
            Args: {
              weeks: number
            }
            Returns: {
              schedules_created: number
              employees_processed: number
            }[]
          }
      generate_schedules_for_employees_by_name: {
        Args: {
          employee_name: string
          weeks: number
        }
        Returns: undefined
      }
      get_all_employee_sick_time_usage: {
        Args: Record<PropertyKey, never>
        Returns: {
          employee_id: number
          name: string
          available_sick_time: number
          used_sick_time: number
          used_dates: string[]
          hours_per_date: number[]
        }[]
      }
      get_all_employee_vacation_time_usage: {
        Args: Record<PropertyKey, never>
        Returns: {
          employee_id: number
          name: string
          available_vacation_time: number
          used_vacation_time: number
          used_dates: string[]
          hours_per_date: number[]
        }[]
      }
      get_all_sick_time_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          employee_id: number
          employee_name: string
          available_sick_time: number
        }[]
      }
      get_employee_sick_time_usage: {
        Args: {
          p_emp_id: number
        }
        Returns: {
          used_date: string
          hours_deducted: number
        }[]
      }
      get_future_vacation_usage: {
        Args: {
          p_employee_id: number
        }
        Returns: {
          year: number
          hours_approved: number
          estimated_balance: number
        }[]
      }
      get_timesheet_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: number
          employee_id: number
          name: string
          event_date: string
          start_time: string
          end_time: string
          lunch_start: string
          lunch_end: string
          stored_total_hours: unknown
          calculated_total_hours: unknown
          scheduled_hours: number
          sick_time_usage: number
          vacation_time_usage: number
          regular_time: number
          overtime: number
          available_sick_time: number
          total_hours_with_sick: number
        }[]
      }
      http: {
        Args: {
          request: Database["public"]["CompositeTypes"]["http_request"]
        }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete:
        | {
            Args: {
              uri: string
            }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
          }
        | {
            Args: {
              uri: string
              content: string
              content_type: string
            }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
          }
      http_get:
        | {
            Args: {
              uri: string
            }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
          }
        | {
            Args: {
              uri: string
              data: Json
            }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
          }
      http_head: {
        Args: {
          uri: string
        }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: {
          field: string
          value: string
        }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: {
          uri: string
          content: string
          content_type: string
        }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post:
        | {
            Args: {
              uri: string
              content: string
              content_type: string
            }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
          }
        | {
            Args: {
              uri: string
              data: Json
            }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
          }
      http_put: {
        Args: {
          uri: string
          content: string
          content_type: string
        }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: {
          curlopt: string
          value: string
        }
        Returns: boolean
      }
      is_dev_or_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      mark_messages_as_read: {
        Args: {
          user_id: string
        }
        Returns: undefined
      }
      pre_allocate_next_year_vacation: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      recalculate_all_vacation_time: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      recalculate_vacation_time: {
        Args: {
          p_emp_id: number
        }
        Returns: number
      }
      reconcile_hours: {
        Args: {
          p_employee_id: number
          p_event_date: string
          p_hours_to_reconcile: number
        }
        Returns: {
          id: number
          employee_id: number
          name: string
          event_date: string
          start_time: string
          end_time: string
          lunch_start: string
          lunch_end: string
          calculated_total_hours: unknown
          scheduled_hours: number
          sick_time_usage: number
          vacation_time_usage: number
          regular_time: number
          overtime: number
          available_sick_time: number
        }[]
      }
      request_future_vacation: {
        Args: {
          p_emp_id: number
          p_start_date: string
          p_end_date: string
        }
        Returns: number
      }
      requesting_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      reset_sick_time_usage:
        | {
            Args: Record<PropertyKey, never>
            Returns: undefined
          }
        | {
            Args: {
              p_employee_id: number
            }
            Returns: undefined
          }
      reset_vacation_time: {
        Args: {
          p_emp_id: number
          p_new_vacation_time?: number
        }
        Returns: undefined
      }
      reverse_vacation_time_deduction: {
        Args: {
          p_emp_id: number
          p_start_date: string
          p_end_date: string
        }
        Returns: undefined
      }
      set_initial_vacation_time: {
        Args: {
          p_employee_id: number
          p_initial_hours: number
        }
        Returns: undefined
      }
      update_all_employees_sick_time: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      urlencode:
        | {
            Args: {
              data: Json
            }
            Returns: string
          }
        | {
            Args: {
              string: string
            }
            Returns: string
          }
        | {
            Args: {
              string: string
            }
            Returns: string
          }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
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
