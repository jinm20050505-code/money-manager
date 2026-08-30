import { daysInMonth } from './dueDate.js'

export const FREQUENCY_LABEL = {
  daily: '毎日',
  weekly: '毎週',
  monthly: '毎月',
}

export function hasInstallmentPlan(loan) {
  return Boolean(loan.repaymentFrequency && loan.repaymentAmount)
}

export function remainingAmount(loan) {
  const paid = (loan.payments || []).reduce((sum, p) => sum + p.amount, 0)
  return Math.max(0, loan.amount - paid)
}

export function isSettled(loan) {
  return hasInstallmentPlan(loan) ? remainingAmount(loan) <= 0 : loan.repaid
}

export function dailyRate(loan, today = new Date()) {
  if (!hasInstallmentPlan(loan) || isSettled(loan)) return 0

  switch (loan.repaymentFrequency) {
    case 'daily':
      return loan.repaymentAmount
    case 'weekly':
      return loan.repaymentAmount / 7
    case 'monthly':
      return loan.repaymentAmount / daysInMonth(today.getFullYear(), today.getMonth())
    default:
      return 0
  }
}
