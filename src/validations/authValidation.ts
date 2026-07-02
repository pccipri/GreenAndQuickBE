import { z } from 'zod';
import { emailSchema, optionalPlainText, plainText } from './common';

export const registerSchema = z.object({
  username: plainText(3, 50),
  email: emailSchema,
  password: z.string().min(8, 'auth.passwordTooShort').max(128, 'auth.passwordTooLong'),
  firstName: plainText(1, 100),
  lastName: plainText(1, 100),
  phoneNumber: optionalPlainText(5, 20),
  preferredLanguage: z.enum(['en', 'ro']).optional(),
});

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export const updateProfileSchema = z.object({
  username: plainText(3, 50).optional(),
  firstName: plainText(1, 100).optional(),
  lastName: plainText(1, 100).optional(),
  phoneNumber: optionalPlainText(5, 20),
});
