import type { Q4Intent } from '../types'

/** 與 supabase/migrations/0001_create_schema.sql 對應的精簡型別（供 TS 使用） */
export type SurveyResponseRow = {
  id: string
  created_at: string
  parent_name: string
  child_name: string
  q1_feature: string
  q2_change: string
  q2_other: string | null
  q3_expectation: string
  q3_other: string | null
  q4_purchase_intent: Q4Intent
  q5_objection: string
  q5_other: string | null
  q6_followup: string
  feedback: string | null
  campaign: string
  batch: string
  source: string | null
  followup_status: string
  lead_status: string | null
}

export type SurveyAdminsRow = {
  id: string
  email: string
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      survey_responses: {
        Row: SurveyResponseRow
        Insert: Partial<SurveyResponseRow>
        Update: Partial<SurveyResponseRow>
        Relationships: []
      }
      survey_admins: {
        Row: SurveyAdminsRow
        Insert: { email: string }
        Update: { email?: string }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}