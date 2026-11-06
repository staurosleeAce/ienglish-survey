/** 與 supabase/migrations/0003_survey_v2.sql 對應的精簡型別（供 TS 使用） */
export type SurveyResponseRow = {
  id: string
  created_at: string
  project_id: string
  survey_type: string
  parent_name: string
  child_name: string
  q1_feature: string[]
  q1_other: string | null
  q2_change: string[]
  q2_other: string | null
  q3_expectation: string[]
  q3_other: string | null
  q4_assistance: string[]
  q4_other: string | null
  feedback: string | null
  campaign: string
  batch: string
  source: string | null
  followup_status: string
  lead_status: string | null
  super_parent_name: string | null
  super_line_name: string | null
  super_child_ages: string[] | null
  super_stuck_points: string[] | null
  super_source: string | null
  super_feedback: string | null
  closing_child_ages: string[] | null
  closing_biggest_gain: string[] | null
  closing_expectation: string | null
  closing_future_interest: string | null
  closing_next_topic: string[] | null
  closing_feedback: string | null
  closing_action: string | null
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
