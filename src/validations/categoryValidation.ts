import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2, 'category.nameTooShort').max(100, 'category.nameTooLong'),
});

export const updateCategorySchema = z.object({
  name: z.string().min(2, 'category.nameTooShort').max(100, 'category.nameTooLong').optional(), // Name is optional for updates
});
