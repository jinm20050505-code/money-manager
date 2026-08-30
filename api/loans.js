import { prisma } from '../lib/prisma.js'
import { isBlank, hasInvalidChars, REQUIRED_MESSAGE, INVALID_CHAR_MESSAGE } from '../lib/validation.js'

const VALID_FREQUENCIES = ['daily', 'weekly', 'monthly']

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const loans = await prisma.loan.findMany({
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
