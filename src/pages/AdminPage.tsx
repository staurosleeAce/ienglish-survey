import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  adminIsAuthed,
  adminLogin,
  adminLogout,
  fetchResponses,
  fetchStats,
  followupPriority,
  updateFollowupStatus,
} from '../lib/api'
import { exportCSV, exportExcel } from '../lib/excel'
import { BATCHES, findOptionLabel, INTENT_LABEL, getQuestion } from '../data/survey'
import type { Q4Intent, SurveyRecord } from '../types'
import { FOLLOWUP_STATUS_LABEL } from '../types'
import { ResponseDetail } from '../components/ResponseDetail'

type StatusFilter = 'all' | SurveyRecord['followup_status']
type SortDir = 'asc' | 'desc'

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [loginUser, setLoginUser] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [loginError, setLoginError] = useState('')
  const [rows, setRows] = useState<SurveyRecord[]>([])
  const [search, setSearch] = useState('')
  const [batchFilter, setBatchFilter] = useState('all')
  const [intentFilter, setIntentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [detail, setDetail] = useState<SurveyRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<'none' | 'excel' | 'csv'>('none')
  const [stats, setStats] = useState<{
    total: number
    today: number
    week: number
    byIntent: Record<Q4Intent, number>
    consulted: number
  } | null>(null)

  const refresh = useCallback(async () => {
    const [list, s] = await Promise.all([fetchResponses(), fetchStats()])
    setRows(list)
    setStats(s)
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      const ok = await adminIsAuthed()
      if (!alive) return
      setAuthed(ok)
      if (ok) {
        try {
          await refresh()
        } catch {
          setLoginError('連線資料庫失敗，請確認 Supabase 設定與環境變數。')
          setAuthed(false)
        }
      }
      setLoading(false)
    })()
    return () => {
      alive = false
    }
  }, [refresh])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    const res = await adminLogin(loginUser.trim(), loginPass)
    if (res.ok) {
      setAuthed(true)
      setLoading(true)
      try {
        await refresh()
      } catch {
        setLoginError('登入成功，但讀取資料失敗。請確認後台帳號權限（survey_admins）與環境變數。')
        setAuthed(false)
      }
      setLoading(false)
    } else {
      setLoginError(res.error ?? '登入失敗')
    }
  }

  const handleLogout = async () => {
    await adminLogout()
    setAuthed(false)
    setRows([])
    setStats(null)
  }

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    return rows
      .filter((r) => (batchFilter === 'all' ? true : r.batch === batchFilter))
      .filter((r) => (intentFilter === 'all' ? true : r.q4_purchase_intent === intentFilter))
      .filter((r) => (statusFilter === 'all' ? true : r.followup_status === statusFilter))
      .filter((r) =>
        s
          ? [r.parent_name, r.child_name, r.feedback, r.q1_feature]
              .join(' ')
              .toLowerCase()
              .includes(s)
          : true,
      )
      .sort((a, b) => {
        const t = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        return sortDir === 'asc' ? t : -t
      })
  }, [rows, search, batchFilter, intentFilter, statusFilter, sortDir])

  const handleExport = async (kind: 'excel' | 'csv') => {
    setExporting(kind)
    try {
      const data = filtered.length ? filtered : await fetchResponses()
      if (kind === 'excel') exportExcel(data)
      else exportCSV(data)
    } catch (err) {
      window.alert('匯出失敗：' + (err instanceof Error ? err.message : '未知錯誤'))
    } finally {
      setExporting('none')
    }
  }

  const intentOptions = useMemo(
    () =>
      (Object.keys(INTENT_LABEL) as Q4Intent[]).map((k) => ({
        key: k,
        label: INTENT_LABEL[k],
      })),
    [],
  )

  // ---------- 登入畫面 ----------
  if (authed === false) {
    return (
      <div className="login-wrap">
        <div className="login-box">
          <span className="brand-logo">🔐</span>
          <h1 className="login-title">iEnglish 結營問卷 · 後台</h1>
          <form onSubmit={handleLogin}>
            <div className="field">
              <label className="field-label">帳號（或 Email）</label>
              <input
                className="field-input"
                type="text"
                autoComplete="username"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label">密碼</label>
              <input
                className="field-input"
                type="password"
                autoComplete="current-password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
              />
            </div>
            {loginError && (
              <div className="banner banner--err" role="alert">
                ⚠️ {loginError}
              </div>
            )}
            <button className="btn btn--primary btn--block" type="submit">
              登入後台
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (authed === null || loading) {
    return (
      <div className="login-wrap">
        <div className="spinner spinner--dark" />
      </div>
    )
  }

  // ---------- Dashboard ----------
  const batches = ['all', ...BATCHES]
  if (!batches.includes(batchFilter)) batches.push(batchFilter)

  return (
    <div className="admin-page">
      <div className="admin-shell">
        <div className="admin-topbar">
          <h1>📊 iEnglish 結營問卷 · 後台</h1>
          <div className="admin-actions">
            <button className="btn btn--ghost btn--sm" onClick={refresh}>
              ⟳ 重新整理
            </button>
            <button className="btn btn--ghost btn--sm" onClick={handleLogout}>
              登出
            </button>
          </div>
        </div>

        {/* 統計卡片 */}
        {stats && (
          <div className="stat-grid">
            <StatCard num={stats.total} label="總填寫數" />
            <StatCard num={stats.today} label="今日填寫" />
            <StatCard num={stats.week} label="本週填寫" />
            <StatCard num={stats.consulted} label="希望顧問聯繫" isGreen />
          </div>
        )}

        {/* 購買意願分布 */}
        {stats && (
          <div className="chart-block">
            <div className="chart-card">
              <h3>Q4 繼續使用意願分布</h3>
              <IntentDonut byIntent={stats.byIntent} total={stats.total} />
            </div>
          </div>
        )}

        {/* 各題分布 */}
        <div className="chart-block">
          {(['q1', 'q2', 'q3', 'q5', 'q6'] as const).map((qid) => (
            <QDistribution key={qid} qid={qid} rows={filtered} />
          ))}
        </div>

        {/* 工具列 */}
        <div className="admin-tools">
          <div className="admin-tool-row">
            <input
              className="admin-search"
              type="search"
              placeholder="🔎 搜尋家長稱呼、孩子稱呼、回饋內容…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="admin-select"
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
            >
              {batches.map((b) => (
                <option key={b} value={b}>
                  {b === 'all' ? '全部梯次' : `梯次 ${b}`}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-tool-row">
            <select
              className="admin-select"
              value={intentFilter}
              onChange={(e) => setIntentFilter(e.target.value)}
            >
              <option value="all">全部購買意願</option>
              {intentOptions.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              className="admin-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="all">全部跟進狀態</option>
              {(Object.keys(FOLLOWUP_STATUS_LABEL) as (keyof typeof FOLLOWUP_STATUS_LABEL)[]).map(
                (k) => (
                  <option key={k} value={k}>
                    {FOLLOWUP_STATUS_LABEL[k]}
                  </option>
                ),
              )}
            </select>
            <span style={{ flex: 1 }} />
            <button
              className="btn btn--primary btn--sm"
              onClick={() => handleExport('excel')}
              disabled={exporting !== 'none' || filtered.length === 0}
            >
              {exporting === 'excel' ? '匯出中…' : '📥 匯出 Excel'}
            </button>
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => handleExport('csv')}
              disabled={exporting !== 'none' || filtered.length === 0}
            >
              {exporting === 'csv' ? '匯出中…' : '📄 匯出 CSV'}
            </button>
          </div>
        </div>

        {/* 資料表 */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <p style={{ margin: 0 }}>
              {rows.length === 0 ? '目前還沒有問卷資料。' : '沒有符合條件的資料。'}
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="responses">
              <thead>
                <tr>
                  <th onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}>
                    ID {<span className="sort">{sortDir === 'asc' ? '△' : '▽'}</span>}
                  </th>
                  <th>填寫時間</th>
                  <th>家長稱呼</th>
                  <th>孩子稱呼</th>
                  <th>Q1</th>
                  <th>Q4 購買意願</th>
                  <th>Q6 後續需求</th>
                  <th>梯次</th>
                  <th>Lead</th>
                  <th>跟進排序</th>
                  <th>跟進狀態</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const p = followupPriority(r)
                  return (
                    <tr key={r.id} className="clickable" onClick={() => setDetail(r)}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {r.id.slice(0, 8)}
                      </td>
                      <td>{fmtDate(r.created_at)}</td>
                      <td>
                        <strong>{r.parent_name}</strong>
                      </td>
                      <td>{r.child_name}</td>
                      <td className="fade">{findOptionLabel('q1', r.q1_feature)}</td>
                      <td>{INTENT_LABEL[r.q4_purchase_intent]}</td>
                      <td className="fade">{answerLabel('q6', r.q6_followup)}</td>
                      <td>
                        <span className="status-chip status-wait">{r.batch}</span>
                      </td>
                      <td>
                        <LeadChip status={r.lead_status || ''} />
                      </td>
                      <td>
                        <PriorityChip pKey={p.key} label={p.label} />
                      </td>
                      <td>
                        <select
                          className="admin-select"
                          style={{ minHeight: 34, fontSize: 13, padding: '2px 8px' }}
                          value={r.followup_status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation()
                            updateFollowup(e, r.id, e.target.value)
                          }}
                        >
                          {(Object.keys(FOLLOWUP_STATUS_LABEL) as (keyof typeof FOLLOWUP_STATUS_LABEL)[]).map(
                            (k) => (
                              <option key={k} value={k}>
                                {FOLLOWUP_STATUS_LABEL[k]}
                              </option>
                            ),
                          )}
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 12.5, color: '#93a0ac' }}>
          點擊任一列可查看完整資料 · 共 {filtered.length} 筆
          {batchFilter !== 'all' ? `（梯次 ${batchFilter}）` : ''}
        </p>
      </div>

      {detail && (
        <ResponseDetail record={detail} onClose={() => setDetail(null)} />
      )}
    </div>
  )

  async function updateFollowup(
    e: React.ChangeEvent<HTMLSelectElement>,
    id: string,
    status: string,
  ) {
    e.preventDefault()
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, followup_status: status } : r)),
    )
    try {
      await updateFollowupStatus(id, status)
    } catch (err) {
      window.alert('更新狀態失敗：' + (err instanceof Error ? err.message : '未知錯誤'))
    }
  }
}

