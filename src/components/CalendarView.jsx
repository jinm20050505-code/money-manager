import { useState } from 'react'
import { dueDateInMonth, daysInMonth } from '../lib/dueDate.js'
import { useCollapsible } from '../hooks/useCollapsible.js'

const yen = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' })
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

function toDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function CalendarView({ transactions, fixedPayments }) {
  const [open, toggle] = useCollapsible('manemane-section-calendar', true)
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  const dailyTotals = {}
  transactions.forEach((t) => {
    const key = toDateKey(new Date(t.date))
    if (!dailyTotals[key]) dailyTotals[key] = { income: 0, expense: 0 }
    dailyTotals[key][t.type] += t.amount
  })

  const paymentsByDay = {}
  fixedPayments.forEach((p) => {
    const key = toDateKey(dueDateInMonth(p, year, month))
    if (!paymentsByDay[key]) paymentsByDay[key] = []
    paymentsByDay[key].push(p)
  })

  const totalDays = daysInMonth(year, month)
  const startOffset = new Date(year, month, 1).getDay()

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month

  return (
    <section className="calendar-section">
      <button type="button" className="section-toggle" onClick={toggle} aria-expanded={open}>
        <h2>カレンダー</h2>
        <span className={`section-chevron ${open ? 'open' : ''}`}>▾</span>
      </button>

      {open && (
        <>
          <div className="calendar-header">
            <button
              type="button"
              onClick={() => setCursor(new Date(year, month - 1, 1))}
              aria-label="前の月"
            >
              ‹
            </button>
            <span className="calendar-month-label">
              {year}年{month + 1}月
            </span>
            <button
              type="button"
              onClick={() => setCursor(new Date(year, month + 1, 1))}
              aria-label="次の月"
            >
              ›
            </button>
          </div>

          <div className="calendar-grid calendar-weekdays">
            {WEEKDAYS.map((w) => (
              <div key={w} className="calendar-weekday">
                {w}
              </div>
            ))}
          </div>

          <div className="calendar-grid">
            {cells.map((d, i) => {
              if (d === null) return <div key={i} className="calendar-cell empty" />

              const key = toDateKey(new Date(year, month, d))
              const totals = dailyTotals[key]
              const payments = paymentsByDay[key]
              const isToday = isCurrentMonth && today.getDate() === d

              return (
                <div key={i} className={`calendar-cell ${isToday ? 'today' : ''}`}>
                  <span className="calendar-day">{d}</span>
                  {totals?.income > 0 && (
                    <span className="calendar-income">+{yen.format(totals.income)}</span>
                  )}
                  {totals?.expense > 0 && (
                    <span className="calendar-expense">-{yen.format(totals.expense)}</span>
                  )}
                  {payments?.map((p) => (
                    <span
                      key={p.id}
                      className={`calendar-payment ${p.type === 'income' ? 'income' : ''}`}
                    >
                      {p.type === 'income' ? '+' : ''}
                      {p.name}
                    </span>
                  ))}
                </div>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}
