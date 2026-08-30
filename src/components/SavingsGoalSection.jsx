import { useEffect, useState } from 'react'
import { isBlank, REQUIRED_MESSAGE } from '../../lib/validation.js'
import { useCollapsible } from '../hooks/useCollapsible.js'

const yen = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' })

export default function SavingsGoalSection({ transactions }) {
  const [open, toggle] = useCollapsible('manemane-section-savings-goal', false)
  const [goal, setGoal] = useState(null)
  const [amount, setAmount] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/savings-goal')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setGoal(data)
          setAmount(String(data.amount))
        }
      })
      .catch(() => {})
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (isBlank(amount)) {
      setError(REQUIRED_MESSAGE)
      return
    }
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      setError('正しい金額を入力してください')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/savings-goal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.errors?.amount || '保存に失敗しました')
        return
      }
      setGoal(await res.json())
    } finally {
      setSubmitting(false)
    }
  }

  const now = new Date()
  const monthlyNet = transactions
    .filter((t) => {
      const d = new Date(t.date)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    })
    .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0)

  const saved = Math.max(0, monthlyNet)
  const ratio = goal ? Math.min(1, saved / goal.amount) : 0
  const achieved = goal && saved >= goal.amount

  return (
    <section className="savings-goal-section">
      <button type="button" className="section-toggle" onClick={toggle} aria-expanded={open}>
        <h2>今月の貯金目標</h2>
        <span className={`section-chevron ${open ? 'open' : ''}`}>▾</span>
      </button>

      {open && (
        <>
          {goal && (
            <div className="savings-goal-progress">
              <div className="savings-goal-numbers">
                <span className={achieved ? 'positive' : ''}>{yen.format(saved)}</span>
                <span className="savings-goal-target"> / {yen.format(goal.amount)}</span>
              </div>
              <div className="savings-goal-bar">
                <div
                  className={`savings-goal-bar-fill ${achieved ? 'achieved' : ''}`}
                  style={{ width: `${ratio * 100}%` }}
                />
              </div>
              {achieved && <p className="savings-goal-achieved">今月の目標を達成しました！</p>}
              {monthlyNet < 0 && (
                <p className="savings-goal-warning">今月は支出が収入を上回っています</p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="savings-goal-form">
            <label>
              今月の目標額
              <input
                type="number"
                min="1"
                placeholder="10000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {error && <span className="field-error">{error}</span>}
            </label>
            <button type="submit" disabled={submitting}>
              {submitting ? '保存中…' : goal ? '目標を更新する' : '目標を設定する'}
            </button>
          </form>
        </>
      )}
    </section>
  )
}
