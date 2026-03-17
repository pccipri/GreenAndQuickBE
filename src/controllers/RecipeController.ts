import { recipeService } from '@/services/RecipeService';
import { requireAuth } from '@/middlewares/isAuthenticated';
import { IdParams, SlugParams } from '@/models/generic/Routes';
import { Router, Request, Response } from 'express';
import { upload } from '@/middlewares/upload';
import {
  deletePublicImage,
  replacePublicImage,
  uploadPublicImage,
} from '@/services/PublicImageStorageService';
import { Recipe } from '@/schemas/RecipeSchema';
import { Types } from 'mongoose';
import { normalizeRecipePayload } from '@/presenters/RecipePresenter';
import { asyncHandler } from '@/middlewares/asyncHandler';

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
  upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'instructionImages', maxCount: 50 },
  ]),
  asyncHandler(async (req: Request, res: Response) => {
    const payload = normalizeRecipePayload(req);
    const files = getUploadFiles(req);

    const mainImageFile = files.mainImage?.[0] ?? null;
    const instructionImageFiles = files.instructionImages ?? [];

    if (mainImageFile) {
      const uploadedMainImage = await uploadPublicImage({
        file: mainImageFile.buffer,
        mimeType: mainImageFile.mimetype,
        originalFilename: mainImageFile.originalname,
        folder: `recipes/${req.user!._id}/main`,
      });

      payload.imagePath = uploadedMainImage.path;
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
            folder: `recipes/${req.user!._id}/instructions`,
          });

          return {
            ...instruction,
            imagePath: uploadedInstructionImage.path,
          };
        }),
      );
    }

    const doc = await recipeService.create(req.user!._id, payload);
    res.status(201).json(doc);
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
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    if (!Types.ObjectId.isValid(req.params.id)) {
      throw new Error('Invalid recipe id');
    }

    const existingRecipe = await Recipe.findOne({
      _id: req.params.id,
      authorId: new Types.ObjectId(req.user!._id),
    });

    if (!existingRecipe) {
      res.status(404).json({ message: 'Recipe not found' });
      return;
    }

    const payload = normalizeRecipePayload(req);
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

    const doc = await recipeService.update(req.user!._id, req.params.id, payload);
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
      throw new Error('Invalid recipe id');
    }

    const existingRecipe = await Recipe.findOne({
      _id: req.params.id,
      authorId: new Types.ObjectId(req.user!._id),
    });

    if (!existingRecipe) {
      res.status(404).json({ message: 'Recipe not found' });
      return;
    }

    if (existingRecipe.imagePath) {
      await deletePublicImage(existingRecipe.imagePath);
    }

    if (Array.isArray(existingRecipe.instructions)) {
      for (const instruction of existingRecipe.instructions) {
        if (instruction.imagePath) {
          await deletePublicImage(instruction.imagePath);
        }
      }
    }

    const result = await recipeService.remove(req.user!._id, req.params.id);
    res.json(result);
  }),
);

export default router;
