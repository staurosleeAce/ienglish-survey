import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CompletionModal } from '../components/CompletionModal'
import {
  QUESTIONS,
  normalizeBatch,
  OPTION_OTHER_KEY,
} from '../data/survey'
import { submitResponse } from '../lib/api'
import { looksLikeSpam } from '../lib/sanitize'
import type { Answers, Q4Intent, SurveyQuestion } from '../types'
import { emptyAnswers } from '../types'

type Step =
  | 'landing'
  | 'identity'
  | 'q1'
  | 'q2'
  | 'q3'
  | 'q4'
  | 'q5'
  | 'q6'
  | 'feedback'
  | 'done'

const QUESTION_STEPS: Step[] = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6']

const STEP_EYEBROW: Record<string, string> = {
  q1: '回顧這 7 天',
  q2: '孩子的變化',
  q3: '期待的事',
  q4: '關於下一步',
  q5: '想先釐清的事',
  q6: '我們怎麼陪你',
}

export function SurveyPage() {
  const [params] = useSearchParams()
  // 同時相容：真 query（?batch=）與 HashRouter 內 query（#/?batch=）
  const hash = window.location.hash
  const qIdx = hash.indexOf('?')
  const hashParams = new URLSearchParams(qIdx >= 0 ? hash.slice(qIdx + 1) : '')
  const batchParam = hashParams.get('batch') ?? params.get('batch')
  const srcParam = hashParams.get('src') ?? params.get('src')
  const batch = normalizeBatch(batchParam)
  const source = (srcParam ?? 'line').slice(0, 40)

  const [step, setStep] = useState<Step>('landing')
  const [answers, setAnswers] = useState<Answers>(emptyAnswers())
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const startedAtRef = useRef<number>(0)

  const showQuestionIndex = QUESTION_STEPS.indexOf(step)
  const question =
    showQuestionIndex >= 0 ? (QUESTIONS[showQuestionIndex] ?? null) : null

  const questionValue = (q: SurveyQuestion | null): string =>
    q ? String(answers[q.id as keyof Answers] ?? '') : ''
  const otherValue = (q: SurveyQuestion | null): string =>
    q ? String((answers[`${q.id}Other` as keyof Answers] as string) ?? '') : ''

  const setAnswer = (key: keyof Answers, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    setError('')
  }

  const targetStep = (fromIndex: number): Step =>
    fromIndex + 1 >= QUESTION_STEPS.length ? 'feedback' : (QUESTION_STEPS[fromIndex + 1] as Step)

  const validateQuestion = (q: SurveyQuestion): boolean => {
    const val = questionValue(q)
    if (!val) {
      setError('請先選擇一個選項再繼續。')
      return false
    }
    if (val === OPTION_OTHER_KEY && !otherValue(q).trim()) {
      setError('請填寫「其他」的內容再繼續。')
      return false
    }
    setError('')
    return true
  }

  const handleStart = () => {
    startedAtRef.current = Date.now()
    setStep('identity')
  }

  const handleIdentityNext = () => {
    if (!answers.parentName.trim()) {
      setError('請告訴我們怎麼稱呼您（例如：Miffy媽咪）')
      return
    }
    if (!answers.childName.trim()) {
      setError('請告訴我們孩子的稱呼（例如：Miffy）')
      return
    }
    setError('')
    setStep('q1')
  }

  const handleOptionSelect = (key: string) => {
    if (!question) return
    const needsOther = key === OPTION_OTHER_KEY
    setAnswer(question.id as keyof Answers, key)
    if (needsOther) return
    // 自動進入下一題（手機 UX：不需要一直找「下一步」按鈕）
    window.setTimeout(
      () => setStep(targetStep(showQuestionIndex)),
      260,
    )
  }

  const goNext = () => {
    if (step === 'identity') {
      handleIdentityNext()
    } else if (question) {
      if (validateQuestion(question)) {
        setStep(targetStep(showQuestionIndex))
      }
    }
  }

  const goBack = () => {
    setError('')
    if (step === 'identity') setStep('landing')
    else if (showQuestionIndex === 0) setStep('identity')
    else if (showQuestionIndex > 0) setStep(QUESTION_STEPS[showQuestionIndex - 1])
    else if (step === 'feedback') setStep('q6')
  }

  const handleSubmit = async () => {
    if (submitting) return
    // 基本防 spam
    if (looksLikeSpam(answers.feedback, answers.parentName)) {
      setError('謝謝您的回饋，內容似乎包含不正常的格式，請調整後再送出。')
      return
    }
    // 快速提交防護
    if (Date.now() - startedAtRef.current < 5000) {
      setError('您填寫得有點快，請再稍等一下。')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const { id } = await submitResponse({
        parentName: answers.parentName,
        childName: answers.childName,
        q1_feature: answers.q1,
        q2_change: answers.q2,
        q2_other: answers.q2Other,
        q3_expectation: answers.q3,
        q3_other: answers.q3Other,
        q4_purchase_intent: answers.q4 as Q4Intent,
        q5_objection: answers.q5,
        q5_other: answers.q5Other,
        q6_followup: answers.q6,
        feedback: answers.feedback,
        batch,
        source,
      })
      if (id) console.debug('submitted id:', id)
      setSubmitted(true)
      setStep('done')
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'duplicate') {
        setSubmitted(true)
        setStep('done')
        return
      }
      if (msg === 'supabase_not_configured') {
        setError('系統尚未完成設定，暫時無法接收問卷。請稍後再試，謝謝。')
        return
      }
      if (msg === 'Failed to fetch' || msg.includes('NetworkError')) {
        setError('網路好像不太穩定，您的內容都已保留，請再送出一次。')
        return
      }
      setError('不好意思，問卷送出時遇到了一點問題，請稍後再試。')
    } finally {
      setSubmitting(false)
    }
  }

  // ---------- Landing ----------
  if (step === 'landing') {
    return (
      <div className="page">
        <div className="app">
          <BrandBar />
          <main className="landing">
            <div className="landing-hero">
              <div className="landing-art">📖</div>
              <span className="landing-badge">
                <span className="dot">🕊️</span> 7 日英語閱讀口說營 · 結營問卷
              </span>
              <h1 className="landing-title">
                這 7 天，孩子的英語學習
                <br />
                <span className="em">有什麼不一樣？</span>
              </h1>
              <p className="landing-sub">謝謝你陪孩子一起走完 7 日英語閱讀口說營。</p>
            </div>

            <div className="landing-card">
              <p>
                這份小問卷大約需要 <strong>1～2 分鐘</strong>
                ，我們想知道：這 7 天裡，您看見了孩子什麼樣的變化？
              </p>
              <p>您的回答，也會幫助我們更了解孩子接下來適合怎麼學習。</p>
              <p>讓我們一起回頭看看，這 7 天孩子走了多遠。</p>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: 18 }}>
              <button className="btn btn--primary btn--block" onClick={handleStart}>
                開始回顧孩子的 7 天 ✨
              </button>
              <p className="landing-note">
                <span className="dot">●</span> 約需 1～2 分鐘
                <span className="dot">●</span> 單選題，很快就能完成 · 不需填寫真實姓名
              </p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const isReviewStep = step === 'feedback' || step === 'done'
  const qIndex = showQuestionIndex

  return (
    <div className="page">
      <div className="app">
        <BrandBar />

        <div className="survey">
          {!isReviewStep && (
            <div className="progress-head">
              <div className="progress-meta">
                {step === 'identity' ? (
                  <span className="step">先認識您</span>
                ) : (
                  <span className="step">第 {qIndex + 1} / 6 題</span>
                )}
                <span className="percent">
                  {step === 'identity' ? '0%' : `${Math.round((qIndex / 6) * 100)}%`}
                </span>
              </div>
              {step === 'identity' ? (
                <div className="progress-steps">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <span key={i} className="progress-step" />
                  ))}
                </div>
              ) : (
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${(qIndex / 6) * 100}%` }}
                  />
                </div>
              )}
            </div>
          )}

          <div className="survey-stage" key={step}>
            {error && (
              <div className="banner banner--err" role="alert">
                <span>⚠️</span> {error}
              </div>
            )}

            {step === 'identity' && (
              <div style={{ marginTop: 8 }}>
                <p className="q-eyebrow">先認識您</p>
                <h2 className="q-title" style={{ margin: 0 }}>
                  我們沒有要問真實姓名，
                  <br />
                  只想知道怎麼稱呼您和孩子 😊
                </h2>
                <p className="q-hint">這些資料會用於後續問卷辨識與顯示個人化結果。</p>

                <div style={{ marginTop: 26 }}>
                  <div className="field">
                    <label className="field-label">
                      您希望我們怎麼稱呼您？<span className="req">*</span>
                    </label>
                    <input
                      className="field-input"
                      type="text"
                      value={answers.parentName}
                      maxLength={40}
                      placeholder="例如：Miffy媽咪、安安媽咪、樂樂爸爸"
                      onChange={(e) => setAnswer('parentName', e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label className="field-label">
                      孩子怎麼稱呼呢？<span className="req">*</span>
                    </label>
                    <input
                      className="field-input"
                      type="text"
                      value={answers.childName}
                      maxLength={40}
                      placeholder="例如：Miffy、安安、樂樂"
                      onChange={(e) => setAnswer('childName', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {question && (
              <div style={{ marginTop: 8 }}>
                <div className="q-eyebrow">{STEP_EYEBROW[question.id]}</div>
                <h2 className="q-title">{question.title}</h2>
                {question.hint && <p className="q-hint">{question.hint}</p>}

                <div className="q-list">
                  {question.options.map((opt) => {
                    const selected = questionValue(question) === opt.key
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        className={`opt ${selected ? 'selected' : ''}`}
                        onClick={() => handleOptionSelect(opt.key)}
                      >
                        <span className="opt-icon">{opt.icon}</span>
                        <span className="opt-label">{opt.label}</span>
                        <span className="opt-check">✓</span>
                      </button>
                    )
                  })}

                  {question.allowsOther && (
                    <button
                      type="button"
                      className={`opt ${questionValue(question) === OPTION_OTHER_KEY ? 'selected' : ''}`}
                      onClick={() => handleOptionSelect(OPTION_OTHER_KEY)}
                    >
                      <span className="opt-icon">✏️</span>
                      <span className="opt-label">其他</span>
                      <span className="opt-check">✓</span>
                    </button>
                  )}
                </div>

                {questionValue(question) === OPTION_OTHER_KEY && (
                  <div className="field-other">
                    <input
                      className="field-input"
                      type="text"
                      maxLength={200}
                      placeholder="請填寫您的想法…"
                      value={otherValue(question)}
                      onChange={(e) =>
                        setAnswer(`${question.id}Other` as keyof Answers, e.target.value)
                      }
                    />
                  </div>
                )}
              </div>
            )}

            {step === 'feedback' && (
              <div style={{ marginTop: 8 }}>
                <div className="q-eyebrow">開放回饋（選填）</div>
                <h2 className="q-title">還有什麼想跟小 i 說的嗎？</h2>
                <textarea
                  className="feedback-box"
                  rows={5}
                  maxLength={2000}
                  placeholder="不論是孩子這 7 天的表現、使用上的感受，或是您還想了解的事情，都歡迎告訴我們。"
                  value={answers.feedback}
                  onChange={(e) => setAnswer('feedback', e.target.value)}
                />
                <p className="feedback-hint">{answers.feedback.length} / 2000</p>
              </div>
            )}
          </div>

          <div className="survey-footer">
            {step === 'feedback' ? (
              <button
                className="btn btn--primary btn--block"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner" /> 問卷整理中…
                  </>
                ) : (
                  <>完成問卷 ✨</>
                )}
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn--ghost" onClick={goBack} style={{ minWidth: 92 }}>
                  ← 上一題
                </button>
                <button className="btn btn--primary" style={{ flex: 1 }} onClick={goNext}>
                  下一題 →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {step === 'done' && submitted && (
        <CompletionModal
          q4={answers.q4}
          q6={answers.q6}
          childName={answers.childName}
          batch={batch}
        />
      )}
    </div>
  )
}

function BrandBar() {
  return (
    <header className="brand-bar">
      <span className="brand-logo">📚</span>
      <span>
        <span className="brand-name">iEnglish 台灣</span>
        <br />
        <span className="brand-tag">7 日英語閱讀口說營 · 結營問卷</span>
      </span>
    </header>
  )
}