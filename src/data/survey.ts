import type { Q4Intent, SurveyQuestion } from '../types'

export const CAMPAIGN = '7day_english_camp'

export const DEFAULT_BATCH = '2026-10-06'

export const BATCHES = ['2026-10-06', '2026-10-20', '2026-11-10']

export function normalizeBatch(raw: string | null | undefined): string {
  const value = (raw ?? '').trim()
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return DEFAULT_BATCH
}

export const OPTION_OTHER_KEY = 'other'

export const QUESTIONS: SurveyQuestion[] = [
  {
    id: 'q1',
    field: 'q1_feature',
    title: '這 7 天實際體驗下來，您覺得小 i 哪一個特色最符合孩子目前的需要？',
    options: [
      { key: 'smart_level', label: '會依孩子程度，智能安排適合的內容', icon: '🎯' },
      { key: 'daily_habit', label: '每天都有機會接觸英文，慢慢建立習慣', icon: '🗓️' },
      { key: 'variety', label: '有很多不同類型的英文內容可以閱讀', icon: '📚' },
      { key: 'speaking', label: '透過聽、跟讀與語音練習，幫助孩子開口', icon: '🎤' },
      { key: 'self_operate', label: '孩子可以自己操作，不需要家長一直陪在旁邊', icon: '🙌' },
      { key: 'observing', label: '目前還在觀察，還沒有特別明顯的感受', icon: '🔍' },
    ],
  },
  {
    id: 'q2',
    field: 'q2_change',
    title: '經過這 7 天，您覺得孩子在哪一方面出現了比較明顯的變化？',
    options: [
      { key: 'initiative', label: '願意主動拿起小 i', icon: '🌟' },
      { key: 'willing', label: '比較願意接觸英文', icon: '😊' },
      { key: 'reading', label: '閱讀時間或閱讀量增加', icon: '📖' },
      { key: 'speaking', label: '願意跟著英文一起說／跟讀', icon: '🗣️' },
      { key: 'confidence', label: '對英文內容的理解比較有信心', icon: '💪' },
      { key: 'habit', label: '開始養成每天接觸英文的習慣', icon: '⏰' },
      { key: 'no_change', label: '暫時還看不出明顯變化', icon: '🤔' },
    ],
    allowsOther: true,
  },
  {
    id: 'q3',
    field: 'q3_expectation',
    title: '如果孩子繼續使用小 i，您最期待它可以幫孩子做到哪一件事？',
    options: [
      { key: 'daily_habit', label: '建立每天接觸英文的習慣', icon: '🌅' },
      { key: 'read_more', label: '增加英文閱讀量與詞彙量', icon: '📈' },
      { key: 'speak_out', label: '讓孩子更敢開口說英文', icon: '🎙️' },
      { key: 'self_learn', label: '讓孩子可以自己學，不需要家長一直陪', icon: '🧒' },
      { key: 'right_level', label: '找到適合孩子程度的英文學習方式', icon: '🧩' },
      { key: 'less_resist', label: '希望孩子對英文不再那麼排斥', icon: '🌈' },
      { key: 'no_expect', label: '目前還沒有特別期待', icon: '🍀' },
    ],
    allowsOther: true,
  },
  {
    id: 'q4',
    field: 'q4_purchase_intent',
    title: '7 日體驗結束後，如果希望孩子繼續使用小 i，您目前的想法比較接近哪一種？',
    options: [
      { key: 'info', label: '想進一步了解正式使用方式', icon: '🔍' },
      { key: 'compare', label: '有興趣，但想先多了解、比較看看', icon: '⚖️' },
      { key: 'questions', label: '有興趣，但目前還有一些疑問想確認', icon: '❓' },
      { key: 'want_results', label: '想先看看孩子完整的 7 日成果', icon: '📊' },
      { key: 'not_now', label: '目前先不考慮', icon: '💤' },
    ],
  },
  {
    id: 'q5',
    field: 'q5_objection',
    title: '如果目前還沒有決定繼續使用，您還有哪些事情想先了解呢？',
    multi: true,
    options: [
      { key: 'time', label: '每天需要使用多久？如何安排家庭作息？', icon: '⏱️' },
      { key: 'observe', label: '想再觀察孩子的學習狀況', icon: '👀' },
      { key: 'fit', label: '想確認小 i 是否真的適合我的孩子', icon: '🎯' },
      { key: 'plan_cost', label: '想了解正式方案與費用', icon: '💰' },
      { key: 'child_willing', label: '孩子目前還沒有很明確的使用意願', icon: '🤷' },
      { key: 'parent_time', label: '擔心自己沒有時間陪伴孩子', icon: '🕰️' },
      { key: 'results', label: '想了解孩子 7 日體驗的完整學習成果', icon: '📊' },
    ],
    allowsOther: true,
  },
  {
    id: 'q6',
    field: 'q6_followup',
    title: '如果您希望進一步了解，接下來最希望我們提供哪些協助呢？',
    multi: true,
    options: [
      { key: 'agent', label: '希望有專人跟我說明正式使用方式', icon: '🤝' },
      { key: 'results', label: '想先看看孩子的 7 日學習成果', icon: '📈' },
      { key: 'plan', label: '想了解適合孩子的正式方案', icon: '📋' },
      { key: 'consult', label: '我有問題想先詢問客服／顧問', icon: '💬' },
      { key: 'none', label: '目前想先自己了解看看', icon: '🍃' },
    ],
  },
]

