import { prisma } from '../lib/prisma.js'
import { isBlank, hasInvalidChars, REQUIRED_MESSAGE, INVALID_CHAR_MESSAGE } from '../lib/validation.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const transactions = await prisma.transaction.findMany({
      orderBy: { date: 'desc' },
    })
    return res.status(200).json(transactions)
  }

  if (req.method === 'POST') {
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

    const transaction = await prisma.transaction.create({
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
    return res.status(201).json(transaction)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