function StatCard({
  num,
  label,
  isGreen,
}: {
  num: number
  label: string
  isGreen?: boolean
}) {
  return (
    <div className="stat-card">
      <div className={`num ${isGreen ? 'is-green' : ''}`}>{num}</div>
      <div className="label">{label}</div>
    </div>
  )
}

function LeadChip({ status }: { status: string }) {
  const cls =
    status === 'HIGH'
      ? 'lead-high'
      : status === 'MEDIUM'
        ? 'lead-medium'
        : status === 'FOLLOW_UP'
          ? 'lead-followup'
          : 'lead-low'
  const label =
    status === 'HIGH'
      ? '🔥 HIGH'
      : status === 'MEDIUM'
        ? '🟡 MEDIUM'
        : status === 'FOLLOW_UP'
          ? '🔵 FOLLOW_UP'
          : '⚪ LOW'
  return <span className={`lead-chip ${cls}`}>{label}</span>
}

function PriorityChip({ pKey, label }: { pKey: string; label: string }) {
  const emoji =
    pKey === 'hot' ? '🔥' : pKey === 'warm' ? '🟡' : pKey === 'wait' ? '🔵' : '⚪'
  const cls =
    pKey === 'hot'
      ? 'status-hot'
      : pKey === 'warm'
        ? 'status-warm'
        : pKey === 'wait'
          ? 'status-wait'
          : 'status-low'
  return (
    <span className={`status-chip ${cls}`}>
      {emoji} {label}
    </span>
  )
}

