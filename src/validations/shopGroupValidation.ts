import { z } from 'zod';

const pickupAddressSchema = z.object({
  street: z.string().min(1, 'validation.address.streetRequired'),
  city: z.string().min(1, 'validation.address.cityRequired'),
  county: z.string().min(1, 'validation.address.countyRequired'),
  country: z.string().min(1, 'validation.address.countryRequired'),
  zipcode: z.string().min(1, 'validation.address.zipcodeRequired'),
});

export const createGroupSchema = z.object({
  name: z
    .string()
    .min(3, 'validation.group.nameMinLength')
    .max(50, 'validation.group.nameMaxLength'),
  description: z.string().max(1000, 'validation.group.descriptionMaxLength').optional().nullable(),
  pickupAddress: pickupAddressSchema,
});

export const updateGroupSchema = createGroupSchema.partial();

export const inviteShopSchema = z.object({
  shopId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'validation.invalidId'),
});

export const respondInviteSchema = z.object({
  status: z.enum(['accepted', 'declined'] as const, 'validation.group.invalidInvitationStatus'),
});
