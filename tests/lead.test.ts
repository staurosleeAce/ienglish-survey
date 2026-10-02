import { describe, expect, it } from 'vitest'
import { computeLeadStatus, followupPriority } from '../src/lib/api'
import { normalizeBatch } from '../src/data/survey'
import type { SurveyRecord } from '../src/types'

function makeRecord(partial: Partial<SurveyRecord>): SurveyRecord {
  return {
    id: 'r1',
    created_at: '2026-10-06T10:00:00Z',
    parent_name: 'Miffy媽咪',
    child_name: 'Miffy',
    q1_feature: 'smart_level',
    q2_change: 'initiative',
    q2_other: '',
    q3_expectation: 'daily_habit',
    q3_other: '',
    q4_purchase_intent: 'info',
    q5_objection: 'time',
    q5_other: '',
    q6_followup: 'none',
    feedback: '',
    campaign: '7day_english_camp',
    batch: '2026-10-06',
    source: 'line',
    followup_status: 'new',
    lead_status: 'HIGH',
    ...partial,
  }
}

describe('computeLeadStatus（後台 Lead 分類）', () => {
  it('HIGH：想進一步了解正式使用方式', () => {
    expect(computeLeadStatus('info')).toBe('HIGH')
  })
  it('MEDIUM：比較看看 / 有疑問', () => {
    expect(computeLeadStatus('compare')).toBe('MEDIUM')
    expect(computeLeadStatus('questions')).toBe('MEDIUM')
  })
  it('FOLLOW_UP：想先看成果', () => {
    expect(computeLeadStatus('want_results')).toBe('FOLLOW_UP')
  })
  it('LOW：目前先不考慮', () => {
    expect(computeLeadStatus('not_now')).toBe('LOW')
  })
})

describe('followupPriority（跟進優先順序）', () => {
  it('🔥 想了解正式方式 → 建議優先聯繫', () => {
    const p = followupPriority(makeRecord({ q4_purchase_intent: 'info' }))
    expect(p.key).toBe('hot')
  })
  it('🔥 Q6 想詢問顧問 → 建議優先聯繫', () => {
    const p = followupPriority(makeRecord({ q6_followup: 'consult' }))
    expect(p.key).toBe('hot')
  })
  it('🟡 比較看看 → 持續培養', () => {
    const p = followupPriority(makeRecord({ q4_purchase_intent: 'compare' }))
    expect(p.key).toBe('warm')
  })
  it('🔵 想先看成果 → 等待家長需求', () => {
    const p = followupPriority(makeRecord({ q4_purchase_intent: 'want_results' }))
    expect(p.key).toBe('wait')
  })
  it('⚪ 目前不考慮 → 暫不跟進', () => {
    const p = followupPriority(makeRecord({ q4_purchase_intent: 'not_now' }))
    expect(p.key).toBe('low')
  })
})

describe('normalizeBatch', () => {
  it('接受合法日期並去除空白', () => {
    expect(normalizeBatch(' 2026-10-20 ')).toBe('2026-10-20')
  })
  it('無效或空值回退預設梯次', () => {
    expect(normalizeBatch('')).toBe('2026-10-06')
    expect(normalizeBatch('foobar')).toBe('2026-10-06')
    expect(normalizeBatch(null)).toBe('2026-10-06')
  })
})