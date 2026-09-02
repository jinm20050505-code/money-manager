import { prisma } from '../../lib/prisma.js'
import { getUserId } from '../../lib/auth.js'

export default async function handler(req, res) {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: '認証が必要です' })

  if (req.method === 'POST') {
    const { endpoint, keys } = req.body ?? {}

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: '不正な購読情報です' })
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh: keys.p256dh, auth: keys.auth, userId },
      create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId },
    })
    return res.status(201).json({ ok: true })
  }

  if (req.method === 'DELETE') {
    const { endpoint } = req.body ?? {}
    if (!endpoint) {
      return res.status(400).json({ error: 'endpoint を指定してください' })
    }
    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId } })
    return res.status(204).end()
  }

  res.setHeader('Allow', ['POST', 'DELETE'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
