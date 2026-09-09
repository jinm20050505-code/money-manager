import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto'

if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error(
    'SESSION_SECRET environment variable is required in production (set it in the Vercel dashboard)',
  )
}

const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-insecure-secret-change-me'
const REMEMBER_MAX_AGE = 60 * 60 * 24 * 30
const DEFAULT_MAX_AGE = 60 * 60 * 24

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password, stored) {
  const [salt, hash] = (stored || '').split(':')
  if (!salt || !hash) return false
  const hashBuffer = Buffer.from(hash, 'hex')
  const candidate = scryptSync(password, salt, 64)
  return hashBuffer.length === candidate.length && timingSafeEqual(hashBuffer, candidate)
}

function sign(value) {
  return createHmac('sha256', SESSION_SECRET).update(value).digest('hex')
}

export function createSessionToken(userId, remember) {
  const maxAgeSeconds = remember ? REMEMBER_MAX_AGE : DEFAULT_MAX_AGE
  const expiresAt = Date.now() + maxAgeSeconds * 1000
  const payload = `${userId}.${expiresAt}`
  const token = `${payload}.${sign(payload)}`
  return { token, maxAgeSeconds: remember ? maxAgeSeconds : null }
}

export function verifySessionToken(token) {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [userIdStr, expiresAtStr, signature] = parts
  const payload = `${userIdStr}.${expiresAtStr}`
  const expected = sign(payload)
  const expectedBuf = Buffer.from(expected)
  const givenBuf = Buffer.from(signature)
  if (expectedBuf.length !== givenBuf.length || !timingSafeEqual(expectedBuf, givenBuf)) return null
  if (Date.now() > Number(expiresAtStr)) return null
  const userId = Number(userIdStr)
  return Number.isInteger(userId) ? userId : null
}

export function parseCookies(req) {
  const header = req.headers?.cookie
  if (!header) return {}
  return Object.fromEntries(
    header.split(';').map((pair) => {
      const idx = pair.indexOf('=')
      const key = (idx === -1 ? pair : pair.slice(0, idx)).trim()
      const value = idx === -1 ? '' : pair.slice(idx + 1).trim()
      return [key, decodeURIComponent(value)]
    }),
  )
}

export function getUserId(req) {
  return verifySessionToken(parseCookies(req).session)
}

export function setSessionCookie(res, token, maxAgeSeconds) {
  const parts = [`session=${encodeURIComponent(token)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax']
  if (process.env.NODE_ENV === 'production') parts.push('Secure')
  if (maxAgeSeconds) parts.push(`Max-Age=${maxAgeSeconds}`)
  res.setHeader('Set-Cookie', parts.join('; '))
}

export function clearSessionCookie(res) {
  const parts = ['session=', 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0']
  if (process.env.NODE_ENV === 'production') parts.push('Secure')
  res.setHeader('Set-Cookie', parts.join('; '))
}
