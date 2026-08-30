export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      activity_events: {
        Row: {
          created_at: string
          event_date: string
          event_type: string
          id: string
          metadata: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          event_date?: string
          event_type: string
          id?: string
          metadata?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          event_date?: string
          event_type?: string
          id?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      admin_access_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          reason: string
          resource_type: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          reason: string
          resource_type: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          reason?: string
          resource_type?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      ai_observations: {
        Row: {
          assistant_message_id: string | null
          confidence: number
          content_original: string
          content_user_edited: string | null
          conversation_id: string
          created_at: string
          decision_at: string | null
          decision_idempotency_key: string | null
          dimension: string
          id: string
          observation_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assistant_message_id?: string | null
          confidence?: number
          content_original: string
          content_user_edited?: string | null
          conversation_id: string
          created_at?: string
          decision_at?: string | null
          decision_idempotency_key?: string | null
          dimension: string
          id?: string
          observation_type?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assistant_message_id?: string | null
          confidence?: number
          content_original?: string
          content_user_edited?: string | null
          conversation_id?: string
          created_at?: string
          decision_at?: string | null
          decision_idempotency_key?: string | null
          dimension?: string
          id?: string
          observation_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ai_observations_conversation"
            columns: ["conversation_id", "user_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "fk_ai_observations_message"
            columns: ["assistant_message_id", "user_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      ai_run_logs: {
        Row: {
          completion_tokens: number | null
          created_at: string
          error_code: string | null
          id: string
          latency_ms: number
          model: string
          prompt_tokens: number | null
          provider: string
          request_id: string
          status: string
          user_hash: string
        }
        Insert: {
          completion_tokens?: number | null
          created_at?: string
          error_code?: string | null
          id?: string
          latency_ms: number
          model: string
          prompt_tokens?: number | null
          provider: string
          request_id: string
          status: string
          user_hash: string
        }
        Update: {
          completion_tokens?: number | null
          created_at?: string
          error_code?: string | null
          id?: string
          latency_ms?: number
          model?: string
          prompt_tokens?: number | null
          provider?: string
          request_id?: string
          status?: string
          user_hash?: string
        }
        Relationships: []
      }
      application_errors: {
        Row: {
          created_at: string
          error_code: string
          id: string
          request_id: string
          route: string
          sanitized_detail: Json
          user_hash: string | null
        }
        Insert: {
          created_at?: string
          error_code: string
          id?: string
          request_id: string
          route: string
          sanitized_detail: Json
          user_hash?: string | null
        }
        Update: {
          created_at?: string
          error_code?: string
          id?: string
          request_id?: string
          route?: string
          sanitized_detail?: Json
          user_hash?: string | null
        }
        Relationships: []
      }
      confirmed_insights: {
        Row: {
          confirmed_at: string
          content: string
          created_at: string
          deleted_at: string | null
          dimension: string
          evidence_message_ids: string[] | null
          id: string
          insight_type: string
          source_observation_id: string | null
          superseded_by_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          confirmed_at?: string
          content: string
          created_at?: string
          deleted_at?: string | null
          dimension: string
          evidence_message_ids?: string[] | null
          id?: string
          insight_type?: string
          source_observation_id?: string | null
          superseded_by_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          confirmed_at?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          dimension?: string
          evidence_message_ids?: string[] | null
          id?: string
          insight_type?: string
          source_observation_id?: string | null
          superseded_by_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "confirmed_insights_superseded_by_id_fkey"
            columns: ["superseded_by_id"]
            isOneToOne: false
            referencedRelation: "confirmed_insights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_confirmed_insights_observation"
            columns: ["source_observation_id", "user_id"]
            isOneToOne: false
            referencedRelation: "ai_observations"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          current_stage: string
          deleted_at: string | null
          id: string
          last_message_at: string
          prompt_version: string
          question_flow_version_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_stage?: string
          deleted_at?: string | null
          id?: string
          last_message_at?: string
          prompt_version?: string
          question_flow_version_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_stage?: string
          deleted_at?: string | null
          id?: string
          last_message_at?: string
          prompt_version?: string
          question_flow_version_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_question_flow_version_id_fkey"
            columns: ["question_flow_version_id"]
            isOneToOne: false
            referencedRelation: "question_flow_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      experiments: {
        Row: {
          created_at: string
          deleted_at: string | null
          gap_id: string | null
          hypothesis: string
          id: string
          observation_focus: Json
          progress_percent: number
          smallest_step: string
          start_date: string
          status: string
          success_signal: string
          target_date: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          gap_id?: string | null
          hypothesis: string
          id?: string
          observation_focus?: Json
          progress_percent?: number
          smallest_step: string
          start_date: string
          status?: string
          success_signal: string
          target_date: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          gap_id?: string | null
          hypothesis?: string
          id?: string
          observation_focus?: Json
          progress_percent?: number
          smallest_step?: string
          start_date?: string
          status?: string
          success_signal?: string
          target_date?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_experiments_gap"
            columns: ["gap_id", "user_id"]
            isOneToOne: false
            referencedRelation: "gaps"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      gaps: {
        Row: {
          created_at: string
          current_state: string
          deleted_at: string | null
          desired_state: string
          dimension: string
          id: string
          priority: number
          source_insight_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_state: string
          deleted_at?: string | null
          desired_state: string
          dimension: string
          id?: string
          priority?: number
          source_insight_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_state?: string
          deleted_at?: string | null
          desired_state?: string
          dimension?: string
          id?: string
          priority?: number
          source_insight_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_gaps_insight"
            columns: ["source_insight_id", "user_id"]
            isOneToOne: false
            referencedRelation: "confirmed_insights"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      idempotency_records: {
        Row: {
          created_at: string
          id: string
          key: string
          operation: string
          response_payload: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          operation: string
          response_payload?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          operation?: string
          response_payload?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      learning_records: {
        Row: {
          confirmed_at: string | null
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          source_reflection_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confirmed_at?: string | null
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          source_reflection_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confirmed_at?: string | null
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          source_reflection_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_learning_records_reflection"
            columns: ["source_reflection_id", "user_id"]
            isOneToOne: false
            referencedRelation: "reflections"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      life_profile_versions: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_current: boolean
          snapshot: Json
          source_answer_ids: string[] | null
          source_insight_ids: string[] | null
          status: string
          updated_at: string
          user_id: string
          version_no: number
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: string
          is_current?: boolean
          snapshot: Json
          source_answer_ids?: string[] | null
          source_insight_ids?: string[] | null
          status?: string
          updated_at?: string
          user_id: string
          version_no: number
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_current?: boolean
          snapshot?: Json
          source_answer_ids?: string[] | null
          source_insight_ids?: string[] | null
          status?: string
          updated_at?: string
          user_id?: string
          version_no?: number
        }
        Relationships: []
      }
      messages: {
        Row: {
          completion_tokens: number | null
          content: string
          conversation_id: string
          created_at: string
          error_code: string | null
          id: string
          idempotency_key: string | null
          prompt_tokens: number | null
          prompt_version: string | null
          provider_message_id: string | null
          role: string
          sequence_no: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completion_tokens?: number | null
          content: string
          conversation_id: string
          created_at?: string
          error_code?: string | null
          id?: string
          idempotency_key?: string | null
          prompt_tokens?: number | null
          prompt_version?: string | null
          provider_message_id?: string | null
          role: string
          sequence_no: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completion_tokens?: number | null
          content?: string
          conversation_id?: string
          created_at?: string
          error_code?: string | null
          id?: string
          idempotency_key?: string | null
          prompt_tokens?: number | null
          prompt_version?: string | null
          provider_message_id?: string | null
          role?: string
          sequence_no?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_messages_conversation"
            columns: ["conversation_id", "user_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          consented_at: string | null
          created_at: string
          display_name: string
          id: string
          locale: string
          onboarding_status: string
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          consented_at?: string | null
          created_at?: string
          display_name?: string
          id: string
          locale?: string
          onboarding_status?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          consented_at?: string | null
          created_at?: string
          display_name?: string
          id?: string
          locale?: string
          onboarding_status?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      prompt_configs: {
        Row: {
          checksum: string
          code: string
          created_at: string
          encrypted_content: string
          id: string
          name: string
          status: string
          updated_at: string
          version: string
        }
        Insert: {
          checksum: string
          code: string
          created_at?: string
          encrypted_content: string
          id?: string
          name: string
          status?: string
          updated_at?: string
          version: string
        }
        Update: {
          checksum?: string
          code?: string
          created_at?: string
          encrypted_content?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      question_flow_versions: {
        Row: {
          checksum: string
          code: string
          created_at: string
          id: string
          name: string
          published_at: string | null
          schema_version: number
          status: string
          updated_at: string
          version_no: number
        }
        Insert: {
          checksum?: string
          code: string
          created_at?: string
          id?: string
          name: string
          published_at?: string | null
          schema_version?: number
          status?: string
          updated_at?: string
          version_no: number
        }
        Update: {
          checksum?: string
          code?: string
          created_at?: string
          id?: string
          name?: string
          published_at?: string | null
          schema_version?: number
          status?: string
          updated_at?: string
          version_no?: number
        }
        Relationships: []
      }
      questions: {
        Row: {
          answer_type: string
          branch_rules: Json
          created_at: string
          flow_version_id: string
          helper_text: string | null
          id: string
          is_required: boolean
          options: Json
          ordinal: number
          question_key: string
          title: string
          updated_at: string
        }
        Insert: {
          answer_type: string
          branch_rules?: Json
          created_at?: string
          flow_version_id: string
          helper_text?: string | null
          id?: string
          is_required?: boolean
          options?: Json
          ordinal?: number
          question_key: string
          title: string
          updated_at?: string
        }
        Update: {
          answer_type?: string
          branch_rules?: Json
          created_at?: string
          flow_version_id?: string
          helper_text?: string | null
          id?: string
          is_required?: boolean
          options?: Json
          ordinal?: number
          question_key?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_flow_version_id_fkey"
            columns: ["flow_version_id"]
            isOneToOne: false
            referencedRelation: "question_flow_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      reflections: {
        Row: {
          created_at: string
          experiment_id: string
          feeling: string
          id: string
          learning_candidate: string
          next_action: string
          rating: number | null
          result: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          experiment_id: string
          feeling: string
          id?: string
          learning_candidate: string
          next_action: string
          rating?: number | null
          result: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          experiment_id?: string
          feeling?: string
          id?: string
          learning_candidate?: string
          next_action?: string
          rating?: number | null
          result?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_reflections_experiment"
            columns: ["experiment_id", "user_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      resources: {
        Row: {
          confidence: number
          created_at: string
          deleted_at: string | null
          description: string | null
          dimension: string
          id: string
          name: string
          resource_type: string
          source_insight_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          dimension: string
          id?: string
          name: string
          resource_type: string
          source_insight_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          dimension?: string
          id?: string
          name?: string
          resource_type?: string
          source_insight_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_resources_insight"
            columns: ["source_insight_id", "user_id"]
            isOneToOne: false
            referencedRelation: "confirmed_insights"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      user_answers: {
        Row: {
          answer: Json
          answered_at: string
          deleted_at: string | null
          flow_version_id: string
          id: string
          idempotency_key: string | null
          question_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answer: Json
          answered_at?: string
          deleted_at?: string | null
          flow_version_id: string
          id?: string
          idempotency_key?: string | null
          question_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answer?: Json
          answered_at?: string
          deleted_at?: string | null
          flow_version_id?: string
          id?: string
          idempotency_key?: string | null
          question_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_answers_flow_version_id_fkey"
            columns: ["flow_version_id"]
            isOneToOne: false
            referencedRelation: "question_flow_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      user_statements: {
        Row: {
          captured_at: string
          content: string
          conversation_id: string
          deleted_at: string | null
          dimension: string | null
          id: string
          message_id: string
          statement_type: string
          user_id: string
        }
        Insert: {
          captured_at?: string
          content: string
          conversation_id: string
          deleted_at?: string | null
          dimension?: string | null
          id?: string
          message_id: string
          statement_type?: string
          user_id: string
        }
        Update: {
          captured_at?: string
          content?: string
          conversation_id?: string
          deleted_at?: string | null
          dimension?: string | null
          id?: string
          message_id?: string
          statement_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_statements_conversation"
            columns: ["conversation_id", "user_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "fk_user_statements_message"
            columns: ["message_id", "user_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      confirm_life_profile: {
        Args: {
          p_idempotency_key?: string
          p_snapshot: Json
          p_source_answer_ids?: string[]
          p_source_insight_ids?: string[]
        }
        Returns: Json
      }
      create_pending_observation: {
        Args: {
          p_assistant_message_id: string
          p_confidence?: number
          p_content_original: string
          p_conversation_id: string
          p_dimension: string
          p_observation_type: string
        }
        Returns: Json
      }
      decide_observation_atomic: {
        Args: {
          p_decision: string
          p_edited_content?: string
          p_idempotency_key?: string
          p_observation_id: string
        }
        Returns: Json
      }
      decide_learning_atomic: {
        Args: {
          p_decision: string
          p_edited_content?: string
          p_idempotency_key?: string
          p_learning_id: string
        }
        Returns: Json
      }
      is_admin: { Args: { p_user_id: string }; Returns: boolean }
      save_life_profile_draft: {
        Args: {
          p_snapshot: Json
          p_source_answer_ids?: string[]
          p_source_insight_ids?: string[]
        }
        Returns: Json
      }
      transition_experiment: {
        Args: {
          p_experiment_id: string
          p_idempotency_key?: string
          p_progress_percent?: number
          p_status: string
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
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
          versioning_status: string
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
          versioning_status?: string
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
          versioning_status?: string
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      iceberg_namespaces: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          metadata: Json
          name: string
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_namespaces_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      iceberg_tables: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          location: string
          name: string
          namespace_id: string
          remote_table_id: string | null
          shard_id: string | null
          shard_key: string | null
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          location: string
          name: string
          namespace_id: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          location?: string
          name?: string
          namespace_id?: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_tables_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iceberg_tables_namespace_id_fkey"
            columns: ["namespace_id"]
            isOneToOne: false
            referencedRelation: "iceberg_namespaces"
            referencedColumns: ["id"]
          },
        ]
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          archived_at: string | null
          bucket_id: string | null
          created_at: string | null
          id: string
          is_delete_marker: boolean
          is_versioned: boolean
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          archived_at?: string | null
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          is_delete_marker?: boolean
          is_versioned?: boolean
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          archived_at?: string | null
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          is_delete_marker?: boolean
          is_versioned?: boolean
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          metadata: Json | null
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allow_any_operation: {
        Args: { expected_operations: string[] }
        Returns: boolean
      }
      allow_only_operation: {
        Args: { expected_operation: string }
        Returns: boolean
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
