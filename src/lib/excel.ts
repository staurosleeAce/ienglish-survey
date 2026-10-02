import * as XLSX from 'xlsx'
import { findOptionLabel, INTENT_LABEL, OPTION_OTHER_KEY } from '../data/survey'
import { followupPriority } from './api'
import type { SurveyRecord } from '../types'

function label(qid: string, key: string): string {
  if (!key) return ''
  if (key === OPTION_OTHER_KEY) return '其他'
  return findOptionLabel(qid, key)
}

/**
 * 將資料轉成適合客服/業務整理的資料列。
 * 每一列 = 一份問卷，每一欄 = 一個問題（中文欄位名稱）。
 */
export function toExportRows(rows: SurveyRecord[]) {
  return rows.map((r) => {
    const p = followupPriority(r)
    return {
      填寫時間: formatDateTime(r.created_at),
      家長稱呼: r.parent_name,
      孩子稱呼: r.child_name,
      最符合孩子需求的特色: label('q1', r.q1_feature),
      孩子7日後的變化: label('q2', r.q2_change),
      其他回答_變化: r.q2_other ?? '',
      期待的改變: label('q3', r.q3_expectation),
      其他回答_期待: r.q3_other ?? '',
      繼續使用意願: intentLabel(r.q4_purchase_intent),
      主要疑慮: label('q5', r.q5_objection),
      其他回答_疑慮: r.q5_other ?? '',
      後續協助需求: label('q6', r.q6_followup),
      其他回答: [r.q2_other, r.q3_other, r.q5_other].filter(Boolean).join('；'),
      家長回饋: r.feedback ?? '',
      活動梯次: r.batch,
      資料來源: r.source ?? 'line',
      Lead分類: r.lead_status || '',
      跟進優先: p.label,
      跟進狀態: r.followup_status,
      ID: r.id,
    }
  })
}

function intentLabel(intent: string): string {
  return INTENT_LABEL[intent as keyof typeof INTENT_LABEL] ?? intent
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  // 以台灣時間 (Asia/Taipei, UTC+8) 顯示，避免時區造成匯出欄位混亂
  const tw = new Date(d.getTime() + 8 * 60 * 60 * 1000)
  return `${tw.getUTCFullYear()}-${pad(tw.getUTCMonth() + 1)}-${pad(tw.getUTCDate())} ${pad(tw.getUTCHours())}:${pad(tw.getUTCMinutes())}`
}

/** 匯出 Excel (.xlsx) */
export function exportExcel(rows: SurveyRecord[]) {
  const data = toExportRows(rows)
  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [
    { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 34 }, { wch: 34 }, { wch: 30 },
    { wch: 34 }, { wch: 30 }, { wch: 34 }, { wch: 34 }, { wch: 30 }, { wch: 34 },
    { wch: 40 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 10 },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '問卷結果')
  XLSX.writeFile(wb, `ienglish-7day-survey-${today()}.xlsx`)
}

/** 匯出 CSV */
export function exportCSV(rows: SurveyRecord[]) {
  const data = toExportRows(rows)
  const ws = XLSX.utils.json_to_sheet(data)
  const csv = XLSX.utils.sheet_to_csv(ws)
  // BOM 讓 Excel 開啟中文正常；換行用 \r\n
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ienglish-7day-survey-${today()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function today() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
}