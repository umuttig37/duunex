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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_revenue_tracking: {
        Row: {
          collection_date: string | null
          created_at: string | null
          effective_fee_percentage: number | null
          id: string
          original_task_budget: number | null
          payment_id: string
          payment_status: string
          platform_fee_collected: number
          revenue_category: string | null
          revenue_processing_notes: string | null
          task_id: string
          tasker_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          collection_date?: string | null
          created_at?: string | null
          effective_fee_percentage?: number | null
          id?: string
          original_task_budget?: number | null
          payment_id: string
          payment_status: string
          platform_fee_collected: number
          revenue_category?: string | null
          revenue_processing_notes?: string | null
          task_id: string
          tasker_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          collection_date?: string | null
          created_at?: string | null
          effective_fee_percentage?: number | null
          id?: string
          original_task_budget?: number | null
          payment_id?: string
          payment_status?: string
          platform_fee_collected?: number
          revenue_category?: string | null
          revenue_processing_notes?: string | null
          task_id?: string
          tasker_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_revenue_tracking_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: true
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_revenue_tracking_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "pending_review_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_revenue_tracking_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_revenue_tracking_tasker_id_fkey"
            columns: ["tasker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_revenue_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      balance_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          payment_id: string | null
          task_id: string | null
          tasker_id: string
          transaction_type: string
          withdrawal_request_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          payment_id?: string | null
          task_id?: string | null
          tasker_id: string
          transaction_type: string
          withdrawal_request_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          payment_id?: string | null
          task_id?: string | null
          tasker_id?: string
          transaction_type?: string
          withdrawal_request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "balance_transactions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balance_transactions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "pending_review_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balance_transactions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balance_transactions_tasker_id_fkey"
            columns: ["tasker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balance_transactions_withdrawal_request_id_fkey"
            columns: ["withdrawal_request_id"]
            isOneToOne: false
            referencedRelation: "withdrawal_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_account_info: {
        Row: {
          account_holder_name: string
          bank_name: string | null
          bic: string
          created_at: string | null
          iban: string
          id: string
          is_verified: boolean | null
          tasker_id: string
          updated_at: string | null
        }
        Insert: {
          account_holder_name: string
          bank_name?: string | null
          bic: string
          created_at?: string | null
          iban: string
          id?: string
          is_verified?: boolean | null
          tasker_id: string
          updated_at?: string | null
        }
        Update: {
          account_holder_name?: string
          bank_name?: string | null
          bic?: string
          created_at?: string | null
          iban?: string
          id?: string
          is_verified?: boolean | null
          tasker_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_account_info_tasker_id_fkey"
            columns: ["tasker_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          description_fi: string | null
          icon_url: string | null
          id: string
          name: string
          name_en: string | null
          name_fi: string
          parent_category_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_fi?: string | null
          icon_url?: string | null
          id?: string
          name: string
          name_en?: string | null
          name_fi: string
          parent_category_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_fi?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          name_en?: string | null
          name_fi?: string
          parent_category_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_specific_questions: {
        Row: {
          category_id: string
          created_at: string
          display_order: number
          helper_text_en: string | null
          helper_text_fi: string | null
          id: string
          is_required: boolean
          options_en: Json | null
          options_fi: Json | null
          question_text_en: string | null
          question_text_fi: string
          question_type: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          display_order?: number
          helper_text_en?: string | null
          helper_text_fi?: string | null
          id?: string
          is_required?: boolean
          options_en?: Json | null
          options_fi?: Json | null
          question_text_en?: string | null
          question_text_fi: string
          question_type: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          display_order?: number
          helper_text_en?: string | null
          helper_text_fi?: string | null
          id?: string
          is_required?: boolean
          options_en?: Json | null
          options_fi?: Json | null
          question_text_en?: string | null
          question_text_fi?: string
          question_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_specific_questions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          is_read: boolean | null
          message_type: Database["public"]["Enums"]["message_type"] | null
          receiver_profile_id: string
          sender_profile_id: string
          task_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          message_type?: Database["public"]["Enums"]["message_type"] | null
          receiver_profile_id: string
          sender_profile_id: string
          task_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          message_type?: Database["public"]["Enums"]["message_type"] | null
          receiver_profile_id?: string
          sender_profile_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_profile_id_fkey"
            columns: ["receiver_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "pending_review_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          recipient_id: string
          related_offer_id: string | null
          related_task_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          recipient_id: string
          related_offer_id?: string | null
          related_task_id?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          recipient_id?: string
          related_offer_id?: string | null
          related_task_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_offer_id_fkey"
            columns: ["related_offer_id"]
            isOneToOne: false
            referencedRelation: "task_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_offer_id_fkey"
            columns: ["related_offer_id"]
            isOneToOne: false
            referencedRelation: "task_offers_with_counter_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_task_id_fkey"
            columns: ["related_task_id"]
            isOneToOne: false
            referencedRelation: "pending_review_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_task_id_fkey"
            columns: ["related_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      overdue_task_actions: {
        Row: {
          action_notes: string | null
          action_taken_at: string | null
          action_type: string
          hours_overdue: number
          id: string
          new_status: string | null
          notification_sent: boolean | null
          overdue_type: string
          previous_status: string
          task_id: string
        }
        Insert: {
          action_notes?: string | null
          action_taken_at?: string | null
          action_type: string
          hours_overdue: number
          id?: string
          new_status?: string | null
          notification_sent?: boolean | null
          overdue_type: string
          previous_status: string
          task_id: string
        }
        Update: {
          action_notes?: string | null
          action_taken_at?: string | null
          action_type?: string
          hours_overdue?: number
          id?: string
          new_status?: string | null
          notification_sent?: boolean | null
          overdue_type?: string
          previous_status?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "overdue_task_actions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "pending_review_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "overdue_task_actions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          fee_calculation_method: string | null
          id: string
          is_fee_processed: boolean | null
          offer_id: string | null
          original_amount: number | null
          paytrail_transaction_id: string | null
          platform_fee_amount: number | null
          platform_fee_percentage: number | null
          processed_at: string | null
          provider: string
          raw_response: Json | null
          status: string
          task_id: string
          tasker_payout_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          fee_calculation_method?: string | null
          id?: string
          is_fee_processed?: boolean | null
          offer_id?: string | null
          original_amount?: number | null
          paytrail_transaction_id?: string | null
          platform_fee_amount?: number | null
          platform_fee_percentage?: number | null
          processed_at?: string | null
          provider?: string
          raw_response?: Json | null
          status?: string
          task_id: string
          tasker_payout_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          fee_calculation_method?: string | null
          id?: string
          is_fee_processed?: boolean | null
          offer_id?: string | null
          original_amount?: number | null
          paytrail_transaction_id?: string | null
          platform_fee_amount?: number | null
          platform_fee_percentage?: number | null
          processed_at?: string | null
          provider?: string
          raw_response?: Json | null
          status?: string
          task_id?: string
          tasker_payout_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "task_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "task_offers_with_counter_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "pending_review_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          email: string | null
          email_notifications: boolean | null
          first_name: string | null
          id: string
          is_verified: boolean
          last_name: string | null
          location: unknown | null
          marketing_messages: boolean | null
          phone_number: string | null
          public_profile: boolean | null
          push_notifications: boolean | null
          role: string
          show_contact_info: boolean | null
          show_location: boolean | null
          suspended: boolean | null
          updated_at: string | null
          zipcode: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          email_notifications?: boolean | null
          first_name?: string | null
          id: string
          is_verified?: boolean
          last_name?: string | null
          location?: unknown | null
          marketing_messages?: boolean | null
          phone_number?: string | null
          public_profile?: boolean | null
          push_notifications?: boolean | null
          role: string
          show_contact_info?: boolean | null
          show_location?: boolean | null
          suspended?: boolean | null
          updated_at?: string | null
          zipcode?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          email_notifications?: boolean | null
          first_name?: string | null
          id?: string
          is_verified?: boolean
          last_name?: string | null
          location?: unknown | null
          marketing_messages?: boolean | null
          phone_number?: string | null
          public_profile?: boolean | null
          push_notifications?: boolean | null
          role?: string
          show_contact_info?: boolean | null
          show_location?: boolean | null
          suspended?: boolean | null
          updated_at?: string | null
          zipcode?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          reviewee_profile_id: string
          reviewer_profile_id: string
          task_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          reviewee_profile_id: string
          reviewer_profile_id: string
          task_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          reviewee_profile_id?: string
          reviewer_profile_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reviewee_profile_id_fkey"
            columns: ["reviewee_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_profile_id_fkey"
            columns: ["reviewer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "pending_review_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_id: string | null
          admin_response: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          admin_response?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_id?: string | null
          admin_response?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_approvals: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          task_id: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          task_id: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_approvals_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_approvals_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
            referencedRelation: "pending_review_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_approvals_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_attachments: {
        Row: {
          created_at: string | null
          file_type: string | null
          file_url: string
          id: string
          task_id: string
        }
        Insert: {
          created_at?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          task_id: string
        }
        Update: {
          created_at?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "pending_review_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_offers: {
        Row: {
          counter_offer_reason: string | null
          created_at: string | null
          id: string
          is_counter_offer: boolean | null
          message: string | null
          offered_price: number
          original_offer_id: string | null
          original_offered_price: number | null
          proposed_date: string | null
          proposed_time_slot: string | null
          status: string
          task_id: string
          tasker_id: string
          updated_at: string | null
        }
        Insert: {
          counter_offer_reason?: string | null
          created_at?: string | null
          id?: string
          is_counter_offer?: boolean | null
          message?: string | null
          offered_price: number
          original_offer_id?: string | null
          original_offered_price?: number | null
          proposed_date?: string | null
          proposed_time_slot?: string | null
          status?: string
          task_id: string
          tasker_id: string
          updated_at?: string | null
        }
        Update: {
          counter_offer_reason?: string | null
          created_at?: string | null
          id?: string
          is_counter_offer?: boolean | null
          message?: string | null
          offered_price?: number
          original_offer_id?: string | null
          original_offered_price?: number | null
          proposed_date?: string | null
          proposed_time_slot?: string | null
          status?: string
          task_id?: string
          tasker_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_offers_original_offer_id_fkey"
            columns: ["original_offer_id"]
            isOneToOne: false
            referencedRelation: "task_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_offers_original_offer_id_fkey"
            columns: ["original_offer_id"]
            isOneToOne: false
            referencedRelation: "task_offers_with_counter_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_offers_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "pending_review_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_offers_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_offers_tasker_id_fkey"
            columns: ["tasker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_specific_answers: {
        Row: {
          answer_value: Json
          created_at: string
          id: string
          question_id: string
          task_id: string
          updated_at: string
        }
        Insert: {
          answer_value: Json
          created_at?: string
          id?: string
          question_id: string
          task_id: string
          updated_at?: string
        }
        Update: {
          answer_value?: Json
          created_at?: string
          id?: string
          question_id?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_specific_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "category_specific_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_specific_answers_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "pending_review_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_specific_answers_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          category_id: string | null
          created_at: string | null
          description_en: string | null
          description_fi: string | null
          id: string
          is_active: boolean | null
          keywords_en: string[] | null
          keywords_fi: string[] | null
          name_en: string | null
          name_fi: string
          popularity_score: number | null
          questions: Json
          subcategory_id: string | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description_en?: string | null
          description_fi?: string | null
          id?: string
          is_active?: boolean | null
          keywords_en?: string[] | null
          keywords_fi?: string[] | null
          name_en?: string | null
          name_fi: string
          popularity_score?: number | null
          questions?: Json
          subcategory_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description_en?: string | null
          description_fi?: string | null
          id?: string
          is_active?: boolean | null
          keywords_en?: string[] | null
          keywords_fi?: string[] | null
          name_en?: string | null
          name_fi?: string
          popularity_score?: number | null
          questions?: Json
          subcategory_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_templates_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      tasker_applications: {
        Row: {
          id: string
          profile_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string | null
        }
        Insert: {
          id?: string
          profile_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
        }
        Update: {
          id?: string
          profile_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasker_applications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasker_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasker_balance: {
        Row: {
          created_at: string | null
          current_balance: number
          id: string
          pending_withdrawals: number
          tasker_id: string
          total_earned: number
          total_withdrawn: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_balance?: number
          id?: string
          pending_withdrawals?: number
          tasker_id: string
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_balance?: number
          id?: string
          pending_withdrawals?: number
          tasker_id?: string
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasker_balance_tasker_id_fkey"
            columns: ["tasker_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasker_categories: {
        Row: {
          category_id: string
          profile_id: string
        }
        Insert: {
          category_id: string
          profile_id: string
        }
        Update: {
          category_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasker_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasker_categories_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasker_details: {
        Row: {
          availability_schedule: Json | null
          hourly_rate: number
          location: unknown
          profile_id: string
          service_radius_meters: number
        }
        Insert: {
          availability_schedule?: Json | null
          hourly_rate: number
          location: unknown
          profile_id: string
          service_radius_meters: number
        }
        Update: {
          availability_schedule?: Json | null
          hourly_rate?: number
          location?: unknown
          profile_id?: string
          service_radius_meters?: number
        }
        Relationships: [
          {
            foreignKeyName: "tasker_details_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_tasker_id: string | null
          budget: number | null
          category_id: string | null
          created_at: string
          description: string
          id: string
          image_url: string | null
          latitude: number | null
          location_coordinates: unknown | null
          location_text: string
          longitude: number | null
          posting_type: string | null
          scheduled_date: string | null
          scheduled_time_slot: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_tasker_id?: string | null
          budget?: number | null
          category_id?: string | null
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          latitude?: number | null
          location_coordinates?: unknown | null
          location_text: string
          longitude?: number | null
          posting_type?: string | null
          scheduled_date?: string | null
          scheduled_time_slot?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_tasker_id?: string | null
          budget?: number | null
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          latitude?: number | null
          location_coordinates?: unknown | null
          location_text?: string
          longitude?: number | null
          posting_type?: string | null
          scheduled_date?: string | null
          scheduled_time_slot?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_tasker_id_fkey"
            columns: ["assigned_tasker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_transactions: {
        Row: {
          amount: number | null
          created_at: string | null
          description: string | null
          id: string
          task_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          task_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          task_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_transactions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "pending_review_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_transactions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          completed_at: string | null
          created_at: string | null
          id: string
          processed_at: string | null
          processed_by: string | null
          request_message: string | null
          status: string | null
          tasker_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          request_message?: string | null
          status?: string | null
          tasker_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          request_message?: string | null
          status?: string | null
          tasker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_requests_tasker_id_fkey"
            columns: ["tasker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_task_approval_stats: {
        Row: {
          approved_count: number | null
          approved_this_week: number | null
          avg_approval_time_hours: number | null
          pending_count: number | null
          pending_today: number | null
        }
        Relationships: []
      }
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown | null
          f_table_catalog: unknown | null
          f_table_name: unknown | null
          f_table_schema: unknown | null
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown | null
          f_table_catalog: string | null
          f_table_name: unknown | null
          f_table_schema: unknown | null
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown | null
          f_table_catalog?: string | null
          f_table_name?: unknown | null
          f_table_schema?: unknown | null
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown | null
          f_table_catalog?: string | null
          f_table_name?: unknown | null
          f_table_schema?: unknown | null
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      pending_review_tasks: {
        Row: {
          budget: number | null
          category_id: string | null
          category_name: string | null
          created_at: string | null
          description: string | null
          email: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          location: string | null
          scheduled_date: string | null
          title: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      safe_spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number | null
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number | null
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number | null
          srtext?: string | null
        }
        Relationships: []
      }
      task_offers_with_counter_info: {
        Row: {
          counter_offer_message: string | null
          counter_offer_price: number | null
          created_at: string | null
          id: string | null
          message: string | null
          offered_price: number | null
          status: string | null
          task_id: string | null
          task_owner_id: string | null
          task_title: string | null
          tasker_first_name: string | null
          tasker_id: string | null
          tasker_last_name: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_offers_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "pending_review_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_offers_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_offers_tasker_id_fkey"
            columns: ["tasker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["task_owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      _postgis_scripts_pgsql_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_bestsrid: {
        Args: { "": unknown }
        Returns: number
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_covers: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_pointoutside: {
        Args: { "": unknown }
        Returns: unknown
      }
      _st_sortablehash: {
        Args: { geom: unknown }
        Returns: number
      }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      accept_offer_and_create_payment: {
        Args: {
          p_amount: number
          p_offer_id: string
          p_payment_id: string
          p_user_id: string
        }
        Returns: Json
      }
      add_tasker_details: {
        Args: {
          p_availability_schedule: string
          p_hourly_rate: number
          p_latitude: number
          p_longitude: number
          p_profile_id: string
          p_service_radius_meters: number
        }
        Returns: undefined
      }
      addauth: {
        Args: { "": string }
        Returns: boolean
      }
      addgeometrycolumn: {
        Args:
          | {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
          | {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
          | {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
        Returns: string
      }
      audit_rls_policies: {
        Args: Record<PropertyKey, never>
        Returns: {
          policy_count: number
          rls_enabled: boolean
          table_name: string
        }[]
      }
      box: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box2d: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box2d_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2d_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2df_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2df_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3d: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box3d_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3d_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3dtobox: {
        Args: { "": unknown }
        Returns: unknown
      }
      bytea: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      calculate_payment_fees_3_percent: {
        Args: {
          calculation_method?: string
          fee_percentage?: number
          original_amount: number
        }
        Returns: {
          effective_fee_percentage: number
          platform_fee_amount: number
          tasker_receives_amount: number
          user_pays_amount: number
        }[]
      }
      can_view_task: {
        Args: { task_id: string; user_id: string }
        Returns: boolean
      }
      create_counter_offer: {
        Args: {
          counter_message?: string
          counter_reason: string
          new_price: number
          original_offer_id_param: string
        }
        Returns: string
      }
      create_missing_balance_records: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_notification: {
        Args: {
          message: string
          recipient_id: string
          related_offer_id?: string
          related_task_id?: string
          title: string
          type: string
        }
        Returns: string
      }
      create_overdue_task_actions: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      create_task_approval_record: {
        Args: { p_task_id: string }
        Returns: undefined
      }
      create_withdrawal_request_with_deduction: {
        Args: {
          p_amount: number
          p_request_message?: string
          p_tasker_id: string
        }
        Returns: string
      }
      delete_non_admin_users: {
        Args: { admin_user_id: string }
        Returns: number
      }
      disablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      dropgeometrycolumn: {
        Args:
          | {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
          | { column_name: string; schema_name: string; table_name: string }
          | { column_name: string; table_name: string }
        Returns: string
      }
      dropgeometrytable: {
        Args:
          | { catalog_name: string; schema_name: string; table_name: string }
          | { schema_name: string; table_name: string }
          | { table_name: string }
        Returns: string
      }
      enablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      find_nearby_taskers: {
        Args:
          | {
              category_id?: string
              radius_km?: number
              task_lat: number
              task_lng: number
            }
          | {
              search_radius_meters: number
              target_category_id: string
              task_lat: number
              task_lon: number
            }
        Returns: {
          avatar_url: string
          bio: string
          distance_meters: number
          email: string
          first_name: string
          hourly_rate: number
          is_available: boolean
          last_name: string
          profile_id: string
          verified_at: string
        }[]
      }
      fix_missing_earnings_transactions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      fix_pending_withdrawal_amounts: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      fix_tasker_balances: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      generate_test_payment_data: {
        Args: { num_records?: number }
        Returns: string
      }
      geography: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      geography_analyze: {
        Args: { "": unknown }
        Returns: boolean
      }
      geography_gist_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_gist_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_send: {
        Args: { "": unknown }
        Returns: string
      }
      geography_spgist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      geography_typmod_out: {
        Args: { "": number }
        Returns: unknown
      }
      geometry: {
        Args:
          | { "": string }
          | { "": string }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
        Returns: unknown
      }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_analyze: {
        Args: { "": unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gist_compress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_decompress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_decompress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_sortsupport_2d: {
        Args: { "": unknown }
        Returns: undefined
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_hash: {
        Args: { "": unknown }
        Returns: number
      }
      geometry_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_recv: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_send: {
        Args: { "": unknown }
        Returns: string
      }
      geometry_sortsupport: {
        Args: { "": unknown }
        Returns: undefined
      }
      geometry_spgist_compress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_spgist_compress_3d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_spgist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      geometry_typmod_out: {
        Args: { "": number }
        Returns: unknown
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometrytype: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      geomfromewkb: {
        Args: { "": string }
        Returns: unknown
      }
      geomfromewkt: {
        Args: { "": string }
        Returns: unknown
      }
      get_admin_payment_dashboard_metrics: {
        Args: { time_period?: string }
        Returns: {
          avg_payment_amount: number
          avg_platform_fee_amount: number
          failed_user_payment_count: number
          failed_user_payments: number
          pending_platform_revenue: number
          pending_tasker_payouts: number
          pending_user_payment_count: number
          pending_user_payments: number
          platform_fee_percentage: number
          platform_revenue_count: number
          recent_transactions: number
          revenue_growth_rate: number
          tasker_payout_count: number
          total_platform_revenue: number
          total_tasker_payouts: number
          total_user_payments: number
          unprocessed_payments: number
          user_payment_count: number
        }[]
      }
      get_available_tasks_for_tasker: {
        Args: { radius_km?: number; tasker_id: string }
        Returns: {
          budget: number
          category_name: string
          created_at: string
          description: string
          distance_meters: number
          id: string
          location_text: string
          title: string
          user_name: string
        }[]
      }
      get_balance_overview_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_taskers: number
          total_completed_withdrawals: number
          total_pending_withdrawals: number
          total_tasker_earnings: number
        }[]
      }
      get_enhanced_payment_statistics: {
        Args: { time_period?: string }
        Returns: {
          avg_transaction_amount: number
          failed_count: number
          growth_rate: number
          paid_count: number
          pending_count: number
          recent_transactions: number
          refunded_count: number
          total_failed: number
          total_paid: number
          total_pending: number
          total_refunded: number
        }[]
      }
      get_enhanced_payment_statistics_with_revenue: {
        Args: { time_period?: string }
        Returns: {
          avg_service_fee_percentage: number
          avg_transaction_amount: number
          failed_count: number
          growth_rate: number
          paid_count: number
          pending_count: number
          pending_withdrawals_amount: number
          pending_withdrawals_count: number
          platform_revenue: number
          recent_transactions: number
          refunded_count: number
          revenue_growth_rate: number
          total_failed: number
          total_paid: number
          total_pending: number
          total_refunded: number
          total_tasker_payouts: number
          total_withdrawals_processed: number
          withdrawal_processing_count: number
        }[]
      }
      get_open_tasks_for_map: {
        Args: Record<PropertyKey, never>
        Returns: {
          budget: number
          category_id: string
          category_name_fi: string
          created_at: string
          description: string
          id: string
          location_coordinates: string
          location_text: string
          scheduled_date: string
          scheduled_time_slot: string
          status: string
          title: string
          user_first_name: string
          user_id: string
          user_last_name: string
          user_profile_id: string
        }[]
      }
      get_overdue_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_overdue_hours: number
          critical_overdue: number
          high_priority_overdue: number
          payment_completion_overdue: number
          response_overdue: number
          review_overdue: number
          scheduling_overdue: number
          start_overdue: number
          task_completion_overdue: number
          total_overdue: number
          total_overdue_value: number
        }[]
      }
      get_overdue_tasks: {
        Args: { grace_period_hours?: number; include_paid_tasks?: boolean }
        Returns: {
          assigned_tasker_id: string
          budget: number
          created_at: string
          overdue_hours: number
          overdue_type: string
          priority_level: string
          scheduled_date: string
          scheduled_time_slot: string
          status: string
          task_id: string
          tasker_email: string
          tasker_name: string
          title: string
          user_email: string
          user_id: string
          user_name: string
        }[]
      }
      get_overdue_tasks_summary: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_payment_health_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          failed_payments_last_hour: number
          high_value_transactions_today: number
          pending_payments_over_24h: number
          suspicious_activity_alerts: number
          system_health_score: number
        }[]
      }
      get_payment_provider_stats: {
        Args: { days_back?: number }
        Returns: {
          avg_amount: number
          provider_name: string
          success_rate: number
          total_amount: number
          transaction_count: number
        }[]
      }
      get_payment_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          failed_count: number
          paid_count: number
          pending_count: number
          refunded_count: number
          total_failed: number
          total_paid: number
          total_pending: number
          total_refunded: number
        }[]
      }
      get_payment_timeline: {
        Args: { days_back?: number }
        Returns: {
          date_bucket: string
          success_rate: number
          total_amount: number
          transaction_count: number
        }[]
      }
      get_pending_task_approval_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_pending_task_approvals_for_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          approval_id: string
          posting_type: string
          submitted_at: string
          task_budget: number
          task_category_name: string
          task_description: string
          task_id: string
          task_location: string
          task_title: string
          user_email: string
          user_name: string
        }[]
      }
      get_platform_performance_metrics: {
        Args: { time_period?: string }
        Returns: {
          active_taskers: number
          avg_task_value: number
          platform_efficiency_score: number
          revenue_per_active_user: number
          total_platform_users: number
          total_tasks_with_payments: number
        }[]
      }
      get_proj4_from_srid: {
        Args: { "": number }
        Returns: string
      }
      get_revenue_analytics: {
        Args: { days_back?: number; group_by_period?: string }
        Returns: {
          avg_revenue_per_transaction: number
          cumulative_revenue: number
          period_end: string
          period_start: string
          total_revenue: number
          transaction_count: number
        }[]
      }
      get_task_final_price: {
        Args: { task_id_param: string }
        Returns: number
      }
      get_task_with_coords: {
        Args: { p_task_id: string }
        Returns: {
          budget: number
          category_id: string
          category_name: string
          created_at: string
          description: string
          id: string
          image_urls: string[]
          latitude: number
          location_coordinates: unknown
          location_text: string
          longitude: number
          publisher_avatar_url: string
          publisher_first_name: string
          publisher_last_name: string
          scheduled_date: string
          scheduled_time_slot: string
          status: string
          title: string
          user_id: string
        }[]
      }
      get_unread_message_count: {
        Args: { user_id_param: string }
        Returns: number
      }
      get_withdrawal_dashboard_statistics: {
        Args: { time_period?: string }
        Returns: {
          active_taskers_with_earnings: number
          avg_processing_time_hours: number
          avg_withdrawal_amount: number
          paid_withdrawals_count: number
          pending_withdrawals_count: number
          rejected_withdrawals_count: number
          revenue_growth_rate: number
          total_paid_withdrawals: number
          total_pending_withdrawals: number
          total_platform_revenue: number
          total_rejected_withdrawals: number
          total_user_payments: number
          user_payments_count: number
          withdrawal_growth_rate: number
        }[]
      }
      get_withdrawal_statistics: {
        Args: { time_period?: string }
        Returns: {
          approved_withdrawal_count: number
          avg_processing_time_hours: number
          completed_withdrawal_count: number
          pending_withdrawal_count: number
          rejected_withdrawal_count: number
          total_approved_withdrawals: number
          total_completed_withdrawals: number
          total_pending_withdrawals: number
          total_rejected_withdrawals: number
          total_withdrawal_volume: number
        }[]
      }
      gettransactionid: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      gidx_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gidx_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      handle_delete_current_user: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      initialize_missing_tasker_balances: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      is_task_publicly_visible: {
        Args: { task_id: string }
        Returns: boolean
      }
      is_valid_withdrawal_status_transition: {
        Args: { current_status: string; new_status: string }
        Returns: boolean
      }
      json: {
        Args: { "": unknown }
        Returns: Json
      }
      jsonb: {
        Args: { "": unknown }
        Returns: Json
      }
      longtransactionsenabled: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      path: {
        Args: { "": unknown }
        Returns: unknown
      }
      perform_complete_balance_sync: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      pgis_asflatgeobuf_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asgeobuf_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asmvt_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asmvt_serialfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_geometry_clusterintersecting_finalfn: {
        Args: { "": unknown }
        Returns: unknown[]
      }
      pgis_geometry_clusterwithin_finalfn: {
        Args: { "": unknown }
        Returns: unknown[]
      }
      pgis_geometry_collect_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_makeline_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_polygonize_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_union_parallel_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_union_parallel_serialfn: {
        Args: { "": unknown }
        Returns: string
      }
      point: {
        Args: { "": unknown }
        Returns: unknown
      }
      polygon: {
        Args: { "": unknown }
        Returns: unknown
      }
      populate_geometry_columns: {
        Args:
          | { tbl_oid: unknown; use_typmod?: boolean }
          | { use_typmod?: boolean }
        Returns: number
      }
      postgis_addbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_dropbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_extensions_upgrade: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_full_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_geos_noop: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_geos_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_getbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_hasbbox: {
        Args: { "": unknown }
        Returns: boolean
      }
      postgis_index_supportfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_lib_build_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_lib_revision: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_lib_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libjson_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_liblwgeom_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libprotobuf_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libxml_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_noop: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_proj_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_build_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_installed: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_released: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_svn_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_typmod_dims: {
        Args: { "": number }
        Returns: number
      }
      postgis_typmod_srid: {
        Args: { "": number }
        Returns: number
      }
      postgis_typmod_type: {
        Args: { "": number }
        Returns: string
      }
      postgis_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_wagyu_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      process_automatic_overdue_actions: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      process_overdue_tasks: {
        Args: Record<PropertyKey, never>
        Returns: {
          action_taken: string
          new_status: string
          notification_sent: boolean
          previous_status: string
          task_id: string
        }[]
      }
      process_payment_with_3_percent_fee: {
        Args: { force_reprocess?: boolean; payment_id: string }
        Returns: Json
      }
      process_pending_payments_with_fees: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      process_task_approval: {
        Args: {
          admin_id: string
          admin_notes?: string
          approval_status: string
          rejection_reason?: string
          task_approval_id: string
        }
        Returns: boolean
      }
      process_withdrawal_request: {
        Args: {
          admin_id: string
          admin_notes?: string
          new_status: string
          request_id: string
        }
        Returns: boolean
      }
      process_withdrawal_request_enhanced: {
        Args: {
          admin_id: string
          admin_notes?: string
          force_approve?: boolean
          new_status: string
          request_id: string
        }
        Returns: Json
      }
      process_withdrawal_with_payment_sync: {
        Args: {
          admin_id: string
          admin_notes?: string
          force_approve?: boolean
          new_status: string
          request_id: string
        }
        Returns: Json
      }
      recalculate_tasker_balance: {
        Args: { p_tasker_id: string }
        Returns: boolean
      }
      respond_to_counter_offer: {
        Args: {
          counter_offer_id_param: string
          new_counter_price?: number
          response_message?: string
          response_status: string
        }
        Returns: string
      }
      scheduled_overdue_processing: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      send_overdue_notifications: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      spheroid_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      spheroid_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlength: {
        Args: { "": unknown }
        Returns: number
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dperimeter: {
        Args: { "": unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle: {
        Args:
          | { line1: unknown; line2: unknown }
          | { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
        Returns: number
      }
      st_area: {
        Args:
          | { "": string }
          | { "": unknown }
          | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_area2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_asbinary: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkb: {
        Args: { "": unknown }
        Returns: string
      }
      st_asewkt: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      st_asgeojson: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; options?: number }
          | { geom: unknown; maxdecimaldigits?: number; options?: number }
          | {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
        Returns: string
      }
      st_asgml: {
        Args:
          | { "": string }
          | {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
          | {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
          | {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
          | { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_ashexewkb: {
        Args: { "": unknown }
        Returns: string
      }
      st_askml: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
          | { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
        Returns: string
      }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: {
        Args: { format?: string; geom: unknown }
        Returns: string
      }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; rel?: number }
          | { geom: unknown; maxdecimaldigits?: number; rel?: number }
        Returns: string
      }
      st_astext: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      st_astwkb: {
        Args:
          | {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
          | {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
        Returns: string
      }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_boundary: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer: {
        Args:
          | { geom: unknown; options?: string; radius: number }
          | { geom: unknown; quadsegs: number; radius: number }
        Returns: unknown
      }
      st_buildarea: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_centroid: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      st_cleangeometry: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_clusterintersecting: {
        Args: { "": unknown[] }
        Returns: unknown[]
      }
      st_collect: {
        Args: { "": unknown[] } | { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collectionextract: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_collectionhomogenize: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_convexhull: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_coorddim: {
        Args: { geometry: unknown }
        Returns: number
      }
      st_coveredby: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_covers: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_dimension: {
        Args: { "": unknown }
        Returns: number
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance: {
        Args:
          | { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
          | { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_distancesphere: {
        Args:
          | { geom1: unknown; geom2: unknown }
          | { geom1: unknown; geom2: unknown; radius: number }
        Returns: number
      }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dump: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumppoints: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumprings: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumpsegments: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_endpoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_envelope: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_expand: {
        Args:
          | { box: unknown; dx: number; dy: number }
          | { box: unknown; dx: number; dy: number; dz?: number }
          | { dm?: number; dx: number; dy: number; dz?: number; geom: unknown }
        Returns: unknown
      }
      st_exteriorring: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_flipcoordinates: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_force2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_force3d: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_forcecollection: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcecurve: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcepolygonccw: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcepolygoncw: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcerhr: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcesfs: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_generatepoints: {
        Args:
          | { area: unknown; npoints: number }
          | { area: unknown; npoints: number; seed: number }
        Returns: unknown
      }
      st_geogfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geogfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geographyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geohash: {
        Args:
          | { geog: unknown; maxchars?: number }
          | { geom: unknown; maxchars?: number }
        Returns: string
      }
      st_geomcollfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomcollfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geometrytype: {
        Args: { "": unknown }
        Returns: string
      }
      st_geomfromewkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromewkt: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromgeojson: {
        Args: { "": Json } | { "": Json } | { "": string }
        Returns: unknown
      }
      st_geomfromgml: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromkml: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfrommarc21: {
        Args: { marc21xml: string }
        Returns: unknown
      }
      st_geomfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromtwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_gmltosql: {
        Args: { "": string }
        Returns: unknown
      }
      st_hasarc: {
        Args: { geometry: unknown }
        Returns: boolean
      }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_isclosed: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_iscollection: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isempty: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_ispolygonccw: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_ispolygoncw: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isring: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_issimple: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isvalid: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
      }
      st_isvalidreason: {
        Args: { "": unknown }
        Returns: string
      }
      st_isvalidtrajectory: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_length: {
        Args:
          | { "": string }
          | { "": unknown }
          | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_length2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_letters: {
        Args: { font?: Json; letters: string }
        Returns: unknown
      }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefrommultipoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_linefromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_linefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linemerge: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_linestringfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_linetocurve: {
        Args: { geometry: unknown }
        Returns: unknown
      }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_m: {
        Args: { "": unknown }
        Returns: number
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { "": unknown[] } | { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makepolygon: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { "": unknown } | { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_maximuminscribedcircle: {
        Args: { "": unknown }
        Returns: Record<string, unknown>
      }
      st_memsize: {
        Args: { "": unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_minimumboundingradius: {
        Args: { "": unknown }
        Returns: Record<string, unknown>
      }
      st_minimumclearance: {
        Args: { "": unknown }
        Returns: number
      }
      st_minimumclearanceline: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_mlinefromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mlinefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpolyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpolyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multi: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_multilinefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multilinestringfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipolyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipolygonfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_ndims: {
        Args: { "": unknown }
        Returns: number
      }
      st_node: {
        Args: { g: unknown }
        Returns: unknown
      }
      st_normalize: {
        Args: { geom: unknown }
        Returns: unknown
      }
      st_npoints: {
        Args: { "": unknown }
        Returns: number
      }
      st_nrings: {
        Args: { "": unknown }
        Returns: number
      }
      st_numgeometries: {
        Args: { "": unknown }
        Returns: number
      }
      st_numinteriorring: {
        Args: { "": unknown }
        Returns: number
      }
      st_numinteriorrings: {
        Args: { "": unknown }
        Returns: number
      }
      st_numpatches: {
        Args: { "": unknown }
        Returns: number
      }
      st_numpoints: {
        Args: { "": unknown }
        Returns: number
      }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_orientedenvelope: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { "": unknown } | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_perimeter2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_pointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_pointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointonsurface: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_points: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_polyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonize: {
        Args: { "": unknown[] }
        Returns: unknown
      }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: string
      }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_reverse: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid: {
        Args: { geog: unknown; srid: number } | { geom: unknown; srid: number }
        Returns: unknown
      }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shiftlongitude: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid: {
        Args: { geog: unknown } | { geom: unknown }
        Returns: number
      }
      st_startpoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_summary: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_transform: {
        Args:
          | { from_proj: string; geom: unknown; to_proj: string }
          | { from_proj: string; geom: unknown; to_srid: number }
          | { geom: unknown; to_proj: string }
        Returns: unknown
      }
      st_triangulatepolygon: {
        Args: { g1: unknown }
        Returns: unknown
      }
      st_union: {
        Args:
          | { "": unknown[] }
          | { geom1: unknown; geom2: unknown }
          | { geom1: unknown; geom2: unknown; gridsize: number }
        Returns: unknown
      }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_wkbtosql: {
        Args: { wkb: string }
        Returns: unknown
      }
      st_wkttosql: {
        Args: { "": string }
        Returns: unknown
      }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      st_x: {
        Args: { "": unknown }
        Returns: number
      }
      st_xmax: {
        Args: { "": unknown }
        Returns: number
      }
      st_xmin: {
        Args: { "": unknown }
        Returns: number
      }
      st_y: {
        Args: { "": unknown }
        Returns: number
      }
      st_ymax: {
        Args: { "": unknown }
        Returns: number
      }
      st_ymin: {
        Args: { "": unknown }
        Returns: number
      }
      st_z: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmax: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmflag: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmin: {
        Args: { "": unknown }
        Returns: number
      }
      sync_tasker_balances: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      test_payment_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          paid_count: number
          total_paid: number
        }[]
      }
      test_task_update_permissions: {
        Args: { test_assigned_tasker_id: string; test_task_id: string }
        Returns: string
      }
      text: {
        Args: { "": unknown }
        Returns: string
      }
      unlockrows: {
        Args: { "": string }
        Returns: number
      }
      update_payment_from_paytrail_callback: {
        Args: {
          new_status: string
          payment_id: string
          paytrail_transaction_id: string
          raw_response?: string
        }
        Returns: Json
      }
      update_tasker_balance_from_payment: {
        Args: {
          payment_id: string
          task_id: string
          tasker_id: string
          transaction_type?: string
        }
        Returns: Json
      }
      update_tasker_location: {
        Args: { latitude: number; longitude: number; tasker_id: string }
        Returns: undefined
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      validate_task_status_transition: {
        Args: { new_status: string; old_status: string }
        Returns: boolean
      }
    }
    Enums: {
      message_type: "text" | "image"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown | null
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown | null
      }
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
      message_type: ["text", "image"],
    },
  },
} as const
