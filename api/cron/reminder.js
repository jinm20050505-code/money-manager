import webpush from 'web-push'
import { prisma } from '../../lib/prisma.js'

function todayRangeJST() {
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const y = jst.getUTCFullYear()
  const m = jst.getUTCMonth()
  const d = jst.getUTCDate()
  const startUTC = Date.UTC(y, m, d, 0, 0, 0) - 9 * 60 * 60 * 1000
  return { start: new Date(startUTC), end: new Date(startUTC + 24 * 60 * 60 * 1000) }
}

export default async function handler(req, res) {
  if (process.env.CRON_SECRET) {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'unauthorized' })
    }
  }

  const { start, end } = todayRangeJST()

  const usersWithSubscriptions = await prisma.user.findMany({
    where: { pushSubscriptions: { some: {} } },
    include: { pushSubscriptions: true },
  })

  if (usersWithSubscriptions.length === 0) {
    return res.status(200).json({ sent: 0, reason: 'no subscriptions' })
  }

  webpush.setVapidDetails(
    'mailto:support@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  )

  const payload = JSON.stringify({
    title: 'マネマネ',
    body: '今日はまだ記録がありません。忘れてても大丈夫、気づいたときにまとめて記録できます。',
  })

  let sent = 0
  for (const user of usersWithSubscriptions) {
    const todayCount = await prisma.transaction.count({
      where: { userId: user.id, date: { gte: start, lt: end } },
    })
    if (todayCount > 0) continue

    for (const sub of user.pushSubscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        )
        sent += 1
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
        }
      }
    }
  }

  return res.status(200).json({ sent })
}
