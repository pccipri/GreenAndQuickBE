import { Request, Response, Router } from 'express';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { requireAuth, requireRole } from '@/middlewares/isAuthenticated';
import { validate } from '@/middlewares/validate';
import {
  createDietaryTagSchema,
  dietaryTagIdParamSchema,
} from '@/validations/dietaryTagValidation';
import { dietaryTagService } from '@/services/DietaryTagService';
import { IdParams } from '@/models/generic/Routes';

const router = Router();

// Public list of dietary tag keys
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const tags = await dietaryTagService.list();
    res.json(tags);
  }),
);

// Admin creates a dietary tag
router.post(
  '/',
  requireAuth,
  requireRole(['admin']),
  validate(createDietaryTagSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const tag = await dietaryTagService.create(req.body);
    res.status(201).json(tag);
  }),
);

// Admin deletes a dietary tag by id
router.delete(
  '/:id',
  requireAuth,
  requireRole(['admin']),
  validate(dietaryTagIdParamSchema, 'params'),
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const result = await dietaryTagService.remove(req.params.id);
    res.json(result);
  }),
);

export default router;
