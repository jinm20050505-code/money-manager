import { useEffect, useState } from 'react'
import {
  isBlank,
  hasInvalidChars,
  REQUIRED_MESSAGE,
  INVALID_CHAR_MESSAGE,
} from '../../lib/validation.js'
import { useCollapsible } from '../hooks/useCollapsible.js'

const yen = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' })

export default function BudgetSection({ transactions }) {
  const [open, toggle] = useCollapsible('manemane-section-budget', false)
  const [budgets, setBudgets] = useState([])
  const [form, setForm] = useState({ category: '', limit: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadBudgets()
  }, [])

  async function loadBudgets() {
    const res = await fetch('/api/budgets')
    if (res.ok) setBudgets(await res.json())
  }

  function validate() {
    const next = {}
    if (isBlank(form.category)) next.category = REQUIRED_MESSAGE
    else if (hasInvalidChars(form.category)) next.category = INVALID_CHAR_MESSAGE

    if (isBlank(form.limit)) next.limit = REQUIRED_MESSAGE
    else if (!Number.isFinite(Number(form.limit)) || Number(form.limit) <= 0)
      next.limit = '正しい金額を入力してください'

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        if (body.errors) setErrors(body.errors)
        return
      }
      setForm({ category: '', limit: '' })
      await loadBudgets()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(category) {
    await fetch(`/api/budgets?category=${encodeURIComponent(category)}`, { method: 'DELETE' })
    setBudgets((prev) => prev.filter((b) => b.category !== category))
  }

  const now = new Date()
  const thisMonthSpend = transactions
    .filter((t) => t.type === 'expense' && t.category)
    .filter((t) => {
      const d = new Date(t.date)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    })
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {})

  return (
    <section className="budget-section">
      <button type="button" className="section-toggle" onClick={toggle} aria-expanded={open}>
        <h2>カテゴリ別の予算（今月）</h2>
        <span className={`section-chevron ${open ? 'open' : ''}`}>▾</span>
      </button>

      {open && (
        <>
          {budgets.length > 0 && (
            <ul className="budget-list">
              {budgets.map((b) => {
                const spent = thisMonthSpend[b.category] || 0
                const ratio = Math.min(1, spent / b.limit)
                const over = spent > b.limit
                return (
                  <li key={b.category} className="budget-item">
                    <div className="budget-item-header">
                      <span>{b.category}</span>
                      <span className={over ? 'negative' : ''}>
                        {yen.format(spent)} / {yen.format(b.limit)}
                      </span>
                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => handleDelete(b.category)}
                        aria-label="削除"
                      >
                        ×
                      </button>
                    </div>
                    <div className="budget-bar">
                      <div
                        className={`budget-bar-fill ${over ? 'over' : ''}`}
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          <form onSubmit={handleSubmit} className="budget-form">
            <label>
              カテゴリ
              <input
                type="text"
                placeholder="例：食費"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              {errors.category && <span className="field-error">{errors.category}</span>}
            </label>

            <label>
              上限額（月）
              <input
                type="number"
                min="1"
                placeholder="20000"
                value={form.limit}
                onChange={(e) => setForm({ ...form, limit: e.target.value })}
              />
              {errors.limit && <span className="field-error">{errors.limit}</span>}
            </label>

            <button type="submit" disabled={submitting}>
              {submitting ? '保存中…' : '設定する'}
            </button>
          </form>
        </>
      )}
    </section>
  )
}
