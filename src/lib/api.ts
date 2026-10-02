import type { Q4Intent, SurveyRecord } from '../types'
import { CAMPAIGN } from '../data/survey'
import { getSupabase } from './supabase'
import { isSupabaseConfigured } from './config'
import { sanitizeText } from './sanitize'

export interface SubmitPayload {
  parentName: string
  childName: string
  q1_feature: string
  q2_change: string
  q2_other: string
  q3_expectation: string
  q3_other: string
  q4_purchase_intent: Q4Intent
  q5_objection: string
  q5_other: string
  q6_followup: string
  feedback: string
  campaign: string
  batch: string
  source: string
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
  const finalPayload: SubmitPayload = {
    ...payload,
    campaign: CAMPAIGN,
  }

  // 只寫入、不要求回傳 row（return=minimal）。
  // 若用 .select() 會帶 Prefer: return=representation，
  // PostgREST 會對 anon 再執行一次 SELECT，被 RLS 擋下而回報 42501。
  const { error } = await supabase
    .from('survey_responses')
    .insert({
      parent_name: sanitizeText(finalPayload.parentName, 40),
      child_name: sanitizeText(finalPayload.childName, 40),
      q1_feature: sanitizeText(finalPayload.q1_feature, 60),
      q2_change: sanitizeText(finalPayload.q2_change, 60),
      q2_other: sanitizeText(finalPayload.q2_other, 200),
      q3_expectation: sanitizeText(finalPayload.q3_expectation, 60),
      q3_other: sanitizeText(finalPayload.q3_other, 200),
      q4_purchase_intent: finalPayload.q4_purchase_intent,
      q5_objection: sanitizeText(finalPayload.q5_objection, 60),
      q5_other: sanitizeText(finalPayload.q5_other, 200),
      q6_followup: sanitizeText(finalPayload.q6_followup, 60),
      feedback: sanitizeText(finalPayload.feedback, 2000),
      campaign: CAMPAIGN,
      batch: finalPayload.batch,
      source: sanitizeText(finalPayload.source, 40),
      followup_status: 'new',
    })

  if (error) {
    // 由資料庫 unique 限制來的重複插入 → 避免重複提交
    if (error.code === '23505') throw new Error('duplicate')
    throw new Error(error.message)
  }
  // 只寫入，不回傳 row（return=minimal）。
  // .select() 會帶 Prefer: return=representation，PostgREST 對 anon 再 SELECT 會被 RLS 擋下 (42501)。
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
  byIntent: Record<Q4Intent, number>
  consulted: number
}> {
  const rows = await fetchResponses()
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - 7)

  const byIntent: Record<Q4Intent, number> = {
    info: 0,
    compare: 0,
    questions: 0,
    want_results: 0,
    not_now: 0,
  }

  let today = 0
  let week = 0
  let consulted = 0
  for (const r of rows) {
    const d = new Date(r.created_at)
    byIntent[r.q4_purchase_intent] = (byIntent[r.q4_purchase_intent] ?? 0) + 1
    if (d >= startOfToday) today++
    if (d >= startOfWeek) week++
    if (['agent', 'consult', 'plan'].includes(r.q6_followup)) consulted++
  }
  return { total: rows.length, today, week, byIntent, consulted }
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

// ---------- Lead 分類（後台內部使用，不對外顯示） ----------
export function computeLeadStatus(intent: Q4Intent): string {
  switch (intent) {
    case 'info':
      return 'HIGH'
    case 'compare':
    case 'questions':
      return 'MEDIUM'
    case 'want_results':
      return 'FOLLOW_UP'
    case 'not_now':
      return 'LOW'
  }
}

export function followupPriority(record: SurveyRecord): {
  key: 'hot' | 'warm' | 'wait' | 'low'
  label: string
} {
  const intent = record.q4_purchase_intent
  const followup = record.q6_followup
  if (intent === 'info' || followup === 'agent' || followup === 'consult') {
    return { key: 'hot', label: '建議優先聯繫' }
  }
  if (intent === 'compare' || intent === 'questions') {
    return { key: 'warm', label: '建議持續培養' }
  }
  if (intent === 'want_results' || followup === 'results' || followup === 'plan') {
    return { key: 'wait', label: '等待家長需求' }
  }
  return { key: 'low', label: '暫不跟進' }
}