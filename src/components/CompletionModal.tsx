import { useEffect, useState } from 'react'
import type { Answers } from '../types'

export function CompletionModal({
  childName,
  onExit,
}: Pick<Answers, 'childName'> & {
  onExit?: () => void
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 120)
    return () => window.clearTimeout(t)
  }, [])

  if (!visible) return null

  return (
    <div className="modal-overlay">
      <div className="modal">
        <img
          className="modal-hero"
          src="./xiaoi-hero.png"
          alt="小 i 陪孩子一起學習"
        />
        <h2 className="modal-title">謝謝你陪孩子走完這 7 天！</h2>
        <p className="modal-body">
          {childName ? `${childName} 這 7 天，也許只是孩子英語學習旅程中的一小段，` : '這 7 天，也許只是孩子英語學習旅程中的一小段，'}
          {'\n'}
          但每一次願意拿起小 i、願意聽、願意讀、願意開口，
          {'\n'}
          都是孩子正在累積的力量。
          {'\n\n'}
          問券已成功送出，謝謝您的分享。
        </p>

        {onExit && (
          <button className="btn btn--primary btn--block modal-exit" onClick={onExit}>
            離開此頁面
          </button>
        )}

        <p className="modal-cta-note">
          <span>💚</span> 這份問券的回饋，都會成為小 i 更貼近孩子的養分。
        </p>
      </div>
    </div>
  )
}