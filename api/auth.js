import { prisma } from '../lib/prisma.js'
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  getUserId,
  setSessionCookie,
  clearSessionCookie,
} from '../lib/auth.js'
import { isBlank, REQUIRED_MESSAGE } from '../lib/validation.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CLAIMABLE_MODELS = [
  'profile',
  'transaction',
  'fixedPayment',
  'budget',
  'loan',
  'creditCard',
  'savingsGoal',
  'pushSubscription',
]

async function claimOrphanedData(userId) {
  for (const model of CLAIMABLE_MODELS) {
    await prisma[model].updateMany({ where: { userId: null }, data: { userId } })
  }
}

function validateCredentials({ email, password }) {
  const errors = {}
  if (isBlank(email)) errors.email = REQUIRED_MESSAGE
  else if (!EMAIL_PATTERN.test(email)) errors.email = '正しいメールアドレスを入力してください'

  if (isBlank(password)) errors.password = REQUIRED_MESSAGE

  return errors
}

export default async function handler(req, res) {
  const { action } = req.query

  if (action === 'register') {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST'])
      return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    const { email, password } = req.body ?? {}
    const errors = validateCredentials({ email, password })
    if (!errors.password && password.length < 8) errors.password = '8文字以上で入力してください'

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(400).json({ errors: { email: 'このメールアドレスは既に登録されています' } })
    }

    const isFirstUser = (await prisma.user.count()) === 0
    const user = await prisma.user.create({
      data: { email, passwordHash: hashPassword(password) },
    })

    if (isFirstUser) {
      await claimOrphanedData(user.id)
    }

    const { token, maxAgeSeconds } = createSessionToken(user.id, true)
    setSessionCookie(res, token, maxAgeSeconds)
    return res.status(201).json({ id: user.id, email: user.email })
  }

  if (action === 'login') {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST'])
      return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    const { email, password, remember } = req.body ?? {}
    const errors = validateCredentials({ email, password })
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'メールアドレスまたはパスワードが違います' })
    }

    const { token, maxAgeSeconds } = createSessionToken(user.id, !!remember)
    setSessionCookie(res, token, maxAgeSeconds)
    return res.status(200).json({ id: user.id, email: user.email })
  }

  if (action === 'logout') {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST'])
      return res.status(405).end(`Method ${req.method} Not Allowed`)
    }
    clearSessionCookie(res)
    return res.status(200).json({ ok: true })
  }

  if (action === 'change-password') {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST'])
      return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    const userId = getUserId(req)
    if (!userId) return res.status(401).json({ error: '認証が必要です' })

    const { currentPassword, newPassword } = req.body ?? {}
    const errors = {}

    if (isBlank(currentPassword)) errors.currentPassword = REQUIRED_MESSAGE

    if (isBlank(newPassword)) errors.newPassword = REQUIRED_MESSAGE
    else if (newPassword.length < 8) errors.newPassword = '8文字以上で入力してください'

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
      return res.status(401).json({ errors: { currentPassword: '現在のパスワードが違います' } })
    }

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashPassword(newPassword) },
    })

    return res.status(200).json({ ok: true })
  }

  if (action === 'me') {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET'])
      return res.status(405).end(`Method ${req.method} Not Allowed`)
    }
    const userId = getUserId(req)
    if (!userId) return res.status(200).json(null)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(200).json(null)

    return res.status(200).json({ id: user.id, email: user.email })
  }

  return res.status(400).json({ error: '不正なリクエストです' })
}
