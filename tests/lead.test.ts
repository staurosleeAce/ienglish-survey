import { describe, expect, it } from 'vitest'
import { computeLeadStatus, followupPriority } from '../src/lib/api'
import { normalizeBatch } from '../src/data/survey'
import type { SurveyRecord } from '../src/types'

function makeRecord(partial: Partial<SurveyRecord>): SurveyRecord {
  return {
    id: 'r1',
    created_at: '2026-10-06T10:00:00Z',
    parent_name: 'Amber媽媽',
    child_name: 'Amber',
    q1_feature: ['smart_level'],
    q1_other: '',
    q2_change: ['initiative'],
    q2_other: '',
    q3_expectation: ['daily_habit'],
    q3_other: '',
    q4_assistance: [],
    q4_other: '',
    feedback: '',
    campaign: '7day_english_camp',
    batch: '2026-10-06',
    source: 'line',
    followup_status: 'new',
    lead_status: 'MEDIUM',
    ...partial,
  }
}

describe('computeLeadStatus（後台 Lead 分類，依 Q4 複選）', () => {
  it('HIGH：希望專人說明 / 想與客服聊聊', () => {
    expect(computeLeadStatus(['agent'])).toBe('HIGH')
    expect(computeLeadStatus(['consult'])).toBe('HIGH')
  })
  it('MEDIUM：想了解方案費用 / 學習成果', () => {
    expect(computeLeadStatus(['plan_cost'])).toBe('MEDIUM')
    expect(computeLeadStatus(['results'])).toBe('MEDIUM')
  })
  it('FOLLOW_UP：想再觀察一段時間', () => {
    expect(computeLeadStatus(['observe'])).toBe('FOLLOW_UP')
  })
  it('LOW：其他', () => {
    expect(computeLeadStatus(['other'])).toBe('LOW')
    expect(computeLeadStatus([])).toBe('LOW')
  })
})

describe('followupPriority（跟進優先順序）', () => {
  it('🔥 需要專人/顧問 → 建議優先聯繫', () => {
    expect(followupPriority(makeRecord({ q4_assistance: ['agent'] })).key).toBe('hot')
    expect(followupPriority(makeRecord({ q4_assistance: ['consult'] })).key).toBe('hot')
  })
  it('🟡 想了解方案/成果 → 持續培養', () => {
    expect(followupPriority(makeRecord({ q4_assistance: ['plan_cost'] })).key).toBe('warm')
    expect(followupPriority(makeRecord({ q4_assistance: ['results'] })).key).toBe('warm')
  })
  it('🔵 想再觀察 → 等待家長需求', () => {
    expect(followupPriority(makeRecord({ q4_assistance: ['observe'] })).key).toBe('wait')
  })
  it('⚪ 其他 → 暫不跟進', () => {
    expect(followupPriority(makeRecord({ q4_assistance: ['other'] })).key).toBe('low')
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