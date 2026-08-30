import { prisma } from '../lib/prisma.js'
import { isBlank, REQUIRED_MESSAGE } from '../lib/validation.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const goal = await prisma.savingsGoal.findFirst()
    return res.status(200).json(goal)
  }

  if (req.method === 'PUT') {
    const { amount } = req.body ?? {}
    const errors = {}

    if (isBlank(amount)) errors.amount = REQUIRED_MESSAGE
    else if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      errors.amount = '正しい金額を入力してください'
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors })
    }

    const data = { amount: Math.round(Number(amount)) }
    const existing = await prisma.savingsGoal.findFirst()

    const goal = existing
      ? await prisma.savingsGoal.update({ where: { id: existing.id }, data })
      : await prisma.savingsGoal.create({ data })

    return res.status(200).json(goal)
  }

  res.setHeader('Allow', ['GET', 'PUT'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
