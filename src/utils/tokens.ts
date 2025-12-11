import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { RefreshToken } from '../schemas/RefreshTokenSchema'

const ACCESS_SECRET = process.env.JWT_SECRET || 'supersecret'

export function generateAccessToken(payload: object): string {
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '10m' })
}

export async function createRefreshToken(userId: string) {
    const token = crypto.randomBytes(40).toString("hex")
    const expiresAt = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) // 4 days
    const refreshToken = new RefreshToken({ userId: userId, token, expiresAt })
    await refreshToken.save()
    return refreshToken
}

export function generateVerificationToken() {
  const token = crypto.randomBytes(32).toString('hex'); // raw token for email
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex'); // store hash
  return { token, hashedToken };
}