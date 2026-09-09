import webpush from 'web-push'
import { prisma } from '../../lib/prisma.js'
import { hashPassword } from '../../lib/auth.js'

const DEMO_EMAIL = 'demo@example.com'
const DEMO_PASSWORD = 'demo12345'

function todayRangeJST() {
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const y = jst.getUTCFullYear()
  const m = jst.getUTCMonth()
  const d = jst.getUTCDate()
  const startUTC = Date.UTC(y, m, d, 0, 0, 0) - 9 * 60 * 60 * 1000
  return { start: new Date(startUTC), end: new Date(startUTC + 24 * 60 * 60 * 1000) }
}

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

async function resetDemoAccount() {
  let demoUser = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } })
  if (!demoUser) {
    demoUser = await prisma.user.create({
      data: { email: DEMO_EMAIL, passwordHash: hashPassword(DEMO_PASSWORD) },
    })
  }
  const userId = demoUser.id

  await prisma.transaction.deleteMany({ where: { userId } })
  await prisma.fixedPayment.deleteMany({ where: { userId } })
  await prisma.budget.deleteMany({ where: { userId } })
  await prisma.loan.deleteMany({ where: { userId } })
  await prisma.creditCard.deleteMany({ where: { userId } })
  await prisma.savingsGoal.deleteMany({ where: { userId } })
  await prisma.profile.deleteMany({ where: { userId } })
  await prisma.pushSubscription.deleteMany({ where: { userId } })

  await prisma.profile.create({
    data: { userId, name: 'デモ太郎', age: 21, occupation: '配達フリーター' },
  })

  await prisma.transaction.createMany({
    data: [
      { userId, type: 'income', amount: 8000, category: '日払い', memo: '配達バイト代', date: daysAgo(1) },
      { userId, type: 'expense', amount: 500, category: '食費', memo: 'コンビニ', date: daysAgo(1) },
      { userId, type: 'income', amount: 8000, category: '日払い', memo: '配達バイト代', date: daysAgo(2) },
      { userId, type: 'expense', amount: 800, category: '食費', memo: 'ランチ', date: daysAgo(2) },
      { userId, type: 'expense', amount: 200, category: '交通費', memo: '電車', date: daysAgo(3) },
      { userId, type: 'income', amount: 10000, category: '日払い', memo: '配達バイト代', date: daysAgo(4) },
    ],
  })

  await prisma.fixedPayment.create({
    data: { userId, name: '家賃', amount: 45000, type: 'expense', dueDay: 27 },
  })

  await prisma.budget.create({
    data: { userId, category: '食費', limit: 20000 },
  })
}

export default async function handler(req, res) {
  if (process.env.CRON_SECRET) {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'unauthorized' })
    }
  }

  await resetDemoAccount()

  const { start, end } = todayRangeJST()

  const usersWithSubscriptions = await prisma.user.findMany({
    where: { pushSubscriptions: { some: {} } },
    include: { pushSubscriptions: true },
  })

  if (usersWithSubscriptions.length === 0) {
    return res.status(200).json({ sent: 0, demoReset: true, reason: 'no subscriptions' })
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

  return res.status(200).json({ sent, demoReset: true })
}
