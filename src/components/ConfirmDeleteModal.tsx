import { useEffect, useRef } from 'react'
import type { SurveyRecord } from '../types'

function fmt(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function ConfirmDeleteModal({
  record,
  onCancel,
  onConfirm,
  deleting,
}: {
  record: SurveyRecord | null
  onCancel: () => void
  onConfirm: () => void
  deleting: boolean
}) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  // 預設焦點放在「取消」，避免誤刪
  useEffect(() => {
    cancelRef.current?.focus()
  }, [])

  if (!record) return null

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="刪除問券確認"
      onClick={deleting ? undefined : onCancel}
    >
      <div
        className="modal confirm-modal"
        role="document"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title">確定要刪除這筆問券嗎？</h2>
        <p className="modal-body confirm-body">
          刪除後，這筆問券資料將無法從後台恢復，包含家長稱呼、孩子稱呼、問券回答及其他相關紀錄。請確認這是要刪除的資料。
        </p>

        <div className="confirm-id">
          <div className="confirm-id-row">
            <span className="confirm-id-label">提交時間</span>
            <span className="confirm-id-value">{fmt(record.created_at)}</span>
          </div>
          <div className="confirm-id-row">
            <span className="confirm-id-label">家長稱呼</span>
            <span className="confirm-id-value">{record.parent_name}</span>
          </div>
          <div className="confirm-id-row">
            <span className="confirm-id-label">孩子稱呼</span>
            <span className="confirm-id-value">{record.child_name}</span>
          </div>
          <div className="confirm-id-row">
            <span className="confirm-id-label">梯次</span>
            <span className="confirm-id-value">{record.batch}</span>
          </div>
        </div>

        <div className="confirm-actions">
          <button
            ref={cancelRef}
            type="button"
            className="btn btn--primary confirm-cancel"
            onClick={onCancel}
            disabled={deleting}
          >
            取消
          </button>
          <button
            type="button"
            className="btn btn--danger confirm-ok"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <span className="spinner spinner--danger" /> 正在刪除…
              </>
            ) : (
              '確認刪除'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}