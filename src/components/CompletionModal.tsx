import { useEffect, useState } from 'react'
import { lineUrlForBatch } from '../data/survey'
import type { Q4Intent, Answers } from '../types'

interface CompletionCopy {
  heading: string
  body: string
  ctaTitle: string
  ctaLabel: string
  ctaKind: 'warm' | 'primary'
}

function ctaFor(q4: Q4Intent): CompletionCopy {
  switch (q4) {
    case 'info':
      return {
        heading: '想知道小 i 正式使用後，孩子會怎麼學嗎？',
        body: '',
        ctaTitle: '想知道小 i 正式使用後，孩子會怎麼學嗎？',
        ctaLabel: '💬 我想了解正式使用方式',
        ctaKind: 'warm',
      }
    case 'compare':
      return {
        heading: '多了解一些，再決定也沒關係。',
        body: '',
        ctaTitle: '多了解一些，再決定也沒關係。',
        ctaLabel: '💬 我想先了解更多',
        ctaKind: 'warm',
      }
    case 'questions':
      return {
        heading: '每個孩子的學習狀況都不一樣，如果您還有疑問，歡迎直接告訴我們。',
        body: '',
        ctaTitle: '每個孩子的學習狀況都不一樣，如果您還有疑問，歡迎直接告訴我們。',
        ctaLabel: '💬 我要詢問小 i 顧問',
        ctaKind: 'warm',
      }
    case 'want_results':
      return {
        heading: '先了解孩子這 7 天的學習狀況，再決定下一步。',
        body: '',
        ctaTitle: '先了解孩子這 7 天的學習狀況，再決定下一步。',
        ctaLabel: '📊 我想了解孩子的7日成果',
        ctaKind: 'primary',
      }
    case 'not_now':
      return {
        heading: '沒問題，學習這件事本來就值得好好想一想。',
        body:
          '未來如果還有任何關於孩子英語學習的問題，都歡迎再找我們聊聊。',
        ctaTitle: '',
        ctaLabel: '之後有需要再找我們',
        ctaKind: 'primary',
      }
  }
}

export function CompletionModal({
  q4,
  q6,
  childName,
  batch,
}: Pick<Answers, 'q4' | 'q6'> & { childName: string; batch: string }) {
  const [visible, setVisible] = useState(false)
  const cta = ctaFor(q4)
  const lineUrl = lineUrlForBatch(batch)

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 120)
    return () => window.clearTimeout(t)
  }, [])

  if (!visible) return null

  return (
    <div className={`modal-overlay ${visible ? '' : ''}`}>
      <div className="modal">
        <div className="modal-confetti">🎉</div>
        <h2 className="modal-title">謝謝你陪孩子走完這 7 天！</h2>
        <p className="modal-body">
          {childName ? `${childName} 這 7 天，也許只是孩子英語學習旅程中的一小段，` : '這 7 天，也許只是孩子英語學習旅程中的一小段，'}
          {'\n'}
          但每一次願意拿起小 i、願意聽、願意讀、願意開口，
          {'\n'}
          都是孩子正在累積的力量。
          {'\n\n'}
          如果你想知道，接下來小 i 可以怎麼陪孩子繼續學，歡迎直接和我們聊聊。
        </p>

        {cta.ctaTitle && (
          <div className="modal-cta-card">
            <p className="modal-cta-title">{cta.ctaTitle}</p>
            <a
              className={`btn ${cta.ctaKind === 'warm' ? 'btn--warm' : 'btn--primary'} btn--block`}
              href={lineUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {cta.ctaLabel}
            </a>
            {q6 === 'none' && (
              <p className="modal-cta-note">沒關係，之後想到隨時歡迎再來。</p>
            )}
          </div>
        )}

        {!cta.ctaTitle && (
          <div className="modal-cta-card">
            <p className="modal-cta-title">{cta.heading}</p>
            <p className="modal-cta-note" style={{ margin: '0 0 10px' }}>{cta.body}</p>
            <a
              className={`btn ${cta.ctaKind === 'warm' ? 'btn--warm' : 'btn--primary'} btn--block`}
              href={lineUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {cta.ctaLabel}
            </a>
          </div>
        )}

        <p className="modal-cta-note">
          <span>💚</span> 這份問卷的回饋，都會成為小 i 更貼近孩子的養分。
        </p>
      </div>
    </div>
  )
}