import { z } from 'zod';
import { Types } from 'mongoose';
import { configEnvs } from '@/config/env';
import { isDisposableEmailDomain } from '@/utils/disposableEmailDomains';
import { escapeRegex, sanitizePlainText, sanitizeRichText } from '@/utils/sanitize';

export const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: 'validation.invalidObjectId',
});

function isValidStoragePath(path: string): boolean {
  const trimmed = path.trim();
  return (
    trimmed.length > 0 &&
    !trimmed.includes('..') &&
    !trimmed.startsWith('/') &&
    !/^https?:\/\//i.test(trimmed)
  );
}

export const plainText = (min: number, max: number) =>
  z.string().transform(sanitizePlainText).pipe(z.string().min(min).max(max));

export const richText = (min: number, max: number) =>
  z.string().transform(sanitizeRichText).pipe(z.string().min(min).max(max));

export const optionalPlainText = (min: number, max: number) =>
  z.union([z.null(), plainText(min, max)]).optional();

export const optionalRichText = (max: number) =>
  z.union([z.null(), z.string().transform(sanitizeRichText).pipe(z.string().max(max))]).optional();

export function isAllowedEmailDomain(email: string): boolean {
  if (!configEnvs.BLOCK_DISPOSABLE_EMAILS) return true;
  return !isDisposableEmailDomain(email);
}

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ message: 'auth.invalidEmail' }))
  .refine(isAllowedEmailDomain, { message: 'auth.disposableEmailNotAllowed' });

export const safeSearchString = z.string().trim().min(1).max(100).transform(escapeRegex);

export const optionalSafeSearchString = safeSearchString.optional();

export const searchQueryString = z.string().trim().min(1).max(100);

export const storagePathSchema = z
  .string()
  .trim()
  .refine(isValidStoragePath, { message: 'validation.invalidStoragePath' });
