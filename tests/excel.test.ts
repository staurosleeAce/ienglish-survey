import { describe, expect, it } from 'vitest'
import { toExportRows } from '../src/lib/excel'
import type { SurveyRecord } from '../src/types'

function makeRecord(partial: Partial<SurveyRecord>): SurveyRecord {
  return {
    id: 'r1',
    created_at: '2026-10-06T10:30:00Z',
    parent_name: 'Amber媽媽',
    child_name: 'Amber',
    q1_feature: ['smart_level'],
    q1_other: '',
    q2_change: ['initiative'],
    q2_other: '',
    q3_expectation: ['daily_habit'],
    q3_other: '',
    q4_assistance: ['plan_cost'],
    q4_other: '',
    feedback: '孩子很喜歡',
    campaign: '7day_english_camp',
    batch: '2026-10-06',
    source: 'line',
    followup_status: 'new',
    lead_status: 'MEDIUM',
    ...partial,
  }
}

describe('toExportRows（Excel 匯出欄位）', () => {
  it('每一列 = 一份問券，欄位以中文清楚標示', () => {
    const rows = toExportRows([makeRecord({})])
    expect(rows).toHaveLength(1)
    const r = rows[0]
    expect(r['填寫時間']).toBe('2026-10-06 18:30')
    expect(r['家長稱呼']).toBe('Amber媽媽')
    expect(r['孩子稱呼']).toBe('Amber')
    expect(r['最符合孩子需求的特色']).toContain('智能安排')
    expect(r['孩子7日後的變化']).toContain('主動拿起')
    expect(r['期待的改變']).toContain('每天接觸英文')
    expect(r['希望提供的協助']).toContain('正式方案與費用')
    expect(r['家長回饋']).toBe('孩子很喜歡')
    expect(r['活動梯次']).toBe('2026-10-06')
  })

  it('多選答案以「；」串接並轉成中文 label', () => {
    const r = toExportRows([
      makeRecord({ q4_assistance: ['plan_cost', 'results', 'other'] }),
    ])[0]
    expect(r['希望提供的協助']).toBe('想了解適合孩子的正式方案與費用；想了解孩子7日的學習成果；其他')
  })

  it('Q1 多選以「；」串接', () => {
    const r = toExportRows([
      makeRecord({ q1_feature: ['smart_level', 'variety'] }),
    ])[0]
    expect(r['最符合孩子需求的特色']).toBe(
      '會依孩子程度，智能安排適合的內容；有很多不同類型的英文內容可以閱讀',
    )
  })

  it('其他文字欄位正確輸出', () => {
    const r = toExportRows([
      makeRecord({ q2_change: ['speaking', 'other'], q2_other: '她開始唱歌' }),
    ])[0]
    expect(r['孩子7日後的變化']).toContain('其他')
    expect(r['其他回答_變化']).toBe('她開始唱歌')
  })
})