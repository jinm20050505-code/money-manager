import { prisma } from '../lib/prisma.js'
import { isBlank, hasInvalidChars, REQUIRED_MESSAGE, INVALID_CHAR_MESSAGE } from '../lib/validation.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const budgets = await prisma.budget.findMany({ orderBy: { category: 'asc' } })
    return res.status(200).json(budgets)
  }

  if (req.method === 'POST') {
    const { category, limit } = req.body ?? {}
    const errors = {}

    if (isBlank(category)) errors.category = REQUIRED_MESSAGE
    else if (hasInvalidChars(category)) errors.category = INVALID_CHAR_MESSAGE

    if (isBlank(limit)) errors.limit = REQUIRED_MESSAGE
    else if (!Number.isFinite(Number(limit)) || Number(limit) <= 0) {
      errors.limit = '正しい金額を入力してください'
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors })
    }

    const budget = await prisma.budget.upsert({
      where: { category },
      update: { limit: Math.round(Number(limit)) },
      create: { category, limit: Math.round(Number(limit)) },
    })
    return res.status(200).json(budget)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
