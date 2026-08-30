import { useState } from 'react'
import {
  isBlank,
  hasInvalidChars,
  REQUIRED_MESSAGE,
  INVALID_CHAR_MESSAGE,
} from '../../lib/validation.js'
import { nextBillAmount, pendingTotal } from '../lib/creditCard.js'
import { nextDueDate } from '../lib/dueDate.js'

const yen = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' })

const emptyForm = { name: '', paymentDay: '' }

export default function CreditCardSection({ cards, transactions, onChanged }) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    const next = {}
    if (isBlank(form.name)) next.name = REQUIRED_MESSAGE
    else if (hasInvalidChars(form.name)) next.name = INVALID_CHAR_MESSAGE

    if (isBlank(form.paymentDay)) next.paymentDay = REQUIRED_MESSAGE
    else if (
      !Number.isInteger(Number(form.paymentDay)) ||
      Number(form.paymentDay) < 1 ||
      Number(form.paymentDay) > 31
    )
      next.paymentDay = '1〜31の日付を指定してください'

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/credit-cards', {
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
    await fetch(`/api/credit-cards/${id}`, { method: 'DELETE' })
    onChanged?.()
  }

  return (
    <section className="credit-card-section">
      <h2>クレジットカード</h2>
      <p className="share-hint">
        カードを登録すると、記録時に「クレカ」で支払いを選べます。クレカ利用分はすぐには残高から引かれず、引き落とし日にまとめて反映されます。
      </p>

      {cards.length > 0 && (
        <ul className="credit-card-list">
          {cards.map((c) => {
            const due = nextDueDate({ dueDay: c.paymentDay, endOfMonth: false })
            const bill = nextBillAmount(c, transactions)
            const pending = pendingTotal(c, transactions)
            return (
              <li key={c.id} className="credit-card-item">
                <div className="credit-card-main">
                  <span className="credit-card-name">{c.name}</span>
                  <span className="credit-card-detail">
                    毎月{c.paymentDay}日引き落とし・次回（{due.toLocaleDateString('ja-JP')}）
                    {yen.format(bill)}
                  </span>
                  {pending > bill && (
                    <span className="credit-card-detail">未引き落とし合計：{yen.format(pending)}</span>
                  )}
                </div>
                <button
                  type="button"
                  className="delete-button"
                  onClick={() => handleDelete(c.id)}
                  aria-label="削除"
                >
                  ×
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="credit-card-form">
        <label>
          カード名
          <input
            type="text"
            placeholder="例：楽天カード"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </label>

        <label>
          引き落とし日（毎月）
          <input
            type="number"
            min="1"
            max="31"
            placeholder="27"
            value={form.paymentDay}
            onChange={(e) => setForm({ ...form, paymentDay: e.target.value })}
          />
          {errors.paymentDay && <span className="field-error">{errors.paymentDay}</span>}
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? '登録中…' : '登録する'}
        </button>
      </form>
    </section>
  )
}
