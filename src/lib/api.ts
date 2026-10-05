import type { SurveyRecord } from '../types'
import { CAMPAIGN } from '../data/survey'
import { getSupabase } from './supabase'
import { isSupabaseConfigured } from './config'
import { sanitizeText } from './sanitize'

export interface SubmitPayload {
  parentName: string
  childName: string
  q1_feature: string[]
  q1_other: string
  q2_change: string[]
  q2_other: string
  q3_expectation: string[]
  q3_other: string
  q4_assistance: string[]
  q4_other: string
  feedback: string
  campaign: string
  batch: string
  source: string
}

function sanitizeArray(items: string[], maxLen: number): string[] {
  return (items ?? []).map((s) => sanitizeText(s, maxLen)).filter(Boolean)
}

/** 依 Q4 協助需求推導 Lead 分類（後台內部用） */
export function computeLeadStatus(q4: string[]): string {
  const set = new Set(q4 ?? [])
  if (set.has('agent') || set.has('consult')) return 'HIGH'
  if (set.has('plan_cost') || set.has('results')) return 'MEDIUM'
  if (set.has('observe')) return 'FOLLOW_UP'
  return 'LOW'
}

/**
 * 若未設定 Supabase 環境變數，拋出明確錯誤，前端會顯示設定提示。
 * 「正式資料來源只有 Supabase」，不使用 localStorage / mock data。
 */
export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super('supabase_not_configured')
    this.name = 'SupabaseNotConfiguredError'
  }
}

function assertConfigured(): NonNullable<ReturnType<typeof getSupabase>> {
  const supabase = getSupabase()
  if (!supabase) throw new SupabaseNotConfiguredError()
  return supabase
}

// ---------- 前台：寫入正式資料庫 ----------
export async function submitResponse(
  payload: Omit<SubmitPayload, 'campaign'>,
): Promise<{ id: string }> {
  const supabase = assertConfigured()

  // 只寫入、不要求回傳 row（return=minimal）。
  // 若用 .select() 會帶 Prefer: return=representation，
  // PostgREST 會對 anon 再執行一次 SELECT，被 RLS 擋下而回報 42501。
  const { error } = await supabase
    .from('survey_responses')
    .insert({
      parent_name: sanitizeText(payload.parentName, 40),
      child_name: sanitizeText(payload.childName, 40),
      q1_feature: sanitizeArray(payload.q1_feature, 60),
      q1_other: sanitizeText(payload.q1_other, 200),
      q2_change: sanitizeArray(payload.q2_change, 60),
      q2_other: sanitizeText(payload.q2_other, 200),
      q3_expectation: sanitizeArray(payload.q3_expectation, 60),
      q3_other: sanitizeText(payload.q3_other, 200),
      q4_assistance: sanitizeArray(payload.q4_assistance, 60),
      q4_other: sanitizeText(payload.q4_other, 200),
      feedback: sanitizeText(payload.feedback, 2000),
      campaign: CAMPAIGN,
      batch: payload.batch,
      source: sanitizeText(payload.source, 40),
      followup_status: 'new',
      lead_status: computeLeadStatus(payload.q4_assistance),
    })

  if (error) {
    // 由資料庫 unique 限制來的重複插入 → 避免重複提交
    if (error.code === '23505') throw new Error('duplicate')
    throw new Error(error.message)
  }
  return { id: '' }
}

// ---------- Admin：驗證目前連線狀態 ----------
export function isSupabaseConfiguredNow(): boolean {
  return isSupabaseConfigured
}

// ---------- Admin：登入 / 登出 / 狀態 ----------
export async function adminLogin(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase()
  if (!supabase) return { ok: false, error: 'Supabase 尚未設定，請先於 .env 設定環境變數。' }
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function adminLogout() {
  const supabase = getSupabase()
  if (supabase) await supabase.auth.signOut()
}

export async function adminIsAuthed(): Promise<boolean> {
  const supabase = getSupabase()
  if (!supabase) return false
  const { data } = await supabase.auth.getSession()
  return Boolean(data.session)
}

// ---------- Admin：讀取正式資料庫 ----------
export async function fetchResponses(): Promise<SurveyRecord[]> {
  const supabase = assertConfigured()
  const { data, error } = await supabase
    .from('survey_responses')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as SurveyRecord[]
}

export async function fetchStats(): Promise<{
  total: number
  today: number
  week: number
  consulted: number
}> {
  const rows = await fetchResponses()
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - 7)

  let today = 0
  let week = 0
  let consulted = 0
  for (const r of rows) {
    const d = new Date(r.created_at)
    if (d >= startOfToday) today++
    if (d >= startOfWeek) week++
    if ((r.q4_assistance ?? []).some((k) => ['agent', 'consult'].includes(k))) consulted++
  }
  return { total: rows.length, today, week, consulted }
}

export async function updateFollowupStatus(
  id: string,
  status: string,
): Promise<void> {
  const supabase = assertConfigured()
  const { error } = await supabase
    .from('survey_responses')
    .update({ followup_status: status })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

// ---------- 跟進優先順序（後台內部使用，不對外顯示） ----------
export function followupPriority(record: SurveyRecord): {
  key: 'hot' | 'warm' | 'wait' | 'low'
  label: string
} {
  const q4 = record.q4_assistance ?? []
  if (q4.includes('agent') || q4.includes('consult')) {
    return { key: 'hot', label: '建議優先聯繫' }
  }
  if (q4.includes('plan_cost') || q4.includes('results')) {
    return { key: 'warm', label: '建議持續培養' }
  }
  if (q4.includes('observe')) {
    return { key: 'wait', label: '等待家長需求' }
  }
  return { key: 'low', label: '暫不跟進' }
}