import { IRecipeDTO } from '@/models/IRecipe';
import { toDtoWithImageUrl } from './GenericPresenter';
import { getPublicFileUrl } from '@/services/StorageService';
import { PUBLIC_IMAGE_BUCKET } from '@/utils/constants';

export function toRecipeDto(doc: any): IRecipeDTO {
  const recipe = toDtoWithImageUrl<any>(doc, 'imagePath');

  // Transform author if populated by the service
  if (recipe.authorId && typeof recipe.authorId === 'object') {
    const authDoc = recipe.authorId;
    recipe.author = {
      id: (authDoc._id || authDoc.id)?.toString(),
      firstName: authDoc.firstName,
      lastName: authDoc.lastName,
      avatarUrl: authDoc.avatarPath
        ? getPublicFileUrl(PUBLIC_IMAGE_BUCKET, authDoc.avatarPath)
        : null,
    };
    // authorId remains a string for root level consistency
    recipe.authorId = recipe.author.id;
  }

  recipe.instructions = Array.isArray(recipe.instructions)
    ? recipe.instructions.map((instruction: any) => {
        const { imagePath, ...rest } = instruction;
        return {
          ...rest,
          imageUrl: imagePath ? getPublicFileUrl(PUBLIC_IMAGE_BUCKET, imagePath) : null,
        };
      })
    : [];

  // Transform ingredients: if ingredient.linkedProductId is populated, expose linkedProduct
  recipe.ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients.map((ing: any) => {
        const { linkedProductId, ...rest } = ing;
        const linkedProduct =
          linkedProductId && typeof linkedProductId === 'object'
            ? {
                id: (linkedProductId._id || linkedProductId.id)?.toString(),
                name: linkedProductId.name,
                price: linkedProductId.price ?? null,
                shopId: linkedProductId.shopId ? String(linkedProductId.shopId) : null,
              }
            : null;

        return {
          ...rest,
          linkedProduct,
          linkedProductId: linkedProduct ? linkedProduct.id : (linkedProductId ?? null),
        };
      })
    : [];

  return recipe as IRecipeDTO;
}
