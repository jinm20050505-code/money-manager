import { prisma } from '../lib/prisma.js'
import { getUserId } from '../lib/auth.js'
import { isBlank, hasInvalidChars, REQUIRED_MESSAGE, INVALID_CHAR_MESSAGE } from '../lib/validation.js'

export default async function handler(req, res) {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: '認証が必要です' })

  const { id } = req.query

  if (id === undefined) {
    if (req.method === 'GET') {
      const payments = await prisma.fixedPayment.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      })
      return res.status(200).json(payments)
    }

    if (req.method === 'POST') {
      const { name, amount, dueDay, endOfMonth, type } = req.body ?? {}
      const errors = {}

      if (isBlank(name)) errors.name = REQUIRED_MESSAGE
      else if (hasInvalidChars(name)) errors.name = INVALID_CHAR_MESSAGE

      if (isBlank(amount)) errors.amount = REQUIRED_MESSAGE
      else if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
        errors.amount = '正しい金額を入力してください'
      }

      if (type !== undefined && type !== 'income' && type !== 'expense') {
        errors.type = '収入または支出を指定してください'
      }

      if (!endOfMonth) {
        if (isBlank(dueDay)) errors.dueDay = REQUIRED_MESSAGE
        else if (!Number.isInteger(Number(dueDay)) || Number(dueDay) < 1 || Number(dueDay) > 31) {
          errors.dueDay = '1〜31の日付を指定してください'
        }
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ errors })
      }

      const payment = await prisma.fixedPayment.create({
        data: {
          userId,
          name,
          amount: Math.round(Number(amount)),
          type: type === 'income' ? 'income' : 'expense',
          dueDay: endOfMonth ? null : Number(dueDay),
          endOfMonth: !!endOfMonth,
        },
      })
      return res.status(201).json(payment)
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const paymentId = Number(id)
  if (!Number.isInteger(paymentId)) {
    return res.status(400).json({ error: '不正なIDです' })
  }

  if (req.method === 'DELETE') {
    const result = await prisma.fixedPayment.deleteMany({ where: { id: paymentId, userId } })
    if (result.count === 0) {
      return res.status(404).json({ error: '固定費が見つかりません' })
    }
    return res.status(204).end()
  }

  res.setHeader('Allow', ['DELETE'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
