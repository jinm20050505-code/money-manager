import { prisma } from '../../lib/prisma.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { token } = req.query
  const profile = await prisma.profile.findUnique({ where: { shareToken: token } })
  if (!profile) {
    return res.status(404).json({ error: 'この共有リンクは無効です' })
  }

  const transactions = await prisma.transaction.findMany({ orderBy: { date: 'desc' } })

  const balance = transactions.reduce(
    (sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount),
    0,
  )

  const categories = transactions.reduce((acc, t) => {
    if (!t.category) return acc
    acc[t.category] = (acc[t.category] || 0) + (t.type === 'income' ? t.amount : -t.amount)
    return acc
  }, {})

  return res.status(200).json({
    name: profile.name,
    occupation: profile.occupation,
    balance,
    categories,
  })
}
