import { nextDueDate } from '../lib/dueDate.js'
import { dailyRate } from '../lib/loan.js'

const yen = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' })

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export default function DailyAllowance({ balance, fixedPayments, loans }) {
  const today = startOfDay(new Date())

  const expensePayments = fixedPayments.filter((p) => p.type !== 'income')
  const incomePayments = fixedPayments.filter((p) => p.type === 'income')

  let targetDate
  let amountToReserve = 0
  let label

  if (expensePayments.length > 0) {
    const withDue = expensePayments.map((p) => ({ ...p, due: nextDueDate(p, today) }))
    const soonest = withDue.reduce((a, b) => (a.due < b.due ? a : b))
    targetDate = soonest.due
    amountToReserve = soonest.amount
    label = `次の支払い「${soonest.name}」（${targetDate.toLocaleDateString('ja-JP')}）まで`
  } else {
    targetDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    label = `今月末（${targetDate.toLocaleDateString('ja-JP')}）まで`
  }

  const incomingBeforeTarget = incomePayments
    .map((p) => ({ ...p, due: nextDueDate(p, today) }))
    .filter((p) => p.due <= targetDate)
    .reduce((sum, p) => sum + p.amount, 0)

  const daysRemaining = Math.max(1, Math.round((targetDate - today) / 86400000))
  const usable = balance + incomingBeforeTarget - amountToReserve
  const loanBurden = Math.round(loans.reduce((sum, l) => sum + dailyRate(l, today), 0))
  const perDay = Math.floor(usable / daysRemaining) - loanBurden

  return (
    <section className="daily-allowance">
      <span className="daily-allowance-label">
        {label}あと{daysRemaining}日
      </span>
      <span className={`daily-allowance-amount ${perDay < 0 ? 'negative' : ''}`}>
        1日 {yen.format(perDay)}
      </span>
      {incomingBeforeTarget > 0 && (
        <span className="daily-allowance-note">
          （それまでに入る収入 {yen.format(incomingBeforeTarget)} を含む）
        </span>
      )}
      {loanBurden > 0 && (
        <span className="daily-allowance-note">
          （うち借金返済分 {yen.format(loanBurden)}/日を差し引き済み）
        </span>
      )}
      {perDay < 0 && (
        <p className="daily-allowance-warning">
          このペースだと支払い前にお金が足りなくなります
        </p>
      )}
    </section>
  )
}
