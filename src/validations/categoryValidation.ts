import { z } from 'zod';
import { plainText } from './common';

export const createCategorySchema = z.object({
  name: plainText(2, 100),
});

export const updateCategorySchema = z.object({
  name: plainText(2, 100).optional(),
});
