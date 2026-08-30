import { useState } from 'react'
import { useDraft } from '../hooks/useDraft.js'
import {
  isBlank,
  hasInvalidChars,
  REQUIRED_MESSAGE,
  INVALID_CHAR_MESSAGE,
} from '../../lib/validation.js'

function todayString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const emptyForm = {
  type: 'expense',
  amount: '',
  category: '',
  memo: '',
  date: todayString(),
  paymentMethod: 'cash',
  creditCardId: '',
}

const QUICK_PRESETS = [
  { label: 'コンビニ ¥500', type: 'expense', category: '食費', memo: 'コンビニ', amount: 500 },
  { label: 'ランチ ¥800', type: 'expense', category: '食費', memo: 'ランチ', amount: 800 },
  { label: '飲み物 ¥150', type: 'expense', category: '食費', memo: '飲み物', amount: 150 },
  { label: '交通費 ¥200', type: 'expense', category: '交通費', memo: '交通費', amount: 200 },
  { label: '日払い給料 ¥8,000', type: 'income', category: '日払い', memo: '日払い給料', amount: 8000 },
]

export default function TransactionForm({ onCreated, creditCards = [] }) {
  const [draft, setDraft, clearDraft] = useDraft('transaction-draft', emptyForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [quickMessage, setQuickMessage] = useState(null)

  const isCredit = draft.paymentMethod === 'credit'

  async function submitPayload(payload) {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.errors ? JSON.stringify(body.errors) : '登録に失敗しました', {
        cause: body.errors,
      })
    }
    onCreated?.()
  }

  function validate() {
    const next = {}
    if (isBlank(draft.amount)) next.amount = REQUIRED_MESSAGE
    else if (!Number.isFinite(Number(draft.amount)) || Number(draft.amount) <= 0)
      next.amount = '正しい金額を入力してください'

    if (hasInvalidChars(draft.memo)) next.memo = INVALID_CHAR_MESSAGE
    if (hasInvalidChars(draft.category)) next.category = INVALID_CHAR_MESSAGE

    if (isCredit && isBlank(draft.creditCardId)) next.creditCardId = REQUIRED_MESSAGE

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      await submitPayload(draft)
      clearDraft()
      setErrors({})
    } catch (err) {
      if (err.cause) setErrors(err.cause)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleQuickTap(preset) {
    setQuickMessage(null)
    try {
      await submitPayload({
        type: preset.type,
        amount: preset.amount,
        category: preset.category,
        memo: preset.memo,
        date: todayString(),
      })
      setQuickMessage(`「${preset.label}」を記録しました。金額が違う場合は下の履歴から編集・削除できます。`)
      setTimeout(() => setQuickMessage(null), 4000)
    } catch {
      setQuickMessage('記録に失敗しました。もう一度お試しください。')
    }
  }

  return (
    <div className="transaction-input">
      <div className="quick-presets">
        <p className="quick-presets-hint">
          金額をきっちり覚えていなくてもOK。よく使うものはタップだけで記録できます。
        </p>
        <div className="quick-preset-buttons">
          {QUICK_PRESETS.map((preset) => (
            <button
              type="button"
              key={preset.label}
              className={`quick-preset ${preset.type}`}
              onClick={() => handleQuickTap(preset)}
            >
              {preset.label}
            </button>
          ))}
        </div>
        {quickMessage && <p className="quick-message">{quickMessage}</p>}
      </div>

      <form className="transaction-form" onSubmit={handleSubmit}>
        <div className="field-group">
          <label>
            種別
            <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
              <option value="expense">支出</option>
              <option value="income">収入</option>
            </select>
          </label>

          <label>
            金額
            <input
              type="number"
              min="1"
              step="1"
              placeholder="1000"
              value={draft.amount}
              onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
            />
            {errors.amount && <span className="field-error">{errors.amount}</span>}
          </label>

          <label>
            日付
            <input
              type="date"
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
            />
          </label>
        </div>

        {draft.type === 'expense' && creditCards.length > 0 && (
          <div className="field-group">
            <label>
              支払い方法
              <select
                value={draft.paymentMethod}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    paymentMethod: e.target.value,
                    creditCardId: e.target.value === 'cash' ? '' : draft.creditCardId,
                  })
                }
              >
                <option value="cash">現金</option>
                <option value="credit">クレカ</option>
              </select>
            </label>

            {isCredit && (
              <label>
                カード
                <select
                  value={draft.creditCardId}
                  onChange={(e) => setDraft({ ...draft, creditCardId: e.target.value })}
                >
                  <option value="">選択してください</option>
                  {creditCards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.creditCardId && <span className="field-error">{errors.creditCardId}</span>}
              </label>
            )}
          </div>
        )}

        <label>
          カテゴリ（任意）
          <input
            type="text"
            list="category-suggestions"
            placeholder="例：食費、交通費、家賃"
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
          />
          <datalist id="category-suggestions">
            <option value="食費" />
            <option value="交通費" />
            <option value="家賃" />
            <option value="通信費" />
            <option value="その他" />
          </datalist>
          {errors.category && <span className="field-error">{errors.category}</span>}
        </label>

        <label>
          メモ
          <input
            type="text"
            placeholder="例：コンビニ、日払いバイト代"
            value={draft.memo}
            onChange={(e) => setDraft({ ...draft, memo: e.target.value })}
          />
          {errors.memo && <span className="field-error">{errors.memo}</span>}
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? '登録中…' : '記録する'}
        </button>
      </form>
    </div>
  )
}
