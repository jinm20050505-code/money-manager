import { daysInMonth, nextDueDate } from './dueDate.js'

export function billingDate(paymentDay, transactionDate) {
  const d = new Date(transactionDate)
  let year = d.getFullYear()
  let month = d.getMonth() + 1
  if (month > 11) {
    month = 0
    year += 1
  }
  const day = Math.min(paymentDay, daysInMonth(year, month))
  return new Date(year, month, day)
}

export function isBilled(paymentDay, transactionDate, today = new Date()) {
  return billingDate(paymentDay, transactionDate) <= today
}

function isCreditExpense(t, cardId) {
  return t.type === 'expense' && t.paymentMethod === 'credit' && t.creditCardId === cardId
}

export function pendingTotal(card, transactions, today = new Date()) {
  return transactions
    .filter((t) => isCreditExpense(t, card.id) && !isBilled(card.paymentDay, t.date, today))
    .reduce((sum, t) => sum + t.amount, 0)
}

export function nextBillAmount(card, transactions, today = new Date()) {
  const due = nextDueDate({ dueDay: card.paymentDay, endOfMonth: false }, today)
  return transactions
    .filter((t) => isCreditExpense(t, card.id))
    .filter((t) => billingDate(card.paymentDay, t.date).getTime() === due.getTime())
    .reduce((sum, t) => sum + t.amount, 0)
}

export function creditCardFixedPayments(creditCards, transactions, today = new Date()) {
  return creditCards.map((card) => ({
    id: `card-${card.id}`,
    name: `${card.name}の引き落とし`,
    amount: nextBillAmount(card, transactions, today),
    dueDay: card.paymentDay,
    endOfMonth: false,
    type: 'expense',
  }))
}

export function calculateBalance(transactions, creditCards, today = new Date()) {
  const cardsById = Object.fromEntries(creditCards.map((c) => [c.id, c]))

  return transactions.reduce((sum, t) => {
    if (t.type === 'income') return sum + t.amount

    if (t.paymentMethod !== 'credit') return sum - t.amount

    const card = cardsById[t.creditCardId]
    if (!card) return sum - t.amount

    return isBilled(card.paymentDay, t.date, today) ? sum - t.amount : sum
  }, 0)
}
