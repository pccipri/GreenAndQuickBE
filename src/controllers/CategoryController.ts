import { Request, Response, Router } from 'express';
import { categoryService } from '@/services/CategoryService';
import { IdParams } from '@/models/generic/Routes';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { requireAuth, requireRole } from '@/middlewares/isAuthenticated';
import { validate } from '@/middlewares/validate';
import { createCategorySchema, updateCategorySchema } from '@/validations/categoryValidation';

const router = Router();

// List all categories (Public)
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const categories = await categoryService.list();
    res.json(categories);
  }),
);

// Get a category by ID (Public)
router.get(
  '/:id',
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const category = await categoryService.getById(req.params.id);
    res.json(category);
  }),
);

// Create a new category (Admin Only)
router.post(
  '/',
  requireAuth,
  requireRole(['admin']),
  validate(createCategorySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.create(req.body);
    res.status(201).json(category);
  }),
);

// Update a category by ID (Admin Only)
router.patch(
  '/:id',
  requireAuth,
  requireRole(['admin']),
  validate(updateCategorySchema),
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const category = await categoryService.update(req.params.id, req.body);
    res.json(category);
  }),
);

// Delete a category by ID (Admin Only)
router.delete(
  '/:id',
  requireAuth,
  requireRole(['admin']),
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const result = await categoryService.remove(req.params.id);
    res.json(result);
  }),
);

export default router;
