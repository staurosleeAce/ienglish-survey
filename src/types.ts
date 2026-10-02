export type Q4Intent =
  | 'info'
  | 'compare'
  | 'questions'
  | 'want_results'
  | 'not_now'

export type LeadStatus = 'HIGH' | 'MEDIUM' | 'FOLLOW_UP' | 'LOW'

export type FollowupPriority = 'hot' | 'warm' | 'wait' | 'low'

export interface SurveyOption {
  key: string
  label: string
  icon: string
}

export interface SurveyQuestion {
  id: string
  field: string
  title: string
  hint?: string
  options: SurveyOption[]
  allowsOther?: boolean
  multi?: boolean
  allowNoSelection?: boolean
}

export interface Answers {
  parentName: string
  childName: string
  q1: string
  q2: string
  q2Other: string
  q3: string
  q3Other: string
  q4: Q4Intent | ''
  q5: string[]
  q5Other: string
  q6: string[]
  feedback: string
}

export interface SurveyRecord {
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
  q5_objection: string[]
  q5_other: string | null
  q6_followup: string[]
  feedback: string | null
  campaign: string
  batch: string
  source: string
  followup_status: string
  lead_status: string
}

export type FollowupStatus =
  | 'new'
  | 'contacted'
  | 'closed'
  | 'no_response'

export const FOLLOWUP_STATUS_LABEL: Record<FollowupStatus, string> = {
  new: '待處理',
  contacted: '已聯繫',
  closed: '已完成',
  no_response: '未回應',
}

export function emptyAnswers(): Answers {
  return {
    parentName: '',
    childName: '',
    q1: '',
    q2: '',
    q2Other: '',
    q3: '',
    q3Other: '',
    q4: '',
    q5: [],
    q5Other: '',
    q6: [],
    feedback: '',
  }
}