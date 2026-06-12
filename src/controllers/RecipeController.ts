import { recipeService } from '@/services/RecipeService';
import { HttpError } from '@/middlewares/errorHandler';
import { requireActiveUser, requireAuth } from '@/middlewares/isAuthenticated';
import { IdParams, SlugParams } from '@/models/generic/Routes';
import { Router, Request, Response } from 'express';
import { upload } from '@/middlewares/upload';
import {
  deletePublicImage,
  replacePublicImage,
  uploadPublicImage,
  deletePublicImageFolder,
} from '@/services/PublicImageStorageService';
import { Recipe } from '@/schemas/RecipeSchema';
import { Types } from 'mongoose';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { validate } from '@/middlewares/validate';
import {
  createRecipeSchema,
  updateRecipeSchema,
  recipeIdParamSchema,
  shopRecipeSchema,
} from '@/validations/recipeValidation';

const router = Router();

type MulterFields = {
  mainImage?: Express.Multer.File[];
  instructionImages?: Express.Multer.File[];
};

function getUploadFiles(req: Request): MulterFields {
  return (req.files as MulterFields) ?? {};
}

/**
 * GET /recipes
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const authorId = req.user?._id || null;
    const result = await recipeService.list(authorId, req.query as any);
    res.json(result);
  }),
);

/**
 * GET /recipes/slug/:slug
 */
router.get(
  '/slug/:slug',
  asyncHandler(async (req: Request<SlugParams>, res: Response) => {
    const authorId = req.user?._id || null;
    const doc = await recipeService.getBySlug(authorId, req.params.slug);
    res.json(doc);
  }),
);

/**
 * GET /recipes/:id
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const authorId = req.user?._id || null;
    const doc = await recipeService.getById(authorId, req.params.id);
    res.json(doc);
  }),
);

/**
 * POST /recipes
 */
router.post(
  '/',
  requireAuth,
  requireActiveUser,
  upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'instructionImages', maxCount: 50 },
  ]),
  validate(createRecipeSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body;
    if (!payload.dietaryTags && payload.tags) {
      payload.dietaryTags = payload.tags;
      delete payload.tags;
    }

    const recipeId = new Types.ObjectId(); // Generate ObjectId upfront
    const files = getUploadFiles(req);

    let uploadedMainImagePath: string | null = null;
    const uploadedInstructionImagePaths: string[] = [];

    // cleanup function to run if recipe creation fails
    const cleanupImages = async () => {
      await deletePublicImageFolder(`recipes/${recipeId}/main`);
      await deletePublicImageFolder(`recipes/${recipeId}/instructions`);
    };

    const mainImageFile = files.mainImage?.[0] ?? null;
    const instructionImageFiles = files.instructionImages ?? [];

    try {
      if (mainImageFile) {
        const uploadedMainImage = await uploadPublicImage({
          file: mainImageFile.buffer,
          mimeType: mainImageFile.mimetype,
          originalFilename: mainImageFile.originalname,
          folder: `recipes/${recipeId}/main`,
        });
        uploadedMainImagePath = uploadedMainImage.path; // Store path for cleanup
        payload.imagePath = uploadedMainImagePath;
      }

      if (Array.isArray(payload.instructions)) {
        payload.instructions = await Promise.all(
          payload.instructions.map(async (instruction: any, index: number) => {
            const imageFile = instructionImageFiles[index];

            if (!imageFile) {
              return {
                ...instruction,
                imagePath: instruction.imagePath ?? null,
              };
            }

            const uploadedInstructionImage = await uploadPublicImage({
              file: imageFile.buffer,
              mimeType: imageFile.mimetype,
              originalFilename: imageFile.originalname,
              folder: `recipes/${recipeId}/instructions`,
            });
            uploadedInstructionImagePaths.push(uploadedInstructionImage.path); // Store path for cleanup

            return {
              ...instruction,
              imagePath: uploadedInstructionImage.path,
            };
          }),
        );
      }

      const doc = await recipeService.create(req.user!._id, { ...payload, _id: recipeId });
      res.status(201).json(doc);
    } catch (error) {
      // If recipe creation fails, clean up uploaded images
      await cleanupImages();
      throw error; // Re-throw the error to be caught by asyncHandler and errorHandler
    }
  }),
);

/**
 * PATCH /recipes/:id
 */
