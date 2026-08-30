import { prisma } from '../../lib/prisma.js'

export default async function handler(req, res) {
  const id = Number(req.query.id)

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: '不正なIDです' })
  }

  if (req.method === 'PATCH') {
    const { repaid } = req.body ?? {}
    try {
      const loan = await prisma.loan.update({ where: { id }, data: { repaid: !!repaid } })
      return res.status(200).json(loan)
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: '借入記録が見つかりません' })
      }
      throw err
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.loan.delete({ where: { id } })
      return res.status(204).end()
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: '借入記録が見つかりません' })
      }
      throw err
    }
  }

  res.setHeader('Allow', ['PATCH', 'DELETE'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
