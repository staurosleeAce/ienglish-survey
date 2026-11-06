import { findOptionLabels } from '../data/survey'
import { SUPER_PROJECT_ID } from '../data/projects'
import { followupPriority } from '../lib/api'
import type { SurveyRecord } from '../types'
import { FOLLOWUP_STATUS_LABEL } from '../types'

function Section({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="detail-item">
      <div className="k">{k}</div>
      <div className="v">{v}</div>
    </div>
  )
}

export function ResponseDetail({
  record,
  onClose,
  onDelete,
}: {
  record: SurveyRecord
  onClose: () => void
  onDelete?: () => void
}) {
  const p = followupPriority(record)
  const isSuper = record.project_id === SUPER_PROJECT_ID
  const isClosing = isSuper && record.survey_type === 'closing'

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <h2 className="drawer-title">📋 完整問券資料</h2>
          <button className="icon-btn" onClick={onClose} aria-label="關閉">
            ✕
          </button>
        </div>
        <div className="drawer-body">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
            <span className={`status-chip ${
              p.key === 'hot' ? 'status-hot' : p.key === 'warm' ? 'status-warm' : p.key === 'wait' ? 'status-wait' : 'status-low'
            }`}>
              {p.key === 'hot' ? '🔥' : p.key === 'warm' ? '🟡' : p.key === 'wait' ? '🔵' : '⚪'} {p.label}
            </span>
            <span className={`lead-chip ${
              record.lead_status === 'HIGH' ? 'lead-high' : record.lead_status === 'MEDIUM' ? 'lead-medium' : record.lead_status === 'FOLLOW_UP' ? 'lead-followup' : 'lead-low'
            }`}>
              {record.lead_status || '—'}
            </span>
            <span className="status-chip status-wait">梯次 {record.batch}</span>
            <span className="status-chip status-wait">來源：{record.source || 'line'}</span>
          </div>

          <Section k="填寫時間" v={new Date(record.created_at).toLocaleString('zh-TW')} />
          <div className="divider" />
          <Section k="家長稱呼" v={<strong>{isSuper ? record.super_parent_name : record.parent_name}</strong>} />
          <Section k={isSuper ? (isClosing ? '填寫者識別' : 'LINE 名稱 / ID') : '孩子稱呼'} v={<strong>{isSuper ? (isClosing ? '結束問券' : record.super_line_name) : record.child_name}</strong>} />
          <div className="divider" />
          {isClosing ? (
            <>
              <Section k="孩子年齡" v={(record.closing_child_ages ?? []).join('、')} />
              <Section k="今天最大的收穫" v={(record.closing_biggest_gain ?? []).join('、')} />
              <Section k="講座是否符合期待" v={record.closing_expectation} />
              <Section k="是否願意參加未來講座" v={record.closing_future_interest} />
              <Section k="下次想聽的話題" v={(record.closing_next_topic ?? []).join('、')} />
            </>
          ) : isSuper ? (
            <>
              <Section k="孩子年齡" v={(record.super_child_ages ?? []).join('、')} />
              <Section k="最近陪伴孩子最常卡住的地方" v={(record.super_stuck_points ?? []).join('、')} />
              <Section k="認識來源" v={record.super_source} />
            </>
          ) : (
            <>
              <Section k="Q1 · 最符合孩子需求的特色" v={findOptionLabels('q1', record.q1_feature ?? [])} />
              {record.q1_other && <Section k="Q1 其他" v={record.q1_other} />}
              <Section k="Q2 · 孩子 7 日後的變化" v={findOptionLabels('q2', record.q2_change ?? [])} />
              {record.q2_other && <Section k="Q2 其他" v={record.q2_other} />}
              <Section k="Q3 · 期待的改變" v={findOptionLabels('q3', record.q3_expectation ?? [])} />
              {record.q3_other && <Section k="Q3 其他" v={record.q3_other} />}
              <Section k="Q4 · 希望提供的協助" v={findOptionLabels('q4', record.q4_assistance ?? [])} />
              {record.q4_other && <Section k="Q4 其他" v={record.q4_other} />}
            </>
          )}
          <div className="divider" />
          <Section
            k="開放式回饋"
            v={(isClosing ? record.closing_feedback : isSuper ? record.super_feedback : record.feedback) || <span style={{ color: '#93a0ac' }}>（未填寫）</span>}
          />
          <Section k="跟進狀態" v={FOLLOWUP_STATUS_LABEL[record.followup_status as keyof typeof FOLLOWUP_STATUS_LABEL] ?? record.followup_status} />
          <Section
            k="活動 / 資料來源"
            v={`${record.campaign || '7day_english_camp'} · ${record.source || 'line'}`}
          />

          {onDelete && (
            <>
              <div className="divider" />
              <button
                type="button"
                className="btn btn--danger btn--block"
                onClick={onDelete}
              >
                刪除這筆問券
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