router.patch(
  '/:id',
  requireAuth,
  upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'instructionImages', maxCount: 50 },
  ]),
  validate(updateRecipeSchema),
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    if (!Types.ObjectId.isValid(req.params.id)) {
      throw new HttpError(400, 'recipe.invalidId');
    }

    const isAdmin = req.user?.role === 'admin';
    const filter: any = { _id: req.params.id };

    if (!isAdmin) {
      filter.authorId = new Types.ObjectId(req.user!._id);
    }

    const existingRecipe = await Recipe.findOne(filter);

    if (!existingRecipe) {
      res.status(404).json({ error: 'recipe.notFound' });
      return;
    }

    const payload = req.body;
    if (!payload.dietaryTags && payload.tags) {
      payload.dietaryTags = payload.tags;
      delete payload.tags;
    }

    const files = getUploadFiles(req);

    const mainImageFile = files.mainImage?.[0] ?? null;
    const instructionImageFiles = files.instructionImages ?? [];

    const removeMainImage = payload.removeMainImage === true || payload.removeMainImage === 'true';

    if (removeMainImage && existingRecipe.imagePath) {
      await deletePublicImage(existingRecipe.imagePath);
      payload.imagePath = null;
    }

    if (mainImageFile) {
      if (existingRecipe.imagePath) {
        const replacedMainImage = await replacePublicImage({
          path: existingRecipe.imagePath,
          file: mainImageFile.buffer,
          mimeType: mainImageFile.mimetype,
        });

        payload.imagePath = replacedMainImage.path;
      } else {
        const uploadedMainImage = await uploadPublicImage({
          file: mainImageFile.buffer,
          mimeType: mainImageFile.mimetype,
          originalFilename: mainImageFile.originalname,
          folder: `recipes/${req.params.id}/main`,
        });

        payload.imagePath = uploadedMainImage.path;
      }
    }

    const incomingInstructions = Array.isArray(payload.instructions)
      ? payload.instructions
      : (existingRecipe.instructions ?? []);

    const removeInstructionImages: boolean[] = Array.isArray(payload.removeInstructionImages)
      ? payload.removeInstructionImages
      : [];

    payload.instructions = await Promise.all(
      incomingInstructions.map(async (instruction: any, index: number) => {
        const existingInstruction = existingRecipe.instructions?.[index];
        const imageFile = instructionImageFiles[index];
        const shouldRemoveImage = removeInstructionImages[index] === true;

        let imagePath = existingInstruction?.imagePath ?? null;

        if (shouldRemoveImage && imagePath) {
          await deletePublicImage(imagePath);
          imagePath = null;
        }

        if (imageFile) {
          if (imagePath) {
            const replacedInstructionImage = await replacePublicImage({
              path: imagePath,
              file: imageFile.buffer,
              mimeType: imageFile.mimetype,
            });

            imagePath = replacedInstructionImage.path;
          } else {
            const uploadedInstructionImage = await uploadPublicImage({
              file: imageFile.buffer,
              mimeType: imageFile.mimetype,
              originalFilename: imageFile.originalname,
              folder: `recipes/${req.params.id}/instructions`,
            });

            imagePath = uploadedInstructionImage.path;
          }
        }

        return {
          ...instruction,
          imagePath,
        };
      }),
    );

    delete payload.removeMainImage;
    delete payload.removeInstructionImages;

    const doc = await recipeService.update(req.params.id, payload, req.user!._id, isAdmin);
    res.json(doc);
  }),
);

/**
 * DELETE /recipes/:id
 */
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    if (!Types.ObjectId.isValid(req.params.id)) {
      throw new HttpError(400, 'recipe.invalidId');
    }

    const isAdmin = req.user?.role === 'admin';
    const filter: any = { _id: req.params.id };

    if (!isAdmin) {
      filter.authorId = new Types.ObjectId(req.user!._id);
    }

    const existingRecipe = await Recipe.findOne(filter);

    if (!existingRecipe) {
      res.status(404).json({ error: 'recipe.notFound' });
      return;
    }

    // Efficiently cleanup all images associated with this recipe
    await deletePublicImageFolder(`recipes/${req.params.id}/main`);
    await deletePublicImageFolder(`recipes/${req.params.id}/instructions`);

    const result = await recipeService.remove(req.params.id, req.user!._id, isAdmin);
    res.json(result);
  }),
);

/**
 * POST /recipes/:id/shop
 * Fetch matched products for all ingredients in a recipe at once (Public)
 */
router.post(
  '/:id/shop',
  validate(recipeIdParamSchema, 'params'),
  validate(shopRecipeSchema),
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const { ingredients } = req.body;
    const result = await recipeService.shopRecipeIngredients(req.params.id, ingredients);

    res.json(result);
  }),
);

export default router;
