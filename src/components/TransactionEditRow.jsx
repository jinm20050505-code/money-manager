import { useState } from 'react'
import {
  isBlank,
  hasInvalidChars,
  REQUIRED_MESSAGE,
  INVALID_CHAR_MESSAGE,
} from '../../lib/validation.js'

function toDateInputValue(dateString) {
  const d = new Date(dateString)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function TransactionEditRow({ transaction, creditCards, onSaved, onCancel }) {
  const [form, setForm] = useState({
    type: transaction.type,
    amount: String(transaction.amount),
    category: transaction.category || '',
    memo: transaction.memo || '',
    date: toDateInputValue(transaction.date),
    paymentMethod: transaction.paymentMethod || 'cash',
    creditCardId: transaction.creditCardId ? String(transaction.creditCardId) : '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const isCredit = form.paymentMethod === 'credit'

  function validate() {
    const next = {}
    if (isBlank(form.amount)) next.amount = REQUIRED_MESSAGE
    else if (!Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0)
      next.amount = '正しい金額を入力してください'

    if (hasInvalidChars(form.memo)) next.memo = INVALID_CHAR_MESSAGE
    if (hasInvalidChars(form.category)) next.category = INVALID_CHAR_MESSAGE
    if (isCredit && isBlank(form.creditCardId)) next.creditCardId = REQUIRED_MESSAGE

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSave() {
    if (!validate()) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        if (body.errors) setErrors(body.errors)
        return
      }
      onSaved?.()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <li className="transaction-item editing">
      <div className="transaction-edit-form">
        <div className="field-group">
          <label>
            種別
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="expense">支出</option>
              <option value="income">収入</option>
            </select>
          </label>

          <label>
            金額
            <input
              type="number"
              min="1"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
            {errors.amount && <span className="field-error">{errors.amount}</span>}
          </label>

          <label>
            日付
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </label>
        </div>

        {form.type === 'expense' && creditCards.length > 0 && (
          <div className="field-group">
            <label>
              支払い方法
              <select
                value={form.paymentMethod}
                onChange={(e) =>
                  setForm({
                    ...form,
                    paymentMethod: e.target.value,
                    creditCardId: e.target.value === 'cash' ? '' : form.creditCardId,
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
                  value={form.creditCardId}
                  onChange={(e) => setForm({ ...form, creditCardId: e.target.value })}
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
          カテゴリ
          <input
            type="text"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          {errors.category && <span className="field-error">{errors.category}</span>}
        </label>

        <label>
          メモ
          <input
            type="text"
            value={form.memo}
            onChange={(e) => setForm({ ...form, memo: e.target.value })}
          />
          {errors.memo && <span className="field-error">{errors.memo}</span>}
        </label>

        <div className="transaction-edit-actions">
          <button type="button" onClick={handleSave} disabled={submitting}>
            {submitting ? '保存中…' : '保存'}
          </button>
          <button type="button" className="cancel-button" onClick={onCancel}>
            キャンセル
          </button>
        </div>
      </div>
    </li>
  )
}
