import { describe, expect, it } from 'vitest'
import { toExportRows } from '../src/lib/excel'
import type { SurveyRecord } from '../src/types'

function makeRecord(partial: Partial<SurveyRecord>): SurveyRecord {
  return {
    id: 'r1',
    created_at: '2026-10-06T10:30:00Z',
    parent_name: 'Miffy媽咪',
    child_name: 'Miffy',
    q1_feature: 'smart_level',
    q2_change: 'initiative',
    q2_other: '',
    q3_expectation: 'daily_habit',
    q3_other: '',
    q4_purchase_intent: 'info',
    q5_objection: ['time'],
    q5_other: '',
    q6_followup: ['agent'],
    feedback: '孩子很喜歡',
    campaign: '7day_english_camp',
    batch: '2026-10-06',
    source: 'line',
    followup_status: 'new',
    lead_status: 'HIGH',
    ...partial,
  }
}

describe('toExportRows（Excel 匯出欄位）', () => {
  it('每一列 = 一份問券，欄位以中文清楚標示', () => {
    const rows = toExportRows([makeRecord({})])
    expect(rows).toHaveLength(1)
    const r = rows[0]
    expect(r['填寫時間']).toBe('2026-10-06 18:30')
    expect(r['家長稱呼']).toBe('Miffy媽咪')
    expect(r['孩子稱呼']).toBe('Miffy')
    expect(r['最符合孩子需求的特色']).toContain('智能安排')
    expect(r['孩子7日後的變化']).toContain('主動拿起')
    expect(r['期待的改變']).toContain('每天接觸英文')
    expect(r['繼續使用意願']).toContain('正式使用方式')
    expect(r['主要疑慮']).toContain('每天需要使用多久')
    expect(r['後續協助需求']).toContain('專人')
    expect(r['家長回饋']).toBe('孩子很喜歡')
    expect(r['活動梯次']).toBe('2026-10-06')
    expect(r['Lead分類']).toBe('HIGH')
    expect(r['跟進優先']).toContain('優先')
  })

  it('答案代碼會被轉成中文 label', () => {
    const r = toExportRows([
      makeRecord({ q2_change: 'other', q2_other: '她開始唱歌' }),
    ])[0]
    expect(r['孩子7日後的變化']).toBe('其他')
    expect(r['其他回答_變化']).toBe('她開始唱歌')
    expect(r['其他回答']).toBe('她開始唱歌')
  })

  it('合併多個「其他」欄位', () => {
    const r = toExportRows([
      makeRecord({
        q2_change: 'other',
        q3_expectation: 'other',
        q2_other: 'A',
        q3_other: 'B',
      }),
    ])[0]
    expect(r['其他回答']).toBe('A；B')
  })
})