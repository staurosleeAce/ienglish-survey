import { useRef, useState } from 'react'
import { SUPER_PROJECT_ID } from '../data/projects'
import { submitSuperClosingResponse } from '../lib/api'

type Step = 'landing' | 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q6' | 'q7' | 'done'
const STEPS: Step[] = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7']

type Answers = {
  ages: string[]
  agesOther: string
  biggestGain: string[]
  biggestGainOther: string
  expectation: string
  futureInterest: string
  nextTopic: string[]
  nextTopicOther: string
  feedback: string
  action: string
}

const empty = (): Answers => ({
  ages: [],
  agesOther: '',
  biggestGain: [],
  biggestGainOther: '',
  expectation: '',
  futureInterest: '',
  nextTopic: [],
  nextTopicOther: '',
  feedback: '',
  action: '',
})

const AGE_OPTIONS = [
  ['3_6', '3–6 歲（幼兒園）', '🌱'],
  ['7_9', '7–9 歲（國小低年級）', '📚'],
  ['10_12', '10–12 歲（國小高年級）', '🌟'],
  ['13_15', '13–15 歲（國中）', '🧭'],
  ['16_18', '16–18 歲（高中）', '🚀'],
  ['other', '其他', '✏️'],
] as const

const GAIN_OPTIONS = [
  ['stable', '心裡穩定了，能放鬆一些', '🌿'],
  ['see_self_child', '照見自己，也看見孩子', '💛'],
  ['accompany', '3 不陪、3 要陪的陪伴方法', '🤝'],
  ['ai_family', 'AI 快速變化的時代，家庭可以給孩子什麼', '💡'],
  ['experience', 'Eric 和 Kelin 的真實經驗', '🎤'],
  ['other', '其他', '✏️'],
] as const

const TOPIC_OPTIONS = [
  ['prompting', '孩子拖延、一直要催', '⏰'],
  ['communication', '親子溝通，一談學習就吵', '💬'],
  ['screen_ai', '手機、3C 和 AI', '📱'],
  ['english', '英語自學怎麼開始', '📖'],
  ['habit', '陪孩子養成好習慣', '🌱'],
  ['parenting', '夫妻在教養上不一樣怎麼辦', '🤝'],
  ['emotion', '照顧好自己、媽媽的情緒', '🫶'],
  ['other', '其他', '✏️'],
] as const

