import { IRecipeDTO } from '@/models/IRecipe';
import { toDtoWithImageUrl } from './GenericPresenter';
import { getPublicFileUrl } from '@/services/StorageService';
import { PUBLIC_IMAGE_BUCKET } from '@/utils/constants';
import { Request } from 'express';
import { parseJsonField } from '@/utils/helpers';

export function toRecipeDto(doc: any): IRecipeDTO {
  const recipe = toDtoWithImageUrl<any>(doc, 'imagePath');

  recipe.instructions = Array.isArray(recipe.instructions)
    ? recipe.instructions.map((instruction: any) => {
        const { imagePath, ...rest } = instruction;
        return {
          ...rest,
          imageUrl: imagePath ? getPublicFileUrl(PUBLIC_IMAGE_BUCKET, imagePath) : null,
        };
      })
    : [];

  return recipe as IRecipeDTO;
}

/** Normalizes the incoming request payload for creating/updating a recipe.
 * Body contract:
 * - instructions can be JSON string or array
 * - removeMainImage?: 'true' | 'false'
 * - removeInstructionImages?: JSON stringified boolean[]
 */
export function normalizeRecipePayload(req: Request) {
  const payload: any = { ...req.body };

  payload.instructions = parseJsonField<any[]>(req.body.instructions, []);
  payload.tags = parseJsonField<string[] | null>(req.body.tags, payload.tags ?? null);
  payload.ingredients = parseJsonField<any[]>(req.body.ingredients, payload.ingredients ?? []);
  payload.nutritionValues = parseJsonField<any[] | null>(
    req.body.nutritionValues,
    payload.nutritionValues ?? null,
  );
  payload.nutritionPerPortion = parseJsonField<any | null>(
    req.body.nutritionPerPortion,
    payload.nutritionPerPortion ?? null,
  );
  payload.removeInstructionImages = parseJsonField<boolean[]>(req.body.removeInstructionImages, []);

  return payload;
}
