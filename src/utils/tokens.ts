import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { RefreshToken } from '../schemas/RefreshTokenSchema';
import { configEnvs } from '@/config/env';

export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ sub: userId }, configEnvs.ACCESS_SECRET, { expiresIn: '10m' });
};

export const verifyToken = (token: string): { sub: string } | null => {
  try {
    return jwt.verify(token, configEnvs.ACCESS_SECRET) as { sub: string };
  } catch {
    return null;
  }
};

export async function createRefreshToken(userId: string) {
  const token = crypto.randomBytes(40).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);

  await new RefreshToken({ userId, token: hashedToken, expiresAt }).save();
  return token; // return raw token for client
}

export function generateVerificationToken() {
  const token = crypto.randomBytes(32).toString('hex'); // raw token for email
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex'); // store hash
  return { token, hashedToken };
}

export async function rotateRefreshToken(incomingToken: string) {
  const hashedToken = crypto.createHash('sha256').update(incomingToken).digest('hex');

  const stored = await RefreshToken.findOne({ token: hashedToken });
  if (!stored || stored.expiresAt < new Date()) {
    throw new Error('Invalid or expired refresh token');
  }

  // invalidate old token
  await RefreshToken.deleteOne({ _id: stored._id });

  // issue new ones
  const newAccessToken = generateAccessToken(stored.userId.toString());
  const newRefreshToken = await createRefreshToken(stored.userId.toString());

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