export function SuperClosingSurveyPage() {
  const [step, setStep] = useState<Step>('landing')
  const [answers, setAnswers] = useState<Answers>(empty())
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const startedAt = useRef(0)

  const update = <K extends keyof Answers>(key: K, value: Answers[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    setError('')
  }

  const toggle = (key: 'ages' | 'biggestGain' | 'nextTopic', value: string, limit?: number) => {
    const current = answers[key]
    if (current.includes(value)) update(key, current.filter((v) => v !== value))
    else if (!limit || current.length < limit) update(key, [...current, value])
    else setError(`這一題最多選擇 ${limit} 個選項。`)
  }

  const next = () => {
    setError('')
    if (step === 'q1' && answers.ages.length === 0) return setError('請至少選擇一個孩子年齡。')
    if (step === 'q1' && answers.ages.includes('other') && !answers.agesOther.trim()) return setError('請填寫其他年齡。')
    if (step === 'q2' && answers.biggestGain.length === 0) return setError('請至少選擇一項收穫。')
    if (step === 'q2' && answers.biggestGain.includes('other') && !answers.biggestGainOther.trim()) return setError('請填寫其他收穫。')
    if (step === 'q3' && !answers.expectation) return setError('請選擇一個最符合的選項。')
    if (step === 'q4' && !answers.futureInterest) return setError('請選擇一個最符合的選項。')
    if (step === 'q5' && answers.nextTopic.length === 0) return setError('請至少選擇一個想聽的話題。')
    if (step === 'q5' && answers.nextTopic.includes('other') && !answers.nextTopicOther.trim()) return setError('請填寫其他話題。')
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
      await submitSuperClosingResponse({
        projectId: SUPER_PROJECT_ID,
        parentName: '',
        childAges: answers.ages,
        childAgesOther: answers.agesOther,
        biggestGain: answers.biggestGain,
        biggestGainOther: answers.biggestGainOther,
        expectation: answers.expectation,
        futureInterest: answers.futureInterest,
        nextTopic: answers.nextTopic,
        nextTopicOther: answers.nextTopicOther,
        feedback: answers.feedback,
        action: answers.action,
        batch: '2026-11-09',
      })
      setStep('done')
    } catch {
      setError('問券送出失敗，資料尚未儲存，請稍後再試。')
    } finally {
      setSubmitting(false)
    }
  }

  const leave = () => {
    setStep('landing')
    setAnswers(empty())
    setError('')
  }

  if (step === 'landing') {
    return (
      <div className="page super-project">
        <div className="app">
          <main className="landing">
            <div className="landing-hero super-hero">
              <img className="super-badge" src="./super-parent-badge.png" alt="平凡爸媽很 Super" />
              <span className="landing-badge">🕊 7 天陪伴｜第 1 期・結束問券</span>
              <h1 className="landing-title">
                謝謝您今天來 💛
                <br />
                <span className="em">花一分鐘跟我們說說你的感受，也讓我們做得更好</span>
              </h1>
              <p className="landing-sub">
                你的每一句回饋，我們都會認真看。
                <br />
                填完就能掃碼加 LINE，收到更多陪伴的內容。
              </p>
            </div>
            <div className="landing-card">
              <p className="super-brand-line">平凡爸媽很 Super × 為愛發光教育團隊</p>
            </div>
            <div style={{ marginTop: 'auto', paddingTop: 18 }}>
              <button className="btn btn--primary btn--block" onClick={() => { startedAt.current = Date.now(); setStep('q1') }}>
                開始填寫 ✨
              </button>
              <p className="landing-note">約 1 分鐘・大多是選擇題・不需要填真實姓名</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="page super-project">
        <div className="app">
          <main className="landing super-complete">
            <div className="landing-card">
              <img className="super-badge super-badge-small" src="./super-parent-badge.png" alt="平凡爸媽很 Super" />
              <h1 className="modal-title">謝謝你，我們收到了 💛</h1>
              <p className="modal-body">
                希望今天的收穫，能陪你帶回家、變成行動。知行合一，就會長出力量。
                <br /><br />
                掃碼加 LINE「平凡爸媽很 Super」，接收更多信息：下一場講座的消息、陪伴的內容，也可以直接跟團隊聊聊。
              </p>
              <img className="super-community-qr" src="./super-community-qr.png" alt="平凡爸媽很 Super LINE QR Code" />
              <a className="btn btn--primary btn--block" href="https://line.me/R/ti/p/@609lyomk" target="_blank" rel="noopener noreferrer">加入 LINE</a>
              <ul className="super-notes">
                <li>傳「陪我用」：收到練習單，一起參加講座限定「Super7天陪伴營」（11/9 進群）</li>
                <li>點選單「Kelin Letter」：領 Super 陪伴卡電子檔</li>
              </ul>
              <p className="super-brand-line">平凡爸媽很 Super × 為愛發光教育團隊</p>
              <button className="btn btn--ghost btn--block modal-exit" onClick={leave}>離開此頁面</button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const qIndex = STEPS.indexOf(step)
  const stage = qIndex < 2 ? 30 : qIndex < 4 ? 60 : 90
  const options = step === 'q1' ? AGE_OPTIONS : step === 'q2' ? GAIN_OPTIONS : step === 'q5' ? TOPIC_OPTIONS : []
  const selected = step === 'q1' ? answers.ages : step === 'q2' ? answers.biggestGain : answers.nextTopic
  const setOptions = step === 'q1' ? (key: string) => toggle('ages', key) : step === 'q2' ? (key: string) => toggle('biggestGain', key) : (key: string) => toggle('nextTopic', key)
  const isOther = selected.includes('other')
  const otherValue = step === 'q1' ? answers.agesOther : step === 'q2' ? answers.biggestGainOther : answers.nextTopicOther
  const setOtherValue = (value: string) => update(step === 'q1' ? 'agesOther' : step === 'q2' ? 'biggestGainOther' : 'nextTopicOther', value)

  return (
    <div className="page super-project">
      <div className="app">
        <header className="brand-bar super-header">
          <img className="super-header-badge" src="./super-parent-badge.png" alt="平凡爸媽很 Super" />
          <span className="super-header-name">平凡爸媽很 Super｜7 天陪伴・第 1 期・結束問券</span>
        </header>
        <div className="survey">
          <div className="progress-head">
            <div className="progress-meta"><span className="step">第 {qIndex + 1} / 7 題</span><span className="percent">{stage}%</span></div>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${stage}%` }} /></div>
          </div>
          <div className="survey-stage" key={step}>
            {error && <div className="banner banner--err" role="alert">⚠️ {error}</div>}
            {step === 'q6' || step === 'q7' ? (
              <div className="super-question">
                <p className="q-eyebrow">第三段｜下一次，和回家後</p>
                <h2 className="q-title">{step === 'q6' ? '有什麼想跟我們說的嗎？' : '用一句話寫下，今天想帶回家試試的一件事'}</h2>
                <p className="q-hint">{step === 'q6' ? '不論是鼓勵還是建議，我們都很想聽你說 😊' : '寫下來，比較容易真的去做。想有人陪你試，完成後加 LINE 傳「陪我用」'}</p>
                <textarea className="feedback-box" value={step === 'q6' ? answers.feedback : answers.action} placeholder={step === 'q6' ? '想說的話（選填）' : '寫下一件你想帶回家試試的事（選填）'} onChange={(e) => update(step === 'q6' ? 'feedback' : 'action', e.target.value)} />
              </div>
            ) : (
              <div className="super-question">
                <p className="q-eyebrow">{step === 'q1' ? '第一段｜先認識你' : step === 'q2' ? '第二段｜今天的講座' : '第三段｜下一次，和回家後'}</p>
                <h2 className="q-title">{step === 'q3' ? '今天的講座，符合你的期待嗎？' : step === 'q4' ? '之後還願意參加「平凡爸媽很 Super」的講座嗎？' : step === 'q1' ? '孩子的年齡' : step === 'q2' ? '今天最大的收穫是什麼？' : ''}</h2>
                <p className="q-hint">{step === 'q1' ? '家裡幾個孩子就勾幾個。' : step === 'q2' ? '可以複選，選擇最有感的收穫。' : ''}</p>
                {step === 'q3' || step === 'q4' ? (
                  <div className="q-list">
                    {(step === 'q3' ? [['better', '比我期待的還要好', '🌟'], ['match', '符合期待', '👍'], ['okay', '還可以', '🌿'], ['different', '跟我想的不太一樣', '🤔']] : [['yes', '願意，有消息請通知我', '📣'], ['maybe', '看主題再決定', '👀'], ['no', '暫時不會', '🍃']]).map(([key, label, icon]) => {
                      const active = (step === 'q3' ? answers.expectation : answers.futureInterest) === key
                      return <button key={key} className={`opt ${active ? 'selected' : ''}`} onClick={() => update(step === 'q3' ? 'expectation' : 'futureInterest', key)} type="button"><span className="opt-icon">{icon}</span><span className="opt-label">{label}</span><span className="opt-checkbox">{active && <span className="opt-checkbox-tick">✓</span>}</span></button>
                    })}
                  </div>
                ) : (
                  <div className="q-list">
                    {options.map(([key, label, icon]) => <button key={key} className={`opt multi ${selected.includes(key) ? 'selected' : ''}`} onClick={() => setOptions(key)} type="button"><span className="opt-icon">{icon}</span><span className="opt-label">{label}</span><span className="opt-checkbox">{selected.includes(key) && <span className="opt-checkbox-tick">✓</span>}</span></button>)}
                  </div>
                )}
                {isOther && step !== 'q3' && step !== 'q4' && <input className="field-input field-other" type="text" value={otherValue} placeholder="請填寫其他內容" onChange={(e) => setOtherValue(e.target.value)} />}
              </div>
            )}
          </div>
          <div className="survey-footer"><div style={{ display: 'flex', gap: 10 }}><button className="btn btn--ghost" onClick={back}>← 上一步</button><button className="btn btn--primary" style={{ flex: 1 }} onClick={() => step === 'q7' ? submit() : next()} disabled={submitting}>{submitting ? '整理中…' : step === 'q7' ? '完成問券' : '下一題 →'}</button></div></div>
        </div>
      </div>
    </div>
  )
}
