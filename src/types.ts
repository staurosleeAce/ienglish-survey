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
}

export interface Answers {
  parentName: string
  childName: string
  q1: string[]
  q1Other: string
  q2: string[]
  q2Other: string
  q3: string[]
  q3Other: string
  q4: string[]
  q4Other: string
  feedback: string
}

export interface SurveyRecord {
  id: string
  created_at: string
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
    q1: [],
    q1Other: '',
    q2: [],
    q2Other: '',
    q3: [],
    q3Other: '',
    q4: [],
    q4Other: '',
    feedback: '',
  }
}