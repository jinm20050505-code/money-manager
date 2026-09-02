import { prisma } from '../lib/prisma.js'
import { getUserId } from '../lib/auth.js'
import { isBlank, hasInvalidChars, REQUIRED_MESSAGE, INVALID_CHAR_MESSAGE } from '../lib/validation.js'

export default async function handler(req, res) {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: '認証が必要です' })

  if (req.method === 'GET') {
    const profile = await prisma.profile.findUnique({ where: { userId } })
    return res.status(200).json(profile)
  }

  if (req.method === 'PUT') {
    const { name, age, occupation } = req.body ?? {}
    const errors = {}

    if (isBlank(name)) errors.name = REQUIRED_MESSAGE
    else if (hasInvalidChars(name)) errors.name = INVALID_CHAR_MESSAGE

    if (isBlank(age)) errors.age = REQUIRED_MESSAGE
    else if (!Number.isFinite(Number(age)) || Number(age) <= 0) errors.age = '正しい年齢を入力してください'

    if (isBlank(occupation)) errors.occupation = REQUIRED_MESSAGE
    else if (hasInvalidChars(occupation)) errors.occupation = INVALID_CHAR_MESSAGE

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors })
    }

    const data = { name, age: Math.round(Number(age)), occupation }

    const profile = await prisma.profile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    })

    return res.status(200).json(profile)
  }

  res.setHeader('Allow', ['GET', 'PUT'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
