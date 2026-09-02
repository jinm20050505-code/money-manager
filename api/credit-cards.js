import { prisma } from '../lib/prisma.js'
import { getUserId } from '../lib/auth.js'
import { isBlank, hasInvalidChars, REQUIRED_MESSAGE, INVALID_CHAR_MESSAGE } from '../lib/validation.js'

export default async function handler(req, res) {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: '認証が必要です' })

  const { id } = req.query

  if (id === undefined) {
    if (req.method === 'GET') {
      const cards = await prisma.creditCard.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      })
      return res.status(200).json(cards)
    }

    if (req.method === 'POST') {
      const { name, paymentDay } = req.body ?? {}
      const errors = {}

      if (isBlank(name)) errors.name = REQUIRED_MESSAGE
      else if (hasInvalidChars(name)) errors.name = INVALID_CHAR_MESSAGE

      if (isBlank(paymentDay)) errors.paymentDay = REQUIRED_MESSAGE
      else if (!Number.isInteger(Number(paymentDay)) || Number(paymentDay) < 1 || Number(paymentDay) > 31) {
        errors.paymentDay = '1〜31の日付を指定してください'
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ errors })
      }

      const card = await prisma.creditCard.create({
        data: { userId, name, paymentDay: Number(paymentDay) },
      })
      return res.status(201).json(card)
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const cardId = Number(id)
  if (!Number.isInteger(cardId)) {
    return res.status(400).json({ error: '不正なIDです' })
  }

  if (req.method === 'DELETE') {
    const result = await prisma.creditCard.deleteMany({ where: { id: cardId, userId } })
    if (result.count === 0) {
      return res.status(404).json({ error: 'カードが見つかりません' })
    }
    return res.status(204).end()
  }

  res.setHeader('Allow', ['DELETE'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
