import express from 'express';
import passport from 'passport';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { IVerifyOptions } from 'passport-local';
import { requireAuth } from '../middlewares/isAuthenticated';
import { createRefreshToken, generateAccessToken } from '../utils/tokens';
import { RefreshToken } from '../schemas/RefreshTokenSchema';
import { IUser } from '../models/IUser';
import { EmailConfirmationToken } from '../schemas/EmailConfirmationSchema';
import { User } from '../schemas/UserSchema';
import { TokenParams } from '@/models/generic/Routes';

const router = express.Router();

const SUCCESS_URL_GOOGLE_CALLBACK = process.env.SUCCESS_URL_GOOGLE_CALLBACK!;
const FAILURE_URL_GOOGLE_CALLBACK = process.env.FAILURE_URL_GOOGLE_CALLBACK!;

router.post('/login', (req, res, next) => {
  passport.authenticate(
    'local',
    { session: false },
    async (err: Error | null, user: IUser | false, info: IVerifyOptions | undefined) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: info?.message || 'Login failed' });

      // 🔹 Check if email is verified
      if (!user.isVerified) {
        return res.status(403).json({ error: 'Please verify your email before logging in.' });
      }

      // Access token
      const accessToken = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET || 'supersecret',
        { expiresIn: '15m' },
      );

      // Refresh token (DB + cookie)
      const refreshToken = await createRefreshToken(user._id.toString());
      res.cookie('refreshToken', refreshToken.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 4 * 24 * 60 * 60 * 1000,
      });

      res.json({ message: 'Login successful', accessToken });
    },
  )(req, res, next);
});

router.post('/refreshToken', async (req: Request, res: Response) => {
  try {
    if (!req.cookies || !req.cookies.refreshToken) {
      res.status(401).json({ error: 'No refresh token' });
      return;
    }

    const refreshTokenValue = req.cookies.refreshToken;
    const storedToken = await RefreshToken.findOne({ token: refreshTokenValue, isValid: true });

    if (!storedToken) {
      res.status(403).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    if (storedToken.expiresAt < new Date()) {
      storedToken.isValid = false;
      await storedToken.save();
      res.status(403).json({ error: 'Refresh token expired' });
      return;
    }

    // Rotate: invalidate old token
    storedToken.isValid = false;
    await storedToken.save();

    // Issue new tokens
    const payload = { id: storedToken.userId };
    const accessToken = generateAccessToken(payload);
    const newRefreshToken = await createRefreshToken(storedToken.userId.toString());

    // Send new refresh in cookie
    res.cookie('refreshToken', newRefreshToken.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 4 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken });
  } catch (e) {
    console.error('refreshToken error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/logout', async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;
  if (token) {
    await RefreshToken.updateOne({ token }, { isValid: false });
    res.clearCookie('refreshToken');
  }
  res.json({ message: 'Logged out' });
});

router.get('/getLoggedUser', requireAuth, (req: Request, res: Response) => {
  res.json({ message: 'Logged user data', user: req.user });
});

router.get('/confirm/:token', async (req: Request<TokenParams>, res: Response) => {
  const { token } = req.params;

  // Hash incoming token
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Find token record (expired tokens will be excluded)
  const record = await EmailConfirmationToken.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() }, // Only valid tokens
  });

  if (!record) {
    // Token not found OR expired, attempt cleanup if token exists but expired
    const maybeExpired = await EmailConfirmationToken.findOne({ tokenHash });
    if (maybeExpired) {
      await EmailConfirmationToken.deleteOne({ _id: maybeExpired._id });
    }
    res.status(400).json({ message: 'Invalid or expired token' });
    return;
  }

  // If valid: verify user and cleanup
  await User.findByIdAndUpdate(record.userId, { isVerified: true });
  await EmailConfirmationToken.deleteMany({ userId: record.userId }); // Clean up all tokens

  res.json({ message: 'Email verified successfully' });
  return;
});

// Step 1: Redirect user to Google
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false }),
);

// Step 2: Google redirects back here
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${FAILURE_URL_GOOGLE_CALLBACK}/oauth`,
  }),
  (req: Request, res: Response) => {
    const user = req.user as IUser;
    const token = generateAccessToken({ id: user._id });

    // Send the JWT to your frontend via query param or a short-lived cookie
    res.redirect(`${SUCCESS_URL_GOOGLE_CALLBACK}/${token}`);
  },
);

export default router;
