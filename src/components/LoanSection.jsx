import { useState } from 'react'
import {
  isBlank,
  hasInvalidChars,
  REQUIRED_MESSAGE,
  INVALID_CHAR_MESSAGE,
} from '../../lib/validation.js'
import { FREQUENCY_LABEL, hasInstallmentPlan, isSettled, remainingAmount } from '../lib/loan.js'

const yen = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' })

const emptyForm = {
  amount: '',
  lender: '',
  dueDate: '',
  memo: '',
  repaymentFrequency: '',
  repaymentAmount: '',
}

export default function LoanSection({ loans, onChanged }) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const hasPlan = form.repaymentFrequency !== ''

  function validate() {
    const next = {}
    if (isBlank(form.lender)) next.lender = REQUIRED_MESSAGE
    else if (hasInvalidChars(form.lender)) next.lender = INVALID_CHAR_MESSAGE

    if (isBlank(form.amount)) next.amount = REQUIRED_MESSAGE
    else if (!Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0)
      next.amount = '正しい金額を入力してください'

    if (hasPlan) {
      if (isBlank(form.repaymentAmount)) next.repaymentAmount = REQUIRED_MESSAGE
      else if (!Number.isFinite(Number(form.repaymentAmount)) || Number(form.repaymentAmount) <= 0)
        next.repaymentAmount = '正しい金額を入力してください'
    }

    if (hasInvalidChars(form.memo)) next.memo = INVALID_CHAR_MESSAGE

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/loans', {
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

  async function toggleRepaid(loan) {
    await fetch(`/api/loans/${loan.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repaid: !loan.repaid }),
    })
    onChanged?.()
  }

  async function recordPayment(loan) {
    await fetch(`/api/loans/${loan.id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: loan.repaymentAmount }),
    })
    onChanged?.()
  }

  async function handleDelete(id) {
    await fetch(`/api/loans/${id}`, { method: 'DELETE' })
    onChanged?.()
  }

  const outstanding = loans.reduce((sum, l) => {
    if (hasInstallmentPlan(l)) return sum + remainingAmount(l)
    return sum + (l.repaid ? 0 : l.amount)
  }, 0)

  return (
    <section className="loan-section">
      <h2>借入の記録</h2>
      <p className="share-hint">
        人から借りたお金を記録しておけます。残高（収支）には影響しません。分割返済にすると、1日あたりに使える金額から自動で差し引かれます。
      </p>

      {outstanding > 0 && <p className="loan-outstanding">未返済の合計：{yen.format(outstanding)}</p>}

      {loans.length > 0 && (
        <ul className="loan-list">
          {loans.map((l) => {
            const plan = hasInstallmentPlan(l)
            const settled = isSettled(l)
            return (
              <li key={l.id} className={`loan-item ${settled ? 'repaid' : ''}`}>
                {!plan && (
                  <input
                    type="checkbox"
                    className="loan-checkbox"
                    checked={l.repaid}
                    onChange={() => toggleRepaid(l)}
                    aria-label="返済済み"
                  />
                )}
                <div className="loan-main">
                  <span className="loan-lender">{l.lender}</span>
                  {plan ? (
                    <span className="loan-plan">
                      {FREQUENCY_LABEL[l.repaymentFrequency]}{yen.format(l.repaymentAmount)}ずつ返済中・残り
                      {yen.format(remainingAmount(l))}
                    </span>
                  ) : (
                    l.dueDate && (
                      <span className="loan-due">
                        返済予定：{new Date(l.dueDate).toLocaleDateString('ja-JP')}
                      </span>
                    )
                  )}
                </div>
                <span className="loan-amount">{yen.format(l.amount)}</span>
                {plan && !settled && (
                  <button type="button" className="loan-pay-button" onClick={() => recordPayment(l)}>
                    返済を記録
                  </button>
                )}
                <button
                  type="button"
                  className="delete-button"
                  onClick={() => handleDelete(l.id)}
                  aria-label="削除"
                >
                  ×
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="loan-form">
        <label>
          借りた相手
          <input
            type="text"
            placeholder="例：友人、親"
            value={form.lender}
            onChange={(e) => setForm({ ...form, lender: e.target.value })}
          />
          {errors.lender && <span className="field-error">{errors.lender}</span>}
        </label>

        <label>
          金額
          <input
            type="number"
            min="1"
            placeholder="5000"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          {errors.amount && <span className="field-error">{errors.amount}</span>}
        </label>

        <label>
          返済方法
          <select
            value={form.repaymentFrequency}
            onChange={(e) => setForm({ ...form, repaymentFrequency: e.target.value })}
          >
            <option value="">一括（返済予定日のみ）</option>
            <option value="daily">毎日いくらか返す</option>
            <option value="weekly">毎週いくらか返す</option>
            <option value="monthly">毎月いくらか返す</option>
          </select>
        </label>

        {hasPlan ? (
          <label>
            1回あたりの返済額
            <input
              type="number"
              min="1"
              placeholder="1000"
              value={form.repaymentAmount}
              onChange={(e) => setForm({ ...form, repaymentAmount: e.target.value })}
            />
            {errors.repaymentAmount && <span className="field-error">{errors.repaymentAmount}</span>}
          </label>
        ) : (
          <label>
            返済予定日（任意）
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </label>
        )}

        <label>
          メモ（任意）
          <input
            type="text"
            placeholder="例：家賃の足しに"
            value={form.memo}
            onChange={(e) => setForm({ ...form, memo: e.target.value })}
          />
          {errors.memo && <span className="field-error">{errors.memo}</span>}
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? '登録中…' : '記録する'}
        </button>
      </form>
    </section>
  )
}
