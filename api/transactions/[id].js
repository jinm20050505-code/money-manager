import { prisma } from '../../lib/prisma.js'
import { isBlank, hasInvalidChars, REQUIRED_MESSAGE, INVALID_CHAR_MESSAGE } from '../../lib/validation.js'

export default async function handler(req, res) {
  const transactionId = Number(req.query.id)

  if (!Number.isInteger(transactionId)) {
    return res.status(400).json({ error: '不正なIDです' })
  }

  if (req.method === 'PUT') {
    const { type, amount, category, memo, date, paymentMethod, creditCardId } = req.body ?? {}
    const errors = {}

    if (type !== 'income' && type !== 'expense') {
      errors.type = REQUIRED_MESSAGE
    }

    if (isBlank(amount)) {
      errors.amount = REQUIRED_MESSAGE
    } else if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      errors.amount = '正しい金額を入力してください'
    }

    if (hasInvalidChars(memo)) errors.memo = INVALID_CHAR_MESSAGE
    if (hasInvalidChars(category)) errors.category = INVALID_CHAR_MESSAGE

    const isCredit = paymentMethod === 'credit'
    if (paymentMethod !== undefined && paymentMethod !== 'cash' && paymentMethod !== 'credit') {
      errors.paymentMethod = '現金またはクレカを指定してください'
    }
    if (isCredit && !Number.isInteger(Number(creditCardId))) {
      errors.creditCardId = 'カードを選択してください'
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors })
    }

    try {
      const transaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          type,
          amount: Math.round(Number(amount)),
          category: category || null,
          memo: memo || null,
          date: date ? new Date(date) : new Date(),
          paymentMethod: isCredit ? 'credit' : 'cash',
          creditCardId: isCredit ? Number(creditCardId) : null,
        },
      })
      return res.status(200).json(transaction)
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: '取引が見つかりません' })
      }
      throw err
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.transaction.delete({ where: { id: transactionId } })
      return res.status(204).end()
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: '取引が見つかりません' })
      }
      throw err
    }
  }

  res.setHeader('Allow', ['PUT', 'DELETE'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
