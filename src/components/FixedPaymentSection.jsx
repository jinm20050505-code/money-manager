import { useState } from 'react'
import {
  isBlank,
  hasInvalidChars,
  REQUIRED_MESSAGE,
  INVALID_CHAR_MESSAGE,
} from '../../lib/validation.js'

const yen = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' })

const emptyForm = { name: '', amount: '', type: 'expense', dueDay: '', endOfMonth: false }

export default function FixedPaymentSection({ payments, onChanged }) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    const next = {}
    if (isBlank(form.name)) next.name = REQUIRED_MESSAGE
    else if (hasInvalidChars(form.name)) next.name = INVALID_CHAR_MESSAGE

    if (isBlank(form.amount)) next.amount = REQUIRED_MESSAGE
    else if (!Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0)
      next.amount = '正しい金額を入力してください'

    if (!form.endOfMonth) {
      if (isBlank(form.dueDay)) next.dueDay = REQUIRED_MESSAGE
      else if (!Number.isInteger(Number(form.dueDay)) || Number(form.dueDay) < 1 || Number(form.dueDay) > 31)
        next.dueDay = '1〜31の日付を指定してください'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/fixed-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        if (body.errors) setErrors(body.errors)
        return
      }
      setForm(emptyForm)
      onChanged?.()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    await fetch(`/api/fixed-payments/${id}`, { method: 'DELETE' })
    onChanged?.()
  }

  return (
    <section className="fixed-payment-section">
      <h2>固定費・固定給料</h2>

      {payments.length > 0 && (
        <ul className="fixed-payment-list">
          {payments.map((p) => (
            <li key={p.id} className={p.type === 'income' ? 'income' : ''}>
              <span className="fixed-payment-day">{p.endOfMonth ? '毎月末' : `毎月${p.dueDay}日`}</span>
              <span className="fixed-payment-name">{p.name}</span>
              <span className="fixed-payment-amount">
                {p.type === 'income' ? '+' : '-'}
                {yen.format(p.amount)}
              </span>
              <button
                type="button"
                className="delete-button"
                onClick={() => handleDelete(p.id)}
                aria-label="削除"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="fixed-payment-form">
        <label>
          種別
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="expense">固定費（支出）</option>
            <option value="income">固定給料（収入）</option>
          </select>
        </label>

        <label>
          名前
          <input
            type="text"
            placeholder={form.type === 'income' ? '例：給料' : '例：家賃'}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </label>

        <label>
          金額
          <input
            type="number"
            min="1"
            placeholder={form.type === 'income' ? '200000' : '50000'}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          {errors.amount && <span className="field-error">{errors.amount}</span>}
        </label>

        <label>
          {form.type === 'income' ? '入金日（毎月）' : '支払日（毎月）'}
          <input
            type="number"
            min="1"
            max="31"
            placeholder="27"
            value={form.dueDay}
            disabled={form.endOfMonth}
            onChange={(e) => setForm({ ...form, dueDay: e.target.value })}
          />
          {errors.dueDay && <span className="field-error">{errors.dueDay}</span>}
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={form.endOfMonth}
            onChange={(e) => setForm({ ...form, endOfMonth: e.target.checked, dueDay: '' })}
          />
          月末（月によって最終日が変わります）
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? '登録中…' : '登録する'}
        </button>
      </form>
    </section>
  )
}
