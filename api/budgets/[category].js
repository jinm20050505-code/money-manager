import { prisma } from '../../lib/prisma.js'

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    await prisma.budget.delete({ where: { category: req.query.category } })
    return res.status(204).end()
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: '予算が見つかりません' })
    }
    throw err
  }
}
