import { nextDueDate } from '../lib/dueDate.js'

const yen = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' })
const LOOKAHEAD_DAYS = 7

export default function PaymentAlert({ balance, fixedPayments }) {
  const today = new Date()

  const upcoming = fixedPayments
    .map((p) => ({ ...p, due: nextDueDate(p, today) }))
    .filter((p) => (p.due - today) / 86400000 <= LOOKAHEAD_DAYS)
    .sort((a, b) => a.due - b.due)

  if (upcoming.length === 0) return null

  let running = balance
  let shortage = null
  for (const p of upcoming) {
    running += p.type === 'income' ? p.amount : -p.amount
    if (running < 0 && !shortage) {
      shortage = { event: p, runningBalance: running }
    }
  }

  if (!shortage) return null

  return (
    <div className="payment-alert">
      <strong>支払い日にお金が足りなくなりそうです</strong>
      <ul>
        {upcoming.map((p) => (
          <li key={p.id} className={p.type === 'income' ? 'income' : 'expense'}>
            {p.due.toLocaleDateString('ja-JP')}：{p.name}（{p.type === 'income' ? '+' : '-'}
            {yen.format(p.amount)}）
          </li>
        ))}
      </ul>
      <p>
        {shortage.event.due.toLocaleDateString('ja-JP')}の「{shortage.event.name}」の時点で、残高が
        {yen.format(shortage.runningBalance)}になる見込みです。
      </p>
    </div>
  )
}
