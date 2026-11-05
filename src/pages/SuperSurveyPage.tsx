import { useMemo, useRef, useState } from 'react'
import { SUPER_PROJECT, SUPER_PROJECT_ID } from '../data/projects'
import { submitSuperResponse } from '../lib/api'

type Step = 'landing' | 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q6' | 'done'
const STEPS: Step[] = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6']

type SuperAnswers = {
  parentName: string
  lineName: string
  ages: string[]
  stuck: string[]
  source: string
  sourceOther: string
  feedback: string
}

const empty = (): SuperAnswers => ({
  parentName: '', lineName: '', ages: [], stuck: [], source: '', sourceOther: '', feedback: '',
})

function stageFor(step: Step) {
  if (step === 'q1' || step === 'q2') return 25
  if (step === 'q3') return 50
  if (step === 'q4') return 75
  if (step === 'q5' || step === 'q6' || step === 'done') return 100
  return 0
}

export function SuperSurveyPage() {
  const [step, setStep] = useState<Step>('landing')
  const [answers, setAnswers] = useState<SuperAnswers>(empty())
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const startedAt = useRef(0)
  const question = useMemo(() => SUPER_PROJECT.questions.find((q) => q.id === step) ?? null, [step])

  const update = <K extends keyof SuperAnswers>(key: K, value: SuperAnswers[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    setError('')
  }

  const toggle = (key: 'ages' | 'stuck', value: string, limit?: number) => {
    const current = answers[key]
    if (current.includes(value)) update(key, current.filter((v) => v !== value))
    else if (!limit || current.length < limit) update(key, [...current, value])
    else setError(`這一題最多選擇 ${limit} 個選項。`)
  }

  const next = () => {
    setError('')
    if (step === 'q1' && !answers.parentName.trim()) return setError('請填寫我們怎麼稱呼妳。')
    if (step === 'q2' && !answers.lineName.trim()) return setError('請填寫 LINE 名稱或 LINE ID。')
    if (step === 'q3' && answers.ages.length === 0) return setError('請至少選擇一個孩子年齡。')
    if (step === 'q4' && answers.stuck.length === 0) return setError('請至少選擇一項最常卡住的地方。')
    if (step === 'q4' && answers.stuck.length > 2) return setError('這一題最多選擇 2 個選項。')
    if (step === 'q5' && !answers.source) return setError('請選擇認識我們的來源。')
    if (step === 'q5' && answers.source === 'other' && !answers.sourceOther.trim()) return setError('請填寫其他來源。')
    const index = STEPS.indexOf(step)
    setStep(index === STEPS.length - 1 ? 'done' : STEPS[index + 1])
  }

  const back = () => {
    const index = STEPS.indexOf(step)
    setError('')
    setStep(index <= 0 ? 'landing' : STEPS[index - 1])
  }

  const submit = async () => {
    if (Date.now() - startedAt.current < 3000) return setError('請再確認一下內容後送出。')
    setSubmitting(true)
    try {
      await submitSuperResponse({
        projectId: SUPER_PROJECT_ID,
        parentName: answers.parentName,
        lineName: answers.lineName,
        childAges: answers.ages,
        stuckPoints: answers.stuck,
        source: answers.source === 'other' ? answers.sourceOther : answers.source,
        feedback: answers.feedback,
        batch: SUPER_PROJECT.batch,
      })
      setStep('done')
    } catch {
      setError('問券送出失敗，資料尚未儲存，請稍後再試。')
    } finally {
      setSubmitting(false)
    }
  }

  const leave = () => { setStep('landing'); setAnswers(empty()); setError('') }

  if (step === 'landing') {
    return (
      <div className="page super-project"><div className="app"><main className="landing">
        <div className="landing-hero super-hero">
          <img className="super-badge" src="./super-parent-badge.png" alt="平凡爸媽很 Super" />
          <span className="landing-badge">{SUPER_PROJECT.badge}</span>
          <h1 className="landing-title">{SUPER_PROJECT.title}<br /><span className="em">{SUPER_PROJECT.titleAccent}</span></h1>
          <p className="landing-sub">{SUPER_PROJECT.description}</p>
        </div>
        <div className="landing-card"><p>{SUPER_PROJECT.note}</p><p className="super-brand-line">{SUPER_PROJECT.brandLine}</p></div>
        <div style={{ marginTop: 'auto', paddingTop: 18 }}>
          <button className="btn btn--primary btn--block" onClick={() => { startedAt.current = Date.now(); setStep('q1') }}>開始，認識一下 ✨</button>
          <p className="landing-note">約 1 分鐘・大多是選擇題・不需要填真實姓名</p>
        </div>
      </main></div></div>
    )
  }

  if (step === 'done') {
    const communityUrl = (import.meta.env.VITE_SUPER_COMMUNITY_URL as string | undefined)?.trim() ?? ''
    return (
      <div className="page super-project"><div className="app"><main className="landing super-complete"><div className="landing-card">
        <img className="super-badge super-badge-small" src="./super-parent-badge.png" alt="平凡爸媽很 Super" />
        <h1 className="modal-title">謝謝妳 💛 我們 11/9 見</h1>
        <p className="modal-body">問券已成功送出，期待和妳一起開始這 7 天的陪伴。</p>
        {communityUrl ? <a className="btn btn--primary btn--block" href={communityUrl} target="_blank" rel="noopener noreferrer">加入「7 天陪伴｜第 1 期」社群</a> : <p className="super-community-missing">社群連結尚未設定，請聯絡活動管理者。</p>}
        <ul className="super-notes"><li>可以用暱稱加入，只看不說也沒關係</li><li>11/8（日）晚上先打個招呼，11/9（一）21:00 翻第一張卡</li><li>還沒有練習單？到官方帳號傳「陪我用」</li></ul>
        <button className="btn btn--ghost btn--block modal-exit" onClick={leave}>離開此頁面</button>
        <p className="super-brand-line">{SUPER_PROJECT.brandLine}</p>
      </div></main></div></div>
    )
  }

  const progress = stageFor(step)
  const qIndex = STEPS.indexOf(step)
  return (
    <div className="page super-project"><div className="app">
      <header className="brand-bar super-header"><img className="super-header-badge" src="./super-parent-badge.png" alt="平凡爸媽很 Super" /><span className="super-header-name">{SUPER_PROJECT.name}</span></header>
      <div className="survey">
        <div className="progress-head"><div className="progress-meta"><span className="step">第 {Math.min(qIndex + 1, 6)} / 6 題</span><span className="percent">{progress}%</span></div><div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div></div>
        <div className="survey-stage" key={step}>
          {error && <div className="banner banner--err" role="alert">⚠️ {error}</div>}
          {question && <div className="super-question">
            <p className="q-eyebrow">{step === 'q1' || step === 'q2' ? '先認識你' : step === 'q3' ? '認識孩子' : '最想先解決的'}</p>
            <h2 className="q-title">{question.title}</h2>
            {question.hint && <p className="q-hint">{question.hint}</p>}
            {question.options ? <div className="q-list">{question.options.map((opt) => {
              const selected = step === 'q3' ? answers.ages.includes(opt.key) : step === 'q4' ? answers.stuck.includes(opt.key) : answers.source === opt.key
              return <button key={opt.key} className={`opt multi ${selected ? 'selected' : ''}`} onClick={() => step === 'q3' ? toggle('ages', opt.key) : step === 'q4' ? toggle('stuck', opt.key, 2) : update('source', opt.key)} type="button"><span className="opt-icon">{opt.icon}</span><span className="opt-label">{opt.label}</span><span className="opt-checkbox">{selected && <span className="opt-checkbox-tick">✓</span>}</span></button>
            })}</div> : <input className="field-input" type="text" value={step === 'q1' ? answers.parentName : answers.lineName} placeholder={step === 'q1' ? '例如 Amber 媽媽' : '讓我們在社群裡認得妳，有需要時也能一對一回你'} onChange={(e) => update(step === 'q1' ? 'parentName' : 'lineName', e.target.value)} />}
            {step === 'q5' && answers.source === 'other' && <input className="field-input field-other" type="text" value={answers.sourceOther} placeholder="請填寫其他來源" onChange={(e) => update('sourceOther', e.target.value)} />}
            {step === 'q6' && <textarea className="feedback-box" value={answers.feedback} placeholder="想說的話（選填）" onChange={(e) => update('feedback', e.target.value)} />}
          </div>}
        </div>
        <div className="survey-footer"><div style={{ display: 'flex', gap: 10 }}><button className="btn btn--ghost" onClick={back}>← 上一步</button><button className="btn btn--primary" style={{ flex: 1 }} onClick={() => step === 'q6' ? submit() : next()} disabled={submitting}>{submitting ? '整理中…' : step === 'q6' ? '完成問券' : '下一題 →'}</button></div></div>
      </div>
    </div></div>
  )
}
