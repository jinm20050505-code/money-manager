import { prisma } from '../lib/prisma.js'
import { getUserId } from '../lib/auth.js'
import { isBlank, hasInvalidChars, REQUIRED_MESSAGE, INVALID_CHAR_MESSAGE } from '../lib/validation.js'

const VALID_FREQUENCIES = ['daily', 'weekly', 'monthly']

export default async function handler(req, res) {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: '認証が必要です' })

  const { id, resource } = req.query

  if (id === undefined) {
    if (req.method === 'GET') {
      const loans = await prisma.loan.findMany({
        where: { userId },
        include: { payments: true },
        orderBy: { createdAt: 'desc' },
      })
      return res.status(200).json(loans)
    }

    if (req.method === 'POST') {
      const { amount, lender, dueDate, memo, repaymentFrequency, repaymentAmount } = req.body ?? {}
      const errors = {}

      if (isBlank(lender)) errors.lender = REQUIRED_MESSAGE
      else if (hasInvalidChars(lender)) errors.lender = INVALID_CHAR_MESSAGE

      if (isBlank(amount)) errors.amount = REQUIRED_MESSAGE
      else if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
        errors.amount = '正しい金額を入力してください'
      }

      if (hasInvalidChars(memo)) errors.memo = INVALID_CHAR_MESSAGE

      const hasPlan = !isBlank(repaymentFrequency)
      if (hasPlan) {
        if (!VALID_FREQUENCIES.includes(repaymentFrequency)) {
          errors.repaymentFrequency = '毎日・毎週・毎月のいずれかを指定してください'
        }
        if (isBlank(repaymentAmount)) errors.repaymentAmount = REQUIRED_MESSAGE
        else if (!Number.isFinite(Number(repaymentAmount)) || Number(repaymentAmount) <= 0) {
          errors.repaymentAmount = '正しい金額を入力してください'
        }
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ errors })
      }

      const loan = await prisma.loan.create({
        data: {
          userId,
          amount: Math.round(Number(amount)),
          lender,
          dueDate: !hasPlan && dueDate ? new Date(dueDate) : null,
          memo: memo || null,
          repaymentFrequency: hasPlan ? repaymentFrequency : null,
          repaymentAmount: hasPlan ? Math.round(Number(repaymentAmount)) : null,
        },
        include: { payments: true },
      })
      return res.status(201).json(loan)
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const loanId = Number(id)
  if (!Number.isInteger(loanId)) {
    return res.status(400).json({ error: '不正なIDです' })
  }

  if (resource === 'payments') {
    const loan = await prisma.loan.findFirst({ where: { id: loanId, userId } })
    if (!loan) {
      return res.status(404).json({ error: '借入記録が見つかりません' })
    }

    if (req.method === 'GET') {
      const payments = await prisma.loanPayment.findMany({
        where: { loanId },
        orderBy: { date: 'desc' },
      })
      return res.status(200).json(payments)
    }

    if (req.method === 'POST') {
      const { amount } = req.body ?? {}
      const resolvedAmount = isBlank(amount) ? loan.repaymentAmount : Number(amount)

      if (!Number.isFinite(resolvedAmount) || resolvedAmount <= 0) {
        return res.status(400).json({ errors: { amount: '正しい金額を入力してください' } })
      }

      const payment = await prisma.loanPayment.create({
        data: { loanId, amount: Math.round(resolvedAmount) },
      })
      return res.status(201).json(payment)
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  if (req.method === 'PATCH') {
    const { repaid } = req.body ?? {}
    const result = await prisma.loan.updateMany({
      where: { id: loanId, userId },
      data: { repaid: !!repaid },
    })
    if (result.count === 0) {
      return res.status(404).json({ error: '借入記録が見つかりません' })
    }
    const loan = await prisma.loan.findUnique({ where: { id: loanId } })
    return res.status(200).json(loan)
  }

  if (req.method === 'DELETE') {
    const result = await prisma.loan.deleteMany({ where: { id: loanId, userId } })
    if (result.count === 0) {
      return res.status(404).json({ error: '借入記録が見つかりません' })
    }
    return res.status(204).end()
  }

  res.setHeader('Allow', ['PATCH', 'DELETE'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
