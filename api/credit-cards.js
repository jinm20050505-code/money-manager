import { prisma } from '../lib/prisma.js'
import { isBlank, hasInvalidChars, REQUIRED_MESSAGE, INVALID_CHAR_MESSAGE } from '../lib/validation.js'

export default async function handler(req, res) {
  const { id } = req.query

  if (id === undefined) {
    if (req.method === 'GET') {
      const cards = await prisma.creditCard.findMany({ orderBy: { createdAt: 'asc' } })
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
        data: { name, paymentDay: Number(paymentDay) },
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
    try {
      await prisma.creditCard.delete({ where: { id: cardId } })
      return res.status(204).end()
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'カードが見つかりません' })
      }
      throw err
    }
  }

  res.setHeader('Allow', ['DELETE'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
