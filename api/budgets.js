import { prisma } from '../lib/prisma.js'
import { getUserId } from '../lib/auth.js'
import { isBlank, hasInvalidChars, REQUIRED_MESSAGE, INVALID_CHAR_MESSAGE } from '../lib/validation.js'

export default async function handler(req, res) {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: '認証が必要です' })

  const { category } = req.query

  if (category === undefined) {
    if (req.method === 'GET') {
      const budgets = await prisma.budget.findMany({
        where: { userId },
        orderBy: { category: 'asc' },
      })
      return res.status(200).json(budgets)
    }

    if (req.method === 'POST') {
      const { category: newCategory, limit } = req.body ?? {}
      const errors = {}

      if (isBlank(newCategory)) errors.category = REQUIRED_MESSAGE
      else if (hasInvalidChars(newCategory)) errors.category = INVALID_CHAR_MESSAGE

      if (isBlank(limit)) errors.limit = REQUIRED_MESSAGE
      else if (!Number.isFinite(Number(limit)) || Number(limit) <= 0) {
        errors.limit = '正しい金額を入力してください'
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ errors })
      }

      const budget = await prisma.budget.upsert({
        where: { userId_category: { userId, category: newCategory } },
        update: { limit: Math.round(Number(limit)) },
        create: { userId, category: newCategory, limit: Math.round(Number(limit)) },
      })
      return res.status(200).json(budget)
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const result = await prisma.budget.deleteMany({ where: { userId, category } })
  if (result.count === 0) {
    return res.status(404).json({ error: '予算が見つかりません' })
  }
  return res.status(204).end()
}
