import * as XLSX from 'xlsx'
import { findOptionLabels } from '../data/survey'
import { followupPriority } from './api'
import type { SurveyRecord } from '../types'

/**
 * 將資料轉成適合客服/業務整理的資料列。
 * 每一列 = 一份問券，每一欄 = 一個問題（中文欄位名稱）。
 * 多選題以「；」串接呈現。
 */
export function toExportRows(rows: SurveyRecord[]) {
  return rows.map((r) => {
    const p = followupPriority(r)
    return {
      填寫時間: formatDateTime(r.created_at),
      家長稱呼: r.parent_name,
      孩子稱呼: r.child_name,
      最符合孩子需求的特色: findOptionLabels('q1', r.q1_feature ?? []),
      其他回答_特色: r.q1_other ?? '',
      孩子7日後的變化: findOptionLabels('q2', r.q2_change ?? []),
      其他回答_變化: r.q2_other ?? '',
      期待的改變: findOptionLabels('q3', r.q3_expectation ?? []),
      其他回答_期待: r.q3_other ?? '',
      希望提供的協助: findOptionLabels('q4', r.q4_assistance ?? []),
      其他回答_協助: r.q4_other ?? '',
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
    { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 34 }, { wch: 26 },
    { wch: 34 }, { wch: 26 }, { wch: 34 }, { wch: 26 }, { wch: 34 },
    { wch: 26 }, { wch: 40 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
    { wch: 12 }, { wch: 10 }, { wch: 10 },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '問券結果')
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