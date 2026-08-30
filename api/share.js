import { randomUUID } from 'crypto'
import { prisma } from '../lib/prisma.js'

export default async function handler(req, res) {
  if (req.method === 'POST') {
    let profile = await prisma.profile.findFirst()
    if (!profile) {
      return res.status(400).json({ error: '共有する前にプロフィールを登録してください' })
    }

    if (!profile.shareToken) {
      profile = await prisma.profile.update({
        where: { id: profile.id },
        data: { shareToken: randomUUID() },
      })
    }

    return res.status(200).json({ token: profile.shareToken })
  }

  res.setHeader('Allow', ['POST'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
