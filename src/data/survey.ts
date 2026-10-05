import type { SurveyQuestion } from '../types'

export const CAMPAIGN = '7day_english_camp'

export const DEFAULT_BATCH = '2026-10-06'

export const BATCHES = ['2026-10-06', '2026-10-20', '2026-11-10']

export function normalizeBatch(raw: string | null | undefined): string {
  const value = (raw ?? '').trim()
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return DEFAULT_BATCH
}

export const OPTION_OTHER_KEY = 'other'

/** 全部題目皆為複選 */
export const QUESTIONS: SurveyQuestion[] = [
  {
    id: 'q1',
    field: 'q1_feature',
    title: '這 7 天實際體驗下來，您覺得小 i 哪一個特色最符合孩子目前的需要？',
    multi: true,
    options: [
      { key: 'smart_level', label: '會依孩子程度，智能安排適合的內容', icon: '🎯' },
      { key: 'daily_habit', label: '每天都有機會接觸英文，慢慢建立習慣', icon: '🗓️' },
      { key: 'variety', label: '有很多不同類型的英文內容可以閱讀', icon: '📚' },
      { key: 'speaking', label: '透過聽、跟讀與語音練習，幫助孩子開口', icon: '🎤' },
      { key: 'self_operate', label: '孩子可以自己操作，不需要家長一直陪在旁邊', icon: '🙌' },
      { key: 'observing', label: '目前還在觀察，還沒有特別明顯的感受', icon: '🔍' },
    ],
    allowsOther: true,
  },
  {
    id: 'q2',
    field: 'q2_change',
    title: '經過這 7 天，您覺得孩子在哪一方面出現了比較明顯的變化？',
    multi: true,
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
    multi: true,
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
    field: 'q4_assistance',
    title: '體驗7天後，如果希望孩子繼續使用小i，接下來您最希望我們提供哪一項協助呢？',
    hint: '（可複選）',
    multi: true,
    options: [
      { key: 'plan_cost', label: '想了解適合孩子的正式方案與費用', icon: '💰' },
      { key: 'results', label: '想了解孩子7日的學習成果', icon: '📊' },
      { key: 'agent', label: '希望專人說明正式使用方式', icon: '🤝' },
      { key: 'consult', label: '還有一些問題，希望與客服／顧問聊聊', icon: '💬' },
      { key: 'observe', label: '想再觀察孩子一段時間', icon: '👀' },
    ],
    allowsOther: true,
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

export function getQuestion(questionId: string): SurveyQuestion | undefined {
  return QUESTIONS.find((q) => q.id === questionId)
}