export function findOptionLabel(questionId: string, key: string): string {
  const q = QUESTIONS.find((item) => item.id === questionId)
  const opt = q?.options.find((o) => o.key === key)
  return opt ? opt.label : key
}

/** 多選欄位：將多個 key 轉成中文 label，以「；」串接 */
export function findOptionLabels(questionId: string, keys: string[]): string {
  return (keys ?? [])
    .map((k) => {
      if (k === OPTION_OTHER_KEY) return '其他'
      return findOptionLabel(questionId, k)
    })
    .join('；')
}

export function getQuestion(field: string): SurveyQuestion | undefined {
  return QUESTIONS.find((q) => q.field === field)
}

/** Intent 代碼 <-> 顯示用文案 */
export const INTENT_LABEL: Record<Q4Intent, string> = {
  info: '想進一步了解正式使用方式',
  compare: '有興趣，但想先多了解、比較看看',
  questions: '有興趣，但目前還有一些疑問想確認',
  want_results: '想先看看孩子完整的 7 日成果',
  not_now: '目前先不考慮',
}

export const INTENT_ICON: Record<Q4Intent, string> = {
  info: '💬',
  compare: '💬',
  questions: '💬',
  want_results: '📊',
  not_now: '🍃',
}

/**
 * 官方 LINE 入口（由環境變數設定，非 hard-code）。
 * 不同活動梯次可個別覆寫（擴充點）：VITE_LINE_URL_BATCH_2026-10-06 等。
 */
export function lineUrlForBatch(batch: string): string {
  const batchOverride = getBatchOverride(batch)
  if (batchOverride) return batchOverride
  return officialLineUrl
}

const officialLineUrl = envLineUrl()
const LINE_URL_CACHE = new Map<string, string>()

function envLineUrl(): string {
  const custom = import.meta.env.VITE_LINE_OFFICIAL_URL as string | undefined
  return (custom || 'https://lin.ee/dXPhchf').trim()
}

// 支援依梯次覆寫：VITE_LINE_URL_BATCH_2026-10-06 = https://...
function getBatchOverride(batch: string): string | null {
  if (LINE_URL_CACHE.has(batch)) return LINE_URL_CACHE.get(batch)!
  const key = `VITE_LINE_URL_BATCH_${batch}`
  const value = import.meta.env[key] as string | undefined
  if (value && value.trim()) {
    LINE_URL_CACHE.set(batch, value.trim())
    return value.trim()
  }
  LINE_URL_CACHE.set(batch, '')
  return null
}

export { LINE_URL_CACHE }