function IntentDonut({
  byIntent,
  total,
}: {
  byIntent: Record<Q4Intent, number>
  total: number
}) {
  const colors: Record<Q4Intent, string> = {
    info: '#35b58a',
    compare: '#1c9ad6',
    questions: '#ffc222',
    want_results: '#7d9de0',
    not_now: '#c3cdd6',
  }
  const order: Q4Intent[] = ['info', 'compare', 'questions', 'want_results', 'not_now']
  const sum = order.reduce((acc, k) => acc + (byIntent[k] ?? 0), 0)
  const R = 52
  const C = 2 * Math.PI * R
  let offset = 0

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <svg width="140" height="140" viewBox="0 0 140 140" style={{ flex: '0 0 auto' }}>
          <circle cx="70" cy="70" r={R} fill="none" stroke="#eef1f4" strokeWidth="22" />
          {sum > 0 &&
            order.map((k) => {
              const frac = (byIntent[k] ?? 0) / sum
              const seg = (
                <circle
                  key={k}
                  cx="70"
                  cy="70"
                  r={R}
                  fill="none"
                  stroke={colors[k]}
                  strokeWidth="22"
                  strokeDasharray={`${frac * C} ${C}`}
                  strokeDashoffset={-offset * C}
                  strokeLinecap="butt"
                  transform="rotate(-90 70 70)"
                />
              )
              offset += frac
              return seg
            })}
          <text x="70" y="66" textAnchor="middle" fontWeight="900" fontSize="26" fill="#22303a">
            {total}
          </text>
          <text x="70" y="86" textAnchor="middle" fontSize="11" fill="#93a0ac">
            填寫數
          </text>
        </svg>
        <div className="intent-legend" style={{ flex: '1 1 180px', justifyContent: 'flex-start' }}>
          {order.map((k) => (
            <span key={k}>
              <span className="swatch" style={{ background: colors[k] }} />
              {INTENT_LABEL[k]}（{byIntent[k] ?? 0}）
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function QDistribution({
  qid,
  rows,
}: {
  qid: 'q1' | 'q2' | 'q3' | 'q5' | 'q6'
  rows: SurveyRecord[]
}) {
  const q = getQuestion(qid)
  if (!q) return null
  const counts = new Map<string, number>()
  for (const r of rows) {
    const v = String((r as unknown as Record<string, string>)[qid] ?? '')
    counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  const max = Math.max(1, ...[...counts.values()])
  const sorted = q.options.filter((o) => counts.has(o.key))

  const titleMap: Record<string, string> = {
    q1: 'Q1 最符合孩子需求的特色',
    q2: 'Q2 孩子 7 日後的變化',
    q3: 'Q3 最期待的改變',
    q5: 'Q5 主要疑慮',
    q6: 'Q6 後續協助需求',
  }

  if (sorted.length === 0) {
    return (
      <div className="chart-card">
        <h3>{titleMap[qid]}</h3>
        <p style={{ color: '#93a0ac', fontSize: 13, margin: 0 }}>尚無資料</p>
      </div>
    )
  }

  return (
    <div className="chart-card">
      <h3>{titleMap[qid]}</h3>
      {sorted.map((opt) => {
        const cnt = counts.get(opt.key) ?? 0
        const color =
          opt.key === 'other' ? '#7d9de0' : `var(--brand-blue)`
        return (
          <div className="bar-row" key={opt.key}>
            <div className="bar-label">
              <span className="name">
                {opt.icon} {opt.label}
              </span>
              <span className="val">{cnt}</span>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{ width: `${(cnt / max) * 100}%`, background: color }}
              />
            </div>
          </div>
        )
      })}
      {q.allowsOther && counts.has('other') && (
        <p style={{ fontSize: 12.5, color: '#93a0ac', margin: 0 }}>
          其他：{(counts.get('other') ?? 0)} 份
        </p>
      )}
    </div>
  )
}

function answerLabel(qid: string, key: string) {
  const q = getQuestion(qid)
  const opt = q?.options.find((o) => o.key === key)
  return opt ? opt.label : key
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}