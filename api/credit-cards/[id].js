import { prisma } from '../../lib/prisma.js'

export default async function handler(req, res) {
  const id = Number(req.query.id)
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: '不正なIDです' })
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.creditCard.delete({ where: { id } })
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
