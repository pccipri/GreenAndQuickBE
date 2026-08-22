import express from 'express';
import passport from 'passport';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import type { IVerifyOptions } from 'passport-local';
import { requireAuth } from '../middlewares/isAuthenticated';
import { createRefreshToken, generateAccessToken, rotateRefreshToken } from '../utils/tokens';
import { RefreshToken } from '../schemas/RefreshTokenSchema';
import type { ICreateUserDTO, IUser } from '../models/IUser';
import { EmailConfirmationToken } from '../schemas/EmailConfirmationSchema';
import { User } from '../schemas/UserSchema';
import type { TokenParams } from '@/models/generic/Routes';
import { configEnvs } from '@/config/env';
import { toUserDto } from '../presenters/UserPresenter';
import { upload } from '@/middlewares/upload';
import { uploadPublicImage } from '@/services/PublicImageStorageService';
import { validate } from '@/middlewares/validate';
import {
  passwordResetRequestSchema,
  registerSchema,
  updateProfileSchema,
} from '@/validations/authValidation';
import {
  createUser,
  requestPasswordReset,
  resendVerificationEmail,
  resetPassword,
  updateUser,
} from '../services/UserService';

const router = express.Router();

router.post(
  '/register',
  upload.single('avatar'),
  validate(registerSchema),
  async (req: Request, res: Response) => {
    try {
      const { preferredLanguage, ...userData } = req.body as any;
      const user: ICreateUserDTO = { ...userData };

      const userId = await createUser(user, preferredLanguage);

      if (req.file) {
        const uploadedAvatar = await uploadPublicImage({
          file: req.file.buffer,
          mimeType: req.file.mimetype,
          originalFilename: req.file.originalname,
          folder: `users/${userId}/avatar`,
        });

        user.avatarPath = uploadedAvatar.path;
        // Note: If you need the avatar path persisted, ensure createUser handles it or update the user here.
      }

      res.status(201).json({
        id: userId,
        message: 'auth.registrationSuccess',
        preferredLanguage: preferredLanguage || 'en',
      });
    } catch (error: any) {
      res.status(500).json({
        message: 'auth.registrationFailed',
        error: error.message,
      });
    }
  },
);

router.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'auth.emailRequired' });
    }

    const result = await resendVerificationEmail(email);

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    return res.json({
      message: 'auth.verificationEmailResent',
    });
  } catch (error: any) {
    console.error('Resend verification email error:', error);

    return res.status(500).json({
      error: 'auth.resendVerificationFailed',
    });
  }
});

router.post('/login', (req, res, next) => {
  passport.authenticate(
    'local',
    { session: false },
    async (err: Error | null, user: IUser | false, info: IVerifyOptions | undefined) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: info?.message || 'auth.loginFailed' });

      // 🔹 Check if user is active (email verified)
      if (!user.isActive) {
        return res.status(403).json({ error: 'auth.emailNotVerified' });
      }

      // Fetch user with populated userSettings
      const userWithSettings = await User.findById(user._id, '-password').populate('userSettings');

      // Access token
      const accessToken = jwt.sign({ id: user._id, email: user.email }, configEnvs.ACCESS_SECRET, {
        expiresIn: '15m',
      });

      // Refresh token (DB + cookie)
      const refreshToken = await createRefreshToken(user._id.toString());
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: configEnvs.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 4 * 24 * 60 * 60 * 1000,
      });

      res.json({
        message: 'Login successful',
        accessToken,
        user: toUserDto(userWithSettings as any),
      });
    },
  )(req, res, next);
});

router.post('/refreshToken', async (req: Request, res: Response) => {
  try {
    if (!req.cookies?.refreshToken) {
      res.status(401).json({ error: 'auth.noRefreshToken' });
      return;
    }

    const { accessToken, refreshToken } = await rotateRefreshToken(req.cookies.refreshToken);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: configEnvs.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 4 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken });
  } catch (e) {
    console.error('refreshToken error:', e);
    res.status(403).json({ error: 'auth.invalidRefreshToken' });
  }
});

router.post('/logout', async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;

  if (token) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    await RefreshToken.deleteOne({ token: hashedToken });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: configEnvs.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  }

  res.json({ message: 'Logged out' });
});

router.get('/users/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await User.findById((req.user as any)._id, '-password').populate('userSettings');
    if (!user) {
      return res.status(404).json({ error: 'user.notFound' });
    }
    res.json({ message: 'Logged user data', user: toUserDto(user) });
  } catch (error: any) {
    res.status(500).json({ error: 'auth.fetchUserFailed' });
  }
});

router.patch(
  '/users/me',
  requireAuth,
  upload.single('avatar'),
  validate(updateProfileSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)._id;
      const updateData: any = { ...req.body };

      // Prevent role escalation
      delete updateData.role;
      delete updateData.email;
      delete updateData.isActive;

      if (req.file) {
        const uploadedAvatar = await uploadPublicImage({
          file: req.file.buffer,
          mimeType: req.file.mimetype,
          originalFilename: req.file.originalname,
          folder: `users/${userId}/avatar`,
        });
        updateData.avatarPath = uploadedAvatar.path;
      }

      const updatedUser = await updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ error: 'user.notFound' });
      }

      res.json({
        message: 'profile.updateSuccess',
        user: toUserDto(updatedUser),
      });
    } catch (error: any) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'user.updateFailed' });
    }
  },
);

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
    res.status(400).json({ error: 'auth.invalidToken' });
    return;
  }

  // If valid: verify user and cleanup
  await User.findByIdAndUpdate(record.userId, { isActive: true });
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
    failureRedirect: `${configEnvs.FAILURE_URL_GOOGLE_CALLBACK}/oauth`,
  }),
  async (req: Request, res: Response) => {
    const user = req.user as IUser;
    const accessToken = generateAccessToken(user._id.toString());

    // Create refresh token to match local login flow
    const refreshToken = await createRefreshToken(user._id.toString());

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: configEnvs.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 4 * 24 * 60 * 60 * 1000,
    });

    // Redirect with access token
    res.redirect(`${configEnvs.SUCCESS_URL_GOOGLE_CALLBACK}/${accessToken}`);
  },
);
router.post(
  '/forgot-password',
  validate(passwordResetRequestSchema),
  async (req: Request, res: Response) => {
    const { email } = req.body;

    await requestPasswordReset(email);
    res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
  },
);

router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: 'auth.tokenAndPasswordRequired' });
  }

  const result = await resetPassword(token, password);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  res.json({ message: 'Password reset successfully' });
});

export default router;
