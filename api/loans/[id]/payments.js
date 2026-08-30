import { prisma } from '../../../lib/prisma.js'
import { isBlank } from '../../../lib/validation.js'

export default async function handler(req, res) {
  const loanId = Number(req.query.id)
  if (!Number.isInteger(loanId)) {
    return res.status(400).json({ error: '不正なIDです' })
  }

  if (req.method === 'GET') {
    const payments = await prisma.loanPayment.findMany({
      where: { loanId },
      orderBy: { date: 'desc' },
    })
    return res.status(200).json(payments)
  }

  if (req.method === 'POST') {
    const loan = await prisma.loan.findUnique({ where: { id: loanId } })
    if (!loan) {
      return res.status(404).json({ error: '借入記録が見つかりません' })
    }

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
