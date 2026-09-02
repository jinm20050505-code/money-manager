import { prisma } from '../lib/prisma.js'
import { isBlank, hasInvalidChars, REQUIRED_MESSAGE, INVALID_CHAR_MESSAGE } from '../lib/validation.js'

export default async function handler(req, res) {
  const { id } = req.query

  if (id === undefined) {
    if (req.method === 'GET') {
      const payments = await prisma.fixedPayment.findMany({ orderBy: { createdAt: 'asc' } })
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
    try {
      await prisma.fixedPayment.delete({ where: { id: paymentId } })
      return res.status(204).end()
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: '固定費が見つかりません' })
      }
      throw err
    }
  }

  res.setHeader('Allow', ['DELETE'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
