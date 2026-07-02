import { z } from 'zod';
import { optionalRichText, plainText } from './common';

const pickupAddressSchema = z.object({
  street: plainText(1, 200),
  city: plainText(1, 100),
  county: plainText(1, 100),
  country: plainText(1, 100),
  zipcode: plainText(1, 20),
});

export const createGroupSchema = z.object({
  name: plainText(3, 50),
  description: optionalRichText(1000),
  pickupAddress: pickupAddressSchema,
});

export const updateGroupSchema = createGroupSchema.partial();

export const inviteShopSchema = z.object({
  shopId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'validation.invalidId'),
});

export const respondInviteSchema = z.object({
  status: z.enum(['accepted', 'declined'] as const, 'validation.group.invalidInvitationStatus'),
});
