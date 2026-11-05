import type { SurveyOption } from '../types'

export const ORIGINAL_PROJECT_ID = '7day_english_camp'
export const SUPER_PROJECT_ID = 'super_parents_7day_1'

export interface SuperQuestion {
  id: 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q6'
  title: string
  hint?: string
  options?: SurveyOption[]
  multi?: boolean
  required: boolean
}

export const SUPER_PROJECT = {
  id: SUPER_PROJECT_ID,
  name: '平凡爸媽很 Super｜7 天陪伴・第 1 期',
  batch: '2026-11-09',
  badge: '🕊 7 天陪伴｜第 1 期・小問券',
  title: '這 7 天，先陪自己看見什麼？',
  titleAccent: '也看見孩子',
  description: '這份小問券大約 1 分鐘，我們想先認識妳和孩子，這 7 天才陪得剛剛好。',
  note: '填完就會看到社群連結。11/9（一）晚上 9 點，我們一起翻第一張卡。',
  identityTitle: '讓我們更認識你和孩子',
  brandLine: '平凡爸媽很 Super × 為愛發光教育團隊',
  communityUrl: '',
  questions: [
    {
      id: 'q1',
      title: '我們怎麼稱呼妳？',
      required: true,
    },
    {
      id: 'q2',
      title: '你的 LINE 名稱或 LINE ID',
      hint: '讓我們在社群裡認得妳，有需要時也能一對一回你',
      required: true,
    },
    {
      id: 'q3',
      title: '孩子的年齡',
      hint: '家裡幾個孩子就勾幾個。',
      multi: true,
      required: true,
      options: [
        { key: '3_6', label: '3–6 歲（幼兒園）', icon: '🌱' },
        { key: '7_9', label: '7–9 歲（國小低年級）', icon: '📚' },
        { key: '10_12', label: '10–12 歲（國小高年級）', icon: '🌟' },
        { key: '13_15', label: '13–15 歲（國中）', icon: '🧭' },
        { key: '16_18', label: '16–18 歲（高中）', icon: '🚀' },
      ],
    },
    {
      id: 'q4',
      title: '最近陪孩子，最常讓妳卡住的是？',
      hint: '最多選 2 個。',
      multi: true,
      required: true,
      options: [
        { key: 'prompting', label: '一直要催，孩子才會動', icon: '⏰' },
        { key: 'argue', label: '一談學習就吵起來', icon: '🌧️' },
        { key: 'unmotivated', label: '孩子提不起勁、不想學', icon: '💭' },
        { key: 'screen_time', label: '手機、3C 時間', icon: '📱' },
        { key: 'parent_tired', label: '我自己很累、很焦慮', icon: '🫶' },
        { key: 'unclear', label: '還說不上來', icon: '🌿' },
      ],
    },
    {
      id: 'q5',
      title: '妳是從哪裡認識我們的？',
      multi: false,
      required: true,
      options: [
        { key: 'lecture', label: '11/7 講座', icon: '🎤' },
        { key: 'facebook', label: 'Facebook', icon: '📘' },
        { key: 'instagram', label: 'Instagram', icon: '📷' },
        { key: 'podcast', label: 'Podcast', icon: '🎧' },
        { key: 'friend', label: '朋友介紹', icon: '🤝' },
        { key: 'other', label: '其他', icon: '✏️' },
      ],
    },
    {
      id: 'q6',
      title: '還有想先跟我們說的嗎？',
      required: false,
    },
  ] as SuperQuestion[],
}

export interface ProjectTab {
  id: string
  name: string
}

export const PROJECT_TABS: ProjectTab[] = [
  { id: ORIGINAL_PROJECT_ID, name: '7 日英語閱讀口說營' },
  { id: SUPER_PROJECT_ID, name: SUPER_PROJECT.name },
]
