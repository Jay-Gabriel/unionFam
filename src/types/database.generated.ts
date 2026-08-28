export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string
          avatar_url: string | null
          locale: string
          timezone: string
          onboarding_status: string
          consented_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string
          avatar_url?: string | null
          locale?: string
          timezone?: string
          onboarding_status?: string
          consented_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          avatar_url?: string | null
          locale?: string
          timezone?: string
          onboarding_status?: string
          consented_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      question_flow_versions: {
        Row: {
          id: string
          code: string
          version_no: number
          name: string
          status: string
          schema_version: number
          checksum: string
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          version_no: number
          name: string
          status?: string
          schema_version?: number
          checksum?: string
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          version_no?: number
          name?: string
          status?: string
          schema_version?: number
          checksum?: string
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          flow_version_id: string
          question_key: string
          title: string
          helper_text: string | null
          answer_type: string
          options: Json
          branch_rules: Json
          ordinal: number
          is_required: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          flow_version_id: string
          question_key: string
          title: string
          helper_text?: string | null
          answer_type: string
          options?: Json
          branch_rules?: Json
          ordinal?: number
          is_required?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          flow_version_id?: string
          question_key?: string
          title?: string
          helper_text?: string | null
          answer_type?: string
          options?: Json
          branch_rules?: Json
          ordinal?: number
          is_required?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_answers: {
        Row: {
          id: string
          user_id: string
          flow_version_id: string
          question_id: string
          answer: Json
          idempotency_key: string | null
          answered_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          flow_version_id: string
          question_id: string
          answer: Json
          idempotency_key?: string | null
          answered_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          flow_version_id?: string
          question_id?: string
          answer?: Json
          idempotency_key?: string | null
          answered_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          title: string
          status: string
          current_stage: string
          prompt_version: string
          question_flow_version_id: string | null
          last_message_at: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title?: string
          status?: string
          current_stage?: string
          prompt_version?: string
          question_flow_version_id?: string | null
          last_message_at?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          status?: string
          current_stage?: string
          prompt_version?: string
          question_flow_version_id?: string | null
          last_message_at?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          user_id: string
          conversation_id: string
          role: string
          content: string
          status: string
          sequence_no: number
          idempotency_key: string | null
          provider_message_id: string | null
          prompt_version: string | null
          prompt_tokens: number | null
          completion_tokens: number | null
          error_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          conversation_id: string
          role: string
          content: string
          status?: string
          sequence_no: number
          idempotency_key?: string | null
          provider_message_id?: string | null
          prompt_version?: string | null
          prompt_tokens?: number | null
          completion_tokens?: number | null
          error_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          conversation_id?: string
          role?: string
          content?: string
          status?: string
          sequence_no?: number
          idempotency_key?: string | null
          provider_message_id?: string | null
          prompt_version?: string | null
          prompt_tokens?: number | null
          completion_tokens?: number | null
          error_code?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_statements: {
        Row: {
          id: string
          user_id: string
          conversation_id: string
          message_id: string
          content: string
          statement_type: string
          dimension: string | null
          captured_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          conversation_id: string
          message_id: string
          content: string
          statement_type?: string
          dimension?: string | null
          captured_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          conversation_id?: string
          message_id?: string
          content?: string
          statement_type?: string
          dimension?: string | null
          captured_at?: string
          deleted_at?: string | null
        }
      }
      ai_observations: {
        Row: {
          id: string
          user_id: string
          conversation_id: string
          assistant_message_id: string | null
          observation_type: string
          dimension: string
          content_original: string
          content_user_edited: string | null
          confidence: number
          status: string
          decision_at: string | null
          decision_idempotency_key: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          conversation_id: string
          assistant_message_id?: string | null
          observation_type?: string
          dimension: string
          content_original: string
          content_user_edited?: string | null
          confidence?: number
          status?: string
          decision_at?: string | null
          decision_idempotency_key?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          conversation_id?: string
          assistant_message_id?: string | null
          observation_type?: string
          dimension?: string
          content_original?: string
          content_user_edited?: string | null
          confidence?: number
          status?: string
          decision_at?: string | null
          decision_idempotency_key?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      confirmed_insights: {
        Row: {
          id: string
          user_id: string
          source_observation_id: string | null
          insight_type: string
          dimension: string
          content: string
          evidence_message_ids: string[] | null
          confirmed_at: string
          superseded_by_id: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          source_observation_id?: string | null
          insight_type?: string
          dimension: string
          content: string
          evidence_message_ids?: string[] | null
          confirmed_at?: string
          superseded_by_id?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          source_observation_id?: string | null
          insight_type?: string
          dimension?: string
          content?: string
          evidence_message_ids?: string[] | null
          confirmed_at?: string
          superseded_by_id?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: string
          granted_by: string | null
          granted_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role?: string
          granted_by?: string | null
          granted_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          granted_by?: string | null
          granted_at?: string
        }
      }
    }
    Functions: {
      decide_observation_atomic: {
        Args: {
          p_observation_id: string
          p_decision: string
          p_edited_content?: string
          p_idempotency_key?: string
        }
        Returns: Json
      }
      is_admin: {
        Args: {
          p_user_id: string
        }
        Returns: boolean
      }
    }
  }
}
