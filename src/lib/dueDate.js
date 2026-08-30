export function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function dueDateInMonth(payment, year, month) {
  if (payment.endOfMonth) {
    return new Date(year, month + 1, 0)
  }
  const day = Math.min(payment.dueDay, daysInMonth(year, month))
  return new Date(year, month, day)
}

export function nextDueDate(payment, from = new Date()) {
  const today = startOfDay(from)
  let year = from.getFullYear()
  let month = from.getMonth()
  let candidate = dueDateInMonth(payment, year, month)

  if (candidate < today) {
    month += 1
    if (month > 11) {
      month = 0
      year += 1
    }
    candidate = dueDateInMonth(payment, year, month)
  }

  return candidate
}
